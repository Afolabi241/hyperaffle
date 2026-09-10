'use client'

import { STOCKS, refQuote } from '@/lib/stocks'

// Scrolling strip of the stocks available to pair with. Reference quotes only.
export function StockTicker() {
  const items = STOCKS.map((s) => ({ ...s, ...refQuote(s.symbol) }))
  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-card/40">
      <div className="flex w-max animate-marquee gap-6 py-2.5">
        {doubled.map((s, i) => (
          <div key={`${s.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap px-2 text-xs">
            <span className="size-1.5 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="font-mono font-semibold text-foreground">{s.symbol}</span>
            <span className="tabular-nums text-muted-foreground">${s.price.toFixed(2)}</span>
            <span className={`tabular-nums ${s.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {s.change >= 0 ? '+' : ''}
              {(s.change * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}
