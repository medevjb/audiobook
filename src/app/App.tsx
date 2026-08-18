import { useEffect } from 'react'
import { AppLayout } from '../components/Layout/AppLayout'
import { ErrorNotice } from '../components/Layout/ErrorNotice'
import { PdfViewer } from '../components/PdfViewer/PdfViewer'
import { AutoAdvanceToggle } from '../components/Player/AutoAdvanceToggle'
import { PlayerControls } from '../components/Player/PlayerControls'
import { ReaderText } from '../components/ReaderText/ReaderText'
import { SpeechSettingsPanel } from '../components/SpeechSettings/SpeechSettingsPanel'
import { HomeScreen } from '../components/Upload/HomeScreen'
import type { LibraryEntry } from '../hooks/useLibrary'
import { useLibrary } from '../hooks/useLibrary'
import { useOcr } from '../hooks/useOcr'
import { usePdf } from '../hooks/usePdf'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useSpeech } from '../hooks/useSpeech'
import { useVoices } from '../hooks/useVoices'
import { useBookStore } from '../store/bookStore'
import { usePreferencesStore } from '../store/preferencesStore'
import { useReaderStore } from '../store/readerStore'
import { useSpeechStore } from '../store/speechStore'
import { findVoiceByURI } from '../utils/language'
import { hasNextPage, hasPreviousPage } from '../utils/page'

/**
 * Composes the application (PRD Rule 4). Contains no PDF, speech, OCR or
 * persistence logic — those live in services, driven by hooks.
 */
export function App() {
  const { openFile, openStoredBook, renderPage, renderPageForOcr, extractPage, closeBook } = usePdf()
  const progress = useReadingProgress()
  const library = useLibrary()
  const ocr = useOcr()
  useVoices()

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
    ocr.reset()
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
  const voices = useSpeechStore((state) => state.voices)
  const voicesLoaded = useSpeechStore((state) => state.voicesLoaded)
  const autoAdvance = usePreferencesStore((state) => state.preferences.autoAdvance)
  const language = usePreferencesStore((state) => state.preferences.language)
  const voiceURI = usePreferencesStore((state) => state.preferences.voiceURI)
  const rate = usePreferencesStore((state) => state.preferences.rate)

  const isLoading = status === 'loading-document'
  const hasReadableText = Boolean(pageText && pageText.text.trim() !== '' && !pageText.isLikelyScanned)
  // PRD §22: never let Play speak with no real voice resolved — silently
  // falling back to the browser's own default could mean an English voice
  // reading a Bengali page.
  const hasResolvedVoice = Boolean(voiceURI && findVoiceByURI(voices, voiceURI))
  const canPlay = hasReadableText && hasResolvedVoice

  // Single trigger point for extraction (PRD §10/§11): fires on open and on
  // every manual page change, keyed on the book's identity so opening a
  // different book re-extracts even if both happen to land on page 1.
  // Auto-advance extracts the next page itself before calling play() again,
  // so this effect re-running for that same page change is a harmless no-op
  // once pageText is already set.
  useEffect(() => {
    if (bookId && status === 'ready') void extractPage(currentPage)
  }, [bookId, currentPage, status, extractPage])

  // Persist reading progress (PRD §25): position and the per-book settings
  // override, kept in sync on every page change *and* every settings change
  // rather than scattered save() calls in each handler — one place that
  // cannot be forgotten when a future navigation path is added.
  useEffect(() => {
    if (bookId && status === 'ready') void progress.save()
  }, [bookId, currentPage, status, language, voiceURI, rate, autoAdvance, progress])

  function statusMessage(): string {
    if (isLoading) return 'Loading PDF…'
    if (error) return error.message
    if (book) return `${book.filename} — page ${currentPage} of ${totalPages}`
    return 'Ready — open a PDF to begin.'
  }

  function handleNavigate(page: number) {
    // PRD §10/§16: changing pages manually always stops whatever is speaking.
    stop()
    ocr.reset()
    useReaderStore.getState().goToPage(page)
  }

  /**
   * OCR (PRD §13): render the current page into a detached canvas and hand it
   * to Tesseract. `useOcr` owns the consent prompt and progress; this just
   * supplies the image and writes the result back as the page's text once
   * recognition finishes, in the same place `extractPage` writes PDF text.
   */
  async function handleRecognize() {
    const { currentPage: page } = useReaderStore.getState()
    const canvas = await renderPageForOcr(page)
    if (!canvas) return

    const result = await ocr.recognize(page, canvas, language).catch(() => undefined)
    if (result) useReaderStore.getState().setPageText(result)
  }

  function handleFileSelected(file: File) {
    stop()
    void openFile(file)
  }

  function handleOpenRecent(entry: LibraryEntry, startPage?: number) {
    stop()
    void openStoredBook(entry.summary, startPage)
  }

  function handleCloseBook() {
    stop()
    void closeBook()
    void library.refresh()
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
            <SpeechSettingsPanel
              language={language}
              voiceURI={voiceURI}
              rate={rate}
              voices={voices}
              voicesLoaded={voicesLoaded}
              onLanguageChange={(nextLanguage, nextVoiceURI) =>
                usePreferencesStore.getState().update({ language: nextLanguage, voiceURI: nextVoiceURI })
              }
              onVoiceChange={(nextVoiceURI) => usePreferencesStore.getState().update({ voiceURI: nextVoiceURI })}
              onRateChange={(nextRate) => usePreferencesStore.getState().update({ rate: nextRate })}
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
            <ReaderText
              pageText={pageText}
              ocrState={ocr.state}
              onRecognize={() => void handleRecognize()}
              onAnswerConsent={ocr.answerConsent}
            />
          </>
        ) : (
          <HomeScreen
            onFileSelected={handleFileSelected}
            recentBooks={library.entries}
            onOpenRecent={handleOpenRecent}
            busy={isLoading}
          />
        )}
      </div>
    </AppLayout>
  )
}
