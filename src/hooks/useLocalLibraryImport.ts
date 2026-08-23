import { useCallback, useMemo, useState } from 'react'
import { listBooks } from '../services/storage/bookStorage'
import { listRecentProgress } from '../services/storage/progressStorage'
import { fetchLibrary, importLibrary } from '../services/sync/libraryApi'
import { importProgress } from '../services/sync/progressApi'

/**
 * Offers to associate this browser's pre-existing local library with an
 * account just signed into. The import endpoints are idempotent upserts, so
 * this can run again harmlessly — no "don't ask again" state is persisted;
 * declining just clears the local prompt for this session (PRD-adjacent
 * decision, see docs/ARCHITECTURE.md).
 */
export function useLocalLibraryImport() {
  const [pendingCount, setPendingCount] = useState(0)

  const check = useCallback(async () => {
    const [localBooks, remoteBooks] = await Promise.all([listBooks(), fetchLibrary().catch(() => [])])
    const remoteIds = new Set(remoteBooks.map((book) => book.bookId))
    setPendingCount(localBooks.filter((book) => !remoteIds.has(book.bookId)).length)
  }, [])

  const importNow = useCallback(async () => {
    const [localBooks, localProgress] = await Promise.all([listBooks(), listRecentProgress(500)])
    await Promise.all([
      localBooks.length > 0 ? importLibrary(localBooks) : undefined,
      localProgress.length > 0 ? importProgress(localProgress) : undefined,
    ])
    setPendingCount(0)
  }, [])

  const dismiss = useCallback(() => setPendingCount(0), [])

  return useMemo(() => ({ pendingCount, check, importNow, dismiss }), [pendingCount, check, importNow, dismiss])
}
