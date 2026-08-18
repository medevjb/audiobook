import type { PlaybackStatus } from '../../types/reader'

interface PlayerControlsProps {
  playback: PlaybackStatus
  /** False when there is no readable text on the current page to speak. */
  canPlay: boolean
  onPlay(): void
  onStop(): void
}

/**
 * Playback controls (PRD §16). Milestone 5 scope: Play and Stop only —
 * Pause/Resume and page-skip controls arrive in Milestone 7 alongside chunked
 * playback, without changing this component's shape.
 */
export function PlayerControls({ playback, canPlay, onPlay, onStop }: PlayerControlsProps) {
  const isPlaying = playback === 'playing'

  return (
    <div
      className="flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-room-2 px-3 py-2"
      role="group"
      aria-label="Playback controls"
    >
      <button
        type="button"
        onClick={onPlay}
        disabled={!canPlay || isPlaying}
        className="inline-flex items-center gap-1.5 rounded-md bg-brass px-4 py-1.5 text-sm font-semibold text-room transition-colors hover:bg-brass-strong disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <span aria-hidden>▶</span> Play
      </button>
      <button
        type="button"
        onClick={onStop}
        disabled={!isPlaying}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-rose/40 hover:text-rose disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <span aria-hidden>■</span> Stop
      </button>
    </div>
  )
}
