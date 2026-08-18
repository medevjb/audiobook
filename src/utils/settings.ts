import { PLAYBACK_RATES, type ReadingSettings, type UserPreferences } from '../types/preferences'
import type { BookProgress } from '../types/reader'

/**
 * Applies a book's saved overrides on top of the global defaults.
 *
 * This is the single place the §25-vs-§27 split is resolved: global
 * preferences are the fallback, the book wins where it has an opinion.
 */
export function resolveReadingSettings(
  preferences: UserPreferences,
  progress?: Pick<BookProgress, 'language' | 'voiceURI' | 'rate' | 'autoAdvance'>,
): ReadingSettings {
  return {
    language: progress?.language ?? preferences.language,
    voiceURI: progress?.voiceURI ?? preferences.voiceURI,
    rate: progress?.rate ?? preferences.rate,
    autoAdvance: progress?.autoAdvance ?? preferences.autoAdvance,
  }
}

/**
 * Moves to the next/previous PRD §19 rate, for the "+"/"-" keyboard
 * shortcuts (PRD §34). Clamps at the ends rather than wrapping — repeatedly
 * pressing "+" at 2.0x should do nothing, not jump back to 0.5x.
 */
export function stepPlaybackRate(rate: number, direction: 1 | -1): number {
  const index = PLAYBACK_RATES.indexOf(rate as (typeof PLAYBACK_RATES)[number])
  const current = index === -1 ? PLAYBACK_RATES.indexOf(1) : index
  const next = Math.min(PLAYBACK_RATES.length - 1, Math.max(0, current + direction))
  return PLAYBACK_RATES[next]
}
