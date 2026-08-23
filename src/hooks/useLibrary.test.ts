import 'fake-indexeddb/auto'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveBook } from '../services/storage/bookStorage'
import { resetDbForTests } from '../services/storage/db'
import { saveProgress } from '../services/storage/progressStorage'
import * as libraryApi from '../services/sync/libraryApi'
import * as progressApi from '../services/sync/progressApi'
import { useAuthStore } from '../store/authStore'
import type { BookSummary } from '../types/book'
import { useLibrary } from './useLibrary'

vi.mock('../services/sync/libraryApi')
vi.mock('../services/sync/progressApi')

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
  vi.resetAllMocks()
  useAuthStore.setState({ user: undefined, status: 'idle', error: undefined })
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

    expect(result.current.entries).toEqual([{ summary, progress: undefined, hasFile: true }])
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

    expect(result.current.entries).toEqual([{ summary, progress, hasFile: true }])
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

  describe('when authenticated', () => {
    beforeEach(() => {
      useAuthStore.setState({ status: 'authenticated' })
    })

    it('does not call the sync services when signed out', async () => {
      useAuthStore.setState({ status: 'idle' })
      const { result } = renderHook(() => useLibrary())
      await waitFor(() => expect(result.current.loaded).toBe(true))

      expect(libraryApi.fetchLibrary).not.toHaveBeenCalled()
    })

    it('merges in a server-only book and marks it as not present on this device', async () => {
      const remoteOnly = book({ bookId: 'remote', filename: 'remote.pdf' })
      vi.mocked(libraryApi.fetchLibrary).mockResolvedValue([remoteOnly])
      vi.mocked(progressApi.fetchProgress).mockResolvedValue([])

      const { result } = renderHook(() => useLibrary())
      await waitFor(() => expect(result.current.loaded).toBe(true))

      expect(result.current.entries).toEqual([{ summary: remoteOnly, progress: undefined, hasFile: false }])
    })

    it('marks a locally-saved book as hasFile even when it also exists remotely', async () => {
      const summary = book()
      await saveBook(summary, new Blob(['%PDF']))
      vi.mocked(libraryApi.fetchLibrary).mockResolvedValue([summary])
      vi.mocked(progressApi.fetchProgress).mockResolvedValue([])

      const { result } = renderHook(() => useLibrary())
      await waitFor(() => expect(result.current.loaded).toBe(true))

      expect(result.current.entries).toEqual([{ summary, progress: undefined, hasFile: true }])
    })

    it('falls back to local-only data when the server sync fails', async () => {
      const summary = book()
      await saveBook(summary, new Blob(['%PDF']))
      vi.mocked(libraryApi.fetchLibrary).mockRejectedValue(new Error('network error'))
      vi.mocked(progressApi.fetchProgress).mockResolvedValue([])

      const { result } = renderHook(() => useLibrary())
      await waitFor(() => expect(result.current.loaded).toBe(true))

      expect(result.current.entries).toEqual([{ summary, progress: undefined, hasFile: true }])
    })
  })
})
