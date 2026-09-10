'use client'

import { useState, useMemo } from 'react'
import type { Coin } from '@/lib/coins'
import type { HypeMarket } from '@/lib/hyperliquid'
import { CoinCard } from './coin-card'
import { usd, num } from '@/lib/format'
import { Rocket, Flame, Coins, TrendingUp } from 'lucide-react'

type Props = {
  coins: Coin[]
  market: HypeMarket
  onSelect: (id: string) => void
  onCreate: () => void
}

type Sort = 'pot' | 'new' | 'progress'

export function Launchpad({ coins, market, onSelect, onCreate }: Props) {
  const [sort, setSort] = useState<Sort>('pot')
  const [query, setQuery] = useState('')

  const totalWeight = coins.reduce((s, c) => s + c.volumeWeight, 0) || 1
  const padPot = coins.reduce(
    (s, c) => s + market.feesCollected24h * (c.volumeWeight / totalWeight) * c.feeShare,
    0,
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = coins.filter(
      (c) =>
        !q ||
        c.ticker.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.stock.symbol.toLowerCase().includes(q),
    )
    const sorted = [...list]
    if (sort === 'new') sorted.sort((a, b) => b.createdAt - a.createdAt)
    else if (sort === 'progress') sorted.sort((a, b) => b.progress - a.progress)
    else sorted.sort((a, b) => b.volumeWeight * b.feeShare - a.volumeWeight * a.feeShare)
    return sorted
  }, [coins, query, sort])

  return (
    <main>
      {/* hero */}
      <section className="relative overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-radial-glow" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Flame className="size-3.5" aria-hidden />
            Fees flow back to holders — drawn on the spin
          </div>
          <h1 className="mt-5 max-w-3xl text-balance font-mono text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Launch coins paired with <span className="text-primary text-glow">real stocks</span>.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
            Deploy a token on the pad, pair it with any stock, and a share of its trading fees pools
            into a live jackpot — paid out to one random holder every round on the roulette.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onCreate}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Rocket className="size-4" aria-hidden />
              Deploy a coin
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              HYPE ${market.price.toFixed(2)} · {usd(market.dayNotionalVolume, { compact: true })} 24h vol
            </div>
          </div>

          {/* pad stats */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Coins className="size-4" />} label="Live rewards pool" value={usd(padPot, { compact: true })} accent />
            <Stat icon={<Rocket className="size-4" />} label="Coins on pad" value={num(coins.length)} />
            <Stat icon={<TrendingUp className="size-4" />} label="Pad 24h fees" value={usd(market.feesCollected24h, { compact: true })} />
            <Stat icon={<Flame className="size-4" />} label="HYPE funding" value={`${(market.funding * 100).toFixed(3)}%`} />
          </div>
        </div>
      </section>

      {/* market grid */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-mono text-xl font-bold">Coins on the pad</h2>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coin or stock…"
              className="w-40 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 sm:w-56"
            />
            <div className="flex rounded-full border border-border bg-card p-0.5 text-xs">
              {(['pot', 'new', 'progress'] as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3 py-1.5 font-medium capitalize transition-colors ${
                    sort === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s === 'pot' ? 'Top pot' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No coins match your search.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((coin) => (
              <CoinCard key={coin.id} coin={coin} coins={coins} market={market} onSelect={() => onSelect(coin.id)} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? 'border-primary/40 bg-primary/10 neon-border' : 'border-border/70 card-glass'
      }`}
    >
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${accent ? 'text-primary' : 'text-muted-foreground'}`}>
        {icon}
        {label}
      </div>
      <p className={`mt-1 font-mono text-2xl font-extrabold tabular-nums ${accent ? 'text-glow' : ''}`}>{value}</p>
    </div>
  )
}
