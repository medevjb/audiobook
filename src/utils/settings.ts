import type { ReadingSettings, UserPreferences } from '../types/preferences'
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
