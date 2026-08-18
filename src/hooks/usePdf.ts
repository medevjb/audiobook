import { useCallback, useEffect, useRef } from 'react'
import { loadPdfDocument, type PdfDocumentHandle } from '../services/pdf/pdfService'
import { getBookFile, saveBook } from '../services/storage/bookStorage'
import { getProgress } from '../services/storage/progressStorage'
import { useBookStore } from '../store/bookStore'
import { usePreferencesStore } from '../store/preferencesStore'
import { useReaderStore } from '../store/readerStore'
import type { BookSummary } from '../types/book'
import type { BookProgress } from '../types/reader'
import { resolveReadingSettings } from '../utils/settings'
import { deriveBookId, isPdfFile } from '../utils/file'
import { AppError, toAppError } from '../utils/errors'

/**
 * Owns the open PDF document and drives the reader store.
 *
 * The document handle is a ref, not store state: it is a live object with a
 * worker attached, so it must never be compared, serialized or re-rendered on.
 */
export function usePdf() {
  const documentRef = useRef<PdfDocumentHandle | undefined>(undefined)

  const closeDocument = useCallback(async () => {
    const handle = documentRef.current
    documentRef.current = undefined
    await handle?.destroy().catch(() => undefined)
  }, [])

  // A document left open keeps a worker and its buffers alive (PRD §38).
  useEffect(() => () => void closeDocument(), [closeDocument])

  /**
   * Shared by every "book is now open" path (fresh upload, reopening a
   * stored book): resumes at the saved page and applies the book's saved
   * language/voice/speed/auto-advance overrides on top of the current
   * global defaults (PRD §25/§27, `resolveReadingSettings`) — never the
   * other way around, so opening one book can't permanently change another
   * book's remembered settings.
   */
  function applyBookOpened(
    handle: PdfDocumentHandle,
    summary: BookSummary,
    progress: BookProgress | undefined,
    startPageOverride?: number,
  ) {
    useBookStore.getState().setCurrent(summary)
    useReaderStore.getState().setDocument(handle.totalPages, startPageOverride ?? progress?.currentPage ?? 1)
    useReaderStore.getState().setProgress(progress)

    const { preferences } = usePreferencesStore.getState()
    usePreferencesStore.getState().update(resolveReadingSettings(preferences, progress))
  }

  const openFile = useCallback(async (file: File) => {
    const reader = useReaderStore.getState()

    if (!isPdfFile(file)) {
      reader.setError(new AppError('invalid-file', `"${file.name}" is not a PDF file.`))
      return
    }

    await closeDocument()
    reader.reset()
    reader.setStatus('loading-document')

    try {
      const handle = await loadPdfDocument(file)
      documentRef.current = handle

      const summary: BookSummary = {
        bookId: deriveBookId(file),
        filename: file.name,
        size: file.size,
        lastModified: file.lastModified,
        totalPages: handle.totalPages,
        addedAt: Date.now(),
      }

      // Same book re-selected (e.g. dragged in again) resumes where it left
      // off rather than restarting, exactly as reopening it from the recent
      // books list would (PRD §25).
      const progress = await getProgress(summary.bookId)
      applyBookOpened(handle, summary, progress)

      // Saved for next time (PRD §53's "close app, return later, continue
      // reading"). Runs after the reader state above is already established,
      // so a full-storage failure is a dismissible warning, not something
      // that hides the book the user just successfully opened.
      try {
        await saveBook(summary, file)
      } catch (cause) {
        useReaderStore.getState().setError(toAppError(cause, 'storage-quota-exceeded', 'This book could not be saved for next time.'))
      }
    } catch (cause) {
      await closeDocument()
      reader.setError(toAppError(cause, 'parse-failed', 'This PDF could not be opened.'))
    }
  }, [closeDocument])

  /**
   * Reopens a book already in the local library (PRD §25/§26), read from its
   * stored bytes rather than a freshly picked `File`. `startPage` lets the
   * caller offer "start over" (page 1) alongside the default "continue from
   * page N".
   */
  const openStoredBook = useCallback(async (summary: BookSummary, startPage?: number) => {
    const reader = useReaderStore.getState()

    await closeDocument()
    reader.reset()
    reader.setStatus('loading-document')

    try {
      const blob = await getBookFile(summary.bookId)
      if (!blob) {
        throw new AppError('storage-unavailable', 'This book could not be found in your local library.')
      }

      const handle = await loadPdfDocument(blob)
      documentRef.current = handle

      const progress = await getProgress(summary.bookId)
      applyBookOpened(handle, summary, progress, startPage)
    } catch (cause) {
      await closeDocument()
      reader.setError(toAppError(cause, 'parse-failed', 'This book could not be opened.'))
    }
  }, [closeDocument])

  const renderPage = useCallback(async (pageNumber: number, canvas: HTMLCanvasElement) => {
    const handle = documentRef.current
    if (!handle) return
    try {
      await handle.renderPage(pageNumber, canvas)
    } catch (cause) {
      useReaderStore.getState().setError(toAppError(cause, 'parse-failed', 'This page could not be displayed.'))
    }
  }, [])

  /**
   * PRD §11: extract text for the selected page. Called whenever the current
   * page changes, independent of canvas rendering — a render failure (e.g. no
   * 2D context) should not also block getting text onto the page (PRD §10).
   */
  const extractPage = useCallback(async (pageNumber: number) => {
    const handle = documentRef.current
    if (!handle) return
    try {
      const pageText = await handle.extractPageText(pageNumber)
      useReaderStore.getState().setPageText(pageText)
    } catch (cause) {
      useReaderStore
        .getState()
        .setError(toAppError(cause, 'extraction-failed', `Text could not be extracted from page ${pageNumber}.`))
    }
  }, [])

  const closeBook = useCallback(async () => {
    await closeDocument()
    useReaderStore.getState().reset()
    useBookStore.getState().setCurrent(undefined)
  }, [closeDocument])

  return { openFile, openStoredBook, renderPage, extractPage, closeBook, documentRef }
}
