import { useCallback, useMemo } from 'react'
import { saveProgress } from '../services/storage/progressStorage'
import { useBookStore } from '../store/bookStore'
import { usePreferencesStore } from '../store/preferencesStore'
import { useReaderStore } from '../store/readerStore'

/**
 * Persists reading progress (PRD §25): position plus the per-book
 * language/voice/speed/auto-advance overrides that let a Bengali book
 * reopen in the voice it was last read with, even after an English book
 * changed the global defaults in between.
 *
 * A plain imperative action, not reactive state — callers invoke `save()`
 * at the moments that matter (a page changed, a setting changed) rather
 * than this hook watching the stores itself, so a burst of rapid changes
 * (auto-advance skipping several short pages) never queues more writes than
 * there are actual events.
 */
export function useReadingProgress() {
  const save = useCallback(async () => {
    const book = useBookStore.getState().current
    if (!book) return

    const { currentPage, totalPages } = useReaderStore.getState()
    const { preferences } = usePreferencesStore.getState()

    const progress = await saveProgress({
      bookId: book.bookId,
      filename: book.filename,
      currentPage,
      totalPages,
      language: preferences.language,
      voiceURI: preferences.voiceURI,
      rate: preferences.rate,
      autoAdvance: preferences.autoAdvance,
    })

    useReaderStore.getState().setProgress(progress)
  }, [])

  // A stable object identity so callers can depend on the return value itself
  // (e.g. in a useEffect deps array) without it changing every render — only
  // `save`'s own identity (which never changes) can invalidate it.
  return useMemo(() => ({ save }), [save])
}
