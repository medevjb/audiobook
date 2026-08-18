/** Playback rates required by PRD §19. */
export const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const

export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

/**
 * Global defaults, persisted to localStorage (PRD §27).
 * A book may override any of these — see `BookProgress` and `resolveReadingSettings`.
 */
export interface UserPreferences {
  /** BCP-47 base code, e.g. "en", "bn". */
  language: string
  voiceURI?: string
  rate: number
  autoAdvance: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  rate: 1.0,
  /** PRD §17: auto-advance defaults to enabled. */
  autoAdvance: true,
}

/**
 * The settings actually in force for the book being read: global preferences
 * with any per-book override applied. Never persisted — always recomputed.
 */
export interface ReadingSettings {
  language: string
  voiceURI?: string
  rate: number
  autoAdvance: boolean
}
