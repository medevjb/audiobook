import type { PageText } from '../../types/reader'

/**
 * OCR contract for scanned pages (PRD §13). Implementation lands in
 * Milestone 12; the interface exists now so the reader pipeline can be built
 * against it and text can arrive from either source (PRD §12).
 */

/** BCP-47 primary subtag -> Tesseract traineddata name. */
export const OCR_LANGUAGE_CODES: Readonly<Record<string, string>> = {
  en: 'eng',
  bn: 'ben',
  fr: 'fra',
  zh: 'chi_sim',
  es: 'spa',
  de: 'deu',
  hi: 'hin',
  ar: 'ara',
  ja: 'jpn',
  pt: 'por',
  it: 'ita',
  ko: 'kor',
}

/**
 * PRD §13 step 3 says "use the selected OCR language where available" —
 * undefined means this language has no model and the UI must say so rather
 * than silently recognizing as English.
 */
export function toTesseractLanguage(languageCode: string): string | undefined {
  const base = languageCode.trim().toLowerCase().replace(/_/g, '-').split('-')[0] ?? ''
  return OCR_LANGUAGE_CODES[base]
}

export interface OcrProgress {
  /** Engine phase, e.g. "recognizing text". Shown per PRD §13/§36. */
  status: string
  /** 0..1 */
  progress: number
}

/**
 * Tesseract fetches traineddata from a CDN on first use for a language. That
 * is the only outbound request in the product, it carries no book content, and
 * per PRD §3.3/Rule 8 it requires explicit consent before it happens.
 */
export interface ModelConsent {
  /** Asks the user to approve a one-time model download. Resolves false on decline. */
  request(language: string, approximateBytes: number): Promise<boolean>
}

export interface OcrService {
  /** True when the model for this language is already cached locally. */
  isModelCached(languageCode: string): Promise<boolean>
  /**
   * Recognizes text on a rendered page. Runs in a worker so the UI never
   * freezes (PRD §13), and one job at a time (PRD §38).
   */
  recognize(
    image: HTMLCanvasElement | Blob,
    languageCode: string,
    onProgress?: (progress: OcrProgress) => void,
  ): Promise<PageText>
  /** Releases the worker and its WASM heap. */
  terminate(): Promise<void>
}

export interface OcrServiceOptions {
  consent: ModelConsent
  /**
   * Where traineddata is fetched from. Overridable so the models can be
   * self-hosted later without touching call sites.
   */
  modelBaseUrl?: string
}
