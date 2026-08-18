interface StatusBarProps {
  /** Short status line, e.g. "Currently reading page 57" (PRD §31/§36). */
  message: string
  tone?: 'neutral' | 'error'
}

export function StatusBar({ message, tone = 'neutral' }: StatusBarProps) {
  return (
    <div
      className={`border-t px-4 py-2.5 text-sm sm:px-6 ${
        tone === 'error' ? 'border-rose-soft bg-rose-soft text-rose' : 'border-white/5 bg-room-2 text-ink-soft'
      }`}
      // Status changes are announced without stealing focus (PRD §33).
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-6xl">{message}</div>
    </div>
  )
}
