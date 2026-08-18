import { useCallback, useEffect, useState } from 'react'
import { listBooks } from '../services/storage/bookStorage'
import { listRecentProgress } from '../services/storage/progressStorage'
import type { BookSummary } from '../types/book'
import type { BookProgress } from '../types/reader'

export interface LibraryEntry {
  summary: BookSummary
  progress?: BookProgress
}

/**
 * The local library shown on the home screen (PRD §25/§26): every book
 * saved via `saveBook`, each paired with its progress record where one
 * exists, most recently *read* first — not most recently added, since
 * "continue where I left off" is what a returning user actually wants.
 */
export function useLibrary() {
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const [books, progressList] = await Promise.all([listBooks(), listRecentProgress(50)])
    const progressByBook = new Map(progressList.map((progress) => [progress.bookId, progress]))

    const merged = books
      .map((summary): LibraryEntry => ({ summary, progress: progressByBook.get(summary.bookId) }))
      .sort((a, b) => (b.progress?.updatedAt ?? b.summary.addedAt) - (a.progress?.updatedAt ?? a.summary.addedAt))

    setEntries(merged)
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { entries, loaded, refresh }
}
