'use client'

import { type Coin, coinEconomics } from '@/lib/coins'
import type { HypeMarket } from '@/lib/hyperliquid'
import { usd, num, timeAgo } from '@/lib/format'
import { Users, Link2, Gift } from 'lucide-react'

type Props = {
  coin: Coin
  coins: Coin[]
  market: HypeMarket
  onSelect: () => void
}

export function CoinCard({ coin, coins, market, onSelect }: Props) {
  const eco = coinEconomics(coin, coins, market.dayNotionalVolume, market.feesCollected24h)
  const pctFull = Math.round(coin.progress * 100)

  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 card-glass p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:neon-border"
    >
      {/* header: coin + paired stock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-xl font-mono text-sm font-bold text-background"
            style={{ background: coin.color }}
          >
            {coin.ticker.slice(0, 2)}
          </span>
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
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary">
          <Gift className="size-3.5" aria-hidden />
          Holder reward pot
        </div>
        <p className="mt-0.5 font-mono text-xl font-extrabold tabular-nums text-glow">
          {usd(eco.pot, { cents: true })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {Math.round(coin.feeShare * 100)}% of fees · {usd(eco.volume24h, { compact: true })} vol
        </p>
      </div>

      {/* bonding progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Bonding curve</span>
          <span className="tabular-nums">{pctFull}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all"
            style={{ width: `${pctFull}%` }}
          />
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
