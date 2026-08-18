import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const recognizeMock = vi.fn()
const createTesseractOcrServiceMock = vi.fn()

vi.mock('../services/ocr/TesseractOcrService', () => ({
  createTesseractOcrService: (...args: unknown[]) => createTesseractOcrServiceMock(...args),
}))

const { useOcr } = await import('./useOcr')

beforeEach(() => {
  recognizeMock.mockReset()
  createTesseractOcrServiceMock.mockReset()
  createTesseractOcrServiceMock.mockImplementation((options) => ({
    isModelCached: vi.fn().mockResolvedValue(false),
    recognize: (image: unknown, language: string, onProgress: (p: unknown) => void) =>
      recognizeMock(options, image, language, onProgress),
    terminate: vi.fn(),
  }))
})

describe('useOcr (PRD §13)', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useOcr())
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('moves to recognizing while the service call is in flight', async () => {
    let resolveRecognize: (value: unknown) => void = () => undefined
    recognizeMock.mockReturnValue(new Promise((resolve) => { resolveRecognize = resolve }))
    const { result } = renderHook(() => useOcr())

    let pending!: Promise<unknown>
    act(() => {
      pending = result.current.recognize(3, document.createElement('canvas'), 'en')
    })
    await waitFor(() => expect(result.current.state.status).toBe('recognizing'))

    act(() => resolveRecognize({ pageNumber: 0, text: 'hi', source: 'ocr', isLikelyScanned: false }))
    await act(async () => {
      await pending
    })
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('attaches the requested page number to the result (the service does not know it)', async () => {
    recognizeMock.mockResolvedValue({ pageNumber: 0, text: 'hi', source: 'ocr', isLikelyScanned: false })
    const { result } = renderHook(() => useOcr())

    let outcome
    await act(async () => {
      outcome = await result.current.recognize(42, document.createElement('canvas'), 'en')
    })
    expect(outcome).toMatchObject({ pageNumber: 42, text: 'hi' })
  })

  it('bridges consent to state, and resolves the service’s promise once answered', async () => {
    const { result } = renderHook(() => useOcr())
    // The mocked service calls back into the real ModelConsent.request the
    // hook registered with createTesseractOcrService — invoke it directly to
    // simulate what TesseractOcrService really does before recognizing.
    recognizeMock.mockImplementation(async (options) => {
      const approved = await options.consent.request('bn', 2 * 1024 * 1024)
      return approved
        ? { pageNumber: 0, text: 'ok', source: 'ocr', isLikelyScanned: false }
        : Promise.reject(new Error('cancelled'))
    })

    let pending!: Promise<unknown>
    act(() => {
      pending = result.current.recognize(1, document.createElement('canvas'), 'bn')
    })

    await waitFor(() => expect(result.current.state.status).toBe('awaiting-consent'))
    expect(result.current.state).toMatchObject({
      status: 'awaiting-consent',
      request: { language: 'bn', approximateBytes: 2 * 1024 * 1024 },
    })

    act(() => result.current.answerConsent(true))
    await act(async () => {
      await pending
    })
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('returns to idle without an error banner when the user declines consent', async () => {
    recognizeMock.mockImplementation(async (options) => {
      const approved = await options.consent.request('bn', 1024)
      if (!approved) {
        const { AppError } = await import('../utils/errors')
        throw new AppError('ocr-cancelled', 'Text recognition was cancelled.')
      }
      return { pageNumber: 0, text: 'ok', source: 'ocr', isLikelyScanned: false }
    })

    const { result } = renderHook(() => useOcr())
    let pending!: Promise<unknown>
    act(() => {
      pending = result.current.recognize(1, document.createElement('canvas'), 'bn')
    })
    await waitFor(() => expect(result.current.state.status).toBe('awaiting-consent'))

    act(() => result.current.answerConsent(false))
    let outcome
    await act(async () => {
      outcome = await pending
    })

    expect(outcome).toBeUndefined()
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('surfaces a genuine failure as an error state and rethrows', async () => {
    const { AppError } = await import('../utils/errors')
    recognizeMock.mockRejectedValue(new AppError('ocr-failed', 'Text recognition failed on this page.'))
    const { result } = renderHook(() => useOcr())

    await act(async () => {
      await expect(result.current.recognize(1, document.createElement('canvas'), 'en')).rejects.toMatchObject({
        code: 'ocr-failed',
      })
    })
    expect(result.current.state).toEqual({ status: 'error', message: 'Text recognition failed on this page.' })
  })

  it('reset() returns to idle from any state', async () => {
    recognizeMock.mockImplementation(
      (options) => new Promise(() => { void options }), // never resolves
    )
    const { result } = renderHook(() => useOcr())

    act(() => {
      void result.current.recognize(1, document.createElement('canvas'), 'en')
    })
    await waitFor(() => expect(result.current.state.status).toBe('recognizing'))

    act(() => result.current.reset())
    expect(result.current.state).toEqual({ status: 'idle' })
  })
})
