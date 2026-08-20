import type { ReaderError } from '../../types/reader'

interface ErrorNoticeProps {
  error: ReaderError
  onDismiss?(): void
}

/** Renders a recoverable failure rather than letting it crash the app (PRD §35). */
export function ErrorNotice({ error, onDismiss }: ErrorNoticeProps) {
  return (
    <div role="alert" className="flex items-start gap-3.5 rounded-2xl border border-rose/30 bg-rose-soft/40 p-4 shadow-sm backdrop-blur-md">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose/10 text-rose">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-rose">{error.message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose transition-colors hover:bg-rose/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose cursor-pointer"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
