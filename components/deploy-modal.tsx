'use client'

import { useState, useEffect, useRef } from 'react'
import { STOCKS } from '@/lib/stocks'
import { RAFFLE_INTERVALS } from '@/lib/coins'
import { START_MCAP, MIGRATION_MCAP, START_VIRTUAL_LIQUIDITY } from '@/lib/curve'
import { usd } from '@/lib/format'
import { X, Rocket, Search, Check, Timer, ImagePlus, Droplets } from 'lucide-react'

export type DeployInput = {
  name: string
  ticker: string
  stockSymbol: string
  feeShare: number
  raffleInterval: number
  image?: string
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
  const [raffleInterval, setRaffleInterval] = useState(120)
  const [image, setImage] = useState<string | undefined>(undefined)
  const [q, setQ] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setTicker('')
      setStockSymbol('')
      setFeeShare(40)
      setRaffleInterval(120)
      setImage(undefined)
      setQ('')
    }
  }, [open])

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

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
          {/* coin logo + name/ticker */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Logo</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-background transition-colors hover:border-primary/60"
                aria-label="Upload coin logo"
              >
                {image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image || "/placeholder.svg"} alt="Coin logo preview" className="size-full object-cover" />
                    <span className="absolute inset-0 hidden place-items-center bg-background/70 text-[10px] font-medium text-foreground group-hover:grid">
                      Change
                    </span>
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImagePlus className="size-5" aria-hidden />
                    <span className="text-[10px]">Upload</span>
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3">
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Coin name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tesla Rocket"
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Ticker</span>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="TSLR"
                  className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-primary/60"
                />
              </label>
            </div>
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

          {/* raffle interval */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5">
              <Timer className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="text-xs font-medium text-muted-foreground">Raffle fees every</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {RAFFLE_INTERVALS.map((iv) => {
                const active = iv.seconds === raffleInterval
                return (
                  <button
                    key={iv.seconds}
                    onClick={() => setRaffleInterval(iv.seconds)}
                    className={`rounded-xl border px-2 py-2 text-center font-mono text-xs font-semibold transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {iv.label}
                  </button>
                )
              })}
            </div>
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
          {/* launch terms — same bonding curve for every coin */}
          <div className="mb-3 rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Droplets className="size-3.5 text-primary" aria-hidden />
              Launch terms
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Term label="Start cap" value={usd(START_MCAP, { compact: true })} />
              <Term label="Migrates at" value={usd(MIGRATION_MCAP, { compact: true })} />
              <Term label="Virtual liq." value={usd(START_VIRTUAL_LIQUIDITY, { compact: true })} />
            </div>
          </div>
          <button
            disabled={!canDeploy}
            onClick={() => canDeploy && onDeploy({ name: name.trim(), ticker: ticker.trim(), stockSymbol, feeShare: feeShare / 100, raffleInterval, image })}
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
