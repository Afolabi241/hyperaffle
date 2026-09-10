import { Dashboard } from '@/components/dashboard'
import { getHypeMarket } from '@/lib/hyperliquid'
import { getHolders } from '@/lib/holders'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [market, holders] = await Promise.all([getHypeMarket(), Promise.resolve(getHolders())])

  return <Dashboard initial={{ market, holders, totalHolders: holders.length }} />
}
