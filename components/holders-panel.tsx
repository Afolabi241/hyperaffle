'use client'

import { Users } from 'lucide-react'
import type { Holder } from '@/lib/holders'
import { shortAddress } from '@/lib/holders'
import { num } from '@/lib/format'

type Props = {
  holders: Holder[]
  wonAddresses: Set<string>
}

export function HoldersPanel({ holders, wonAddresses }: Props) {
  return (
    <section id="holders" className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Eligible Holders</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {(holders.length - wonAddresses.size).toLocaleString()} in pool
        </span>
      </div>

      <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {holders.map((h, i) => {
          const won = wonAddresses.has(h.address)
          return (
            <li
              key={h.address}
              className={
                'flex items-center justify-between rounded-lg px-3 py-2 ' +
                (won ? 'opacity-40' : 'bg-background/40')
              }
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono text-xs text-muted-foreground">{i + 1}</span>
                <span className="font-mono text-sm text-foreground">{shortAddress(h.address)}</span>
                {won && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    won
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-primary">{num(h.balance, true)} HYPE</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
