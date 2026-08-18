/**
 * Page-number validation (PRD §10). Pages are 1-indexed; 0, negatives and
 * anything past the end must be clamped or rejected, never passed to PDF.js.
 */

export function isValidPage(page: number, totalPages: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= totalPages
}

/**
 * Clamps into [1, totalPages]. Only NaN falls back to page 1 — an infinite
 * value is a "past the end" request and clamps to the last page like any other
 * out-of-range number.
 */
export function clampPage(page: number, totalPages: number): number {
  const max = Math.max(1, Math.floor(totalPages))
  if (Number.isNaN(page)) return 1
  return Math.min(max, Math.max(1, Math.floor(page)))
}

/**
 * Parses the page-number input (PRD §10/§18). Returns undefined for input that
 * is not a page number at all, so the field can reject rather than clamp it to
 * a page the user never asked for.
 */
export function parsePageInput(raw: string, totalPages: number): number | undefined {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return undefined
  return clampPage(Number(trimmed), totalPages)
}

export function hasNextPage(currentPage: number, totalPages: number): boolean {
  return currentPage < totalPages
}

export function hasPreviousPage(currentPage: number): boolean {
  return currentPage > 1
}
