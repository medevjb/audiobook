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
    <label className="flex flex-col gap-1 text-sm text-ink-soft">
      Speed
      <select
        value={rate}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-md border border-white/10 bg-room-2 px-3 py-1.5 text-sm text-ink-strong tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {PLAYBACK_RATES.map((option) => (
          <option key={option} value={option}>
            {formatRate(option)}
          </option>
        ))}
      </select>
    </label>
  )
}
