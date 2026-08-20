import { PLAYBACK_RATES } from '../../types/preferences'

interface SpeedControlProps {
  rate: number
  onChange(rate: number): void
}

function formatRate(rate: number): string {
  return `${rate}×`
}

/** Playback speed (PRD §19): the seven required rates, defaulting to 1.0×. */
export function SpeedControl({ rate, onChange }: SpeedControlProps) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft min-w-0">
      Speed
      <select
        value={rate}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-room px-3 py-2 text-sm font-normal text-ink-strong tabular-nums transition-colors hover:border-brass/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {PLAYBACK_RATES.map((option) => (
          <option key={option} value={option} className="bg-room-2 text-ink">
            {formatRate(option)}
          </option>
        ))}
      </select>
    </label>
  )
}
