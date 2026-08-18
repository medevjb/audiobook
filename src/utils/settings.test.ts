import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, PLAYBACK_RATES, type UserPreferences } from '../types/preferences'
import { resolveReadingSettings, stepPlaybackRate } from './settings'

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

describe('stepPlaybackRate (PRD §19/§34)', () => {
  it('moves to the next faster rate', () => {
    expect(stepPlaybackRate(1.0, 1)).toBe(1.25)
  })

  it('moves to the next slower rate', () => {
    expect(stepPlaybackRate(1.0, -1)).toBe(0.75)
  })

  it('clamps at the fastest rate rather than wrapping', () => {
    expect(stepPlaybackRate(2.0, 1)).toBe(2.0)
  })

  it('clamps at the slowest rate rather than wrapping', () => {
    expect(stepPlaybackRate(0.5, -1)).toBe(0.5)
  })

  it('steps through every adjacent pair in the required rate list', () => {
    for (let i = 0; i < PLAYBACK_RATES.length - 1; i += 1) {
      expect(stepPlaybackRate(PLAYBACK_RATES[i], 1)).toBe(PLAYBACK_RATES[i + 1])
    }
  })

  it('falls back to 1.0x as the nearest step from an unrecognized rate', () => {
    expect(stepPlaybackRate(0.9, 1)).toBe(1.25)
    expect(stepPlaybackRate(0.9, -1)).toBe(0.75)
  })
})
