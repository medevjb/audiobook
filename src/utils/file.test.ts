import { describe, expect, it } from 'vitest'
import { deriveBookId, formatFileSize, isPdfFile } from './file'

describe('deriveBookId (PRD §26)', () => {
  const base = { name: 'book.pdf', size: 1024, lastModified: 1_700_000_000_000 }

  it('is stable for the same file', () => {
    expect(deriveBookId(base)).toBe(deriveBookId({ ...base }))
  })

  it('distinguishes two different books that share a filename', () => {
    expect(deriveBookId(base)).not.toBe(deriveBookId({ ...base, size: 2048 }))
    expect(deriveBookId(base)).not.toBe(deriveBookId({ ...base, lastModified: 1 }))
  })

  it('encodes the filename so a name containing the separator cannot forge an id', () => {
    const spoof = { name: 'a:1024:1700000000000', size: 0, lastModified: 0 }
    const plain = { name: 'a', size: 1024, lastModified: 1_700_000_000_000 }
    expect(deriveBookId(spoof)).not.toBe(deriveBookId(plain))
  })
})

describe('isPdfFile (PRD §9)', () => {
  it('accepts a correct MIME type', () => {
    expect(isPdfFile({ name: 'book', type: 'application/pdf' })).toBe(true)
  })

  it('accepts a .pdf extension when the browser reports no MIME type', () => {
    expect(isPdfFile({ name: 'Book.PDF', type: '' })).toBe(true)
  })

  it('rejects other files', () => {
    expect(isPdfFile({ name: 'notes.txt', type: 'text/plain' })).toBe(false)
    expect(isPdfFile({ name: 'pdf.txt', type: '' })).toBe(false)
  })
})

describe('formatFileSize', () => {
  it('formats across units', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('handles invalid input', () => {
    expect(formatFileSize(Number.NaN)).toBe('—')
  })
})
