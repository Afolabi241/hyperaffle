// Read-only, non-custodial wallet helpers shared by client and server. The app
// NEVER holds keys or funds — a "connected" wallet here is just an address the
// user wants to check eligibility for. The eligibility RULES live server-side
// in wallet-server.ts (computed via /api/eligibility) so they cannot be read or
// gamed in the browser; this file only holds address utilities and shared types.

export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// A wallet must hold the coin continuously for this long before it qualifies
// for a draw. Prevents last-second buy-ins right before a spin.
export const HOLD_MINUTES = 10

export type Eligibility = {
  // Holds a non-zero balance of the coin.
  holds: boolean
  // Holds AND has met the minimum hold time → actually entered in draws.
  qualified: boolean
  balance: number
  // How long this wallet has held the coin, in minutes.
  heldMinutes: number
  // Minutes still required before it qualifies (0 once qualified).
  minutesToQualify: number
  // Odds of winning a given round (1 / qualified holders).
  odds: number
  alreadyWon: boolean
}
