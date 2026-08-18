import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { AppError } from '../../utils/errors'
import { loadPdfDocument, setPdfWorkerSrc, type PdfDocumentHandle } from './pdfService'

/**
 * PDF -> text integration coverage (PRD §43) against a real fixture document.
 * jsdom has no Worker, so PDF.js falls back to its main-thread worker here;
 * the worker path itself is exercised in the browser.
 */

// Resolved from the project root: Vitest serves modules over http, so
// import.meta.url is not a file URL here.
const fixture = resolve(process.cwd(), 'src/test/fixtures/sample.pdf')
const scannedFixture = resolve(process.cwd(), 'src/test/fixtures/scanned.pdf')

beforeAll(() => {
  setPdfWorkerSrc(pathToFileURL(resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href)
})

let handle: PdfDocumentHandle | undefined

afterEach(async () => {
  await handle?.destroy()
  handle = undefined
})

async function openFixture(): Promise<PdfDocumentHandle> {
  const bytes = await readFile(fixture)
  handle = await loadPdfDocument(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  return handle
}

describe('loadPdfDocument', () => {
  it('reports the page count', async () => {
    expect((await openFixture()).totalPages).toBe(3)
  })

  it('extracts clean text from a page', async () => {
    const document = await openFixture()
    const page = await document.extractPageText(1)

    expect(page.pageNumber).toBe(1)
    expect(page.source).toBe('pdf')
    expect(page.text).toContain('Chapter One')
    expect(page.text).toContain('This is the first page of the sample book.')
    expect(page.isLikelyScanned).toBe(false)
  })

  it('extracts each page separately', async () => {
    const document = await openFixture()
    expect((await document.extractPageText(2)).text).toContain('This is the second page.')
    expect((await document.extractPageText(3)).text).toContain('final page')
  })

  it('collapses extraction artifacts into readable prose', async () => {
    const document = await openFixture()
    const { text } = await document.extractPageText(1)
    expect(text).not.toMatch(/ {2}/)
    expect(text.trim()).toBe(text)
  })

  it('rejects a file that is not a PDF with a typed error', async () => {
    // Fresh bytes per attempt: PDF.js detaches the buffer it is given.
    const notPdf = () => new TextEncoder().encode('this is not a pdf')
    await expect(loadPdfDocument(notPdf())).rejects.toBeInstanceOf(AppError)
    await expect(loadPdfDocument(notPdf())).rejects.toMatchObject({ code: 'corrupt-pdf' })
  })

  it('reads a Blob without detaching the caller\u2019s copy', async () => {
    const blob = new Blob([await readFile(fixture)], { type: 'application/pdf' })
    handle = await loadPdfDocument(blob)
    expect(handle.totalPages).toBe(3)
    // The same Blob stays usable — this is what makes the IndexedDB library work.
    await expect(loadPdfDocument(blob).then((second) => second.destroy())).resolves.toBeUndefined()
  })

  it('flags a page with no extractable text as likely scanned (PRD §12)', async () => {
    const bytes = await readFile(scannedFixture)
    handle = await loadPdfDocument(new Uint8Array(bytes))
    const page = await handle.extractPageText(1)

    expect(page.text).toBe('')
    expect(page.isLikelyScanned).toBe(true)
  })
})
