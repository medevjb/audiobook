import { describe, expect, it } from 'vitest'
import type { Voice } from '../services/speech/types'
import {
  allVoiceLanguages,
  baseLanguageCode,
  filterVoicesByLanguage,
  formatVoiceLabel,
  hasVoiceForLanguage,
  pickDefaultVoice,
  prioritizeVoicesByLanguage,
} from './language'

function voice(partial: Partial<Voice> & Pick<Voice, 'voiceURI' | 'lang'>): Voice {
  return { name: partial.voiceURI, localService: true, isDefault: false, ...partial }
}

const voices: Voice[] = [
  voice({ voiceURI: 'uk-female', name: 'Google UK English Female', lang: 'en-GB' }),
  voice({ voiceURI: 'david', name: 'Microsoft David', lang: 'en-US', isDefault: true }),
  voice({ voiceURI: 'bangla', name: 'Google বাংলা', lang: 'bn-BD' }),
  voice({ voiceURI: 'amelie', name: 'Amélie', lang: 'fr_CA', localService: false }),
]

describe('baseLanguageCode', () => {
  it('reduces a tag to its primary subtag regardless of case or separator', () => {
    expect(baseLanguageCode('en-GB')).toBe('en')
    expect(baseLanguageCode('ZH_CN')).toBe('zh')
    expect(baseLanguageCode('  bn  ')).toBe('bn')
    expect(baseLanguageCode('')).toBe('')
  })
})

describe('voice filtering (PRD §42)', () => {
  it('matches an exact language code', () => {
    expect(filterVoicesByLanguage(voices, 'bn').map((v) => v.voiceURI)).toEqual(['bangla'])
  })

  it('matches every region variant of a language', () => {
    expect(filterVoicesByLanguage(voices, 'en').map((v) => v.voiceURI)).toEqual(['uk-female', 'david'])
  })

  it('matches when the requested code itself carries a region', () => {
    expect(filterVoicesByLanguage(voices, 'en-AU').map((v) => v.voiceURI)).toEqual(['uk-female', 'david'])
  })

  it('returns nothing when no voice matches', () => {
    expect(filterVoicesByLanguage(voices, 'ja')).toEqual([])
    expect(hasVoiceForLanguage(voices, 'ja')).toBe(false)
  })

  it('handles an empty voice list', () => {
    expect(filterVoicesByLanguage([], 'en')).toEqual([])
    expect(hasVoiceForLanguage([], 'en')).toBe(false)
    expect(pickDefaultVoice([], 'en')).toBeUndefined()
  })

  it('keeps non-matching voices available but ranked last (PRD §22)', () => {
    const ordered = prioritizeVoicesByLanguage(voices, 'bn')
    expect(ordered[0].voiceURI).toBe('bangla')
    expect(ordered).toHaveLength(voices.length)
  })
})

describe('pickDefaultVoice', () => {
  it('prefers the engine default among matching voices', () => {
    expect(pickDefaultVoice(voices, 'en')?.voiceURI).toBe('david')
  })

  it('prefers an on-device voice when none is marked default', () => {
    const remote = voice({ voiceURI: 'remote-bn', lang: 'bn-IN', localService: false })
    expect(pickDefaultVoice([remote, voices[2]], 'bn')?.voiceURI).toBe('bangla')
  })
})

describe('formatVoiceLabel', () => {
  it('renders the label shape from PRD §20', () => {
    expect(formatVoiceLabel(voices[0])).toBe('Google UK English Female — en-GB')
  })
})

describe('allVoiceLanguages', () => {
  it('reports every language the device can actually speak', () => {
    expect(allVoiceLanguages(voices).map((l) => l.code).sort()).toEqual(['bn', 'en', 'fr'])
  })

  it('labels known languages from the PRD table', () => {
    expect(allVoiceLanguages(voices).find((l) => l.code === 'bn')?.label).toBe('Bengali')
  })
})
