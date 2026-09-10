'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Holder } from '@/lib/holders'
import { shortAddress } from '@/lib/holders'
import { num } from '@/lib/format'

const ITEM_W = 172 // px, must match the card width below (160 + 12 gap)

type Props = {
  pool: Holder[]
  spinId: number
  winner: Holder | null
  onSettled: () => void
}

function buildStrip(pool: Holder[], winner: Holder): Holder[] {
  const strip: Holder[] = []
  for (let i = 0; i < 58; i++) {
    strip.push(pool[Math.floor(Math.random() * pool.length)])
  }
  // Land the winner near the end so the reel decelerates onto it.
  strip[strip.length - 6] = winner
  return strip
}

export function SpinReel({ pool, spinId, winner, onSettled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [strip, setStrip] = useState<Holder[]>([])
  const [offset, setOffset] = useState(0)
  const [transitionOn, setTransitionOn] = useState(false)
  const winnerIndexRef = useRef<number>(-1)

  // Idle strip so the reel never looks empty before the first draw.
  useEffect(() => {
    if (spinId === 0 && pool.length) {
      setStrip(Array.from({ length: 12 }, (_, i) => pool[i % pool.length]))
    }
  }, [spinId, pool])

  useLayoutEffect(() => {
    if (spinId === 0 || !winner || !pool.length) return
    const container = containerRef.current
    if (!container) return

    const nextStrip = buildStrip(pool, winner)
    const winnerIndex = nextStrip.length - 6
    winnerIndexRef.current = winnerIndex

    const center = container.clientWidth / 2 - ITEM_W / 2
    const target = center - winnerIndex * ITEM_W

    // Reset to the start with no transition, then animate to the target.
    setStrip(nextStrip)
    setTransitionOn(false)
    setOffset(center)

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionOn(true)
        setOffset(target)
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [spinId, winner, pool])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl border border-border bg-background/60 py-5"
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-card to-transparent" />

      {/* center pointer */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 -translate-x-1/2">
        <div className="h-full w-0.5 bg-primary shadow-[0_0_16px_2px_var(--color-primary)]" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-primary" />

      <div
        className="flex will-change-transform"
        style={{
          transform: `translateX(${offset}px)`,
          transition: transitionOn ? 'transform 5.2s cubic-bezier(0.12, 0.7, 0.1, 1)' : 'none',
        }}
        onTransitionEnd={(e) => {
          // Only react to this element's own transform finishing — not events
          // bubbling up from descendants or other properties.
          if (e.target === e.currentTarget && e.propertyName === 'transform' && spinId > 0) {
            onSettled()
          }
        }}
      >
        {strip.map((h, i) => {
          return (
            <div
              key={`${h.address}-${i}`}
              className="mr-3 flex h-24 w-40 shrink-0 flex-col justify-between rounded-lg border border-border bg-card p-3"
              data-winner={i === winnerIndexRef.current || undefined}
            >
              <span className="font-mono text-sm text-foreground">{shortAddress(h.address)}</span>
              <div className="flex items-end justify-between">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Holder</span>
                <span className="font-mono text-xs text-primary">{num(h.balance, true)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
