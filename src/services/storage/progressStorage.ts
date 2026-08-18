import type { BookId } from '../../types/book'
import type { BookProgress } from '../../types/reader'
import { getDb } from './db'

/** Reading-progress persistence (PRD §25). */

export async function getProgress(bookId: BookId): Promise<BookProgress | undefined> {
  const db = await getDb()
  return db.get('progress', bookId)
}

/** Writes progress, stamping `updatedAt` so callers cannot forget to. */
export async function saveProgress(progress: Omit<BookProgress, 'updatedAt'>): Promise<BookProgress> {
  const db = await getDb()
  const record: BookProgress = { ...progress, updatedAt: Date.now() }
  await db.put('progress', record)
  return record
}

/**
 * Merges a partial update into existing progress. Used by the page-change and
 * settings-change paths, which each know only their own field.
 */
export async function updateProgress(
  bookId: BookId,
  patch: Partial<Omit<BookProgress, 'bookId' | 'updatedAt'>>,
): Promise<BookProgress | undefined> {
  const db = await getDb()
  const existing = await db.get('progress', bookId)
  if (!existing) return undefined
  const record: BookProgress = { ...existing, ...patch, updatedAt: Date.now() }
  await db.put('progress', record)
  return record
}

/** Most recently read books first — drives "Continue from page 57" (PRD §25). */
export async function listRecentProgress(limit = 10): Promise<BookProgress[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('progress', 'by-updatedAt')
  return all.reverse().slice(0, limit)
}

export async function deleteProgress(bookId: BookId): Promise<void> {
  const db = await getDb()
  await db.delete('progress', bookId)
}
