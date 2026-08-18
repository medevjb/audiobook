import { useState } from 'react'
import type { OcrState } from '../../hooks/useOcr'
import type { PageText } from '../../types/reader'
import { formatFileSize } from '../../utils/file'
import { languageLabel } from '../../utils/language'

interface ReaderTextProps {
  /** Undefined while extraction for the current page is in flight. */
  pageText?: PageText
  ocrState: OcrState
  onRecognize(): void
  onAnswerConsent(approved: boolean): void
}

/**
 * The extracted-text panel (PRD §24): makes extraction visible, doubles as
 * OCR debugging, and will drive chunk highlighting once speech is wired
 * (PRD §23). Collapsible, on the paper surface — this is book content, not
 * app chrome.
 */
export function ReaderText({ pageText, ocrState, onRecognize, onAnswerConsent }: ReaderTextProps) {
  const [collapsed, setCollapsed] = useState(false)

  function renderOcrAction() {
    switch (ocrState.status) {
      case 'awaiting-consent':
        return (
          <div className="flex flex-col items-start gap-2 rounded-md border border-brass/30 bg-brass/10 px-3 py-2 text-sm">
            <p className="text-ink-on-page">
              Download the {languageLabel(ocrState.request.language)} text-recognition model? (~
              {formatFileSize(ocrState.request.approximateBytes)}, one time only)
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onAnswerConsent(true)}
                className="rounded px-2 py-1 font-medium text-brass hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => onAnswerConsent(false)}
                className="rounded px-2 py-1 font-medium text-ink-on-page-soft hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                Cancel
              </button>
            </div>
          </div>
        )

      case 'recognizing':
        return (
          <p className="text-sm italic text-ink-on-page-soft">
            Recognizing text on page {pageText?.pageNumber}… {Math.round(ocrState.progress.progress * 100)}%
          </p>
        )

      case 'error':
        return (
          <div className="flex flex-col items-start gap-1.5">
            <p className="text-sm text-rose">{ocrState.message}</p>
            <button
              type="button"
              onClick={onRecognize}
              className="rounded px-1 text-sm font-medium text-brass hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              Try again
            </button>
          </div>
        )

      case 'idle':
      default:
        return (
          <button
            type="button"
            onClick={onRecognize}
            className="rounded px-1 text-sm font-medium text-brass hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            Recognize text on this page
          </button>
        )
    }
  }

  return (
    <section aria-label="Extracted page text" className="w-full rounded-xl bg-page p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-on-page-soft">
          Extracted text
          {pageText?.source === 'ocr' && (
            <span className="rounded bg-ink-on-page/10 px-1.5 py-0.5 text-[0.65rem] tracking-normal text-ink-on-page-soft">
              OCR
            </span>
          )}
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
            <div className="flex flex-col items-start gap-2">
              <p className="italic text-ink-on-page-soft">No readable text was detected on this page.</p>
              {renderOcrAction()}
            </div>
          ) : (
            <p className="whitespace-pre-line">{pageText.text}</p>
          )}
        </div>
      )}
    </section>
  )
}
