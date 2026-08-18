/**
 * Stable, local-only identifier for a book.
 * Derived from filename + size + lastModified (PRD §26) by `deriveBookId`.
 */
export type BookId = string

/**
 * Library entry for one book.
 *
 * Deliberately carries no file bytes: rendering the "recent books" list must
 * not pull every PDF into memory. The bytes live in the separate `bookFiles`
 * store, keyed by the same `bookId`.
 */
export interface BookSummary {
  bookId: BookId
  filename: string
  /** Bytes, from File.size. Part of the identity tuple (§26). */
  size: number
  /** File.lastModified epoch ms. Part of the identity tuple (§26). */
  lastModified: number
  totalPages: number
  /** Epoch ms the book was first added to the local library. */
  addedAt: number
}

/** The stored PDF bytes for one book. One record per book, fetched on demand. */
export interface BookFile {
  bookId: BookId
  blob: Blob
}

/** A book plus its bytes, as handed to the PDF service. */
export interface LoadedBook {
  summary: BookSummary
  blob: Blob
}
