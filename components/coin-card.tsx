'use client'

import { type Coin, coinEconomics, intervalLabel } from '@/lib/coins'
import { curveState, MIGRATION_MCAP } from '@/lib/curve'
import type { HypeMarket } from '@/lib/hyperliquid'
import { usd, num, timeAgo } from '@/lib/format'
import { Users, Link2, Gift, Timer, Droplets, Rocket, CheckCircle2 } from 'lucide-react'

type Props = {
  coin: Coin
  coins: Coin[]
  market: HypeMarket
  onSelect: () => void
}

export function CoinCard({ coin, coins, market, onSelect }: Props) {
  const eco = coinEconomics(coin, coins, market.dayNotionalVolume, market.feesCollected24h)
  const curve = curveState(coin.progress)
  const pctFull = Math.round(curve.progress * 100)

  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 card-glass p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:neon-border"
    >
      {/* header: coin + paired stock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {coin.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coin.image || "/placeholder.svg"}
              alt={`${coin.ticker} logo`}
              className="size-11 rounded-xl object-cover ring-1 ring-border"
            />
          ) : (
            <span
              className="grid size-11 place-items-center rounded-xl font-mono text-sm font-bold text-background"
              style={{ background: coin.color }}
            >
              {coin.ticker.slice(0, 2)}
            </span>
          )}
          <div className="leading-tight">
            <p className="font-mono text-sm font-bold">{coin.ticker}</p>
            <p className="text-xs text-muted-foreground">{coin.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/40 px-2 py-1">
          <Link2 className="size-3 text-muted-foreground" aria-hidden />
          <span className="size-2 rounded-full" style={{ background: coin.stock.color }} aria-hidden />
          <span className="font-mono text-xs font-semibold">{coin.stock.symbol}</span>
        </div>
      </div>

      {/* reward pot highlight */}
      <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary">
            <Gift className="size-3.5" aria-hidden />
            Holder reward pot
          </div>
          <span className="flex items-center gap-1 rounded-full border border-primary/25 bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-primary">
            <Timer className="size-3" aria-hidden />
            {intervalLabel(coin.raffleInterval)}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-xl font-extrabold tabular-nums text-glow">
          {usd(eco.pot, { cents: true })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {Math.round(coin.feeShare * 100)}% of fees · {usd(eco.volume24h, { compact: true })} vol
        </p>
      </div>

      {/* market cap + bonding progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-end justify-between">
          <div className="leading-tight">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Market cap</span>
            <span className="font-mono text-sm font-bold tabular-nums">{usd(curve.marketCap, { compact: true })}</span>
          </div>
          {curve.migrated ? (
            <span className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <CheckCircle2 className="size-3" aria-hidden />
              Migrated
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Rocket className="size-3" aria-hidden />
              Migrates at {usd(MIGRATION_MCAP, { compact: true })}
            </span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all"
            style={{ width: `${pctFull}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="tabular-nums">{pctFull}% to migration</span>
          <span className="flex items-center gap-1">
            <Droplets className="size-3" aria-hidden />
            {usd(curve.virtualLiquidity, { compact: true })} liquidity
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" aria-hidden />
          {num(coin.holderCount)} holders
        </span>
        <span>{timeAgo(coin.createdAt)}</span>
      </div>
    </button>
  )
}
