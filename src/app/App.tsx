import { useEffect } from 'react'
import { AppLayout } from '../components/Layout/AppLayout'
import { ErrorNotice } from '../components/Layout/ErrorNotice'
import { PdfViewer } from '../components/PdfViewer/PdfViewer'
import { AutoAdvanceToggle } from '../components/Player/AutoAdvanceToggle'
import { PlayerControls } from '../components/Player/PlayerControls'
import { ReaderText } from '../components/ReaderText/ReaderText'
import { HomeScreen } from '../components/Upload/HomeScreen'
import { usePdf } from '../hooks/usePdf'
import { useSpeech } from '../hooks/useSpeech'
import { useBookStore } from '../store/bookStore'
import { usePreferencesStore } from '../store/preferencesStore'
import { useReaderStore } from '../store/readerStore'
import { useSpeechStore } from '../store/speechStore'
import { hasNextPage, hasPreviousPage } from '../utils/page'

/**
 * Composes the application (PRD Rule 4). Contains no PDF, speech, OCR or
 * persistence logic — those live in services, driven by hooks.
 */
export function App() {
  const { openFile, renderPage, extractPage, closeBook } = usePdf()

  /**
   * Auto-advance (PRD §17): when a page finishes speaking naturally, move to
   * the next one, extract its text, and keep reading — stopping quietly once
   * there is no next page. This is the one place PDF navigation and speech
   * genuinely depend on each other, so it lives here rather than inside
   * either hook: `useSpeech` only reports that a page finished; App decides
   * what that means.
   */
  async function handlePageComplete() {
    if (!usePreferencesStore.getState().preferences.autoAdvance) return

    const { currentPage: page, totalPages: total } = useReaderStore.getState()
    if (!hasNextPage(page, total)) return

    const nextPage = page + 1
    useReaderStore.getState().goToPage(nextPage)
    await extractPage(nextPage)
    play()
  }

  const { play, pause, resume, stop } = useSpeech(handlePageComplete)

  const book = useBookStore((state) => state.current)
  const bookId = book?.bookId
  const status = useReaderStore((state) => state.status)
  const currentPage = useReaderStore((state) => state.currentPage)
  const totalPages = useReaderStore((state) => state.totalPages)
  const pageText = useReaderStore((state) => state.pageText)
  const error = useReaderStore((state) => state.error)
  const playback = useSpeechStore((state) => state.playback)
  const autoAdvance = usePreferencesStore((state) => state.preferences.autoAdvance)

  const isLoading = status === 'loading-document'
  const canPlay = Boolean(pageText && pageText.text.trim() !== '' && !pageText.isLikelyScanned)

  // Single trigger point for extraction (PRD §10/§11): fires on open and on
  // every manual page change, keyed on the book's identity so opening a
  // different book re-extracts even if both happen to land on page 1.
  // Auto-advance extracts the next page itself before calling play() again,
  // so this effect re-running for that same page change is a harmless no-op
  // once pageText is already set.
  useEffect(() => {
    if (bookId && status === 'ready') void extractPage(currentPage)
  }, [bookId, currentPage, status, extractPage])

  function statusMessage(): string {
    if (isLoading) return 'Loading PDF…'
    if (error) return error.message
    if (book) return `${book.filename} — page ${currentPage} of ${totalPages}`
    return 'Ready — open a PDF to begin.'
  }

  function handleNavigate(page: number) {
    // PRD §10/§16: changing pages manually always stops whatever is speaking.
    stop()
    useReaderStore.getState().goToPage(page)
  }

  function handleFileSelected(file: File) {
    stop()
    void openFile(file)
  }

  function handleCloseBook() {
    stop()
    void closeBook()
  }

  return (
    <AppLayout
      status={statusMessage()}
      statusTone={error ? 'error' : 'neutral'}
      headerAction={
        book && (
          <button
            type="button"
            onClick={handleCloseBook}
            className="rounded-md border border-white/10 bg-transparent px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brass/40 hover:text-brass-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            Upload new PDF
          </button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <ErrorNotice error={error} onDismiss={() => useReaderStore.getState().setError(undefined)} />
        )}

        {book && status !== 'loading-document' ? (
          <>
            <PdfViewer
              currentPage={currentPage}
              totalPages={totalPages}
              render={renderPage}
              onNavigate={handleNavigate}
            />
            <PlayerControls
              playback={playback}
              canPlay={canPlay}
              hasPrevious={hasPreviousPage(currentPage)}
              hasNext={hasNextPage(currentPage, totalPages)}
              onPlay={play}
              onPause={pause}
              onResume={resume}
              onStop={stop}
              onPrevious={() => handleNavigate(currentPage - 1)}
              onNext={() => handleNavigate(currentPage + 1)}
            />
            <AutoAdvanceToggle
              checked={autoAdvance}
              onChange={(checked) => usePreferencesStore.getState().update({ autoAdvance: checked })}
            />
            <ReaderText pageText={pageText} />
          </>
        ) : (
          <HomeScreen onFileSelected={handleFileSelected} busy={isLoading} />
        )}
      </div>
    </AppLayout>
  )
}
