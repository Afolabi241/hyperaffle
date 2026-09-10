// Raffle entrants = token holders. Every holder gets exactly one ticket
// (equal odds) and a past winner is removed from the pool, so no wallet can
// win twice. Wallets are auto-enrolled — there is no connect step.
//
// NOTE: Hyperliquid's public API does not expose a token's full holder list,
// so this pool is generated deterministically for the demo. To go live with
// real holders, replace `getHolders()` with a call to a HyperEVM holder
// indexer / explorer that returns { address, balance } records — the rest of
// the app (raffle, spin, no-repeat logic) already treats it as the source.

export type Holder = {
  address: string
  balance: number
}

const HEX = '0123456789abcdef'

// Small seeded PRNG so the pool is stable across server renders / refreshes.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeAddress(rand: () => number): string {
  let addr = '0x'
  for (let i = 0; i < 40; i++) addr += HEX[Math.floor(rand() * 16)]
  return addr
}

export function getHolders(count = 120): Holder[] {
  const rand = mulberry32(0x48595045) // "HYPE"
  const holders: Holder[] = []
  for (let i = 0; i < count; i++) {
    // Skewed distribution: a few whales, a long tail of small holders.
    const r = rand()
    const balance = Math.round(500 + Math.pow(r, 3) * 480_000)
    holders.push({ address: makeAddress(rand), balance })
  }
  return holders.sort((a, b) => b.balance - a.balance)
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
