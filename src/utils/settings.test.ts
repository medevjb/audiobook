import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, type UserPreferences } from '../types/preferences'
import { resolveReadingSettings } from './settings'

const preferences: UserPreferences = {
  language: 'en',
  voiceURI: 'david',
  rate: 1.0,
  autoAdvance: true,
}

describe('resolveReadingSettings (PRD §25 over §27)', () => {
  it('uses global preferences when the book has no overrides', () => {
    expect(resolveReadingSettings(preferences)).toEqual(preferences)
  })

  it('lets a book override the language and voice it was last read with', () => {
    const resolved = resolveReadingSettings(preferences, { language: 'bn', voiceURI: 'bangla' })
    expect(resolved.language).toBe('bn')
    expect(resolved.voiceURI).toBe('bangla')
    expect(resolved.rate).toBe(1.0)
  })

  it('treats a false override as a real value, not a missing one', () => {
    expect(resolveReadingSettings(preferences, { autoAdvance: false }).autoAdvance).toBe(false)
  })

  it('falls back per field, not all-or-nothing', () => {
    const resolved = resolveReadingSettings(preferences, { rate: 1.5 })
    expect(resolved).toEqual({ ...preferences, rate: 1.5 })
  })

  it('works from the shipped defaults', () => {
    expect(resolveReadingSettings(DEFAULT_PREFERENCES).autoAdvance).toBe(true)
  })
})
