'use client'

import { Rocket, Plus, Wallet } from 'lucide-react'
import { shortAddr } from '@/lib/wallet'

type Props = {
  onCreate: () => void
  onHome: () => void
  wallet: string | null
  onWallet: () => void
  onDisconnect: () => void
}

export function SiteHeader({ onCreate, onHome, wallet, onWallet, onDisconnect }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <button onClick={onHome} className="flex items-center gap-2.5 outline-none" aria-label="The Pad home">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--color-primary)]">
            <Rocket className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col items-start leading-none">
            <span className="font-mono text-lg font-extrabold tracking-tight text-glow">THE PAD</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              stock-paired · hyperliquid
            </span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium text-primary">Live fees</span>
          </div>
          {wallet ? (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              title="Read-only · click to disconnect"
            >
              <Wallet className="size-4" aria-hidden />
              {shortAddr(wallet)}
            </button>
          ) : (
            <button
              onClick={onWallet}
              className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 sm:flex"
            >
              <Wallet className="size-4" aria-hidden />
              Check wallet
            </button>
          )}
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Deploy coin</span>
            <span className="sm:hidden">Deploy</span>
          </button>
        </div>
      </div>
    </header>
  )
}
