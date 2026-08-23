import type { BookId } from './book'

/** Lifecycle of the document/page pipeline. Independent of playback state. */
export type ReaderStatus =
  | 'idle'
  | 'loading-document'
  | 'extracting'
  | 'ready'
  | 'error'

/** Lifecycle of speech. Independent of reader state (PRD §16). */
export type PlaybackStatus = 'stopped' | 'playing' | 'paused'

/**
 * Per-book persisted state (PRD §25 + §27).
 *
 * The optional settings fields reconcile the two sections: §27's global
 * `UserPreferences` supplies defaults, and these override them for this book
 * so a Bengali book does not reopen in the voice used for an English one.
 * Resolved by `resolveReadingSettings`.
 */
export interface BookProgress {
  bookId: BookId
  filename: string
  currentPage: number
  totalPages: number
  updatedAt: number
  language?: string
  voiceURI?: string
  rate?: number
  autoAdvance?: boolean
}

/** Where a page's text came from. Surfaced in the UI for OCR debugging (§24). */
export type TextSource = 'pdf' | 'ocr'

/** Extracted text for a single page, plus what the extractor concluded about it. */
export interface PageText {
  pageNumber: number
  text: string
  source: TextSource
  /**
   * True when the page yielded too little text to be a real text layer —
   * the OCR fallback trigger (PRD §12).
   */
  isLikelyScanned: boolean
}

/** Machine-readable failure modes the UI must render as recoverable (PRD §35). */
export type ReaderErrorCode =
  | 'invalid-file'
  | 'corrupt-pdf'
  | 'password-protected'
  | 'empty-pdf'
  | 'parse-failed'
  | 'extraction-failed'
  | 'no-voices'
  | 'voice-unavailable'
  | 'speech-failed'
  | 'ocr-failed'
  | 'ocr-cancelled'
  | 'ocr-language-unsupported'
  | 'storage-quota-exceeded'
  | 'storage-unavailable'
  | 'auth-required'
  | 'invalid-credentials'
  | 'sync-failed'
  | 'account-suspended'
  | 'forbidden'
  | 'signups-disabled'
  | 'maintenance-mode'
  | 'password-too-short'
  | 'not-found'

export interface ReaderError {
  code: ReaderErrorCode
  /** Human-readable, already localized for display. */
  message: string
  cause?: unknown
}
