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
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">Continue reading</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {entries.map((entry) => {
          const page = entry.progress?.currentPage ?? 1
          const hasProgress = page > 1
          return (
            <li key={entry.summary.bookId}>
              <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-room-2 px-4 py-3 transition-colors hover:border-brass/30">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-content text-sm text-ink-strong">
                      {entry.summary.filename}
                    </span>
                    <span className="text-xs text-ink-soft">{formatFileSize(entry.summary.size)}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-brass">
                    {hasProgress ? `Continue — page ${page} / ${entry.summary.totalPages}` : `Page 1 / ${entry.summary.totalPages}`}
                  </span>
                </button>
                {hasProgress && (
                  <button
                    type="button"
                    onClick={() => onOpen(entry, 1)}
                    className="shrink-0 rounded px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-white/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
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
