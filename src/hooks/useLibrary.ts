import { useCallback, useEffect, useState } from 'react'
import { listBooks } from '../services/storage/bookStorage'
import { listRecentProgress } from '../services/storage/progressStorage'
import { fetchLibrary } from '../services/sync/libraryApi'
import { fetchProgress } from '../services/sync/progressApi'
import { useAuthStore } from '../store/authStore'
import type { BookSummary } from '../types/book'
import type { BookProgress } from '../types/reader'
import { mergeLibraryByBookId, mergeProgressByUpdatedAt } from '../utils/sync'

export interface LibraryEntry {
  summary: BookSummary
  progress?: BookProgress
  /**
   * Whether this book's actual bytes exist in this browser's IndexedDB.
   * `false` for an entry known only from account sync (metadata/progress
   * synced from another device) — the PDF itself was never uploaded, so
   * opening it here needs a re-upload rather than a normal "Open".
   */
  hasFile: boolean
}

/**
 * The library shown on the home screen (PRD §25/§26): every book saved via
 * `saveBook` on this device, merged with the account's synced library where
 * signed in, each paired with its progress record where one exists, most
 * recently *read* first — not most recently added, since "continue where I
 * left off" is what a returning user actually wants.
 */
export function useLibrary() {
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const [localBooks, localProgress] = await Promise.all([listBooks(), listRecentProgress(50)])

    let books = localBooks
    let progressList = localProgress
    if (useAuthStore.getState().status === 'authenticated') {
      const remote = await Promise.all([fetchLibrary(), fetchProgress()]).catch(() => undefined)
      if (remote) {
        const [remoteBooks, remoteProgress] = remote
        books = mergeLibraryByBookId(localBooks, remoteBooks)
        progressList = mergeProgressByUpdatedAt(localProgress, remoteProgress)
      }
    }

    const progressByBook = new Map(progressList.map((progress) => [progress.bookId, progress]))
    const localFileIds = new Set(localBooks.map((book) => book.bookId))

    const merged = books
      .map(
        (summary): LibraryEntry => ({
          summary,
          progress: progressByBook.get(summary.bookId),
          hasFile: localFileIds.has(summary.bookId),
        }),
      )
      .sort((a, b) => (b.progress?.updatedAt ?? b.summary.addedAt) - (a.progress?.updatedAt ?? a.summary.addedAt))

    setEntries(merged)
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { entries, loaded, refresh }
}
