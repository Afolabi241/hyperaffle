'use client'

import { usd } from '@/lib/format'
import { Timer } from 'lucide-react'

type Props = {
  pot: number
  secondsLeft: number
  roundSeconds: number
  eligibleCount: number
}

function fmtClock(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function PotHero({ pot, secondsLeft, roundSeconds, eligibleCount }: Props) {
  const progress = 1 - secondsLeft / roundSeconds

  return (
    <section id="pot" className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-8 md:p-12">
      <div className="animate-potpulse pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
          Current Round Pot
        </span>

        <p className="mt-6 font-mono text-5xl font-bold tabular-nums tracking-tight text-foreground sm:text-7xl md:text-8xl">
          {usd(pot, { cents: true })}
        </p>
        <p className="mt-3 max-w-md text-pretty text-sm text-muted-foreground">
          Funded live by real HYPE trading fees on Hyperliquid. When the timer hits zero, one
          holder is drawn at random and takes the entire pot.
        </p>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="size-4" aria-hidden /> Next draw in
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {fmtClock(secondsLeft)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono text-primary">{eligibleCount.toLocaleString()}</span> eligible
            holders in the pool · no repeat winners
          </p>
        </div>
      </div>
    </section>
  )
}
