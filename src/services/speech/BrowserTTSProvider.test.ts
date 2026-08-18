import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserTTSProvider } from './BrowserTTSProvider'

/**
 * jsdom implements no part of the Web Speech API, so the browser global is
 * replaced with a small controllable fake that mirrors just the shape
 * BrowserTTSProvider depends on. Utterance lifecycle events are fired
 * manually here to simulate what the real engine would do.
 */

class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  pitch = 1
  volume = 1
  voice: FakeVoice | undefined
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onboundary: ((event: { charIndex: number }) => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

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

const voices: FakeVoice[] = [
  fakeVoice({ voiceURI: 'david', name: 'Microsoft David', lang: 'en-US', default: true }),
  fakeVoice({ voiceURI: 'bangla', name: 'Google বাংলা', lang: 'bn-BD' }),
]

let speakSpy: ReturnType<typeof vi.fn>
let cancelSpy: ReturnType<typeof vi.fn>
let pauseSpy: ReturnType<typeof vi.fn>
let resumeSpy: ReturnType<typeof vi.fn>
let voicesChangedHandlers: Array<() => void>

beforeEach(() => {
  speakSpy = vi.fn()
  cancelSpy = vi.fn()
  pauseSpy = vi.fn()
  resumeSpy = vi.fn()
  voicesChangedHandlers = []

  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices,
    speak: speakSpy,
    cancel: cancelSpy,
    pause: pauseSpy,
    resume: resumeSpy,
    addEventListener: (_event: string, handler: () => void) => voicesChangedHandlers.push(handler),
    removeEventListener: (_event: string, handler: () => void) => {
      voicesChangedHandlers = voicesChangedHandlers.filter((existing) => existing !== handler)
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BrowserTTSProvider', () => {
  it('reports support based on the browser global', () => {
    expect(new BrowserTTSProvider().isSupported()).toBe(true)
    vi.unstubAllGlobals()
    expect(new BrowserTTSProvider().isSupported()).toBe(false)
  })

  it('maps engine voices to the provider-neutral shape (PRD §20)', () => {
    const mapped = new BrowserTTSProvider().getVoices()
    expect(mapped).toEqual([
      { voiceURI: 'david', name: 'Microsoft David', lang: 'en-US', localService: true, isDefault: true },
      { voiceURI: 'bangla', name: 'Google বাংলা', lang: 'bn-BD', localService: true, isDefault: false },
    ])
  })

  it('returns no voices when unsupported instead of throwing', () => {
    vi.unstubAllGlobals()
    expect(new BrowserTTSProvider().getVoices()).toEqual([])
  })

  it('notifies subscribers when the engine reports voiceschanged, and unsubscribes cleanly', () => {
    const provider = new BrowserTTSProvider()
    const listener = vi.fn()
    const unsubscribe = provider.onVoicesChanged(listener)

    expect(voicesChangedHandlers).toHaveLength(1)
    voicesChangedHandlers[0]()
    expect(listener).toHaveBeenCalledWith(provider.getVoices())

    unsubscribe()
    expect(voicesChangedHandlers).toHaveLength(0)
  })

  it('speaks with the requested rate, language and voice', () => {
    const provider = new BrowserTTSProvider()
    provider.speak('Hello world', { lang: 'en-US', voiceURI: 'david', rate: 1.25 })

    expect(speakSpy).toHaveBeenCalledTimes(1)
    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance
    expect(utterance.text).toBe('Hello world')
    expect(utterance.lang).toBe('en-US')
    expect(utterance.rate).toBe(1.25)
    expect(utterance.voice?.voiceURI).toBe('david')
  })

  it('fires onStart and onEnd as the engine reports them', () => {
    const provider = new BrowserTTSProvider()
    const onStart = vi.fn()
    const onEnd = vi.fn()
    provider.speak('Hello', { lang: 'en', rate: 1 }, { onStart, onEnd })

    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance
    utterance.onstart?.()
    utterance.onend?.()

    expect(onStart).toHaveBeenCalledOnce()
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('rejects an unknown voice without ever calling the engine', () => {
    const provider = new BrowserTTSProvider()
    const onError = vi.fn()
    provider.speak('Hello', { lang: 'en', voiceURI: 'nonexistent', rate: 1 }, { onError })

    expect(speakSpy).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith({
      code: 'voice-unavailable',
      message: 'Voice "nonexistent" is not available.',
    })
  })

  it('does not surface stop() as an error (contract: stop() must not invoke onError)', () => {
    const provider = new BrowserTTSProvider()
    const onError = vi.fn()
    provider.speak('Hello', { lang: 'en', rate: 1 }, { onError })
    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance

    provider.stop()
    expect(cancelSpy).toHaveBeenCalledOnce()

    // Simulates the browser's own reaction to cancel() reaching the utterance late.
    utterance.onerror?.({ error: 'canceled' })
    expect(onError).not.toHaveBeenCalled()
  })

  it('does not surface being interrupted by the next utterance as an error', () => {
    const provider = new BrowserTTSProvider()
    const onError = vi.fn()
    provider.speak('First', { lang: 'en', rate: 1 }, { onError })
    const first = speakSpy.mock.calls[0][0] as FakeUtterance

    provider.speak('Second', { lang: 'en', rate: 1 })
    first.onerror?.({ error: 'interrupted' })

    expect(onError).not.toHaveBeenCalled()
  })

  it('surfaces a genuine synthesis failure', () => {
    const provider = new BrowserTTSProvider()
    const onError = vi.fn()
    provider.speak('Hello', { lang: 'en', rate: 1 }, { onError })
    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance

    utterance.onerror?.({ error: 'synthesis-failed' })

    expect(onError).toHaveBeenCalledWith({
      code: 'synthesis-failed',
      message: 'synthesis-failed',
      cause: { error: 'synthesis-failed' },
    })
  })

  it('reports onBoundary events for chunk highlighting (PRD §23)', () => {
    const provider = new BrowserTTSProvider()
    const onBoundary = vi.fn()
    provider.speak('Hello world', { lang: 'en', rate: 1 }, { onBoundary })
    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance

    utterance.onboundary?.({ charIndex: 6 })
    expect(onBoundary).toHaveBeenCalledWith(6)
  })

  it('delegates pause and resume to the engine', () => {
    const provider = new BrowserTTSProvider()
    provider.pause()
    provider.resume()
    expect(pauseSpy).toHaveBeenCalledOnce()
    expect(resumeSpy).toHaveBeenCalledOnce()
  })

  it('is a safe no-op when unsupported', () => {
    vi.unstubAllGlobals()
    const provider = new BrowserTTSProvider()
    expect(() => {
      provider.pause()
      provider.resume()
      provider.stop()
    }).not.toThrow()
  })
})
