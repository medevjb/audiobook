import { describe, expect, it } from 'vitest'
import { clampPage, hasNextPage, hasPreviousPage, isValidPage, parsePageInput } from './page'

describe('page validation (PRD §42)', () => {
  it('rejects a page below 1', () => {
    expect(isValidPage(0, 10)).toBe(false)
    expect(isValidPage(-3, 10)).toBe(false)
  })

  it('accepts page 1 and the last page', () => {
    expect(isValidPage(1, 10)).toBe(true)
    expect(isValidPage(10, 10)).toBe(true)
  })

  it('rejects a page above the maximum', () => {
    expect(isValidPage(11, 10)).toBe(false)
  })

  it('rejects non-integers', () => {
    expect(isValidPage(1.5, 10)).toBe(false)
    expect(isValidPage(Number.NaN, 10)).toBe(false)
  })
})

describe('clampPage', () => {
  it('clamps into range', () => {
    expect(clampPage(0, 10)).toBe(1)
    expect(clampPage(-5, 10)).toBe(1)
    expect(clampPage(99, 10)).toBe(10)
    expect(clampPage(5, 10)).toBe(5)
  })

  it('falls back to page 1 for non-finite input', () => {
    expect(clampPage(Number.NaN, 10)).toBe(1)
    expect(clampPage(Number.POSITIVE_INFINITY, 10)).toBe(10)
  })

  it('never returns 0 even for an empty document', () => {
    expect(clampPage(1, 0)).toBe(1)
  })
})

describe('parsePageInput', () => {
  it('parses and clamps numeric input', () => {
    expect(parsePageInput('57', 324)).toBe(57)
    expect(parsePageInput('  57  ', 324)).toBe(57)
    expect(parsePageInput('999', 324)).toBe(324)
  })

  it('rejects input that is not a page number', () => {
    expect(parsePageInput('', 324)).toBeUndefined()
    expect(parsePageInput('abc', 324)).toBeUndefined()
    expect(parsePageInput('-1', 324)).toBeUndefined()
    expect(parsePageInput('1.5', 324)).toBeUndefined()
  })
})

describe('navigation guards', () => {
  it('knows when there is a next or previous page', () => {
    expect(hasNextPage(1, 10)).toBe(true)
    expect(hasNextPage(10, 10)).toBe(false)
    expect(hasPreviousPage(1)).toBe(false)
    expect(hasPreviousPage(2)).toBe(true)
  })
})
