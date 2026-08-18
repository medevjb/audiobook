import type { Voice } from '../services/speech/types'

export interface LanguageOption {
  code: string
  /** English name, used as the selector label. */
  label: string
}

/** Initial language list from PRD §21. Not a limit — see `allVoiceLanguages`. */
export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'Bengali' },
  { code: 'fr', label: 'French' },
  { code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ko', label: 'Korean' },
] as const

/**
 * Reduces a BCP-47 tag to its primary subtag: "en-GB" -> "en", "zh_CN" -> "zh".
 * Engines are inconsistent about case and separator, so normalize both.
 */
export function baseLanguageCode(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, '-').split('-')[0] ?? ''
}

/** Voices whose primary subtag matches `code` (PRD §21). */
export function filterVoicesByLanguage(voices: readonly Voice[], code: string): Voice[] {
  const target = baseLanguageCode(code)
  if (!target) return []
  return voices.filter((voice) => baseLanguageCode(voice.lang) === target)
}

/**
 * Matching voices first, then the rest — so the selector can offer "show all
 * available voices" (PRD §22) without losing the recommended ordering.
 */
export function prioritizeVoicesByLanguage(voices: readonly Voice[], code: string): Voice[] {
  const target = baseLanguageCode(code)
  const matching: Voice[] = []
  const others: Voice[] = []
  for (const voice of voices) {
    ;(baseLanguageCode(voice.lang) === target ? matching : others).push(voice)
  }
  return [...matching, ...others]
}

/** PRD §22: the app must never pretend a voice exists for the chosen language. */
export function hasVoiceForLanguage(voices: readonly Voice[], code: string): boolean {
  return filterVoicesByLanguage(voices, code).length > 0
}

/**
 * Best default voice for a language: the engine's own default if it matches,
 * otherwise the first on-device voice, otherwise the first match at all.
 */
export function pickDefaultVoice(voices: readonly Voice[], code: string): Voice | undefined {
  const matches = filterVoicesByLanguage(voices, code)
  return matches.find((v) => v.isDefault) ?? matches.find((v) => v.localService) ?? matches[0]
}

export function findVoiceByURI(voices: readonly Voice[], voiceURI: string | undefined): Voice | undefined {
  if (!voiceURI) return undefined
  return voices.find((voice) => voice.voiceURI === voiceURI)
}

/** Selector label per PRD §20, e.g. "Google UK English Female — en-GB". */
export function formatVoiceLabel(voice: Voice): string {
  return `${voice.name} — ${voice.lang}`
}

export function languageLabel(code: string): string {
  const base = baseLanguageCode(code)
  return LANGUAGES.find((language) => language.code === base)?.label ?? code
}

/**
 * Languages the device can actually speak, including ones absent from
 * `LANGUAGES` — PRD §1 requires supporting "other languages supported by the
 * user's browser".
 */
export function allVoiceLanguages(voices: readonly Voice[]): LanguageOption[] {
  const codes = new Set(voices.map((voice) => baseLanguageCode(voice.lang)))
  codes.delete('')
  return [...codes].map((code) => ({ code, label: languageLabel(code) }))
}
