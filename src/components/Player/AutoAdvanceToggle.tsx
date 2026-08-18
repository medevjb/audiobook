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
    <label className="flex select-none items-center justify-center gap-2 text-sm text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-transparent text-brass accent-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      />
      Auto-advance to next page
    </label>
  )
}
