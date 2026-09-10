'use client'

import { Trophy } from 'lucide-react'
import { shortAddress } from '@/lib/holders'
import { usd, timeAgo } from '@/lib/format'

export type Winner = {
  address: string
  amount: number
  at: number
}

export function WinnersFeed({ winners }: { winners: Winner[] }) {
  return (
    <section id="winners" className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="size-4 text-gold" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Recent Winners</h2>
      </div>

      {winners.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No draws yet this session. First spin coming up.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {winners.map((w, i) => (
            <li key={`${w.address}-${w.at}`} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={
                    'grid size-8 place-items-center rounded-full font-mono text-xs font-bold ' +
                    (i === 0 ? 'bg-gold text-gold-foreground' : 'bg-muted text-muted-foreground')
                  }
                >
                  {i + 1}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-foreground">{shortAddress(w.address)}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(w.at)}</span>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-primary">{usd(w.amount, { cents: true })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
