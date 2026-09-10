'use client'

import useSWR from 'swr'
import type { Coin } from '@/lib/coins'
import { shortAddr, HOLD_MINUTES, type Eligibility } from '@/lib/wallet'
import { num } from '@/lib/format'
import { Wallet, CheckCircle2, XCircle, Hourglass, Loader2 } from 'lucide-react'

type Props = {
  coin: Coin
  address: string | null
  onConnect: () => void
  onDisconnect: () => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EligibilityCard({ coin, address, onConnect, onDisconnect }: Props) {
  // Eligibility is computed server-side (/api/eligibility); the client only
  // ever receives the result, never the qualification rules.
  const { data: e, isLoading } = useSWR<Eligibility>(
    address ? `/api/eligibility?address=${address}&coinId=${coin.id}&holderCount=${coin.holderCount}` : null,
    fetcher,
  )

  if (!address) {
    return (
      <button
        onClick={onConnect}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <Wallet className="size-4" aria-hidden />
        Check my wallet eligibility
      </button>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-card card-glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" aria-hidden />
          <span className="font-mono text-sm">{shortAddr(address)}</span>
        </div>
        <button onClick={onDisconnect} className="text-[11px] text-muted-foreground hover:text-foreground">
          Change
        </button>
      </div>

      {isLoading || !e ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">Checking eligibility…</span>
        </div>
      ) : !e.holds ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
          <XCircle className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">
            This wallet holds no {coin.ticker} — hold {coin.ticker} for {HOLD_MINUTES} min to enter the raffle.
          </span>
        </div>
      ) : !e.qualified ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2">
            <Hourglass className="size-4 text-gold" aria-hidden />
            <span className="text-sm font-semibold text-gold">
              Qualifying — {e.minutesToQualify} min left
            </span>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Held {e.heldMinutes} min</span>
              <span>Need {HOLD_MINUTES} min</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${Math.min(100, (e.heldMinutes / HOLD_MINUTES) * 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Wallets must hold {coin.ticker} for {HOLD_MINUTES} minutes before they enter draws — this blocks last-second buy-ins right before a spin.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2">
            <CheckCircle2 className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-primary">
              {e.alreadyWon ? 'Already won this season' : `Qualified for ${coin.ticker} draws`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={`${coin.ticker} balance`} value={num(e.balance)} />
            <Stat
              label="Win odds / round"
              value={e.alreadyWon ? '—' : `1 in ${num(coin.holderCount)}`}
            />
          </div>
          {e.alreadyWon ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              No wallet wins twice in a season. Your entry returns when the pool resets.
            </p>
          ) : null}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-0.5 flex items-center gap-1 font-mono text-sm font-bold tabular-nums">
        {value}
      </span>
    </div>
  )
}
