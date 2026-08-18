import { create } from 'zustand'
import type { BookProgress, PageText, ReaderError, ReaderStatus } from '../types/reader'
import { clampPage } from '../utils/page'

interface ReaderState {
  status: ReaderStatus
  currentPage: number
  totalPages: number
  /** Text for the current page, once extracted. */
  pageText?: PageText
  /** Persisted position and per-book setting overrides. */
  progress?: BookProgress
  error?: ReaderError

  setStatus(status: ReaderStatus): void
  /** Always clamped — invalid page numbers never reach PDF.js (PRD §10). */
  goToPage(page: number): void
  setDocument(totalPages: number, startPage: number): void
  setPageText(pageText: PageText | undefined): void
  setProgress(progress: BookProgress | undefined): void
  setError(error: ReaderError | undefined): void
  reset(): void
}

const initialState = {
  status: 'idle' as ReaderStatus,
  currentPage: 1,
  totalPages: 0,
  pageText: undefined,
  progress: undefined,
  error: undefined,
}

/**
 * Page/document state only.
 *
 * The store holds state and never calls a service: rendering, extraction and
 * persistence are driven by hooks (`usePdf`, `useReadingProgress`), which keeps
 * every transition here synchronous and unit-testable.
 */
export const useReaderStore = create<ReaderState>((set, get) => ({
  ...initialState,

  setStatus(status) {
    set({ status })
  },

  goToPage(page) {
    const { totalPages } = get()
    if (totalPages < 1) return
    const currentPage = clampPage(page, totalPages)
    // Page text belongs to the page it came from; clear it so no stale text
    // can be spoken for the new page.
    set({ currentPage, pageText: undefined })
  },

  setDocument(totalPages, startPage) {
    set({ totalPages, currentPage: clampPage(startPage, totalPages), status: 'ready', error: undefined })
  },

  setPageText(pageText) {
    set({ pageText })
  },

  setProgress(progress) {
    set({ progress })
  },

  setError(error) {
    set({ error, status: error ? 'error' : get().status })
  },

  reset() {
    set({ ...initialState })
  },
}))
