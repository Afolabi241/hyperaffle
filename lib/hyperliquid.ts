// Real market data comes from Hyperliquid's public info API.
// Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
const HL_INFO = 'https://api.hyperliquid.xyz/info'

// Share of daily trading fees that flows into the round pot.
// Hyperliquid taker fee ~0.035%; we route a slice of that into the jackpot.
export const FEE_RATE = 0.00035
export const POT_SHARE = 0.4 // 40% of collected fees fund the holder pot

export type HypeMarket = {
  price: number
  prevDayPrice: number
  change24h: number
  dayNotionalVolume: number
  openInterest: number
  funding: number
  feesCollected24h: number
  pot: number
  updatedAt: number
}

type AssetCtx = {
  markPx: string
  prevDayPx: string
  dayNtlVlm: string
  openInterest: string
  funding: string
}

export async function getHypeMarket(): Promise<HypeMarket> {
  const res = await fetch(HL_INFO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    // Keep it fresh but avoid hammering the upstream on every request.
    next: { revalidate: 15 },
  })

  if (!res.ok) throw new Error(`Hyperliquid API error: ${res.status}`)

  const [meta, ctxs] = (await res.json()) as [
    { universe: { name: string }[] },
    AssetCtx[],
  ]

  const idx = meta.universe.findIndex((u) => u.name === 'HYPE')
  if (idx === -1) throw new Error('HYPE market not found')

  const ctx = ctxs[idx]
  const price = Number(ctx.markPx)
  const prevDayPrice = Number(ctx.prevDayPx)
  const dayNotionalVolume = Number(ctx.dayNtlVlm)
  const feesCollected24h = dayNotionalVolume * FEE_RATE
  const pot = feesCollected24h * POT_SHARE

  return {
    price,
    prevDayPrice,
    change24h: prevDayPrice ? (price - prevDayPrice) / prevDayPrice : 0,
    dayNotionalVolume,
    openInterest: Number(ctx.openInterest) * price,
    funding: Number(ctx.funding),
    feesCollected24h,
    pot,
    updatedAt: Date.now(),
  }
}
