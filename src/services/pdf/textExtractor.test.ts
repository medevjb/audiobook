import { describe, expect, it } from 'vitest'
import { MIN_USEFUL_TEXT_LENGTH, isLikelyScanned, itemsToText, toPageText } from './textExtractor'

describe('itemsToText (PRD §11)', () => {
  it('joins items in reading order with a single space between them', () => {
    expect(itemsToText([{ str: 'Hello' }, { str: 'world' }])).toBe('Hello world')
  })

  it('does not duplicate a space PDF.js already included on an item', () => {
    expect(itemsToText([{ str: 'Hello ' }, { str: 'world' }])).toBe('Hello world')
    expect(itemsToText([{ str: 'Hello' }, { str: ' world' }])).toBe('Hello world')
  })

  it('skips empty items without inserting a stray space', () => {
    expect(itemsToText([{ str: 'Hello' }, { str: '' }, { str: 'world' }])).toBe('Hello world')
  })

  it('treats hasEOL as a line wrap that still reads as one paragraph', () => {
    // A single hard line break inside running text is not a paragraph break —
    // normalizeText collapses it to a space, matching how a wrapped line in
    // print is meant to be read.
    expect(itemsToText([{ str: 'first', hasEOL: true }, { str: 'second' }])).toBe('first second')
  })

  it('returns an empty string for no items or only empty items', () => {
    expect(itemsToText([])).toBe('')
    expect(itemsToText([{ str: '' }, { str: '' }])).toBe('')
  })

  it('preserves multiple items forming a full sentence across a page', () => {
    const items = [
      { str: 'The', hasEOL: false },
      { str: 'quick', hasEOL: false },
      { str: 'brown', hasEOL: true },
      { str: 'fox', hasEOL: false },
      { str: 'jumps.', hasEOL: true },
    ]
    expect(itemsToText(items)).toBe('The quick brown fox jumps.')
  })
})

describe('isLikelyScanned (PRD §12)', () => {
  it('flags empty text as scanned', () => {
    expect(isLikelyScanned('')).toBe(true)
  })

  it('flags text shorter than the threshold as scanned', () => {
    expect(isLikelyScanned('Page 42')).toBe(true)
  })

  it('does not flag ordinary page text as scanned', () => {
    expect(isLikelyScanned('This is a full paragraph of real, extracted body text.')).toBe(false)
  })

  it('is exact at the threshold boundary', () => {
    const atThreshold = 'x'.repeat(MIN_USEFUL_TEXT_LENGTH)
    const belowThreshold = 'x'.repeat(MIN_USEFUL_TEXT_LENGTH - 1)
    expect(isLikelyScanned(atThreshold)).toBe(false)
    expect(isLikelyScanned(belowThreshold)).toBe(true)
  })

  it('trims whitespace before measuring', () => {
    expect(isLikelyScanned('   \n\n   ')).toBe(true)
  })
})

describe('toPageText', () => {
  it('builds a PDF-sourced PageText with the right shape', () => {
    const page = toPageText(3, [{ str: 'This is a full paragraph of real extracted text.' }])
    expect(page).toEqual({
      pageNumber: 3,
      text: 'This is a full paragraph of real extracted text.',
      source: 'pdf',
      isLikelyScanned: false,
    })
  })

  it('marks a page with no usable text as likely scanned', () => {
    const page = toPageText(7, [])
    expect(page.isLikelyScanned).toBe(true)
    expect(page.text).toBe('')
  })
})
