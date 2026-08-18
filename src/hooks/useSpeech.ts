import { useCallback, useRef } from 'react'
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
 * Milestone 6 scope: the page's text is split into chunks (PRD §15) and
 * spoken one utterance at a time, each chunk's `onEnd` triggering the next —
 * never one long utterance for a whole page, which is unreliable across
 * browsers and impossible to pause or highlight mid-page.
 */
export function useSpeech() {
  const providerRef = useRef<BrowserTTSProvider | undefined>(undefined)
  providerRef.current ??= new BrowserTTSProvider()

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

  return { play, stop }
}
