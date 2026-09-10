'use client'

import { useMemo } from 'react'
import type { Holder } from '@/lib/holders'
import type { Coin } from '@/lib/coins'
import { usd } from '@/lib/format'
import { Trophy, X, Send } from 'lucide-react'

type Props = {
  coin: Coin
  winner: Holder
  amount: number
  onClose: () => void
}

const CONFETTI = ['#39ffc2', '#5ac8fa', '#ffd93d', '#ff6b6b', '#c77dff']

export function WinnerOverlay({ coin, winner, amount, onClose }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.6 + Math.random() * 1.4,
        color: CONFETTI[i % CONFETTI.length],
        size: 6 + Math.random() * 8,
      })),
    [],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 block rounded-[2px]"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              animation: `confettifall ${p.dur}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="animate-winnerpop relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/40 card-glass p-8 text-center neon-border">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Close">
          <X className="size-5" />
        </button>

        <div className="relative mx-auto size-20">
          {coin.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coin.image || "/placeholder.svg"}
              alt={`${coin.ticker} logo`}
              className="size-20 rounded-2xl object-cover ring-2 ring-gold shadow-[0_0_36px_-4px_var(--color-gold)]"
            />
          ) : (
            <div className="grid size-20 place-items-center rounded-2xl bg-gold text-gold-foreground shadow-[0_0_30px_-4px_var(--color-gold)]">
              <Trophy className="size-9" aria-hidden />
            </div>
          )}
          <span className="absolute -bottom-2 -right-2 grid size-9 place-items-center rounded-full bg-gold text-gold-foreground ring-4 ring-background">
            <Trophy className="size-4.5" aria-hidden />
          </span>
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">Winner drawn</p>
        <p className="mt-2 font-mono text-4xl font-extrabold tabular-nums text-glow">{usd(amount, { cents: true })}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          paid from <span className="font-semibold text-foreground">{coin.ticker}</span> fees
        </p>

        <div className="mt-5 rounded-xl border border-border bg-background/50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Airdropped to</p>
          <p className="font-mono text-lg font-bold">{winner.short}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
            <Send className="size-3" aria-hidden />
            Paid automatically — no claim needed
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
