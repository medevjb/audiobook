import type { PlaybackStatus } from '../../types/reader'

interface PlayerControlsProps {
  playback: PlaybackStatus
  /** False when there is no readable text on the current page to speak. */
  canPlay: boolean
  hasPrevious: boolean
  hasNext: boolean
  onPlay(): void
  onPause(): void
  onResume(): void
  onStop(): void
  onPrevious(): void
  onNext(): void
}

const iconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-white/5 hover:text-brass-strong disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass'

/**
 * Playback controls (PRD §16): Play, Pause, Resume, Stop, Previous page, Next
 * page. Play/Pause/Resume share one button that swaps its icon and action
 * with playback state — a toggle reads more like an audio player than three
 * separate always-visible buttons for what is, to the listener, one control.
 */
export function PlayerControls({
  playback,
  canPlay,
  hasPrevious,
  hasNext,
  onPlay,
  onPause,
  onResume,
  onStop,
  onPrevious,
  onNext,
}: PlayerControlsProps) {
  const isPlaying = playback === 'playing'
  const isPaused = playback === 'paused'

  const toggle = isPlaying
    ? { label: 'Pause', icon: '❙❙', action: onPause, disabled: false }
    : isPaused
      ? { label: 'Resume', icon: '▶', action: onResume, disabled: false }
      : { label: 'Play', icon: '▶', action: onPlay, disabled: !canPlay }

  return (
    <div
      className="flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-room-2 px-3 py-2"
      role="group"
      aria-label="Playback controls"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={!hasPrevious}
        onClick={onPrevious}
        className={iconButtonClass}
      >
        ‹‹
      </button>

      <button
        type="button"
        onClick={toggle.action}
        disabled={toggle.disabled}
        className="mx-1 inline-flex items-center gap-1.5 rounded-md bg-brass px-5 py-1.5 text-sm font-semibold text-room transition-colors hover:bg-brass-strong disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <span aria-hidden>{toggle.icon}</span> {toggle.label}
      </button>

      <button
        type="button"
        onClick={onStop}
        disabled={playback === 'stopped'}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:border-rose/40 hover:text-rose disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <span aria-hidden>■</span> Stop
      </button>

      <button
        type="button"
        aria-label="Next page"
        disabled={!hasNext}
        onClick={onNext}
        className={iconButtonClass}
      >
        ››
      </button>
    </div>
  )
}
