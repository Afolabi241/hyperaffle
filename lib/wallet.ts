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

export type Eligibility = {
  eligible: boolean
  balance: number
  // Equal-ticket odds of winning a given round (1 / eligible holders).
  odds: number
  alreadyWon: boolean
}

// Deterministic per (address, coin): ~70% of wallets "hold" the coin. Replace
// with a real indexer lookup { address -> balance } to go live.
export function walletEligibility(address: string, coin: Coin): Eligibility {
  const h = hash(address.toLowerCase() + ':' + coin.id)
  const eligible = h % 10 < 7
  const balance = eligible ? 500 + ((h >> 4) % 480_000) : 0
  const pool = Math.max(1, coin.holderCount)
  return {
    eligible,
    balance,
    odds: eligible ? 1 / pool : 0,
    alreadyWon: eligible && (h >> 3) % 100 < 4,
  }
}
