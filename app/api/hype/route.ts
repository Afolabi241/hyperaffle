import { NextResponse } from 'next/server'
import { getHypeMarket } from '@/lib/hyperliquid'
import { getHolders } from '@/lib/holders'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const market = await getHypeMarket()
    const holders = getHolders()
    return NextResponse.json({ market, holders, totalHolders: holders.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load HYPE data' },
      { status: 502 },
    )
  }
}
