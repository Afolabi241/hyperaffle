// Front-end mirror of the on-chain FeeRaffleVault (contracts/FeeRaffleVault.sol).
// These values describe the deployed vault so the UI can show verifiable,
// trust-minimized info. Nothing here custodies funds — the contract does.
//
// TESTNET FIRST: while NETWORK.isTestnet is true, all amounts are test tokens
// with no real value. Do not flip to a mainnet config until an independent
// audit + bug bounty are complete.

export const NETWORK = {
  name: 'Hyperliquid EVM Testnet',
  chainId: 998,
  isTestnet: true,
  explorer: 'https://testnet.purrsec.com',
  currencySymbol: 'HYPE',
} as const

export const VAULT = {
  // Address of the deployed FeeRaffleVault. Placeholder until deployed to testnet.
  address: '0x0000000000000000000000000000000000000000',
  // Wallet that receives prizes left unclaimed past the window, for manual airdrop.
  recoveryWallet: '0x0000000000000000000000000000000000000000',
  // Winners must claim within this window; after it, a prize can be swept to
  // recoveryWallet. Mirrors CLAIM_WINDOW in the contract.
  claimWindowDays: 30,
} as const

export function isPlaceholder(addr: string): boolean {
  return /^0x0+$/.test(addr)
}

export function shortHash(addr: string): string {
  if (isPlaceholder(addr)) return 'not deployed yet'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// Days remaining in a prize's claim window given when it was drawn.
export function claimDaysLeft(drawnAt: number): number {
  const deadline = drawnAt + VAULT.claimWindowDays * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)))
}
