import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PREFERENCES } from '../types/preferences'
import { usePreferencesStore } from '../store/preferencesStore'
import { useSpeechStore } from '../store/speechStore'
import { useVoices } from './useVoices'

interface FakeVoice {
  voiceURI: string
  name: string
  lang: string
  localService: boolean
  default: boolean
}

function fakeVoice(overrides: Partial<FakeVoice> & Pick<FakeVoice, 'voiceURI' | 'lang'>): FakeVoice {
  return { name: overrides.voiceURI, localService: true, default: false, ...overrides }
}

let voiceList: FakeVoice[]
let voicesChangedHandlers: Array<() => void>

function fireVoicesChanged() {
  for (const handler of voicesChangedHandlers) handler()
}

beforeEach(() => {
  voiceList = []
  voicesChangedHandlers = []

  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voiceList,
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    addEventListener: (_event: string, handler: () => void) => voicesChangedHandlers.push(handler),
    removeEventListener: (_event: string, handler: () => void) => {
      voicesChangedHandlers = voicesChangedHandlers.filter((existing) => existing !== handler)
    },
  })

  useSpeechStore.getState().reset()
  usePreferencesStore.setState({ preferences: { ...DEFAULT_PREFERENCES } })
})

afterEach(() => {
  // Unmount (which runs each hook's effect cleanup, including
  // removeEventListener against the stubbed speechSynthesis) must happen
  // before the stub is removed, not after.
  cleanup()
  vi.unstubAllGlobals()
})

describe('useVoices (PRD §20)', () => {
  it('starts with whatever the engine already has, even if empty', () => {
    renderHook(() => useVoices())
    expect(useSpeechStore.getState().voices).toEqual([])
    expect(useSpeechStore.getState().voicesLoaded).toBe(true)
  })

  it('picks up voices that arrive later via voiceschanged', async () => {
    renderHook(() => useVoices())

    voiceList = [fakeVoice({ voiceURI: 'david', lang: 'en-US', default: true })]
    fireVoicesChanged()

    await waitFor(() => {
      expect(useSpeechStore.getState().voices).toHaveLength(1)
    })
  })

  it('auto-picks a default voice for the current language once voices first load', async () => {
    usePreferencesStore.setState({ preferences: { ...DEFAULT_PREFERENCES, language: 'bn' } })
    renderHook(() => useVoices())

    voiceList = [
      fakeVoice({ voiceURI: 'david', lang: 'en-US', default: true }),
      fakeVoice({ voiceURI: 'bangla', lang: 'bn-BD' }),
    ]
    fireVoicesChanged()

    await waitFor(() => {
      expect(usePreferencesStore.getState().preferences.voiceURI).toBe('bangla')
    })
  })

  it('does not override a voice the user already chose', async () => {
    usePreferencesStore.setState({ preferences: { ...DEFAULT_PREFERENCES, voiceURI: 'chosen-by-user' } })
    renderHook(() => useVoices())

    voiceList = [fakeVoice({ voiceURI: 'david', lang: 'en-US', default: true })]
    fireVoicesChanged()

    await waitFor(() => {
      expect(useSpeechStore.getState().voices).toHaveLength(1)
    })
    expect(usePreferencesStore.getState().preferences.voiceURI).toBe('chosen-by-user')
  })

  it('leaves the preference unset when no voice matches the current language', async () => {
    usePreferencesStore.setState({ preferences: { ...DEFAULT_PREFERENCES, language: 'bn' } })
    renderHook(() => useVoices())

    voiceList = [fakeVoice({ voiceURI: 'david', lang: 'en-US', default: true })]
    fireVoicesChanged()

    await waitFor(() => {
      expect(useSpeechStore.getState().voices).toHaveLength(1)
    })
    expect(usePreferencesStore.getState().preferences.voiceURI).toBeUndefined()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useVoices())
    expect(voicesChangedHandlers).toHaveLength(1)
    unmount()
    expect(voicesChangedHandlers).toHaveLength(0)
  })
})
