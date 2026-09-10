import { STOCKS, type Stock } from './stocks'
import { makeHolders, type Holder } from './holders'

export type Coin = {
  id: string
  ticker: string
  name: string
  stock: Stock
  createdAt: number
  // Bonding-curve style progress toward graduation, 0..1
  progress: number
  holderCount: number
  // Share of trading fees routed to the holder reward pot (0..1)
  feeShare: number
  // How often accumulated fees are raffled, in seconds
  raffleInterval: number
  // Deterministic per-coin weight used to split pad-wide volume/fees
  volumeWeight: number
  color: string
  // Coin logo image URL (generated for seed coins, uploaded on deploy)
  image?: string
}

// Selectable raffle cadences shown in the deploy flow (seconds).
export const RAFFLE_INTERVALS: { label: string; seconds: number }[] = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
]

export function intervalLabel(seconds: number): string {
  const match = RAFFLE_INTERVALS.find((i) => i.seconds === seconds)
  if (match) return match.label
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} hr`
  if (seconds >= 60) return `${Math.round(seconds / 60)} min`
  return `${seconds}s`
}

const COLORS = [
  '#39ffc2', '#5ac8fa', '#ff6b6b', '#ffd93d', '#c77dff',
  '#ff9f1c', '#4dd4ac', '#ff5d8f', '#7cf29b', '#63b3ff',
]

function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A curated seed set of coins already "deployed" on the pad, each paired
// with a real stock. New coins created in the UI are appended to this.
const SEED: Array<{ ticker: string; name: string; stockSymbol: string; feeShare: number; raffleInterval: number }> = [
  { ticker: 'TSLR', name: 'Tesla Rocket', stockSymbol: 'TSLA', feeShare: 0.4, raffleInterval: 120 },
  { ticker: 'NVDX', name: 'Nvidia Max', stockSymbol: 'NVDA', feeShare: 0.5, raffleInterval: 60 },
  { ticker: 'APEX', name: 'Apple Prime', stockSymbol: 'AAPL', feeShare: 0.35, raffleInterval: 300 },
  { ticker: 'MSTX', name: 'MicroStack', stockSymbol: 'MSTR', feeShare: 0.6, raffleInterval: 120 },
  { ticker: 'GMEZ', name: 'GameZone', stockSymbol: 'GME', feeShare: 0.55, raffleInterval: 60 },
  { ticker: 'COIX', name: 'Coinbase X', stockSymbol: 'COIN', feeShare: 0.45, raffleInterval: 300 },
  { ticker: 'AMZG', name: 'Amazon Gold', stockSymbol: 'AMZN', feeShare: 0.3, raffleInterval: 900 },
  { ticker: 'PLTX', name: 'Palantir X', stockSymbol: 'PLTR', feeShare: 0.5, raffleInterval: 120 },
  { ticker: 'HOOD', name: 'Hood Money', stockSymbol: 'HOOD', feeShare: 0.4, raffleInterval: 60 },
  { ticker: 'META9', name: 'Meta Nine', stockSymbol: 'META', feeShare: 0.35, raffleInterval: 1800 },
]

function buildCoin(
  ticker: string,
  name: string,
  stock: Stock,
  feeShare: number,
  raffleInterval: number,
  index: number,
): Coin {
  const rand = mulberry(hashStr(ticker))
  return {
    id: ticker.toLowerCase(),
    ticker,
    name,
    stock,
    createdAt: Date.now() - Math.floor(rand() * 1000 * 60 * 60 * 72),
    progress: 0.15 + rand() * 0.8,
    holderCount: 40 + Math.floor(rand() * 400),
    feeShare,
    raffleInterval,
    volumeWeight: 0.3 + rand() * 1.2,
    color: COLORS[index % COLORS.length],
    image: `/coins/${ticker.toLowerCase()}.png`,
  }
}

function hashStr(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function getCoins(): Coin[] {
  return SEED.map((s, i) => {
    const stock = STOCKS.find((st) => st.symbol === s.stockSymbol) ?? STOCKS[0]
    return buildCoin(s.ticker, s.name, stock, s.feeShare, s.raffleInterval, i)
  })
}

export function getCoin(id: string): Coin | undefined {
  return getCoins().find((c) => c.id === id)
}

// Per-coin holder pool, deterministic by coin id so it is stable across renders.
export function coinHolders(coin: Coin): Holder[] {
  return makeHolders(coin.holderCount, hashStr(coin.id))
}

export type CoinEconomics = {
  volume24h: number
  fees24h: number
  // Amount routed to the holder reward pot (what the roulette pays out).
  pot: number
}

/**
 * Splits the real pad-wide 24h volume/fees (from Hyperliquid) across coins by
 * their volume weight, then applies each coin's fee share to size its pot.
 */
export function coinEconomics(
  coin: Coin,
  coins: Coin[],
  padVolume24h: number,
  padFees24h: number,
): CoinEconomics {
  const totalWeight = coins.reduce((s, c) => s + c.volumeWeight, 0) || 1
  const share = coin.volumeWeight / totalWeight
  const volume24h = padVolume24h * share
  const fees24h = padFees24h * share
  return { volume24h, fees24h, pot: fees24h * coin.feeShare }
}
