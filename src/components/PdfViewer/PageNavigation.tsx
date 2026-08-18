import { useEffect, useState } from 'react'
import { hasNextPage, hasPreviousPage, parsePageInput } from '../../utils/page'

interface PageNavigationProps {
  currentPage: number
  totalPages: number
  onNavigate(page: number): void
}

const chevronButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-white/5 hover:text-brass-strong disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass'

/**
 * The page-navigation "running foot" (PRD §10): previous/next, a page-number
 * input, and the current/total count, styled after a printed book's folio
 * line rather than an app-generic pager.
 */
export function PageNavigation({ currentPage, totalPages, onNavigate }: PageNavigationProps) {
  const [draft, setDraft] = useState(String(currentPage))

  // Keep the field in sync when the page changes from elsewhere (prev/next,
  // auto-advance) without fighting the user mid-edit.
  useEffect(() => setDraft(String(currentPage)), [currentPage])

  function commit() {
    const parsed = parsePageInput(draft, totalPages)
    if (parsed === undefined) {
      setDraft(String(currentPage))
      return
    }
    onNavigate(parsed)
  }

  return (
    <nav
      aria-label="Page navigation"
      className="flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-room-2 px-3 py-2 font-sans text-sm text-ink"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={!hasPreviousPage(currentPage)}
        onClick={() => onNavigate(currentPage - 1)}
        className={chevronButtonClass}
      >
        ‹
      </button>

      <span className="mx-2 flex items-baseline gap-1.5 tabular-nums">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">Page</span>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          aria-label={`Page number, ${totalPages} total`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            } else if (event.key === 'Escape') {
              setDraft(String(currentPage))
              event.currentTarget.blur()
            }
          }}
          className="w-10 rounded border border-transparent bg-transparent px-1 py-0.5 text-center font-medium text-ink-strong tabular-nums focus-visible:border-brass focus-visible:outline-none"
        />
        <span className="text-ink-soft">/ {totalPages}</span>
      </span>

      <button
        type="button"
        aria-label="Next page"
        disabled={!hasNextPage(currentPage, totalPages)}
        onClick={() => onNavigate(currentPage + 1)}
        className={chevronButtonClass}
      >
        ›
      </button>
    </nav>
  )
}
