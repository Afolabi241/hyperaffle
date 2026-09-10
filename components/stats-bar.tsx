import type { HypeMarket } from '@/lib/hyperliquid'
import { usd, pct } from '@/lib/format'

function Stat({ label, value, sub, subTone }: { label: string; value: string; sub?: string; subTone?: 'up' | 'down' }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-mono text-xl font-semibold tabular-nums text-foreground">{value}</span>
      {sub && (
        <span
          className={
            subTone === 'up'
              ? 'text-xs font-medium text-primary'
              : subTone === 'down'
                ? 'text-xs font-medium text-destructive'
                : 'text-xs text-muted-foreground'
          }
        >
          {sub}
        </span>
      )}
    </div>
  )
}

export function StatsBar({ market }: { market: HypeMarket }) {
  const tone = market.change24h >= 0 ? 'up' : 'down'
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="HYPE Price" value={usd(market.price, { cents: true })} sub={pct(market.change24h)} subTone={tone} />
      <Stat label="24h Volume" value={usd(market.dayNotionalVolume, { compact: true })} sub="on Hyperliquid" />
      <Stat label="Fees Collected (24h)" value={usd(market.feesCollected24h, { compact: true })} sub="funds the pot" subTone="up" />
      <Stat label="Open Interest" value={usd(market.openInterest, { compact: true })} sub="HYPE perp" />
    </div>
  )
}
