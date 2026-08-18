import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelConsent } from './ocrService'

const recognizeMock = vi.fn()
const terminateMock = vi.fn()
const createWorkerMock = vi.fn()

vi.mock('tesseract.js', () => ({
  createWorker: (...args: unknown[]) => createWorkerMock(...args),
  OEM: { LSTM_ONLY: 'LSTM_ONLY' },
}))

// Imported after the mock so the module under test picks it up.
const { createTesseractOcrService } = await import('./TesseractOcrService')

function fakeConsent(decision: boolean): ModelConsent {
  return { request: vi.fn().mockResolvedValue(decision) }
}

beforeEach(() => {
  recognizeMock.mockReset()
  terminateMock.mockReset()
  createWorkerMock.mockReset()
  createWorkerMock.mockResolvedValue({ recognize: recognizeMock, terminate: terminateMock })
  recognizeMock.mockResolvedValue({ data: { text: 'Recognized text.' } })
})

describe('createTesseractOcrService (PRD §13)', () => {
  it('rejects a language with no OCR mapping before ever asking for consent', async () => {
    const consent = fakeConsent(true)
    const service = createTesseractOcrService({ consent })

    await expect(service.recognize(document.createElement('canvas'), 'xx')).rejects.toMatchObject({
      code: 'ocr-language-unsupported',
    })
    expect(consent.request).not.toHaveBeenCalled()
    expect(createWorkerMock).not.toHaveBeenCalled()
  })

  it('asks for consent before the first use of a language, with an approximate size', async () => {
    const consent = fakeConsent(true)
    const service = createTesseractOcrService({ consent })

    await service.recognize(document.createElement('canvas'), 'bn')
    expect(consent.request).toHaveBeenCalledWith('bn', expect.any(Number))
  })

  it('never loads the worker when consent is declined (PRD §3.3/Rule 8)', async () => {
    const consent = fakeConsent(false)
    const service = createTesseractOcrService({ consent })

    await expect(service.recognize(document.createElement('canvas'), 'bn')).rejects.toMatchObject({
      code: 'ocr-cancelled',
    })
    expect(createWorkerMock).not.toHaveBeenCalled()
  })

  it('loads the worker from self-hosted engine assets, never a CDN', async () => {
    const service = createTesseractOcrService({ consent: fakeConsent(true) })
    await service.recognize(document.createElement('canvas'), 'en')

    const [, , options] = createWorkerMock.mock.calls[0]
    expect(options.workerPath).toContain('/vendor/tesseract-worker/')
    expect(options.corePath).toContain('/vendor/tesseract-core/')
  })

  it('does not ask for consent again on a second call for the same language', async () => {
    const consent = fakeConsent(true)
    const service = createTesseractOcrService({ consent })

    await service.recognize(document.createElement('canvas'), 'en')
    await service.recognize(document.createElement('canvas'), 'en')

    expect(consent.request).toHaveBeenCalledOnce()
  })

  it('marks a language as cached only after a successful recognize', async () => {
    const service = createTesseractOcrService({ consent: fakeConsent(true) })
    expect(await service.isModelCached('en')).toBe(false)

    await service.recognize(document.createElement('canvas'), 'en')
    expect(await service.isModelCached('en')).toBe(true)
  })

  it('returns normalized recognized text', async () => {
    recognizeMock.mockResolvedValue({ data: { text: '  Hello   world.  \n\n' } })
    const service = createTesseractOcrService({ consent: fakeConsent(true) })

    const result = await service.recognize(document.createElement('canvas'), 'en')
    expect(result.text).toBe('Hello world.')
    expect(result.source).toBe('ocr')
  })

  it('flags empty recognition output as likely scanned, same as the PDF path', async () => {
    recognizeMock.mockResolvedValue({ data: { text: '   ' } })
    const service = createTesseractOcrService({ consent: fakeConsent(true) })

    const result = await service.recognize(document.createElement('canvas'), 'en')
    expect(result.isLikelyScanned).toBe(true)
  })

  it('wraps a worker failure as a typed OCR error', async () => {
    recognizeMock.mockRejectedValue(new Error('worker crashed'))
    const service = createTesseractOcrService({ consent: fakeConsent(true) })

    await expect(service.recognize(document.createElement('canvas'), 'en')).rejects.toMatchObject({
      code: 'ocr-failed',
    })
  })

  it('reuses the worker across pages in the same language', async () => {
    const service = createTesseractOcrService({ consent: fakeConsent(true) })
    await service.recognize(document.createElement('canvas'), 'en')
    await service.recognize(document.createElement('canvas'), 'en')

    expect(createWorkerMock).toHaveBeenCalledOnce()
    expect(recognizeMock).toHaveBeenCalledTimes(2)
  })

  it('terminates the underlying worker', async () => {
    const service = createTesseractOcrService({ consent: fakeConsent(true) })
    await service.recognize(document.createElement('canvas'), 'en')
    await service.terminate()

    expect(terminateMock).toHaveBeenCalledOnce()
  })

  it('is a safe no-op to terminate before any recognition happened', async () => {
    const service = createTesseractOcrService({ consent: fakeConsent(true) })
    await expect(service.terminate()).resolves.toBeUndefined()
    expect(terminateMock).not.toHaveBeenCalled()
  })
})
