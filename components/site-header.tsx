import { Flame } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="size-5" aria-hidden />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold tracking-tight">HYPEPOT</span>
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              on Hyperliquid
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#pot" className="transition-colors hover:text-foreground">
            The Pot
          </a>
          <a href="#spin" className="transition-colors hover:text-foreground">
            Live Spin
          </a>
          <a href="#holders" className="transition-colors hover:text-foreground">
            Holders
          </a>
          <a href="#winners" className="transition-colors hover:text-foreground">
            Winners
          </a>
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium text-primary">Live</span>
        </div>
      </div>
    </header>
  )
}
