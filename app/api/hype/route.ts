import { NextResponse } from 'next/server'
import { getHypeMarket } from '@/lib/hyperliquid'

export const dynamic = 'force-dynamic'

// The dashboard only needs the live pad-wide market/fee figures on refresh;
// the coin catalog and holder pools are deterministic and passed from the
// server component on first load.
export async function GET() {
  try {
    const market = await getHypeMarket()
    return NextResponse.json({ market })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load HYPE data' },
      { status: 502 },
    )
  }
}
