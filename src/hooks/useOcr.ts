import { useCallback, useRef, useState } from 'react'
import { createTesseractOcrService } from '../services/ocr/TesseractOcrService'
import type { OcrProgress } from '../services/ocr/ocrService'
import { languageLabel } from '../utils/language'
import { isAppError, toAppError } from '../utils/errors'

export interface OcrConsentRequest {
  language: string
  approximateBytes: number
}

export type OcrState =
  | { status: 'idle' }
  | { status: 'awaiting-consent'; request: OcrConsentRequest }
  | { status: 'recognizing'; progress: OcrProgress }
  | { status: 'error'; message: string }

/**
 * Drives OCR (PRD §13) for the current page. `ModelConsent.request` is a
 * plain Promise the service awaits — this hook is what actually resolves
 * that promise, bridging it to a consent prompt rendered from `state`
 * (`status: 'awaiting-consent'`) rather than a native `confirm()` dialog,
 * which would be both off-brand and untestable.
 */
export function useOcr() {
  const [state, setState] = useState<OcrState>({ status: 'idle' })
  const consentResolverRef = useRef<((approved: boolean) => void) | undefined>(undefined)

  const serviceRef = useRef<ReturnType<typeof createTesseractOcrService> | undefined>(undefined)
  serviceRef.current ??= createTesseractOcrService({
    consent: {
      request: (language, approximateBytes) =>
        new Promise<boolean>((resolve) => {
          consentResolverRef.current = resolve
          setState({ status: 'awaiting-consent', request: { language, approximateBytes } })
        }),
    },
  })

  const answerConsent = useCallback((approved: boolean) => {
    consentResolverRef.current?.(approved)
    consentResolverRef.current = undefined
  }, [])

  const recognize = useCallback(async (pageNumber: number, image: HTMLCanvasElement, languageCode: string) => {
    const service = serviceRef.current
    if (!service) return undefined

    setState({ status: 'recognizing', progress: { status: 'starting', progress: 0 } })

    try {
      const result = await service.recognize(image, languageCode, (progress) => {
        setState({ status: 'recognizing', progress })
      })
      setState({ status: 'idle' })
      return { ...result, pageNumber }
    } catch (cause) {
      // A cancelled consent prompt is not a failure worth alarming over —
      // just return to idle so the user can try again or move on.
      if (isAppError(cause) && cause.code === 'ocr-cancelled') {
        setState({ status: 'idle' })
        return undefined
      }
      const error = toAppError(cause, 'ocr-failed', `Text recognition failed for "${languageLabel(languageCode)}".`)
      setState({ status: 'error', message: error.message })
      throw error
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, recognize, answerConsent, reset }
}
