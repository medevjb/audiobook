import 'fake-indexeddb/auto'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { saveBook } from '../services/storage/bookStorage'
import { resetDbForTests } from '../services/storage/db'
import { saveProgress } from '../services/storage/progressStorage'
import type { BookSummary } from '../types/book'
import { useLibrary } from './useLibrary'

function book(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    bookId: 'book.pdf:1:1',
    filename: 'book.pdf',
    size: 1024,
    lastModified: 1,
    totalPages: 100,
    addedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  indexedDB = new IDBFactory()
  resetDbForTests()
})

afterEach(() => {
  cleanup()
})

describe('useLibrary (PRD §25/§26)', () => {
  it('lists a saved book even before it has any progress', async () => {
    const summary = book()
    await saveBook(summary, new Blob(['%PDF']))

    const { result } = renderHook(() => useLibrary())
    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.entries).toEqual([{ summary, progress: undefined }])
  })

  it('pairs a book with its progress record', async () => {
    const summary = book()
    await saveBook(summary, new Blob(['%PDF']))
    const progress = await saveProgress({
      bookId: summary.bookId,
      filename: summary.filename,
      currentPage: 57,
      totalPages: 100,
    })

    const { result } = renderHook(() => useLibrary())
    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.entries).toEqual([{ summary, progress }])
  })

  it('orders by most recently read, not most recently added', async () => {
    const older = book({ bookId: 'a', filename: 'a.pdf', addedAt: 1 })
    const newer = book({ bookId: 'b', filename: 'b.pdf', addedAt: 2 })
    await saveBook(older, new Blob(['a']))
    await saveBook(newer, new Blob(['b']))

    // "older" was read most recently, even though it was added first.
    await saveProgress({ bookId: newer.bookId, filename: newer.filename, currentPage: 1, totalPages: 100 })
    await new Promise((resolve) => setTimeout(resolve, 2))
    await saveProgress({ bookId: older.bookId, filename: older.filename, currentPage: 1, totalPages: 100 })

    const { result } = renderHook(() => useLibrary())
    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.entries.map((entry) => entry.summary.bookId)).toEqual(['a', 'b'])
  })

  it('falls back to added-at order for books that were never read', async () => {
    const older = book({ bookId: 'a', addedAt: 1 })
    const newer = book({ bookId: 'b', addedAt: 2 })
    await saveBook(older, new Blob(['a']))
    await saveBook(newer, new Blob(['b']))

    const { result } = renderHook(() => useLibrary())
    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.entries.map((entry) => entry.summary.bookId)).toEqual(['b', 'a'])
  })

  it('starts empty and loaded for a fresh library', async () => {
    const { result } = renderHook(() => useLibrary())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.entries).toEqual([])
  })

  it('refresh() picks up a book saved after the initial load', async () => {
    const { result } = renderHook(() => useLibrary())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.entries).toEqual([])

    const summary = book()
    await saveBook(summary, new Blob(['%PDF']))
    await result.current.refresh()

    await waitFor(() => expect(result.current.entries).toHaveLength(1))
  })
})
