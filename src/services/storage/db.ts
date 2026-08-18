import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { BookFile, BookSummary } from '../../types/book'
import type { BookProgress } from '../../types/reader'
import { AppError } from '../../utils/errors'

const DB_NAME = 'audiobook-reader'
const DB_VERSION = 1

/**
 * Local persistence schema.
 *
 * `books` and `bookFiles` are split on purpose: listing the library reads only
 * the small metadata records, so opening the app never deserializes hundreds
 * of megabytes of PDF bytes (PRD §38).
 */
export interface AudiobookDB extends DBSchema {
  books: {
    key: string
    value: BookSummary
    indexes: { 'by-addedAt': number }
  }
  bookFiles: {
    key: string
    value: BookFile
  }
  progress: {
    key: string
    value: BookProgress
    indexes: { 'by-updatedAt': number }
  }
}

let dbPromise: Promise<IDBPDatabase<AudiobookDB>> | undefined

export function getDb(): Promise<IDBPDatabase<AudiobookDB>> {
  dbPromise ??= openDB<AudiobookDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('books')) {
        const books = db.createObjectStore('books', { keyPath: 'bookId' })
        books.createIndex('by-addedAt', 'addedAt')
      }
      if (!db.objectStoreNames.contains('bookFiles')) {
        db.createObjectStore('bookFiles', { keyPath: 'bookId' })
      }
      if (!db.objectStoreNames.contains('progress')) {
        const progress = db.createObjectStore('progress', { keyPath: 'bookId' })
        progress.createIndex('by-updatedAt', 'updatedAt')
      }
    },
  }).catch((cause: unknown) => {
    dbPromise = undefined
    throw new AppError('storage-unavailable', 'Local storage is unavailable in this browser.', { cause })
  })
  return dbPromise
}

/** Test seam: forces the next `getDb` to reopen. */
export function resetDbForTests(): void {
  dbPromise = undefined
}

export interface StorageEstimate {
  usageBytes: number
  quotaBytes: number
}

/**
 * Remaining local space. Storing whole PDFs makes quota a real failure mode,
 * so the library surfaces this before a large import.
 */
export async function estimateStorage(): Promise<StorageEstimate | undefined> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return undefined
  const estimate = await navigator.storage.estimate()
  return { usageBytes: estimate.usage ?? 0, quotaBytes: estimate.quota ?? 0 }
}
