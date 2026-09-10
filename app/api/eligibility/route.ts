import { NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/wallet'
import { computeEligibility } from '@/lib/wallet-server'

export const dynamic = 'force-dynamic'

/**
 * Server-side eligibility check. The qualification rules (hold time, odds, win
 * history) live only on the server so they cannot be read or gamed in the
 * browser — the client just renders the result.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = (searchParams.get('address') ?? '').trim()
  const coinId = searchParams.get('coinId') ?? ''
  const holderCount = Number(searchParams.get('holderCount') ?? '0')

  if (!isValidAddress(address) || !coinId || !Number.isFinite(holderCount) || holderCount <= 0) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  return NextResponse.json(computeEligibility(address, coinId, holderCount))
}
