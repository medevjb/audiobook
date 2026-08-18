import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReaderStore } from '../store/readerStore'
import { useSpeechStore } from '../store/speechStore'
import type { PageText } from '../types/reader'
import { useSpeech } from './useSpeech'

/**
 * Drives useSpeech() through a real BrowserTTSProvider against the same
 * controllable fake Web Speech API used in BrowserTTSProvider.test.ts, so
 * this exercises the chunk-sequencing logic (PRD §15) end to end rather than
 * mocking it away.
 */

class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onstart: (() => void) | null = null
  onboundary: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

let speakSpy: ReturnType<typeof vi.fn>
let cancelSpy: ReturnType<typeof vi.fn>
let pauseSpy: ReturnType<typeof vi.fn>
let resumeSpy: ReturnType<typeof vi.fn>

function setPageText(overrides: Partial<PageText>) {
  useReaderStore.setState({
    pageText: { pageNumber: 1, text: '', source: 'pdf', isLikelyScanned: false, ...overrides },
  })
}

beforeEach(() => {
  speakSpy = vi.fn()
  cancelSpy = vi.fn()
  pauseSpy = vi.fn()
  resumeSpy = vi.fn()

  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [],
    speak: speakSpy,
    cancel: cancelSpy,
    pause: pauseSpy,
    resume: resumeSpy,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })

  useReaderStore.getState().reset()
  useSpeechStore.getState().reset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function latestUtterance(): FakeUtterance {
  return speakSpy.mock.calls.at(-1)?.[0] as FakeUtterance
}

describe('useSpeech chunk sequencing (PRD §15)', () => {
  it('does nothing when there is no page text', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.play())
    expect(speakSpy).not.toHaveBeenCalled()
  })

  it('speaks a short page as a single chunk and stops when it ends', () => {
    setPageText({ text: 'One short sentence.' })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    expect(speakSpy).toHaveBeenCalledTimes(1)
    expect(useSpeechStore.getState().playback).toBe('playing')

    act(() => latestUtterance().onend?.())
    expect(speakSpy).toHaveBeenCalledTimes(1)
    expect(useSpeechStore.getState().playback).toBe('stopped')
  })

  it('advances to the next chunk only after the current one ends', () => {
    // Long enough to guarantee the chunker splits it into more than one piece.
    const longText = 'Sentence number one is here. '.repeat(20)
    setPageText({ text: longText })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    const chunkCount = useSpeechStore.getState().chunks.length
    expect(chunkCount).toBeGreaterThan(1)
    expect(speakSpy).toHaveBeenCalledTimes(1)

    act(() => latestUtterance().onend?.())
    expect(speakSpy).toHaveBeenCalledTimes(2)
    expect(useSpeechStore.getState().currentChunkIndex).toBe(1)
    expect(useSpeechStore.getState().playback).toBe('playing')
  })

  it('speaks every chunk in order and stops after the last one', () => {
    setPageText({ text: 'First. Second. Third.' })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    const total = useSpeechStore.getState().chunks.length

    for (let i = 0; i < total; i += 1) {
      expect(useSpeechStore.getState().playback).toBe('playing')
      act(() => latestUtterance().onend?.())
    }

    expect(speakSpy).toHaveBeenCalledTimes(total)
    expect(useSpeechStore.getState().playback).toBe('stopped')
  })

  it('stop() halts the queue permanently, even if a stale onEnd arrives late', () => {
    const longText = 'Sentence number one is here. '.repeat(20)
    setPageText({ text: longText })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    const firstUtterance = latestUtterance()
    expect(speakSpy).toHaveBeenCalledTimes(1)

    act(() => result.current.stop())
    expect(cancelSpy).toHaveBeenCalledOnce()
    expect(useSpeechStore.getState().playback).toBe('stopped')

    // The cancelled utterance's own end/error handlers can still fire after
    // stop() returns — this must not resurrect the queue.
    act(() => {
      firstUtterance.onerror?.({ error: 'canceled' })
      firstUtterance.onend?.()
    })
    expect(speakSpy).toHaveBeenCalledTimes(1)
    expect(useSpeechStore.getState().playback).toBe('stopped')
  })

  it('starting a new play() supersedes a stale onEnd from the previous run', () => {
    setPageText({ text: 'First page sentence.' })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    const firstUtterance = latestUtterance()

    setPageText({ text: 'Second page sentence.' })
    act(() => result.current.play())
    expect(speakSpy).toHaveBeenCalledTimes(2)

    // The first run's utterance finishing late must not queue a third chunk
    // from the (now irrelevant) first run.
    act(() => firstUtterance.onend?.())
    expect(speakSpy).toHaveBeenCalledTimes(2)
  })

  it('stops the queue and surfaces a genuine synthesis failure', () => {
    setPageText({ text: 'One short sentence.' })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    act(() => latestUtterance().onerror?.({ error: 'synthesis-failed' }))

    expect(useSpeechStore.getState().playback).toBe('stopped')
    expect(useReaderStore.getState().error).toMatchObject({ code: 'speech-failed' })
  })

  it('treats a page with no readable text as nothing to play', () => {
    setPageText({ text: '', isLikelyScanned: true })
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.play())
    expect(speakSpy).not.toHaveBeenCalled()
  })
})

describe('useSpeech pause and resume (PRD §16)', () => {
  it('pauses the engine in place without touching the chunk queue', () => {
    const longText = 'Sentence number one is here. '.repeat(20)
    setPageText({ text: longText })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    act(() => result.current.pause())

    expect(pauseSpy).toHaveBeenCalledOnce()
    expect(useSpeechStore.getState().playback).toBe('paused')
    // Pausing must not cancel the utterance — that would drop the queue.
    expect(cancelSpy).not.toHaveBeenCalled()
  })

  it('resumes the same utterance rather than restarting the chunk', () => {
    setPageText({ text: 'One short sentence.' })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    act(() => result.current.pause())
    act(() => result.current.resume())

    expect(resumeSpy).toHaveBeenCalledOnce()
    expect(useSpeechStore.getState().playback).toBe('playing')
    // Still the one utterance from play() — resume did not speak again.
    expect(speakSpy).toHaveBeenCalledTimes(1)
  })

  it('does nothing when pausing while stopped', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.pause())
    expect(pauseSpy).not.toHaveBeenCalled()
    expect(useSpeechStore.getState().playback).toBe('stopped')
  })

  it('does nothing when resuming while not paused', () => {
    setPageText({ text: 'One short sentence.' })
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.play())

    act(() => result.current.resume())
    expect(resumeSpy).not.toHaveBeenCalled()
    expect(useSpeechStore.getState().playback).toBe('playing')
  })

  it('the paused chunk still advances the queue normally once resumed', () => {
    const longText = 'Sentence number one is here. '.repeat(20)
    setPageText({ text: longText })
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.play())
    act(() => result.current.pause())
    act(() => result.current.resume())
    act(() => latestUtterance().onend?.())

    expect(speakSpy).toHaveBeenCalledTimes(2)
  })
})
