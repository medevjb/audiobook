import type { LibraryEntry } from '../../hooks/useLibrary'
import { formatFileSize } from '../../utils/file'

interface RecentBooksProps {
  entries: readonly LibraryEntry[]
  onOpen(entry: LibraryEntry, startPage?: number): void
}

/**
 * "Continue from page 57" (PRD §25): the local library of previously opened
 * books, letting a returning user resume without re-picking the file. Renders
 * nothing for a first-time user with an empty library — the plain upload
 * experience is untouched until there is something to continue.
 */
export function RecentBooks({ entries, onOpen }: RecentBooksProps) {
  if (entries.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">Continue reading</h3>
        <span className="text-xs text-ink-soft">{entries.length} recent {entries.length === 1 ? 'book' : 'books'}</span>
      </div>
      <ul className="mt-3.5 flex flex-col gap-2.5">
        {entries.map((entry) => {
          const page = entry.progress?.currentPage ?? 1
          const hasProgress = page > 1
          const percent = Math.round((page / Math.max(1, entry.summary.totalPages)) * 100)

          return (
            <li key={entry.summary.bookId}>
              <div className="group flex items-center gap-3.5 rounded-xl border border-[var(--color-border)] bg-room-2/90 p-3.5 shadow-sm transition-all duration-150 hover:border-brass/40 hover:bg-room-2 hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-room-3 text-brass ring-1 ring-[var(--color-border)] group-hover:bg-brass group-hover:text-room transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-sm text-ink-strong group-hover:text-brass-strong transition-colors">
                      {entry.summary.filename}
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                      <span>{formatFileSize(entry.summary.size)}</span>
                      <span>·</span>
                      <span className="tabular-nums">{percent}% completed</span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-room-3 px-3 py-1.5 text-xs font-semibold tabular-nums text-brass ring-1 ring-[var(--color-border)]">
                    {hasProgress ? `Continue — page ${page} / ${entry.summary.totalPages}` : `Page 1 / ${entry.summary.totalPages}`}
                  </span>
                </button>

                {hasProgress && (
                  <button
                    type="button"
                    onClick={() => onOpen(entry, 1)}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-room-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer"
                  >
                    Start over
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
