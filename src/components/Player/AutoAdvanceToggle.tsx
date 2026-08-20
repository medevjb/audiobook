interface AutoAdvanceToggleProps {
  checked: boolean
  onChange(checked: boolean): void
}

/**
 * "Auto continue to next page" (PRD §17). Defaults to enabled — see
 * `DEFAULT_PREFERENCES` — and lives next to the transport controls it
 * governs rather than buried in a settings panel.
 */
export function AutoAdvanceToggle({ checked, onChange }: AutoAdvanceToggleProps) {
  return (
    <label className="flex select-none items-center justify-between rounded-2xl border border-[var(--color-border)] bg-room-2/95 px-4 py-3 text-xs text-ink-soft shadow-sm backdrop-blur-md transition-all hover:border-brass/40 cursor-pointer">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-room-3 text-brass ring-1 ring-[var(--color-border-subtle)]">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
          </svg>
        </span>
        <span className="font-medium text-ink-strong text-sm">Auto-advance to next page</span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label="Auto-advance to next page"
        className="h-4 w-4 rounded border border-[var(--color-border)] bg-room text-brass accent-brass cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      />
    </label>
  )
}
