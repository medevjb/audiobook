import 'fake-indexeddb/auto'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDbForTests } from '../services/storage/db'
import { getProgress } from '../services/storage/progressStorage'
import { useBookStore } from '../store/bookStore'
import { DEFAULT_PREFERENCES } from '../types/preferences'
import { usePreferencesStore } from '../store/preferencesStore'
import { useReaderStore } from '../store/readerStore'
import type { BookSummary } from '../types/book'
import { useReadingProgress } from './useReadingProgress'

function book(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    bookId: 'book.pdf:1:1',
    filename: 'book.pdf',
    size: 1024,
    lastModified: 1,
    totalPages: 324,
    addedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  indexedDB = new IDBFactory()
  resetDbForTests()
  useBookStore.setState({ current: undefined })
  useReaderStore.getState().reset()
  usePreferencesStore.setState({ preferences: { ...DEFAULT_PREFERENCES } })
})

describe('useReadingProgress (PRD §25)', () => {
  it('does nothing when no book is open', async () => {
    const { result } = renderHook(() => useReadingProgress())
    await result.current.save()
    expect(await getProgress('book.pdf:1:1')).toBeUndefined()
  })

  it('saves the current position and settings for the open book', async () => {
    useBookStore.setState({ current: book() })
    useReaderStore.setState({ currentPage: 57, totalPages: 324 })
    usePreferencesStore.setState({
      preferences: { language: 'bn', voiceURI: 'bangla', rate: 1.25, autoAdvance: false },
    })

    const { result } = renderHook(() => useReadingProgress())
    await result.current.save()

    const saved = await getProgress('book.pdf:1:1')
    expect(saved).toMatchObject({
      bookId: 'book.pdf:1:1',
      filename: 'book.pdf',
      currentPage: 57,
      totalPages: 324,
      language: 'bn',
      voiceURI: 'bangla',
      rate: 1.25,
      autoAdvance: false,
    })
  })

  it('mirrors the saved record back into the reader store', async () => {
    useBookStore.setState({ current: book() })
    useReaderStore.setState({ currentPage: 12, totalPages: 324 })

    const { result } = renderHook(() => useReadingProgress())
    await result.current.save()

    expect(useReaderStore.getState().progress?.currentPage).toBe(12)
  })

  it('overwrites the previous save for the same book rather than duplicating it', async () => {
    useBookStore.setState({ current: book() })
    const { result } = renderHook(() => useReadingProgress())

    useReaderStore.setState({ currentPage: 5, totalPages: 324 })
    await result.current.save()
    useReaderStore.setState({ currentPage: 6, totalPages: 324 })
    await result.current.save()

    expect((await getProgress('book.pdf:1:1'))?.currentPage).toBe(6)
  })
})
