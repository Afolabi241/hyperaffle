'use client'

import { useState, useEffect } from 'react'
import { STOCKS } from '@/lib/stocks'
import { X, Rocket, Search, Check } from 'lucide-react'

export type DeployInput = {
  name: string
  ticker: string
  stockSymbol: string
  feeShare: number
}

type Props = {
  open: boolean
  onClose: () => void
  onDeploy: (input: DeployInput) => void
}

export function DeployModal({ open, onClose, onDeploy }: Props) {
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [stockSymbol, setStockSymbol] = useState('')
  const [feeShare, setFeeShare] = useState(40)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setTicker('')
      setStockSymbol('')
      setFeeShare(40)
      setQ('')
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const stocks = STOCKS.filter(
    (s) => !q || s.symbol.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()),
  )
  const canDeploy = name.trim() && ticker.trim() && stockSymbol

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Rocket className="size-4" aria-hidden />
            </span>
            <h2 className="font-mono text-lg font-bold">Deploy a coin</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-1 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Coin name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tesla Rocket"
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
              />
            </label>
            <label className="col-span-1 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ticker</span>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="TSLR"
                className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-primary/60"
              />
            </label>
          </div>

          {/* fee share */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Fees paid to holders</span>
              <span className="font-mono text-sm font-bold text-primary">{feeShare}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={feeShare}
              onChange={(e) => setFeeShare(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>

          {/* stock picker */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pair with a stock</span>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
                <Search className="size-3.5 text-muted-foreground" aria-hidden />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  className="w-24 bg-transparent text-xs outline-none"
                />
              </div>
            </div>
            <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {stocks.map((s) => {
                const active = s.symbol === stockSymbol
                return (
                  <button
                    key={s.symbol}
                    onClick={() => setStockSymbol(s.symbol)}
                    className={`relative flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-colors ${
                      active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'
                    }`}
                  >
                    {active && (
                      <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                    <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                    <span className="font-mono text-xs font-bold">{s.symbol}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{s.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 px-5 py-4">
          <button
            disabled={!canDeploy}
            onClick={() => canDeploy && onDeploy({ name: name.trim(), ticker: ticker.trim(), stockSymbol, feeShare: feeShare / 100 })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform enabled:hover:scale-[1.01] enabled:active:scale-95 disabled:opacity-40"
          >
            <Rocket className="size-4" aria-hidden />
            {canDeploy ? `Deploy ${ticker} × ${stockSymbol}` : 'Complete the form to deploy'}
          </button>
        </div>
      </div>
    </div>
  )
}
