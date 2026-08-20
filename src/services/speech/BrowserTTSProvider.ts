import type { SpeechCallbacks, SpeechOptions, TTSProvider, Voice } from './types'

/**
 * Wraps `window.speechSynthesis` (PRD §14). The only module that touches the
 * Web Speech API — the reader depends on `TTSProvider`, never on this
 * browser global directly, so a future local neural engine is a new provider,
 * not a rewrite.
 */
export class BrowserTTSProvider implements TTSProvider {
  /**
   * The utterance currently in flight, if any. Cleared before `stop()` calls
   * `cancel()` so a late `onerror`/`onend` from the cancelled utterance can be
   * told apart from a genuine failure of whatever speaks next.
   */
  private activeUtterance: SpeechSynthesisUtterance | undefined

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getVoices(): Voice[] {
    if (!this.isSupported()) return []
    return window.speechSynthesis.getVoices().map(toVoice)
  }

  onVoicesChanged(listener: (voices: Voice[]) => void): () => void {
    if (!this.isSupported()) return () => undefined
    const handler = () => listener(this.getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
  }

  speak(text: string, options: SpeechOptions, callbacks?: SpeechCallbacks): void {
    if (!this.isSupported()) {
      callbacks?.onError?.({ code: 'not-supported', message: 'Speech synthesis is not supported in this browser.' })
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1

    const voice = options.voiceURI
      ? window.speechSynthesis.getVoices().find((candidate) => candidate.voiceURI === options.voiceURI || candidate.name === options.voiceURI)
      : undefined
    if (options.voiceURI && !voice) {
      callbacks?.onError?.({ code: 'voice-unavailable', message: `Voice "${options.voiceURI}" is not available.` })
      return
    }
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang || options.lang
    } else {
      utterance.lang = options.lang
    }

    this.activeUtterance = utterance

    utterance.onstart = () => callbacks?.onStart?.()

    utterance.onend = () => {
      if (this.activeUtterance === utterance) this.activeUtterance = undefined
      callbacks?.onEnd?.()
    }

    utterance.onerror = (event) => {
      if (this.activeUtterance === utterance) this.activeUtterance = undefined
      // "canceled" is our own stop(); "interrupted" is a new speak() cutting
      // this one off. Both are normal control flow, not failures — the
      // contract requires stop() not to surface as an error.
      if (event.error === 'canceled' || event.error === 'interrupted') return
      callbacks?.onError?.({ code: 'synthesis-failed', message: event.error, cause: event })
    }

    utterance.onboundary = (event) => callbacks?.onBoundary?.(event.charIndex)

    window.speechSynthesis.speak(utterance)
  }

  pause(): void {
    if (this.isSupported()) window.speechSynthesis.pause()
  }

  resume(): void {
    if (this.isSupported()) window.speechSynthesis.resume()
  }

  stop(): void {
    if (!this.isSupported()) return
    this.activeUtterance = undefined
    window.speechSynthesis.cancel()
  }
}

function toVoice(voice: SpeechSynthesisVoice): Voice {
  return {
    voiceURI: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
    isDefault: voice.default,
  }
}
