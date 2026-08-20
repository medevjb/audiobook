interface StatusBarProps {
  /** Short status line, e.g. "Currently reading page 57" (PRD §31/§36). */
  message: string
  tone?: 'neutral' | 'error'
}

export function StatusBar({ message, tone = 'neutral' }: StatusBarProps) {
  return (
    <footer
      className={`border-t px-4 py-2.5 text-xs sm:px-6 lg:px-8 transition-colors ${
        tone === 'error'
          ? 'border-rose-soft/50 bg-rose-soft/30 text-rose'
          : 'border-[var(--color-border-subtle)] bg-room-2/90 text-ink-soft'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              tone === 'error' ? 'bg-rose animate-ping' : 'bg-brass'
            }`}
          />
          <span className="font-medium truncate">{message}</span>
        </div>
        <span className="hidden sm:inline-block text-[0.7rem] opacity-60 shrink-0">
          Space: Play/Pause · ←/→: Pages · S: Stop
        </span>
      </div>
    </footer>
  )
}
