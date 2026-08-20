import { useEffect, useState } from 'react'
import { hasNextPage, hasPreviousPage, parsePageInput } from '../../utils/page'

interface PageNavigationProps {
  currentPage: number
  totalPages: number
  onNavigate(page: number): void
}

const chevronButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-all duration-150 hover:bg-room-3 hover:text-brass-strong active:scale-95 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer'

/**
 * The page-navigation "running foot" (PRD §10): previous/next, a page-number
 * input, and the current/total count, styled as an elegant floating island.
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
      className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-room-2/95 px-4 py-1.5 font-sans text-sm text-ink shadow-lg backdrop-blur-md ring-1 ring-[var(--color-border-subtle)]"
    >
      <button
        type="button"
        aria-label="Previous page"
        title="Previous page"
        disabled={!hasPreviousPage(currentPage)}
        onClick={() => onNavigate(currentPage - 1)}
        className={chevronButtonClass}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="mx-2 flex items-center gap-1.5 tabular-nums">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">Page</span>
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
          className="w-11 rounded-lg border border-[var(--color-border)] bg-room-3 px-1.5 py-0.5 text-center font-semibold text-ink-strong tabular-nums shadow-inner transition-colors hover:border-brass/40 focus-visible:border-brass focus-visible:outline-none"
        />
        <span className="text-xs text-ink-soft font-medium">/ {totalPages}</span>
      </span>

      <button
        type="button"
        aria-label="Next page"
        title="Next page"
        disabled={!hasNextPage(currentPage, totalPages)}
        onClick={() => onNavigate(currentPage + 1)}
        className={chevronButtonClass}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
