import { useEffect, useRef } from 'react'
import { BrowserTTSProvider } from '../services/speech/BrowserTTSProvider'
import { pickDefaultVoice } from '../utils/language'
import { usePreferencesStore } from '../store/preferencesStore'
import { useSpeechStore } from '../store/speechStore'

/**
 * Owns voice discovery (PRD §20). Voices load asynchronously in most
 * browsers — `getVoices()` can return an empty list until `voiceschanged`
 * fires — so this subscribes rather than reading once.
 *
 * A separate `BrowserTTSProvider` instance from `useSpeech`'s: the provider
 * holds no engine state of its own for voice queries (both wrap the same
 * global `speechSynthesis`), so there is nothing to share, and it keeps
 * voice discovery decoupled from playback.
 */
export function useVoices() {
  const providerRef = useRef<BrowserTTSProvider | undefined>(undefined)
  providerRef.current ??= new BrowserTTSProvider()

  useEffect(() => {
    const provider = providerRef.current
    if (!provider) return

    function applyVoices(voices: ReturnType<BrowserTTSProvider['getVoices']>) {
      // Chrome commonly reports zero voices on the very first synchronous
      // call and fills the list in only once `voiceschanged` fires — so
      // `voicesLoaded` (has the engine responded at all) is the wrong signal
      // for "voices just became available"; that has to watch the count.
      const hadNoVoicesYet = useSpeechStore.getState().voices.length === 0
      useSpeechStore.getState().setVoices(voices)

      // First time real voices show up: pick a default for whatever language
      // is already selected, if the user hasn't chosen one yet. Later
      // updates (a voice pack installed mid-session, say) must not override
      // an explicit choice.
      if (hadNoVoicesYet && voices.length > 0) {
        const { preferences } = usePreferencesStore.getState()
        if (!preferences.voiceURI) {
          const fallback = pickDefaultVoice(voices, preferences.language)
          if (fallback) usePreferencesStore.getState().update({ voiceURI: fallback.voiceURI })
        }
      }
    }

    applyVoices(provider.getVoices())
    return provider.onVoicesChanged(applyVoices)
  }, [])
}
