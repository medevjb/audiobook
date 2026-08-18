/**
 * Speech contracts (PRD §14).
 *
 * Nothing outside this folder may touch `window.speechSynthesis`. Swapping in a
 * local neural engine later means adding a new `TTSProvider`, not editing the
 * reader.
 */

/**
 * Engine-neutral voice. Mirrors the useful parts of SpeechSynthesisVoice
 * without binding callers to the browser type.
 */
export interface Voice {
  voiceURI: string
  name: string
  /** BCP-47 tag as reported by the engine, e.g. "en-GB". */
  lang: string
  /** True when synthesis happens on-device rather than over the network. */
  localService: boolean
  isDefault: boolean
}

export interface SpeechOptions {
  /** BCP-47 tag applied to the utterance. */
  lang: string
  voiceURI?: string
  /** Maps directly to SpeechSynthesisUtterance.rate (PRD §19). */
  rate: number
  pitch?: number
  volume?: number
}

/**
 * Extends PRD §14's minimal interface. Sequential chunk playback (§15) and
 * chunk highlighting (§23) are impossible without completion and error
 * signals, so the provider reports them here rather than callers polling.
 */
export interface SpeechCallbacks {
  /** The utterance began. Drives chunk highlighting. */
  onStart?: () => void
  /** The utterance finished normally. Drives advancing to the next chunk. */
  onEnd?: () => void
  /** Synthesis failed or was interrupted. `stop()` must not fire this. */
  onError?: (error: SpeechError) => void
  /** Word/sentence boundary, when the engine reports one. Optional per §23. */
  onBoundary?: (charIndex: number) => void
}

export interface SpeechError {
  code: 'synthesis-failed' | 'voice-unavailable' | 'not-supported'
  message: string
  cause?: unknown
}

/**
 * The abstraction the reader depends on (PRD §14).
 *
 * Implementations speak exactly one utterance at a time; sequencing a page's
 * chunks is the caller's job, driven by `onEnd`.
 */
export interface TTSProvider {
  /** True when this engine can run in the current environment. */
  isSupported(): boolean
  /**
   * Voices known right now. May be empty before the engine has loaded them —
   * subscribe with `onVoicesChanged` (PRD §20).
   */
  getVoices(): Voice[]
  /** Fires when the voice list changes. Returns an unsubscribe function. */
  onVoicesChanged(listener: (voices: Voice[]) => void): () => void
  speak(text: string, options: SpeechOptions, callbacks?: SpeechCallbacks): void
  pause(): void
  resume(): void
  /** Cancels everything queued. Must not invoke `onError`. */
  stop(): void
}

/** One speakable unit produced by the chunker (PRD §15). */
export interface SpeechChunk {
  /** Position within the page's chunk list, from 0. */
  index: number
  text: string
  /** Offset of this chunk in the normalized page text, for highlighting (§23). */
  startOffset: number
  endOffset: number
}
