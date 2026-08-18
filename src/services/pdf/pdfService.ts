import type { PageText } from '../../types/reader'
import { AppError } from '../../utils/errors'
import { toPageText, type TextItemLike } from './textExtractor'

/**
 * The only module that talks to PDF.js (PRD Rule 5).
 *
 * PDF.js and its worker are ~2.5 MB, so the library is imported dynamically:
 * the home screen must not pay for it before a book is opened (PRD §37).
 */

/** An open document. One instance per book; always `destroy()` when replaced. */
export interface PdfDocumentHandle {
  totalPages: number
  /** Renders one page into a canvas at the given scale. */
  renderPage(pageNumber: number, canvas: HTMLCanvasElement, scale?: number): Promise<void>
  /** PRD §11's recommended API, returning clean, normalized text. */
  extractPageText(pageNumber: number): Promise<PageText>
  destroy(): Promise<void>
}

type PdfJsModule = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfJsModule> | undefined
let workerSrcOverride: string | undefined

/**
 * Test seam. The bundled worker URL is a browser path that Node cannot import,
 * so tests point PDF.js at the worker on disk instead.
 */
export function setPdfWorkerSrc(src: string | undefined): void {
  workerSrcOverride = src
  pdfjsPromise = undefined
}

async function loadPdfJs(): Promise<PdfJsModule> {
  pdfjsPromise ??= (async () => {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc =
      workerSrcOverride ?? (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default
    return pdfjs
  })()
  return pdfjsPromise
}

/** Maps PDF.js exceptions onto the codes the UI knows how to render (PRD §35). */
function toPdfError(cause: unknown): AppError {
  const name = cause instanceof Error ? cause.name : ''
  switch (name) {
    case 'PasswordException':
      return new AppError('password-protected', 'This PDF is password protected and cannot be opened.', { cause })
    case 'InvalidPDFException':
      return new AppError('corrupt-pdf', 'This file is not a valid PDF, or it is damaged.', { cause })
    case 'MissingPDFException':
      return new AppError('corrupt-pdf', 'The PDF could not be read.', { cause })
    default:
      return new AppError('parse-failed', 'This PDF could not be opened.', { cause })
  }
}

/**
 * Opens a PDF.
 *
 * Note: PDF.js transfers the byte buffer to its worker, which **detaches** it.
 * A caller passing an ArrayBuffer or Uint8Array must not reuse it afterwards.
 * Passing a Blob is always safe — the bytes are read fresh each time, which is
 * why the library stores books as Blobs.
 */
export async function loadPdfDocument(source: Blob | ArrayBuffer | Uint8Array): Promise<PdfDocumentHandle> {
  const pdfjs = await loadPdfJs()

  // pdfjs-dist v6 rejects a bare ArrayBuffer — `data` must be a TypedArray.
  let data: Uint8Array
  if (source instanceof Uint8Array) data = source
  else if (source instanceof Blob) data = new Uint8Array(await source.arrayBuffer())
  else data = new Uint8Array(source)

  // The loading task, not the document, owns teardown in pdfjs-dist v6 —
  // it is what terminates the worker. `getDocument` validates eagerly and can
  // throw synchronously, so it sits inside the mapping too.
  let loadingTask: ReturnType<typeof pdfjs.getDocument>
  let document: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>
  try {
    loadingTask = pdfjs.getDocument({ data })
  } catch (cause) {
    throw toPdfError(cause)
  }

  try {
    document = await loadingTask.promise
  } catch (cause) {
    await loadingTask.destroy().catch(() => undefined)
    throw toPdfError(cause)
  }

  if (document.numPages < 1) {
    await loadingTask.destroy()
    throw new AppError('empty-pdf', 'This PDF has no pages.')
  }

  // PDF.js refuses to run two renders against one canvas. Cancelling the
  // previous task is not enough on its own: two calls can both be awaiting
  // `getPage` before either has created its render task, so a `cancel()`
  // aimed at "whatever is active right now" hits nothing and both go on to
  // call `page.render()`, which throws for the second one. React 19's
  // StrictMode double-invokes effects and triggers exactly this. A
  // monotonic token makes a superseded call bail out after its own awaits,
  // before it ever touches the canvas.
  let renderToken = 0
  let activeRender: { cancel(): void } | undefined

  return {
    totalPages: document.numPages,

    async renderPage(pageNumber, canvas, scale = 1.5) {
      const token = ++renderToken
      activeRender?.cancel()

      const page = await document.getPage(pageNumber)
      try {
        if (token !== renderToken) return // a newer call started while this one awaited getPage

        const viewport = page.getViewport({ scale })
        const context = canvas.getContext('2d')
        if (!context) throw new AppError('parse-failed', 'This browser cannot render the page.')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)

        const task = page.render({ canvas, canvasContext: context, viewport })
        activeRender = task
        await task.promise
      } catch (cause) {
        // A superseded render is the expected outcome of paging quickly, not
        // an error the user should ever see.
        if (cause instanceof Error && cause.name === 'RenderingCancelledException') return
        throw new AppError('parse-failed', `Page ${pageNumber} could not be displayed.`, { cause })
      } finally {
        // Free the page's operator list rather than holding rendered pages
        // in memory (PRD §38).
        page.cleanup()
      }
    },

    async extractPageText(pageNumber) {
      const page = await document.getPage(pageNumber)
      try {
        const content = await page.getTextContent()
        // `items` mixes text with marked-content markers; only the former
        // carry `str`. Copying the two fields we need keeps the extractor
        // free of PDF.js types.
        const items: TextItemLike[] = []
        for (const item of content.items) {
          if ('str' in item) items.push({ str: item.str, hasEOL: item.hasEOL })
        }
        return toPageText(pageNumber, items)
      } catch (cause) {
        throw new AppError('extraction-failed', `Text could not be extracted from page ${pageNumber}.`, { cause })
      } finally {
        page.cleanup()
      }
    },

    async destroy() {
      activeRender?.cancel()
      await loadingTask.destroy()
    },
  }
}
