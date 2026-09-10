'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { type Coin, coinEconomics, coinHolders } from '@/lib/coins'
import type { HypeMarket } from '@/lib/hyperliquid'
import type { Holder } from '@/lib/holders'
import { usd, num } from '@/lib/format'
import { RouletteWheel } from './roulette-wheel'
import { WinnerOverlay } from './winner-overlay'
import { ArrowLeft, Link2, Users, Gift, Trophy, Zap, Timer } from 'lucide-react'

type Props = {
  coin: Coin
  coins: Coin[]
  market: HypeMarket
  onBack: () => void
}

type Phase = 'idle' | 'spinning' | 'result'
const ROUND_SECONDS = 45

type WinRecord = { holder: Holder; amount: number; at: number }

export function RewardRoom({ coin, coins, market, onBack }: Props) {
  const eco = coinEconomics(coin, coins, market.dayNotionalVolume, market.feesCollected24h)
  const allHolders = useMemo(() => coinHolders(coin), [coin])

  const [eligible, setEligible] = useState<Holder[]>(allHolders)
  const [wonAddresses, setWonAddresses] = useState<Set<string>>(new Set())
  const [winners, setWinners] = useState<WinRecord[]>([])
  const [currentWinner, setCurrentWinner] = useState<Holder | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [overlay, setOverlay] = useState<WinRecord | null>(null)

  // Reset everything when switching to a different coin.
  useEffect(() => {
    setEligible(allHolders)
    setWonAddresses(new Set())
    setWinners([])
    setCurrentWinner(null)
    setSpinId(0)
    setPhase('idle')
    setSecondsLeft(ROUND_SECONDS)
    setOverlay(null)
  }, [coin.id, allHolders])

  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const settledSpinRef = useRef(0)

  const draw = useCallback(() => {
    if (phaseRef.current === 'spinning') return
    const pool = eligible.length ? eligible : allHolders
    if (pool.length === 0) return
    const winner = pool[Math.floor(Math.random() * pool.length)]
    setCurrentWinner(winner)
    setPhase('spinning')
    setSpinId((n) => n + 1)
  }, [eligible, allHolders])

  // Round countdown → auto draw at zero.
  useEffect(() => {
    if (phase !== 'idle') return
    if (secondsLeft <= 0) {
      draw()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, phase, draw])

  const handleSettled = useCallback(() => {
    if (settledSpinRef.current === spinId) return
    settledSpinRef.current = spinId
    setPhase('result')
    if (currentWinner) {
      const rec: WinRecord = { holder: currentWinner, amount: eco.pot, at: Date.now() }
      setWinners((prev) => [rec, ...prev].slice(0, 12))
      setWonAddresses((prev) => new Set(prev).add(currentWinner.address))
      setEligible((prev) => {
        const next = prev.filter((h) => h.address !== currentWinner.address)
        return next.length ? next : allHolders // new season when pool empties
      })
      setOverlay(rec)
    }
    setTimeout(() => {
      setPhase('idle')
      setSecondsLeft(ROUND_SECONDS)
    }, 1200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWinner, eco.pot, allHolders, spinId])

  const spinning = phase === 'spinning'

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to the pad
      </button>

      {/* coin header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 card-glass p-5">
        <div className="flex items-center gap-4">
          <span
            className="grid size-14 place-items-center rounded-2xl font-mono text-lg font-bold text-background"
            style={{ background: coin.color }}
          >
            {coin.ticker.slice(0, 2)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-extrabold">{coin.ticker}</h1>
              <span className="flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2 py-1 text-xs">
                <Link2 className="size-3 text-muted-foreground" aria-hidden />
                <span className="size-2 rounded-full" style={{ background: coin.stock.color }} aria-hidden />
                <span className="font-mono font-semibold">{coin.stock.symbol}</span>
                <span className="text-muted-foreground">{coin.stock.name}</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{coin.name}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <HeaderStat label="24h volume" value={usd(eco.volume24h, { compact: true })} />
          <HeaderStat label="Fees to holders" value={`${Math.round(coin.feeShare * 100)}%`} />
          <HeaderStat label="Holders" value={num(coin.holderCount)} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* spin stage */}
        <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-grid p-6">
          <div className="absolute inset-0 bg-radial-glow" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Gift className="size-3.5" aria-hidden />
                Current round pot
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-xs">
                <Timer className="size-3.5 text-muted-foreground" aria-hidden />
                {spinning ? (
                  <span className="text-primary">Drawing…</span>
                ) : (
                  <span className="tabular-nums">Next draw in {secondsLeft}s</span>
                )}
              </div>
            </div>

            <p className="mt-3 text-center font-mono text-4xl font-extrabold tabular-nums text-glow md:text-5xl">
              {usd(eco.pot, { cents: true })}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {Math.round(coin.feeShare * 100)}% of {coin.ticker} trading fees · one random holder wins
            </p>

            <div className="mt-6">
              <RouletteWheel
                pool={eligible.length ? eligible : allHolders}
                spinId={spinId}
                winner={currentWinner}
                onSettled={handleSettled}
              />
            </div>

            <button
              onClick={draw}
              disabled={spinning}
              className="mx-auto mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-50"
            >
              <Zap className="size-4" aria-hidden />
              {spinning ? 'Spinning…' : 'Draw now'}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {eligible.length} eligible · past winners removed (no repeat)
            </p>
          </div>
        </section>

        {/* side column */}
        <div className="flex flex-col gap-5">
          {/* winners */}
          <section className="rounded-2xl border border-border/70 card-glass p-5">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="size-4 text-gold" aria-hidden />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wide">Recent winners</h2>
            </div>
            {winners.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No winners yet — first draw in {secondsLeft}s.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {winners.map((w, i) => (
                  <li
                    key={`${w.holder.address}-${w.at}`}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                      i === 0 ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-background/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-md bg-secondary font-mono text-[10px] text-muted-foreground">
                        {winners.length - i}
                      </span>
                      <span className="font-mono text-sm">{w.holder.short}</span>
                    </div>
                    <span className="font-mono text-sm font-bold tabular-nums text-primary">
                      {usd(w.amount, { compact: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* holders pool */}
          <section className="rounded-2xl border border-border/70 card-glass p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" aria-hidden />
                <h2 className="font-mono text-sm font-bold uppercase tracking-wide">Eligible holders</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{eligible.length} in pool</span>
            </div>
            <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
              {allHolders.slice(0, 60).map((h) => {
                const won = wonAddresses.has(h.address)
                return (
                  <div
                    key={h.address}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs ${
                      won ? 'opacity-40' : 'bg-background/40'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${won ? 'bg-muted-foreground' : 'bg-primary'}`} aria-hidden />
                    <span className="font-mono">{h.short}</span>
                    {won && <span className="ml-auto text-[9px] uppercase text-muted-foreground">won</span>}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {overlay && (
        <WinnerOverlay
          coin={coin}
          winner={overlay.holder}
          amount={overlay.amount}
          onClose={() => setOverlay(null)}
        />
      )}
    </main>
  )
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-bold tabular-nums">{value}</p>
    </div>
  )
}
