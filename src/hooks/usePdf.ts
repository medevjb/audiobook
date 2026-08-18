import { useCallback, useEffect, useRef } from 'react'
import { loadPdfDocument, type PdfDocumentHandle } from '../services/pdf/pdfService'
import { useBookStore } from '../store/bookStore'
import { useReaderStore } from '../store/readerStore'
import type { BookSummary } from '../types/book'
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

  const openFile = useCallback(
    async (file: File) => {
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

        useBookStore.getState().setCurrent(summary)
        reader.setDocument(handle.totalPages, 1)
      } catch (cause) {
        await closeDocument()
        reader.setError(toAppError(cause, 'parse-failed', 'This PDF could not be opened.'))
      }
    },
    [closeDocument],
  )

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

  return { openFile, renderPage, extractPage, closeBook, documentRef }
}
