import { describe, expect, it } from 'vitest'
import { DEFAULT_MAX_CHUNK_CHARS, chunkText, normalizeText } from './textChunker'

describe('normalizeText', () => {
  it('returns an empty string for empty input', () => {
    expect(normalizeText('')).toBe('')
    expect(normalizeText('   \n\n  ')).toBe('')
  })

  it('collapses duplicated whitespace (PRD §11)', () => {
    expect(normalizeText('Hello    world  \t there')).toBe('Hello world there')
  })

  it('joins a wrapped line into one paragraph but keeps paragraph breaks', () => {
    expect(normalizeText('first line\nsecond line\n\nnext paragraph')).toBe(
      'first line second line\n\nnext paragraph',
    )
  })

  it('rejoins words hyphenated across a line break', () => {
    expect(normalizeText('multi-\nlingual reading')).toBe('multilingual reading')
  })

  it('keeps a genuine hyphen that is not at a line break', () => {
    expect(normalizeText('multi-lingual reading')).toBe('multi-lingual reading')
  })
})

describe('chunkText', () => {
  it('returns no chunks for empty text', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText('\n\n   \n')).toEqual([])
  })

  it('keeps a short sentence as a single chunk', () => {
    const chunks = chunkText('This is one short sentence.')
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('This is one short sentence.')
    expect(chunks[0].index).toBe(0)
  })

  it('splits paragraphs before sentences (PRD §15 priority order)', () => {
    const chunks = chunkText('First paragraph.\n\nSecond paragraph.')
    expect(chunks.map((chunk) => chunk.text)).toEqual(['First paragraph.', 'Second paragraph.'])
  })

  it('packs multiple sentences into one chunk while under the limit', () => {
    const chunks = chunkText('One. Two. Three.', { maxChars: 100 })
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('One. Two. Three.')
  })

  it('splits a long paragraph at sentence boundaries', () => {
    const sentence = 'Sentence number one is here. '
    const chunks = chunkText(sentence.repeat(20))
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(DEFAULT_MAX_CHUNK_CHARS)
      expect(chunk.text.trim().endsWith('.')).toBe(true)
    }
  })

  it('does not split on a decimal point or abbreviation', () => {
    const chunks = chunkText('Pi is 3.14 and e.g. this stays together.', { maxChars: 200 })
    expect(chunks).toHaveLength(1)
  })

  it('numbers chunks sequentially and preserves reading order', () => {
    const chunks = chunkText('Alpha. Bravo. Charlie. Delta.', { maxChars: 10 })
    expect(chunks.map((chunk) => chunk.index)).toEqual([0, 1, 2, 3])
    expect(chunks.map((chunk) => chunk.text)).toEqual(['Alpha.', 'Bravo.', 'Charlie.', 'Delta.'])
  })

  it('reports offsets that map onto the normalized text', () => {
    const source = 'First sentence. Second sentence.'
    const normalized = normalizeText(source)
    for (const chunk of chunkText(source, { maxChars: 16 })) {
      expect(normalized.slice(chunk.startOffset, chunk.endOffset)).toBe(chunk.text)
    }
  })

  it('falls back to a character split when one sentence exceeds the limit', () => {
    const chunks = chunkText('word '.repeat(200), { maxChars: 50 })
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(50)
    }
  })

  it('splits Bengali text on the danda (PRD §42)', () => {
    const chunks = chunkText('আমি বাংলা পড়ছি৷ এটি দ্বিতীয় বাক্য৷', { maxChars: 20 })
    expect(chunks).toHaveLength(2)
    expect(chunks[0].text).toBe('আমি বাংলা পড়ছি৷')
    expect(chunks[1].text).toBe('এটি দ্বিতীয় বাক্য৷')
  })

  it('splits Hindi text on the purna viram', () => {
    const chunks = chunkText('यह पहला वाक्य है। यह दूसरा वाक्य है।', { maxChars: 20 })
    expect(chunks).toHaveLength(2)
  })

  it('splits Chinese text on the ideographic full stop without needing spaces', () => {
    const chunks = chunkText('这是第一句。这是第二句。', { maxChars: 8 })
    expect(chunks.map((chunk) => chunk.text)).toEqual(['这是第一句。', '这是第二句。'])
  })

  it('character-splits Chinese text that has no terminator at all', () => {
    const chunks = chunkText('这'.repeat(30), { maxChars: 10 })
    expect(chunks).toHaveLength(3)
    expect(chunks[0].text).toHaveLength(10)
  })

  it('splits French text and keeps its punctuation spacing intact', () => {
    const chunks = chunkText('Bonjour le monde ! Comment allez-vous ?', { maxChars: 20 })
    expect(chunks).toHaveLength(2)
    expect(chunks[0].text).toBe('Bonjour le monde !')
    expect(chunks[1].text).toBe('Comment allez-vous ?')
  })

  it('splits Arabic text on the Arabic question mark', () => {
    const chunks = chunkText('كيف حالك؟ أنا بخير.', { maxChars: 12 })
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('keeps closing quotes with the sentence they belong to', () => {
    const chunks = chunkText('"Stop right there." She left.', { maxChars: 20 })
    expect(chunks[0].text).toBe('"Stop right there."')
  })
})
