import { useCallback, useEffect, useRef } from 'react'
import { BrowserTTSProvider } from '../services/speech/BrowserTTSProvider'
import type { SpeechOptions } from '../services/speech/types'
import { chunkText } from '../services/speech/textChunker'
import { usePreferencesStore } from '../store/preferencesStore'
import { useReaderStore } from '../store/readerStore'
import { useSpeechStore } from '../store/speechStore'
import { toAppError } from '../utils/errors'

/**
 * Owns the TTSProvider instance and drives playback state (PRD §14/§16).
 *
 * The page's text is split into chunks (PRD §15) and spoken one utterance at
 * a time, each chunk's `onEnd` triggering the next — never one long utterance
 * for a whole page, which is unreliable across browsers and impossible to
 * pause or highlight mid-page.
 *
 * @param onPageComplete Called when every chunk on the page has finished
 * speaking naturally — never on `stop()`, `pause()`, or a synthesis error.
 * This is the seam auto-advance (PRD §17) hangs off: this hook only reports
 * that a page finished, and the caller (which also knows about page
 * navigation) decides whether to move on.
 */
export function useSpeech(onPageComplete?: () => void) {
  const providerRef = useRef<BrowserTTSProvider | undefined>(undefined)
  providerRef.current ??= new BrowserTTSProvider()

  const onPageCompleteRef = useRef(onPageComplete)
  useEffect(() => {
    onPageCompleteRef.current = onPageComplete
  }, [onPageComplete])

  /**
   * Identifies one playback run. `stop()` and a fresh `play()` both bump this,
   * so a chunk's `onEnd` — which arrives asynchronously and may fire after the
   * user has already moved on — can tell whether it's still the one in charge
   * before queuing the next chunk. Without this, stopping mid-page wouldn't
   * reliably stop the queue: the in-flight chunk's completion would still
   * advance to the next one.
   */
  const sessionRef = useRef(0)

  const stop = useCallback(() => {
    sessionRef.current += 1
    providerRef.current?.stop()
    useSpeechStore.getState().setPlayback('stopped')
  }, [])

  /**
   * Pauses the in-flight utterance in place (PRD §16). Unlike `stop()`, this
   * does not touch the session token: the engine holds the same utterance
   * paused and `resume()` continues it, rather than the queue restarting a
   * chunk from its beginning.
   */
  const pause = useCallback(() => {
    if (useSpeechStore.getState().playback !== 'playing') return
    providerRef.current?.pause()
    useSpeechStore.getState().setPlayback('paused')
  }, [])

  const resume = useCallback(() => {
    if (useSpeechStore.getState().playback !== 'paused') return
    providerRef.current?.resume()
    useSpeechStore.getState().setPlayback('playing')
  }, [])

  const play = useCallback(() => {
    const provider = providerRef.current
    if (!provider) return

    const { pageText } = useReaderStore.getState()
    if (!pageText || pageText.text.trim() === '') return

    const chunks = chunkText(pageText.text)
    if (chunks.length === 0) return

    const { preferences } = usePreferencesStore.getState()
    const options: SpeechOptions = {
      lang: preferences.language,
      voiceURI: preferences.voiceURI,
      rate: preferences.rate,
    }

    const session = ++sessionRef.current
    useSpeechStore.getState().setChunks(chunks)
    useSpeechStore.getState().setPlayback('playing')

    const speakFrom = (index: number) => {
      if (sessionRef.current !== session) return // superseded by stop() or a newer play()

      if (index >= chunks.length) {
        useSpeechStore.getState().setPlayback('stopped')
        onPageCompleteRef.current?.()
        return
      }

      useSpeechStore.getState().setCurrentChunkIndex(index)
      provider.speak(chunks[index].text, options, {
        onEnd: () => speakFrom(index + 1),
        onError: (error) => {
          if (sessionRef.current !== session) return
          useSpeechStore.getState().setPlayback('stopped')
          useReaderStore
            .getState()
            .setError(toAppError(error, 'speech-failed', 'Playback failed. Try a different voice or language.'))
        },
      })
    }

    speakFrom(0)
  }, [])

  return { play, pause, resume, stop }
}
