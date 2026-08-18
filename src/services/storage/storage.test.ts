import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import type { BookSummary } from '../../types/book'
import { DEFAULT_PREFERENCES } from '../../types/preferences'
import { deleteBook, getBookFile, listBooks, saveBook } from './bookStorage'
import { resetDbForTests } from './db'
import { clearPreferences, loadPreferences, savePreferences } from './preferencesStorage'
import { getProgress, listRecentProgress, saveProgress, updateProgress } from './progressStorage'

function book(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    bookId: 'book.pdf:1024:1700000000000',
    filename: 'book.pdf',
    size: 1024,
    lastModified: 1_700_000_000_000,
    totalPages: 324,
    addedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  // Each test gets a pristine database.
  indexedDB = new IDBFactory()
  resetDbForTests()
  localStorage.clear()
})

describe('book storage', () => {
  it('saves a book and stores a record for its bytes', async () => {
    const summary = book()
    await saveBook(summary, new Blob(['%PDF-1.7'], { type: 'application/pdf' }))

    expect(await listBooks()).toEqual([summary])
    // Only that a record came back, not its contents: jsdom's structuredClone
    // does not preserve Blob, so fake-indexeddb hands back a plain object.
    // Real IndexedDB clones Blobs faithfully — the byte round-trip is covered
    // by the browser check in Milestone 2, not here.
    expect(await getBookFile(summary.bookId)).toBeDefined()
  })

  it('does not load PDF bytes when listing the library', async () => {
    await saveBook(book(), new Blob(['%PDF-1.7']))
    const [listed] = await listBooks()
    expect(listed).not.toHaveProperty('blob')
  })

  it('lists newest first', async () => {
    await saveBook(book({ bookId: 'old', addedAt: 1 }), new Blob(['a']))
    await saveBook(book({ bookId: 'new', addedAt: 2 }), new Blob(['b']))
    expect((await listBooks()).map((b) => b.bookId)).toEqual(['new', 'old'])
  })

  it('replaces a book saved twice rather than duplicating it', async () => {
    await saveBook(book({ totalPages: 10 }), new Blob(['a']))
    await saveBook(book({ totalPages: 20 }), new Blob(['b']))
    const listed = await listBooks()
    expect(listed).toHaveLength(1)
    expect(listed[0].totalPages).toBe(20)
  })

  it('deletes the book, its bytes and its progress together', async () => {
    const summary = book()
    await saveBook(summary, new Blob(['%PDF-1.7']))
    await saveProgress({ bookId: summary.bookId, filename: summary.filename, currentPage: 57, totalPages: 324 })

    await deleteBook(summary.bookId)

    expect(await listBooks()).toEqual([])
    expect(await getBookFile(summary.bookId)).toBeUndefined()
    expect(await getProgress(summary.bookId)).toBeUndefined()
  })
})

describe('progress storage (PRD §42)', () => {
  const base = { bookId: 'b1', filename: 'book.pdf', currentPage: 1, totalPages: 324 }

  it('saves and loads reading progress', async () => {
    await saveProgress({ ...base, currentPage: 57 })
    expect((await getProgress('b1'))?.currentPage).toBe(57)
  })

  it('stamps updatedAt on save', async () => {
    const before = Date.now()
    const saved = await saveProgress(base)
    expect(saved.updatedAt).toBeGreaterThanOrEqual(before)
  })

  it('updates progress without dropping other fields', async () => {
    await saveProgress({ ...base, currentPage: 57, language: 'bn', voiceURI: 'bangla' })
    const updated = await updateProgress('b1', { currentPage: 58 })
    expect(updated?.currentPage).toBe(58)
    expect(updated?.language).toBe('bn')
    expect(updated?.voiceURI).toBe('bangla')
  })

  it('returns undefined when updating a book with no saved progress', async () => {
    expect(await updateProgress('missing', { currentPage: 2 })).toBeUndefined()
  })

  it('stores per-book setting overrides alongside the position', async () => {
    await saveProgress({ ...base, language: 'bn', rate: 1.25, autoAdvance: false })
    const progress = await getProgress('b1')
    expect(progress?.language).toBe('bn')
    expect(progress?.rate).toBe(1.25)
    expect(progress?.autoAdvance).toBe(false)
  })

  it('lists recently read books most recent first', async () => {
    await saveProgress({ ...base, bookId: 'first' })
    await new Promise((resolve) => setTimeout(resolve, 2))
    await saveProgress({ ...base, bookId: 'second' })
    expect((await listRecentProgress()).map((p) => p.bookId)).toEqual(['second', 'first'])
  })
})

describe('preferences storage (PRD §42)', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('round-trips saved preferences', () => {
    savePreferences({ language: 'bn', voiceURI: 'bangla', rate: 1.25, autoAdvance: false })
    expect(loadPreferences()).toEqual({ language: 'bn', voiceURI: 'bangla', rate: 1.25, autoAdvance: false })
  })

  it('falls back to defaults on corrupt JSON instead of throwing', () => {
    localStorage.setItem('audiobook-reader:preferences', '{not json')
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('rejects an out-of-range rate written by hand', () => {
    localStorage.setItem('audiobook-reader:preferences', JSON.stringify({ rate: 99 }))
    expect(loadPreferences().rate).toBe(DEFAULT_PREFERENCES.rate)
  })

  it('rejects fields of the wrong type', () => {
    localStorage.setItem('audiobook-reader:preferences', JSON.stringify({ language: 42, autoAdvance: 'yes' }))
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('clears stored preferences', () => {
    savePreferences({ ...DEFAULT_PREFERENCES, language: 'fr' })
    clearPreferences()
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES)
  })
})
