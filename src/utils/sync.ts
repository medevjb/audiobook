import type { BookSummary } from '../types/book'
import type { BookProgress } from '../types/reader'

/**
 * Combines this device's local library with the account's synced library.
 * Local wins on a shared `bookId`: a book present locally is guaranteed to
 * reflect what this device actually has, while a server-only entry is
 * metadata synced in from elsewhere (see `hasFile` in `useLibrary`).
 */
export function mergeLibraryByBookId(local: BookSummary[], remote: BookSummary[]): BookSummary[] {
  const byId = new Map<string, BookSummary>()
  for (const book of remote) byId.set(book.bookId, book)
  for (const book of local) byId.set(book.bookId, book)
  return [...byId.values()]
}

/**
 * Combines local and synced reading progress. Whichever side last touched a
 * given book — by `updatedAt` — wins, so progress made on another device
 * shows up here, and progress made here isn't clobbered by a stale sync.
 */
export function mergeProgressByUpdatedAt(local: BookProgress[], remote: BookProgress[]): BookProgress[] {
  const byId = new Map<string, BookProgress>()
  for (const progress of [...local, ...remote]) {
    const existing = byId.get(progress.bookId)
    if (!existing || progress.updatedAt >= existing.updatedAt) {
      byId.set(progress.bookId, progress)
    }
  }
  return [...byId.values()]
}
