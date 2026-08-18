import { createWorker, OEM } from 'tesseract.js'
import { isLikelyScanned } from '../pdf/textExtractor'
import { normalizeText } from '../speech/textChunker'
import type { PageText } from '../../types/reader'
import { AppError } from '../../utils/errors'
import { toTesseractLanguage } from './ocrService'
import type { OcrProgress, OcrService, OcrServiceOptions } from './ocrService'

/**
 * Self-hosted engine assets. Tesseract.js defaults `workerPath`/`corePath` to
 * a CDN — that would make the OCR *engine itself* an unconsented network
 * request, not just the language model. Both are vendored locally
 * (`public/vendor/`) so only the per-language model (gated by consent below)
 * ever touches the network.
 *
 * One core variant (plain WASM, not SIMD): tesseract.js otherwise picks
 * between several variants at runtime based on feature detection, which
 * means serving all of them locally. Trading a little recognition speed for
 * a single, simple, always-compatible file is the right call for V1 — PRD
 * §54 ranks OCR near the bottom of engineering priorities.
 */
const WORKER_PATH = `${import.meta.env.BASE_URL}vendor/tesseract-worker/worker.min.js`
const CORE_PATH = `${import.meta.env.BASE_URL}vendor/tesseract-core/tesseract-core-lstm.wasm.js`

/**
 * Rough compressed traineddata sizes in MB, for the consent prompt (PRD §22
 * pattern applied to OCR: never let the user download blind). Real sizes
 * vary by Tesseract release; these are conservative estimates, not a promise.
 */
const APPROX_MODEL_MB: Readonly<Record<string, number>> = {
  eng: 4,
  ben: 2,
  fra: 3,
  chi_sim: 12,
  spa: 3,
  deu: 3,
  hin: 3,
  ara: 2,
  jpn: 12,
  por: 3,
  ita: 3,
  kor: 6,
}

function approximateBytes(tesseractLang: string): number {
  const megabytes = APPROX_MODEL_MB[tesseractLang] ?? 8
  return megabytes * 1024 * 1024
}

/**
 * Tesseract.js implementation of `OcrService` (PRD §13).
 *
 * `isModelCached` tracks languages loaded *this session*, not Tesseract's own
 * on-disk cache — Tesseract doesn't expose a way to check that without
 * attempting a load. Worst case, a language already cached from a previous
 * session gets one redundant consent prompt; it never re-downloads anything
 * the browser already has, since Tesseract's own cache still serves the
 * fetch. Asking slightly more often is the safe side of "never assume".
 */
export function createTesseractOcrService(options: OcrServiceOptions): OcrService {
  const loadedLanguages = new Set<string>()
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined
  let workerLanguage: string | undefined

  async function ensureWorker(tesseractLang: string, onProgress?: (progress: OcrProgress) => void) {
    if (worker && workerLanguage === tesseractLang) return worker

    if (worker) {
      await worker.terminate()
      worker = undefined
    }

    worker = await createWorker(tesseractLang, OEM.LSTM_ONLY, {
      workerPath: WORKER_PATH,
      corePath: CORE_PATH,
      langPath: options.modelBaseUrl,
      logger: (message) => onProgress?.({ status: message.status, progress: message.progress }),
    })
    workerLanguage = tesseractLang
    loadedLanguages.add(tesseractLang)
    return worker
  }

  return {
    async isModelCached(languageCode) {
      const tesseractLang = toTesseractLanguage(languageCode)
      return tesseractLang ? loadedLanguages.has(tesseractLang) : false
    },

    async recognize(image, languageCode, onProgress): Promise<PageText> {
      const tesseractLang = toTesseractLanguage(languageCode)
      if (!tesseractLang) {
        throw new AppError('ocr-language-unsupported', 'Text recognition is not available for this language.')
      }

      if (!loadedLanguages.has(tesseractLang)) {
        const approved = await options.consent.request(languageCode, approximateBytes(tesseractLang))
        if (!approved) {
          throw new AppError('ocr-cancelled', 'Text recognition was cancelled.')
        }
      }

      try {
        const activeWorker = await ensureWorker(tesseractLang, onProgress)
        const result = await activeWorker.recognize(image)
        const text = normalizeText(result.data.text)
        return {
          // The caller knows which page this was run against; the engine does not.
          pageNumber: 0,
          text,
          source: 'ocr',
          isLikelyScanned: isLikelyScanned(text),
        }
      } catch (cause) {
        if (cause instanceof AppError) throw cause
        throw new AppError('ocr-failed', 'Text recognition failed on this page.', { cause })
      }
    },

    async terminate() {
      if (worker) {
        await worker.terminate()
        worker = undefined
        workerLanguage = undefined
      }
    },
  }
}
