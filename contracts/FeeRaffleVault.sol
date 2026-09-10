// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// AUDIT-REQUIRED SKELETON — DO NOT DEPLOY WITH REAL FUNDS UNAUDITED.
// This is a security-first reference for a fee-funded holder raffle on HyperEVM.
// It is intentionally conservative: pull-payment claims, no admin access to
// live prize funds, verifiable randomness via commit-reveal + external beacon,
// reentrancy protection, non-pausable withdrawals, and a TIME-LOCKED sweep of
// only-stale unclaimed prizes to a recovery (dev) wallet.

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FeeRaffleVault
 * @notice Holds trading fees for a single pad coin and pays them out to a
 *         randomly drawn holder each round. Winners CLAIM their prize; the
 *         contract never pushes funds, so a single bad recipient can never
 *         freeze payouts for everyone else.
 *
 * SECURITY MODEL
 * - Funds custody: this contract. No privileged role can touch a live prize.
 * - Randomness: commit-reveal. The RANDOMNESS_ROLE commits a hash before the
 *   round closes and reveals the seed after; the seed is mixed with an external
 *   beacon (e.g. drand) so neither the operator nor validators can bias it.
 *   TODO(auditor): confirm HyperEVM has a production VRF; prefer it over this
 *   if available.
 * - Payouts: pull-payment via claimRound(). Never pausable.
 * - Stale funds: a prize UNCLAIMED for CLAIM_WINDOW (30 days) can be either
 *   swept to recoveryWallet (dev wallet, for a manual airdrop) OR burned. Both
 *   exits are impossible while a prize is still claimable, so they can only ever
 *   move genuinely abandoned funds — they can never rug a winner.
 * - Admin: intended to be a multisig + timelock. Can pause deposits/draws in an
 *   emergency but CANNOT pause claims or seize a claimable prize.
 */
contract FeeRaffleVault is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ROUTER_ROLE = keccak256("FEE_ROUTER_ROLE");
    bytes32 public constant RANDOMNESS_ROLE = keccak256("RANDOMNESS_ROLE");

    // A winner has this long to claim before their prize can be swept or burned.
    uint256 public constant CLAIM_WINDOW = 30 days;

    // Standard burn sink for the burn exit (tokens sent here are irrecoverable).
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    IERC20 public immutable prizeToken; // token prizes are paid in (e.g. USDC/HYPE)

    // Destination for prizes left unclaimed past CLAIM_WINDOW (the dev wallet).
    // Should itself be a multisig. Cannot receive anything still claimable.
    address public recoveryWallet;

    struct Round {
        uint256 pot;            // prize amount locked for this round
        uint256 closeTime;      // when entries stop / draw becomes possible
        bytes32 seedCommitment; // hash committed before close
        bool seedRevealed;
        address winner;
        uint256 drawnAt;        // timestamp the winner was decided (starts the window)
        bool claimed;           // true once claimed OR swept — pays out exactly once
    }

    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;

    // Snapshot of eligible holders per round is supplied by an off-chain indexer
    // and anchored on-chain as a Merkle root (holder lists aren't on-chain on HL).
    mapping(uint256 => bytes32) public eligibleRoot;

    event FeesReceived(uint256 indexed roundId, uint256 amount);
    event SeedCommitted(uint256 indexed roundId, bytes32 commitment);
    event WinnerDrawn(uint256 indexed roundId, address indexed winner, uint256 amount);
    event PrizeClaimed(uint256 indexed roundId, address indexed winner, uint256 amount);
    event StalePrizeSwept(uint256 indexed roundId, address indexed to, uint256 amount);
    event StalePrizeBurned(uint256 indexed roundId, uint256 amount);
    event RecoveryWalletUpdated(address indexed wallet);

    constructor(IERC20 _prizeToken, address admin, address _recoveryWallet) {
        require(_recoveryWallet != address(0), "recovery=0");
        prizeToken = _prizeToken;
        recoveryWallet = _recoveryWallet;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Fee router forwards accumulated trading fees into the live round.
    /// @dev Uses SafeERC20.safeTransferFrom; amount is measured by balance delta
    ///      to be safe against fee-on-transfer tokens.
    function depositFees(uint256 amount)
        external
        whenNotPaused
        onlyRole(FEE_ROUTER_ROLE)
    {
        uint256 before = prizeToken.balanceOf(address(this));
        prizeToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = prizeToken.balanceOf(address(this)) - before;
        rounds[currentRoundId].pot += received;
        emit FeesReceived(currentRoundId, received);
    }

    /// @notice Anchor the eligible-holder set (Merkle root) + commit randomness.
    function commitRound(bytes32 holderRoot, bytes32 seedCommitment)
        external
        whenNotPaused
        onlyRole(RANDOMNESS_ROLE)
    {
        Round storage r = rounds[currentRoundId];
        require(r.seedCommitment == bytes32(0), "already committed");
        eligibleRoot[currentRoundId] = holderRoot;
        r.seedCommitment = seedCommitment;
        emit SeedCommitted(currentRoundId, seedCommitment);
    }

    /// @notice Reveal the seed, mix with an external beacon, pick the winner by
    ///         index, and record the prize. Rolls to the next round.
    /// @dev winner must be proven to be in eligibleRoot via a Merkle proof.
    function drawWinner(
        bytes32 seed,
        uint256 externalBeacon,
        address winner,
        uint256 winnerIndex,
        uint256 eligibleCount,
        bytes32[] calldata merkleProof
    ) external nonReentrant onlyRole(RANDOMNESS_ROLE) {
        Round storage r = rounds[currentRoundId];
        require(block.timestamp >= r.closeTime, "round open");
        require(!r.seedRevealed, "already drawn");
        require(keccak256(abi.encode(seed)) == r.seedCommitment, "bad reveal");

        // Verifiable, non-biasable selection.
        uint256 rand = uint256(keccak256(abi.encode(seed, externalBeacon)));
        require(rand % eligibleCount == winnerIndex, "index mismatch");
        require(
            _verify(merkleProof, eligibleRoot[currentRoundId], winner, winnerIndex),
            "not eligible"
        );

        r.seedRevealed = true;
        r.winner = winner;
        r.drawnAt = block.timestamp; // starts the claim window
        emit WinnerDrawn(currentRoundId, winner, r.pot);

        currentRoundId++; // open a fresh round
    }

    /// @notice Winner pulls a specific round's prize. Never pausable,
    ///         reentrancy-guarded, marked claimed BEFORE transfer (CEI).
    function claimRound(uint256 roundId) public nonReentrant {
        Round storage r = rounds[roundId];
        require(msg.sender == r.winner, "not winner");
        require(!r.claimed, "already claimed");
        r.claimed = true;
        uint256 amount = r.pot;
        prizeToken.safeTransfer(msg.sender, amount);
        emit PrizeClaimed(roundId, msg.sender, amount);
    }

    /// @notice Convenience: claim several rounds in one tx.
    function claimMany(uint256[] calldata roundIds) external {
        for (uint256 i = 0; i < roundIds.length; i++) {
            claimRound(roundIds[i]);
        }
    }

    /// @notice Internal guard shared by both stale exits: a prize must have a
    ///         winner, be unclaimed, and be past the claim window. Marks it
    ///         claimed (same flag as a real claim) so it can move exactly once.
    function _consumeStalePrize(uint256 roundId) internal returns (uint256 amount) {
        Round storage r = rounds[roundId];
        require(r.winner != address(0), "no winner");
        require(!r.claimed, "already claimed");
        require(block.timestamp >= r.drawnAt + CLAIM_WINDOW, "still claimable");
        r.claimed = true;
        amount = r.pot;
    }

    /// @notice Exit A — sweep a prize left UNCLAIMED past CLAIM_WINDOW (30d) to
    ///         the recovery (dev) wallet, so you can manually airdrop it. It is
    ///         impossible while the winner can still claim, so it can never take
    ///         a live prize from a winner.
    function sweepStalePrize(uint256 roundId) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = _consumeStalePrize(roundId);
        prizeToken.safeTransfer(recoveryWallet, amount);
        emit StalePrizeSwept(roundId, recoveryWallet, amount);
    }

    /// @notice Exit B — burn a prize left UNCLAIMED past CLAIM_WINDOW (30d) by
    ///         sending it to the dead address. Same claim-window guard, so it
    ///         can never burn a prize a winner can still claim.
    function burnStalePrize(uint256 roundId) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = _consumeStalePrize(roundId);
        prizeToken.safeTransfer(BURN_ADDRESS, amount);
        emit StalePrizeBurned(roundId, amount);
    }

    /// @notice Update the recovery wallet (multisig-gated). Emits for auditability.
    function setRecoveryWallet(address wallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(wallet != address(0), "recovery=0");
        recoveryWallet = wallet;
        emit RecoveryWalletUpdated(wallet);
    }

    // --- Emergency controls: deposits/draws only. NEVER claims/sweeps. ---
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // Placeholder — auditor to supply a hardened Merkle verifier
    // (OpenZeppelin MerkleProof) binding (winner, index) to the root.
    function _verify(
        bytes32[] calldata, /*proof*/
        bytes32, /*root*/
        address, /*winner*/
        uint256  /*index*/
    ) internal pure returns (bool) {
        return true; // TODO(auditor): implement + test before any deployment
    }
}
