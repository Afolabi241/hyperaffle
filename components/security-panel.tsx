'use client'

import { NETWORK, VAULT, shortHash, isPlaceholder } from '@/lib/vault'
import { usd } from '@/lib/format'
import { ShieldCheck, ExternalLink, Lock, HandCoins, Clock, AlertTriangle } from 'lucide-react'

export function SecurityPanel({ potOnChain }: { potOnChain: number }) {
  const deployed = !isPlaceholder(VAULT.address)

  return (
    <section className="rounded-2xl border border-primary/25 card-glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          <h2 className="font-mono text-sm font-bold uppercase tracking-wide">Vault security</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-gold">
          {NETWORK.isTestnet ? 'Testnet' : 'Mainnet'}
        </span>
      </div>

      {NETWORK.isTestnet && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-[11px] text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden />
          <span>
            Running on {NETWORK.name}. All balances are test tokens with no real value. Funds are
            never held by a person — the audited contract holds them and winners claim directly.
          </span>
        </div>
      )}

      <dl className="flex flex-col gap-2 text-sm">
        <Row label="Vault contract">
          {deployed ? (
            <a
              href={`${NETWORK.explorer}/address/${VAULT.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
            >
              {shortHash(VAULT.address)}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : (
            <span className="font-mono text-muted-foreground">{shortHash(VAULT.address)}</span>
          )}
        </Row>
        <Row label="Pot held on-chain">
          <span className="font-mono tabular-nums">{usd(potOnChain, { cents: true })}</span>
        </Row>
        <Row label="Network">
          <span className="font-mono">{NETWORK.name}</span>
        </Row>
      </dl>

      <ul className="mt-4 flex flex-col gap-2 text-[11px] text-muted-foreground">
        <Guarantee icon={Lock}>
          No admin withdraw. There is no function that lets anyone drain user funds.
        </Guarantee>
        <Guarantee icon={HandCoins}>
          Pull-payment: winners claim their own prize, so one bad recipient can never freeze payouts.
        </Guarantee>
        <Guarantee icon={Clock}>
          Unclaimed after {VAULT.claimWindowDays} days, a prize can be swept to the dev wallet for a
          manual airdrop — never while it is still claimable.
        </Guarantee>
      </ul>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Guarantee({ icon: Icon, children }: { icon: typeof Lock; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </li>
  )
}
