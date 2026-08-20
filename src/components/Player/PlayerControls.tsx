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
  'inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition-all duration-150 hover:bg-room-3 hover:text-brass-strong active:scale-95 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer'

/**
 * Playback controls (PRD §16): Play, Pause, Resume, Stop, Previous page, Next
 * page. Designed as a precision tactile audio deck.
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
    ? {
        label: 'Pause',
        icon: (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ),
        action: onPause,
        disabled: false,
      }
    : isPaused
      ? {
          label: 'Resume',
          icon: (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ),
          action: onResume,
          disabled: false,
        }
      : {
          label: 'Play',
          icon: (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ),
          action: onPlay,
          disabled: !canPlay,
        }

  return (
    <div
      className="flex items-center justify-center gap-2.5 rounded-2xl border border-[var(--color-border)] bg-room-2/95 px-4 py-3.5 shadow-md backdrop-blur-md"
      role="group"
      aria-label="Playback controls"
    >
      <button
        type="button"
        aria-label="Previous page"
        title="Previous page (Left arrow)"
        disabled={!hasPrevious}
        onClick={onPrevious}
        className={iconButtonClass}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={toggle.action}
        disabled={toggle.disabled}
        className="mx-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brass via-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-room shadow-lg shadow-amber-500/25 transition-all duration-150 hover:brightness-110 hover:shadow-amber-500/40 active:scale-95 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer"
      >
        <span aria-hidden className="flex items-center">
          {toggle.icon}
        </span>
        {toggle.label}
        {isPlaying && (
          <span className="flex items-end gap-0.5 h-3 ml-0.5" aria-hidden>
            <span className="w-0.5 h-full bg-room rounded-full animate-pulse" />
            <span className="w-0.5 h-2/3 bg-room rounded-full animate-pulse delay-75" />
            <span className="w-0.5 h-4/5 bg-room rounded-full animate-pulse delay-150" />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onStop}
        disabled={playback === 'stopped'}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-room-3 px-4 py-2.5 text-sm font-medium text-ink transition-all duration-150 hover:border-rose/40 hover:text-rose hover:bg-rose-soft/20 active:scale-95 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer"
      >
        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
        Stop
      </button>

      <button
        type="button"
        aria-label="Next page"
        title="Next page (Right arrow)"
        disabled={!hasNext}
        onClick={onNext}
        className={iconButtonClass}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
