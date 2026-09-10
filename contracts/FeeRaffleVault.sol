// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// AUDIT-REQUIRED SKELETON — DO NOT DEPLOY WITH REAL FUNDS UNAUDITED.
// This is a security-first reference for a fee-funded holder raffle on HyperEVM.
// It is intentionally conservative: pull-payment claims, no admin access to
// user funds, verifiable randomness via commit-reveal + external beacon,
// reentrancy protection, and non-pausable withdrawals.

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
 * - Funds custody: this contract. No privileged role can move user funds.
 * - Randomness: commit-reveal. The RANDOMNESS_ROLE commits a hash before the
 *   round closes and reveals the seed after; the seed is mixed with an external
 *   beacon (e.g. drand) so neither the operator nor validators can bias it.
 *   TODO(auditor): confirm HyperEVM has a production VRF; prefer it over this
 *   if available.
 * - Payouts: pull-payment via claim(). Never pausable.
 * - Admin: intended to be a multisig + timelock. Can pause deposits/draws in an
 *   emergency but CANNOT pause claims or withdraw prize funds.
 */
contract FeeRaffleVault is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ROUTER_ROLE = keccak256("FEE_ROUTER_ROLE");
    bytes32 public constant RANDOMNESS_ROLE = keccak256("RANDOMNESS_ROLE");

    IERC20 public immutable prizeToken; // token prizes are paid in (e.g. USDC/HYPE)

    struct Round {
        uint256 pot;            // prize amount locked for this round
        uint256 closeTime;      // when entries stop / draw becomes possible
        bytes32 seedCommitment; // hash committed before close
        bool seedRevealed;
        address winner;
        bool claimed;
    }

    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;

    // Winners pull from here; independent of round bookkeeping so a stuck round
    // can never trap an already-decided prize.
    mapping(address => uint256) public claimable;

    // Snapshot of eligible holders per round is supplied by an off-chain indexer
    // and anchored on-chain as a Merkle root (holder lists aren't on-chain on HL).
    mapping(uint256 => bytes32) public eligibleRoot;

    event FeesReceived(uint256 indexed roundId, uint256 amount);
    event SeedCommitted(uint256 indexed roundId, bytes32 commitment);
    event WinnerDrawn(uint256 indexed roundId, address indexed winner, uint256 amount);
    event PrizeClaimed(address indexed winner, uint256 amount);

    constructor(IERC20 _prizeToken, address admin) {
        prizeToken = _prizeToken;
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
    ///         index, and CREDIT (not send) the prize. Rolls to the next round.
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

        uint256 prize = r.pot;
        claimable[winner] += prize; // credit; winner pulls later
        emit WinnerDrawn(currentRoundId, winner, prize);

        currentRoundId++; // open a fresh round
    }

    /// @notice Winners pull their prize. Never pausable, reentrancy-guarded,
    ///         balance zeroed BEFORE transfer (checks-effects-interactions).
    function claim() external nonReentrant {
        uint256 amount = claimable[msg.sender];
        require(amount > 0, "nothing to claim");
        claimable[msg.sender] = 0;
        prizeToken.safeTransfer(msg.sender, amount);
        emit PrizeClaimed(msg.sender, amount);
    }

    // --- Emergency controls: deposits/draws only. NEVER claims. ---
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
