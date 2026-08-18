import type { BookId, BookSummary } from '../../types/book'
import { AppError } from '../../utils/errors'
import { getDb } from './db'

/**
 * Library persistence. Books are stored locally and never transmitted
 * (PRD §3.1/§40) — this module is the only writer of PDF bytes.
 */

/** Adds or replaces a book and its bytes in a single transaction. */
export async function saveBook(summary: BookSummary, blob: Blob): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['books', 'bookFiles'], 'readwrite')
  try {
    await Promise.all([
      tx.objectStore('books').put(summary),
      tx.objectStore('bookFiles').put({ bookId: summary.bookId, blob }),
      tx.done,
    ])
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'QuotaExceededError') {
      throw new AppError(
        'storage-quota-exceeded',
        'Not enough local storage space for this book. Remove a book from your library and try again.',
        { cause },
      )
    }
    throw cause
  }
}

/** Library listing, newest first. Reads metadata only — never the PDF bytes. */
export async function listBooks(): Promise<BookSummary[]> {
  const db = await getDb()
  const books = await db.getAllFromIndex('books', 'by-addedAt')
  return books.reverse()
}

export async function getBook(bookId: BookId): Promise<BookSummary | undefined> {
  const db = await getDb()
  return db.get('books', bookId)
}

/** Loads the stored bytes for a book. Undefined if the book is not in the library. */
export async function getBookFile(bookId: BookId): Promise<Blob | undefined> {
  const db = await getDb()
  const record = await db.get('bookFiles', bookId)
  return record?.blob
}

/** Removes a book, its bytes and its progress together — no orphans. */
export async function deleteBook(bookId: BookId): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['books', 'bookFiles', 'progress'], 'readwrite')
  await Promise.all([
    tx.objectStore('books').delete(bookId),
    tx.objectStore('bookFiles').delete(bookId),
    tx.objectStore('progress').delete(bookId),
    tx.done,
  ])
}
