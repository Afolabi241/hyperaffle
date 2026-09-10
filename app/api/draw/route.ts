import { NextResponse } from 'next/server'
import { holdersForCoinId } from '@/lib/coins'

export const dynamic = 'force-dynamic'

/**
 * Server-side winner selection. Both the holder pool and the random pick happen
 * here, so a client can neither read the selection logic nor influence who wins
 * (no client-supplied pool, no client-side Math.random). On mainnet this is
 * replaced by an on-chain VRF draw — the request/response shape stays the same.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.coinId !== 'string' || typeof body.holderCount !== 'number') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const exclude = new Set<string>(Array.isArray(body.exclude) ? body.exclude : [])
  const pool = holdersForCoinId(body.coinId, body.holderCount)

  // Remove past winners (no repeat). If everyone has won, start a new season.
  let remaining = pool.filter((h) => !exclude.has(h.address))
  if (remaining.length === 0) remaining = pool
  if (remaining.length === 0) return NextResponse.json({ winner: null })

  const winner = remaining[Math.floor(Math.random() * remaining.length)]
  return NextResponse.json({ winner })
}
