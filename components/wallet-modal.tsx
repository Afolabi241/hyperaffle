'use client'

import { useState, useEffect } from 'react'
import { isValidAddress } from '@/lib/wallet'
import { X, Wallet, ShieldCheck, Eye } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  onConnect: (address: string) => void
}

export function WalletModal({ open, onClose, onConnect }: Props) {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAddress('')
      setError('')
    }
  }, [open])

  if (!open) return null

  const submit = () => {
    const a = address.trim()
    if (!isValidAddress(a)) {
      setError('Enter a valid 0x wallet address (42 characters).')
      return
    }
    onConnect(a)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card card-glass neon-border">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" aria-hidden />
            <h2 className="font-mono text-base font-bold">Check wallet eligibility</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
            <Eye className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Read-only. The Pad never takes custody of your funds and cannot move them — this only
              looks up which coins your address is eligible to win.
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Wallet address</span>
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
              }}
              placeholder="0x…"
              spellCheck={false}
              className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary/60"
            />
            {error ? <span className="text-xs text-destructive">{error}</span> : null}
          </label>

          <button
            onClick={submit}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
          >
            <ShieldCheck className="size-4" aria-hidden />
            Check eligibility
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Testnet · eligibility simulated until the HyperEVM holder indexer is connected
          </p>
        </div>
      </div>
    </div>
  )
}
