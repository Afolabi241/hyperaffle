// Server-only: eligibility qualification logic. Kept out of the client bundle
// so the rules (hold time, odds, win history) cannot be read or gamed in the
// browser. Imported only by the /api/eligibility route handler. Swap the
// deterministic derivation for a real HyperEVM holder-indexer lookup
// ({ address -> balance, firstHeldAt }) to go live.
import { HOLD_MINUTES, type Eligibility } from './wallet'

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function computeEligibility(address: string, coinId: string, holderCount: number): Eligibility {
  const h = hash(address.toLowerCase() + ':' + coinId)
  const holds = h % 10 < 7
  // Unsigned shifts (>>>) so high-bit hashes never produce negative values.
  const balance = holds ? 500 + ((h >>> 4) % 480_000) : 0
  const heldMinutes = holds ? (h >>> 8) % 45 : 0 // 0..44 min held
  const qualified = holds && heldMinutes >= HOLD_MINUTES
  const minutesToQualify = holds ? Math.max(0, HOLD_MINUTES - heldMinutes) : HOLD_MINUTES
  const pool = Math.max(1, holderCount)
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
