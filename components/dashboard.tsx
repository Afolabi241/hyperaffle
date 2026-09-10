'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Dices, Sparkles, X } from 'lucide-react'
import type { HypeMarket } from '@/lib/hyperliquid'
import type { Holder } from '@/lib/holders'
import { shortAddress } from '@/lib/holders'
import { usd } from '@/lib/format'
import { SiteHeader } from './site-header'
import { PotHero } from './pot-hero'
import { StatsBar } from './stats-bar'
import { SpinReel } from './spin-reel'
import { WinnersFeed, type Winner } from './winners-feed'
import { HoldersPanel } from './holders-panel'

const ROUND_SECONDS = 90

type ApiData = { market: HypeMarket; holders: Holder[]; totalHolders: number }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Props = { initial: ApiData }

export function Dashboard({ initial }: Props) {
  const { data } = useSWR<ApiData>('/api/hype', fetcher, {
    fallbackData: initial,
    refreshInterval: 15000,
  })

  const market = data?.market ?? initial.market
  const holders = initial.holders // stable pool

  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle')
  const [spinId, setSpinId] = useState(0)
  const [currentWinner, setCurrentWinner] = useState<Holder | null>(null)
  const [awarded, setAwarded] = useState(0)
  const [winners, setWinners] = useState<Winner[]>([])
  const [wonAddresses, setWonAddresses] = useState<Set<string>>(new Set())

  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const settledSpinRef = useRef(0)

  const eligible = holders.filter((h) => !wonAddresses.has(h.address))

  const startSpin = useCallback(() => {
    if (phaseRef.current !== 'idle') return
    // Reset for a fresh season once everyone has won.
    let pool = holders.filter((h) => !wonAddresses.has(h.address))
    if (pool.length === 0) {
      setWonAddresses(new Set())
      pool = holders
    }
    const winner = pool[Math.floor(Math.random() * pool.length)]
    setCurrentWinner(winner)
    setAwarded(market.pot)
    setPhase('spinning')
    setSpinId((n) => n + 1)
  }, [holders, wonAddresses, market.pot])

  // Countdown, only while idle.
  useEffect(() => {
    if (phase !== 'idle') return
    if (secondsLeft <= 0) {
      startSpin()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, secondsLeft, startSpin])

  const handleSettled = useCallback(() => {
    // Process each spin exactly once, even if transitionend double-fires.
    if (settledSpinRef.current === spinId) return
    settledSpinRef.current = spinId
    setPhase('result')
    if (currentWinner) {
      setWinners((prev) => [{ address: currentWinner.address, amount: awarded, at: Date.now() }, ...prev].slice(0, 8))
      setWonAddresses((prev) => new Set(prev).add(currentWinner.address))
    }
    const t = setTimeout(() => {
      setPhase('idle')
      setSecondsLeft(ROUND_SECONDS)
    }, 6000)
    return () => clearTimeout(t)
  }, [currentWinner, awarded, spinId])

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <PotHero
          pot={market.pot}
          secondsLeft={secondsLeft}
          roundSeconds={ROUND_SECONDS}
          eligibleCount={eligible.length}
        />

        <StatsBar market={market} />

        <div className="grid gap-6 lg:grid-cols-3">
          <section id="spin" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Live Draw</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {phase === 'spinning' ? 'Spinning…' : phase === 'result' ? 'Winner locked' : 'Awaiting next draw'}
              </span>
            </div>

            <SpinReel pool={eligible.length ? eligible : holders} spinId={spinId} winner={currentWinner} onSettled={handleSettled} />

            <button
              type="button"
              onClick={startSpin}
              disabled={phase !== 'idle'}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Dices className="size-4 transition-transform group-hover:rotate-12" aria-hidden />
              {phase === 'idle' ? 'Draw now' : 'Draw in progress'}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Every holder gets one ticket · equal odds · a wallet can only win once per season
            </p>
          </section>

          <WinnersFeed winners={winners} />
        </div>

        <HoldersPanel holders={holders} wonAddresses={wonAddresses} />

        <footer className="pb-6 pt-2 text-center text-xs text-muted-foreground">
          Market data is live from the Hyperliquid public API. HYPEPOT is a demo concept, not
          financial advice or an offer to gamble.
        </footer>
      </main>

      {phase === 'result' && currentWinner && (
        <WinnerOverlay
          address={currentWinner.address}
          amount={awarded}
          onClose={() => {
            setPhase('idle')
            setSecondsLeft(ROUND_SECONDS)
          }}
        />
      )}
    </div>
  )
}

function WinnerOverlay({ address, amount, onClose }: { address: string; amount: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-primary/40 bg-card p-8 text-center">
        <div className="animate-potpulse pointer-events-none absolute -top-20 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <div className="relative">
          <span className="text-xs font-medium uppercase tracking-widest text-primary">Winner drawn</span>
          <p className="mt-4 font-mono text-lg text-foreground">{shortAddress(address)}</p>
          <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-primary">{usd(amount, { cents: true })}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Pot paid out from live HYPE trading fees. Removed from the pool — they can&apos;t win
            again this season.
          </p>
        </div>
      </div>
    </div>
  )
}
