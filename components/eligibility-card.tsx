'use client'

import type { Coin } from '@/lib/coins'
import { walletEligibility, shortAddr } from '@/lib/wallet'
import { num } from '@/lib/format'
import { Wallet, CheckCircle2, XCircle, Ticket } from 'lucide-react'

type Props = {
  coin: Coin
  address: string | null
  onConnect: () => void
  onDisconnect: () => void
}

export function EligibilityCard({ coin, address, onConnect, onDisconnect }: Props) {
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

  const e = walletEligibility(address, coin)

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

      {e.eligible ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2">
            <CheckCircle2 className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-primary">
              {e.alreadyWon ? 'Already won this season' : `Eligible for ${coin.ticker} raffle`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={`${coin.ticker} balance`} value={num(e.balance)} />
            <Stat
              label="Win odds / round"
              value={e.alreadyWon ? '—' : `1 in ${num(coin.holderCount)}`}
              icon
            />
          </div>
          {e.alreadyWon ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              No wallet wins twice in a season. Your ticket returns when the pool resets.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
          <XCircle className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">
            This wallet holds no {coin.ticker} — hold {coin.ticker} to enter the raffle.
          </span>
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-0.5 flex items-center gap-1 font-mono text-sm font-bold tabular-nums">
        {icon ? <Ticket className="size-3.5 text-primary" aria-hidden /> : null}
        {value}
      </span>
    </div>
  )
}
