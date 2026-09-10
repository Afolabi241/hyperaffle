'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import type { HypeMarket } from '@/lib/hyperliquid'
import type { Coin } from '@/lib/coins'
import { SiteHeader } from './site-header'
import { StockTicker } from './stock-ticker'
import { Launchpad } from './launchpad'
import { RewardRoom } from './reward-room'
import { DeployModal, type DeployInput } from './deploy-modal'
import { WalletModal } from './wallet-modal'
import { STOCKS } from '@/lib/stocks'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COIN_COLORS = ['#39ffc2', '#5ac8fa', '#ff6b6b', '#ffd93d', '#c77dff', '#ff9f1c']

export function PadApp({
  initialMarket,
  coins: initialCoins,
}: {
  initialMarket: HypeMarket
  coins: Coin[]
}) {
  const { data } = useSWR<{ market: HypeMarket }>('/api/hype', fetcher, {
    refreshInterval: 15000,
    fallbackData: { market: initialMarket },
    revalidateOnFocus: false,
  })
  const market = data?.market ?? initialMarket

  const [coins, setCoins] = useState<Coin[]>(initialCoins)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deployOpen, setDeployOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [wallet, setWallet] = useState<string | null>(null)

  const selected = coins.find((c) => c.id === selectedId) ?? null

  const handleDeploy = useCallback((input: DeployInput) => {
    const stock = STOCKS.find((s) => s.symbol === input.stockSymbol) ?? STOCKS[0]
    const id = input.ticker.toLowerCase() + '-' + Math.random().toString(36).slice(2, 6)
    const coin: Coin = {
      id,
      ticker: input.ticker.toUpperCase(),
      name: input.name,
      stock,
      createdAt: Date.now(),
      progress: 0.02,
      holderCount: 12 + Math.floor(Math.random() * 20),
      feeShare: input.feeShare,
      raffleInterval: input.raffleInterval,
      volumeWeight: 0.2 + Math.random() * 0.5,
      color: COIN_COLORS[Math.floor(Math.random() * COIN_COLORS.length)],
      image: input.image ?? '/coins/default.png',
    }
    setCoins((prev) => [coin, ...prev])
    setDeployOpen(false)
    setSelectedId(coin.id)
  }, [])

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader
        onCreate={() => setDeployOpen(true)}
        onHome={() => setSelectedId(null)}
        wallet={wallet}
        onWallet={() => setWalletOpen(true)}
        onDisconnect={() => setWallet(null)}
      />
      <StockTicker />

      {selected ? (
        <RewardRoom
          coin={selected}
          coins={coins}
          market={market}
          onBack={() => setSelectedId(null)}
          wallet={wallet}
          onConnect={() => setWalletOpen(true)}
          onDisconnect={() => setWallet(null)}
        />
      ) : (
        <Launchpad
          coins={coins}
          market={market}
          onSelect={(id) => setSelectedId(id)}
          onCreate={() => setDeployOpen(true)}
        />
      )}

      <DeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        onDeploy={handleDeploy}
      />

      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={(addr) => setWallet(addr)}
      />

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Live pad fees derived from real Hyperliquid HYPE volume · Holder pools generated for demo
      </footer>
    </div>
  )
}
