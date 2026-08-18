interface AppHeaderProps {
  /** Rendered on the right — the "Upload New PDF" action once a book is open. */
  action?: React.ReactNode
}

export function AppHeader({ action }: AppHeaderProps) {
  return (
    <header className="border-b border-white/5 bg-room-2">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-medium tracking-tight text-ink-strong">
            Audiobook Reader
          </span>
          <span className="hidden font-display text-lg italic text-brass sm:inline">— aloud.</span>
        </div>
        {action}
      </div>
    </header>
  )
}
