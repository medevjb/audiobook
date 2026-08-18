import { DEFAULT_PREFERENCES, PLAYBACK_RATES, type UserPreferences } from '../../types/preferences'

/**
 * Global preference persistence (PRD §27). localStorage rather than IndexedDB:
 * the payload is tiny and reads happen synchronously during first paint.
 */

const STORAGE_KEY = 'audiobook-reader:preferences'

/**
 * Stored JSON is untrusted — a user or another script can edit it, and an old
 * app version may have written a different shape. Every field is validated and
 * silently falls back to its default rather than corrupting reader state.
 */
function parsePreferences(raw: string): UserPreferences {
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_PREFERENCES }
  const value = parsed as Record<string, unknown>

  const language = typeof value.language === 'string' && value.language.trim() !== ''
    ? value.language
    : DEFAULT_PREFERENCES.language

  const rate = typeof value.rate === 'number' && PLAYBACK_RATES.includes(value.rate as never)
    ? value.rate
    : DEFAULT_PREFERENCES.rate

  const autoAdvance = typeof value.autoAdvance === 'boolean'
    ? value.autoAdvance
    : DEFAULT_PREFERENCES.autoAdvance

  const voiceURI = typeof value.voiceURI === 'string' && value.voiceURI !== '' ? value.voiceURI : undefined

  return { language, rate, autoAdvance, ...(voiceURI ? { voiceURI } : {}) }
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { ...DEFAULT_PREFERENCES }
    return parsePreferences(raw)
  } catch {
    // Corrupt JSON, or localStorage blocked entirely (private mode, embedded
    // contexts). Preferences are a convenience — never fail the app for them.
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Quota or blocked storage. Settings stay in memory for this session.
  }
}

export function clearPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to recover from.
  }
}
