import type { PageText } from '../../types/reader'
import { normalizeText } from '../speech/textChunker'

/**
 * Turns PDF.js text items into readable prose (PRD §11).
 *
 * Structurally typed rather than importing PDF.js types, so this logic is unit
 * testable without loading the library or a real document.
 */
export interface TextItemLike {
  str: string
  /** PDF.js sets this when the item ends a line. */
  hasEOL?: boolean
}

/**
 * Below this many characters a page is treated as having no usable text layer
 * and becomes an OCR candidate (PRD §12). Deliberately small: page numbers and
 * running headers alone should still count as "scanned".
 */
export const MIN_USEFUL_TEXT_LENGTH = 24

/**
 * Joins text items in reading order. PDF.js emits fragments that may already
 * end with a space, so joins are only inserted where one is missing.
 */
export function itemsToText(items: readonly TextItemLike[]): string {
  let out = ''
  for (const item of items) {
    if (item.str !== '') {
      const needsSpace = out !== '' && !/\s$/.test(out) && !/^\s/.test(item.str)
      out += (needsSpace ? ' ' : '') + item.str
    }
    if (item.hasEOL) out += '\n'
  }
  return normalizeText(out)
}

/** PRD §12: no usable text, or extremely little of it. */
export function isLikelyScanned(text: string): boolean {
  return text.trim().length < MIN_USEFUL_TEXT_LENGTH
}

export function toPageText(pageNumber: number, items: readonly TextItemLike[]): PageText {
  const text = itemsToText(items)
  return {
    pageNumber,
    text,
    source: 'pdf',
    isLikelyScanned: isLikelyScanned(text),
  }
}
