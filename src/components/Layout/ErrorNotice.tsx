import type { ReaderError } from '../../types/reader'

interface ErrorNoticeProps {
  error: ReaderError
  onDismiss?(): void
}

/** Renders a recoverable failure rather than letting it crash the app (PRD §35). */
export function ErrorNotice({ error, onDismiss }: ErrorNoticeProps) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose/30 bg-rose-soft p-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-rose">{error.message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-sm font-medium text-rose transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
