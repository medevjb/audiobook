import { useState } from 'react'
import type { PageText } from '../../types/reader'

interface ReaderTextProps {
  /** Undefined while extraction for the current page is in flight. */
  pageText?: PageText
}

/**
 * The extracted-text panel (PRD §24): makes extraction visible, doubles as
 * OCR debugging once OCR exists, and will drive chunk highlighting once
 * speech is wired (PRD §23). Collapsible, on the paper surface — this is
 * book content, not app chrome.
 */
export function ReaderText({ pageText }: ReaderTextProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section aria-label="Extracted page text" className="w-full rounded-xl bg-page p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-on-page-soft">
          Extracted text
        </h3>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className="rounded px-2 py-1 text-xs font-medium text-ink-on-page-soft transition-colors hover:bg-ink-on-page/5 hover:text-ink-on-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 max-h-64 overflow-y-auto font-content text-[0.95rem] leading-relaxed text-ink-on-page">
          {pageText === undefined ? (
            <p className="italic text-ink-on-page-soft">Preparing page…</p>
          ) : pageText.isLikelyScanned ? (
            <p className="italic text-ink-on-page-soft">No readable text was detected on this page.</p>
          ) : (
            <p className="whitespace-pre-line">{pageText.text}</p>
          )}
        </div>
      )}
    </section>
  )
}
