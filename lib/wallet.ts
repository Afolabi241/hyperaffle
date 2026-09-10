// Read-only, non-custodial wallet helper. The app NEVER holds keys or funds —
// a "connected" wallet here is just an address the user wants to check
// eligibility for. On testnet this would come from a real wallet provider
// (window.ethereum) and balances from a HyperEVM holder indexer; until that
// indexer is wired in, eligibility is derived deterministically from the
// address + coin so a given wallet always maps to a consistent, honest result.

import type { Coin } from './coins'

export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
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

// Deterministic per (address, coin): ~70% of wallets "hold" the coin. Replace
// with a real indexer lookup { address -> balance, firstHeldAt } to go live.
export function walletEligibility(address: string, coin: Coin): Eligibility {
  const h = hash(address.toLowerCase() + ':' + coin.id)
  const holds = h % 10 < 7
  // Unsigned shifts (>>>) so high-bit hashes never produce negative values.
  const balance = holds ? 500 + ((h >>> 4) % 480_000) : 0
  const heldMinutes = holds ? (h >>> 8) % 45 : 0 // 0..44 min held
  const qualified = holds && heldMinutes >= HOLD_MINUTES
  const minutesToQualify = holds ? Math.max(0, HOLD_MINUTES - heldMinutes) : HOLD_MINUTES
  const pool = Math.max(1, coin.holderCount)
  return {
    holds,
    qualified,
    balance,
    heldMinutes,
    minutesToQualify,
    odds: qualified ? 1 / pool : 0,
    alreadyWon: qualified && (h >>> 3) % 100 < 4,
  }
}
