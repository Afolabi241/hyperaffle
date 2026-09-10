import { PadApp } from '@/components/pad-app'
import { getHypeMarket } from '@/lib/hyperliquid'
import { getCoins } from '@/lib/coins'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const market = await getHypeMarket()
  const coins = getCoins()

  return <PadApp initialMarket={market} coins={coins} />
}
