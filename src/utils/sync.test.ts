import { describe, expect, it } from 'vitest'
import type { BookSummary } from '../types/book'
import type { BookProgress } from '../types/reader'
import { mergeLibraryByBookId, mergeProgressByUpdatedAt } from './sync'

function book(overrides: Partial<BookSummary> = {}): BookSummary {
  return { bookId: 'a', filename: 'a.pdf', size: 100, lastModified: 1, totalPages: 10, addedAt: 1, ...overrides }
}

function progress(overrides: Partial<BookProgress> = {}): BookProgress {
  return { bookId: 'a', filename: 'a.pdf', currentPage: 1, totalPages: 10, updatedAt: 1, ...overrides }
}

describe('mergeLibraryByBookId', () => {
  it('returns local entries when there is nothing remote', () => {
    expect(mergeLibraryByBookId([book()], [])).toEqual([book()])
  })

  it('includes remote-only entries', () => {
    const remoteOnly = book({ bookId: 'b', filename: 'b.pdf' })
    expect(mergeLibraryByBookId([], [remoteOnly])).toEqual([remoteOnly])
  })

  it('prefers the local copy when the same bookId exists on both sides', () => {
    const local = book({ filename: 'local.pdf' })
    const remote = book({ filename: 'remote.pdf' })
    expect(mergeLibraryByBookId([local], [remote])).toEqual([local])
  })

  it('merges disjoint local and remote sets', () => {
    const local = book({ bookId: 'a' })
    const remote = book({ bookId: 'b' })
    const merged = mergeLibraryByBookId([local], [remote])
    expect(merged.map((b) => b.bookId).sort()).toEqual(['a', 'b'])
  })
})

describe('mergeProgressByUpdatedAt', () => {
  it('returns local entries when there is nothing remote', () => {
    expect(mergeProgressByUpdatedAt([progress()], [])).toEqual([progress()])
  })

  it('includes remote-only entries', () => {
    const remoteOnly = progress({ bookId: 'b' })
    expect(mergeProgressByUpdatedAt([], [remoteOnly])).toEqual([remoteOnly])
  })

  it('picks whichever side has the newer updatedAt', () => {
    const older = progress({ currentPage: 1, updatedAt: 100 })
    const newer = progress({ currentPage: 50, updatedAt: 200 })
    expect(mergeProgressByUpdatedAt([older], [newer])).toEqual([newer])
    expect(mergeProgressByUpdatedAt([newer], [older])).toEqual([newer])
  })

  it('merges disjoint local and remote sets', () => {
    const local = progress({ bookId: 'a', updatedAt: 1 })
    const remote = progress({ bookId: 'b', updatedAt: 1 })
    const merged = mergeProgressByUpdatedAt([local], [remote])
    expect(merged.map((p) => p.bookId).sort()).toEqual(['a', 'b'])
  })
})
