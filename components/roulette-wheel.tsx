'use client'

import { useEffect, useRef } from 'react'
import type { Holder } from '@/lib/holders'
import { shortAddress } from '@/lib/holders'

type Props = {
  pool: Holder[]
  winner: Holder | null
  spinId: number
  onSettled: () => void
}

const MAX_POCKETS = 18
const SPIN_MS = 5200
const TAU = Math.PI * 2

function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5)
}

// Deterministic shuffle helper so the featured pockets look random but stable
// within a single spin.
function sample(pool: Holder[], winner: Holder, count: number) {
  const others = pool.filter((h) => h.address !== winner.address)
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[others[i], others[j]] = [others[j], others[i]]
  }
  const picks = others.slice(0, Math.max(0, count - 1))
  const insertAt = Math.floor(Math.random() * (picks.length + 1))
  picks.splice(insertAt, 0, winner)
  return { pockets: picks, winnerIndex: insertAt }
}

export function RouletteWheel({ pool, winner, spinId, onSettled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const ballRotRef = useRef(0)
  const pocketsRef = useRef<Holder[]>([])
  const winnerIndexRef = useRef(-1)
  const rafRef = useRef<number | null>(null)

  // Draw a static idle wheel on mount / when pool changes and we are not spinning.
  useEffect(() => {
    if (pocketsRef.current.length === 0 && pool.length) {
      const seed = pool.slice(0, MAX_POCKETS)
      pocketsRef.current = seed
      winnerIndexRef.current = -1
    }
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool])

  function draw(highlightWinner = false) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = canvas.clientWidth
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr
      canvas.height = size * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2
    const outer = size / 2 - 2
    const rimInner = outer - Math.max(26, size * 0.075)
    const hub = outer * 0.34

    const pockets = pocketsRef.current
    const n = pockets.length || 1
    const step = TAU / n
    const rot = rotationRef.current

    // Styles pulled from the HYPE theme.
    const css = getComputedStyle(document.documentElement)
    const brand = css.getPropertyValue('--primary').trim() || 'oklch(0.8 0.17 165)'
    const red = '#b0203a'
    const black = '#141a1e'

    // Outer wooden-style rim.
    ctx.beginPath()
    ctx.arc(cx, cy, outer, 0, TAU)
    ctx.fillStyle = '#2b1d14'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.stroke()

    // Pockets.
    for (let i = 0; i < n; i++) {
      const start = rot + i * step
      const end = start + step
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, rimInner, start, end)
      ctx.closePath()
      const isWinner = i === winnerIndexRef.current
      if (isWinner && highlightWinner) {
        ctx.fillStyle = brand
      } else {
        ctx.fillStyle = i % 2 === 0 ? red : black
      }
      ctx.fill()
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.stroke()

      // Label.
      const mid = start + step / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(mid)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = isWinner && highlightWinner ? '#04110b' : 'rgba(255,255,255,0.92)'
      ctx.font = `600 ${Math.max(9, size * 0.026)}px ui-monospace, monospace`
      const label = shortAddress(pockets[i].address)
      ctx.fillText(label, rimInner - 8, 0)
      ctx.restore()
    }

    // Inner hub cone.
    const grad = ctx.createRadialGradient(cx, cy - hub * 0.3, hub * 0.1, cx, cy, hub)
    grad.addColorStop(0, '#4a3527')
    grad.addColorStop(1, '#241812')
    ctx.beginPath()
    ctx.arc(cx, cy, hub, 0, TAU)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = brand
    ctx.lineWidth = 2
    ctx.stroke()

    // Center spindle.
    ctx.beginPath()
    ctx.arc(cx, cy, hub * 0.22, 0, TAU)
    ctx.fillStyle = brand
    ctx.fill()

    // The ball riding the rim.
    const ballAngle = ballRotRef.current - Math.PI / 2
    const ballR = rimInner + (outer - rimInner) / 2
    const bx = cx + Math.cos(ballAngle) * ballR
    const by = cy + Math.sin(ballAngle) * ballR
    ctx.beginPath()
    ctx.arc(bx, by, Math.max(5, size * 0.018), 0, TAU)
    ctx.fillStyle = '#f4f7f5'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 6
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Kick off a spin whenever spinId increments with a valid winner.
  useEffect(() => {
    if (spinId === 0 || !winner || pool.length === 0) return

    const count = Math.min(MAX_POCKETS, pool.length)
    const { pockets, winnerIndex } = sample(pool, winner, count)
    pocketsRef.current = pockets
    winnerIndexRef.current = winnerIndex

    const n = pockets.length
    const step = TAU / n
    // Pointer sits at the top (-90deg). Solve for a rotation that centers the
    // winner pocket under it, plus several full turns for drama.
    const pointer = -Math.PI / 2
    const target =
      pointer - (winnerIndex * step + step / 2) + TAU * (6 + Math.floor(Math.random() * 3))
    const startRot = rotationRef.current % TAU
    const startBall = ballRotRef.current
    // Ball spins the opposite way for 9 turns and lands exactly at the top
    // pointer, where the winning pocket comes to rest.
    const ballTarget = startBall - TAU * 9 - (((startBall % TAU) + TAU) % TAU)

    const t0 = performance.now()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / SPIN_MS)
      const e = easeOutQuint(p)
      rotationRef.current = startRot + (target - startRot) * e
      ballRotRef.current = startBall + (ballTarget - startBall) * e
      draw(p > 0.98)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        ballRotRef.current = ballTarget
        draw(true)
        onSettled()
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId])

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* Pointer */}
      <div className="absolute left-1/2 top-[-2px] z-10 -translate-x-1/2">
        <div className="mx-auto size-0 border-x-8 border-t-[16px] border-x-transparent border-t-primary drop-shadow" />
      </div>
      <div className="animate-[spin_40s_linear_infinite] absolute inset-0 rounded-full opacity-0" aria-hidden />
      <canvas
        ref={canvasRef}
        className="size-full rounded-full shadow-[0_0_60px_-15px_var(--color-primary)]"
        role="img"
        aria-label="Roulette wheel drawing the winning holder"
      />
    </div>
  )
}
