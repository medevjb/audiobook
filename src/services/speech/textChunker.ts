import type { SpeechChunk } from './types'

/**
 * Text normalization and chunking (PRD §15).
 *
 * A whole page must never become one utterance: browsers truncate or drop long
 * utterances, pause/resume gets unreliable, and there is nothing to highlight.
 * Chunk boundaries are chosen in the PRD's priority order — paragraph, then
 * sentence, then a safe character-length fallback.
 */

/**
 * Conservative default. Chrome in particular becomes unreliable with long
 * utterances, and shorter chunks make stop/pause feel immediate.
 */
export const DEFAULT_MAX_CHUNK_CHARS = 220

/** Terminators that end a sentence on their own — no following space required. */
const HARD_TERMINATORS = new Set(['。', '！', '？', '…', '।', '॥', '৷', '؟', '۔'])

/**
 * Terminators that end a sentence only when whitespace or the paragraph end
 * follows, so "3.14" and "e.g." do not split mid-number or mid-abbreviation.
 */
const SOFT_TERMINATORS = new Set(['.', '!', '?'])

/** Closing punctuation that belongs to the sentence it trails. */
const CLOSERS = new Set(['"', "'", '”', '’', ')', ']', '»', '」', '』'])

interface Range {
  start: number
  end: number
}

function isWhitespace(char: string): boolean {
  return char !== '' && /\s/.test(char)
}

/**
 * Collapses the artifacts of PDF text extraction into readable prose
 * (PRD §11): line wrapping inside a paragraph becomes a space, blank lines
 * stay as paragraph breaks, and words hyphenated across a line break are
 * rejoined.
 */
export function normalizeText(raw: string): string {
  if (raw === '') return ''
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\u00AD/g, '')
    .replace(/(\p{L})-\n(?=\p{L})/gu, '$1')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph !== '')
    .join('\n\n')
}

/** Paragraph spans of already-normalized text. */
function paragraphRanges(text: string): Range[] {
  const ranges: Range[] = []
  const separator = '\n\n'
  let start = 0
  let found = text.indexOf(separator)
  while (found !== -1) {
    ranges.push({ start, end: found })
    start = found + separator.length
    found = text.indexOf(separator, start)
  }
  ranges.push({ start, end: text.length })
  return ranges.filter((range) => range.end > range.start)
}

/**
 * Sentence spans within one paragraph. Returns spans without surrounding
 * whitespace so offsets map straight onto the normalized text for highlighting.
 */
function sentenceRanges(text: string, paragraph: Range): Range[] {
  const ranges: Range[] = []
  let start = paragraph.start
  let index = paragraph.start

  const consumeTrailing = (from: number, terminators: Set<string>): number => {
    let end = from
    while (end < paragraph.end) {
      const char = text.charAt(end)
      if (!terminators.has(char) && !CLOSERS.has(char)) break
      end += 1
    }
    return end
  }

  const skipWhitespace = (from: number): number => {
    let next = from
    while (next < paragraph.end && isWhitespace(text.charAt(next))) next += 1
    return next
  }

  while (index < paragraph.end) {
    const char = text.charAt(index)
    const isHard = HARD_TERMINATORS.has(char)
    const isSoft = SOFT_TERMINATORS.has(char)

    if (!isHard && !isSoft) {
      index += 1
      continue
    }

    const end = consumeTrailing(index + 1, isHard ? HARD_TERMINATORS : SOFT_TERMINATORS)
    // A soft terminator only closes a sentence at a whitespace or paragraph edge.
    if (isSoft && end < paragraph.end && !isWhitespace(text.charAt(end))) {
      index = end
      continue
    }

    ranges.push({ start, end })
    start = skipWhitespace(end)
    index = start
  }

  if (start < paragraph.end) ranges.push({ start, end: paragraph.end })
  return ranges
}

/**
 * Last-resort split for a single sentence longer than the limit. Prefers a
 * whitespace boundary; scripts that do not space their words (Chinese,
 * Japanese) fall back to a hard character cut.
 */
function characterSplit(text: string, range: Range, maxChars: number): Range[] {
  const ranges: Range[] = []
  let start = range.start

  while (range.end - start > maxChars) {
    let end = start + maxChars
    for (let probe = end; probe > start; probe -= 1) {
      if (isWhitespace(text.charAt(probe))) {
        end = probe
        break
      }
    }
    ranges.push({ start, end })
    start = end
    while (start < range.end && isWhitespace(text.charAt(start))) start += 1
  }

  if (start < range.end) ranges.push({ start, end: range.end })
  return ranges
}

/** Packs whole sentences into chunks up to `maxChars`, preserving order. */
function chunkParagraph(text: string, paragraph: Range, maxChars: number): Range[] {
  if (paragraph.end - paragraph.start <= maxChars) return [paragraph]

  const ranges: Range[] = []
  let current: Range | undefined

  for (const sentence of sentenceRanges(text, paragraph)) {
    if (sentence.end - sentence.start > maxChars) {
      if (current) {
        ranges.push(current)
        current = undefined
      }
      ranges.push(...characterSplit(text, sentence, maxChars))
      continue
    }

    if (current && sentence.end - current.start <= maxChars) {
      current = { start: current.start, end: sentence.end }
    } else {
      if (current) ranges.push(current)
      current = sentence
    }
  }

  if (current) ranges.push(current)
  return ranges
}

export interface ChunkOptions {
  maxChars?: number
}

/**
 * Splits page text into ordered, speakable chunks.
 *
 * Offsets refer to the *normalized* text, which is also what the reading panel
 * renders — so a chunk index is enough to highlight what is being spoken (§23).
 */
export function chunkText(raw: string, options: ChunkOptions = {}): SpeechChunk[] {
  const maxChars = Math.max(1, Math.floor(options.maxChars ?? DEFAULT_MAX_CHUNK_CHARS))
  const text = normalizeText(raw)
  if (text === '') return []

  const chunks: SpeechChunk[] = []
  for (const paragraph of paragraphRanges(text)) {
    for (const range of chunkParagraph(text, paragraph, maxChars)) {
      const value = text.slice(range.start, range.end)
      if (value.trim() === '') continue
      chunks.push({
        index: chunks.length,
        text: value,
        startOffset: range.start,
        endOffset: range.end,
      })
    }
  }
  return chunks
}
