import type { Pool } from 'pg'
import type { BookProgressDto } from '../../types.js'

interface ProgressRow {
  book_id: string
  filename: string
  current_page: number
  total_pages: number
  language: string | null
  voice_uri: string | null
  rate: number | null
  auto_advance: boolean | null
  updated_at: Date
}

function toDto(row: ProgressRow): BookProgressDto {
  return {
    bookId: row.book_id,
    filename: row.filename,
    currentPage: row.current_page,
    totalPages: row.total_pages,
    updatedAt: row.updated_at.getTime(),
    ...(row.language !== null && { language: row.language }),
    ...(row.voice_uri !== null && { voiceURI: row.voice_uri }),
    ...(row.rate !== null && { rate: row.rate }),
    ...(row.auto_advance !== null && { autoAdvance: row.auto_advance }),
  }
}

export async function listProgressByUser(pool: Pool, userId: string, limit: number): Promise<BookProgressDto[]> {
  const result = await pool.query<ProgressRow>(
    `SELECT book_id, filename, current_page, total_pages, language, voice_uri, rate, auto_advance, updated_at
     FROM reading_progress WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`,
    [userId, limit],
  )
  return result.rows.map(toDto)
}

async function upsertRow(
  pool: Pool,
  userId: string,
  bookId: string,
  fields: Omit<BookProgressDto, 'bookId' | 'updatedAt'>,
  updatedAt: number,
): Promise<BookProgressDto> {
  const result = await pool.query<ProgressRow>(
    `INSERT INTO reading_progress
       (user_id, book_id, filename, current_page, total_pages, language, voice_uri, rate, auto_advance, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_timestamp($10 / 1000.0))
     ON CONFLICT (user_id, book_id) DO UPDATE SET
       filename = EXCLUDED.filename, current_page = EXCLUDED.current_page, total_pages = EXCLUDED.total_pages,
       language = EXCLUDED.language, voice_uri = EXCLUDED.voice_uri, rate = EXCLUDED.rate,
       auto_advance = EXCLUDED.auto_advance, updated_at = EXCLUDED.updated_at
     RETURNING book_id, filename, current_page, total_pages, language, voice_uri, rate, auto_advance, updated_at`,
    [
      userId,
      bookId,
      fields.filename,
      fields.currentPage,
      fields.totalPages,
      fields.language ?? null,
      fields.voiceURI ?? null,
      fields.rate ?? null,
      fields.autoAdvance ?? null,
      updatedAt,
    ],
  )
  return toDto(result.rows[0]!)
}

/** Live single-book sync: server stamps `updatedAt`, mirroring the client's own progressStorage.saveProgress. */
export function upsertProgress(
  pool: Pool,
  userId: string,
  bookId: string,
  fields: Omit<BookProgressDto, 'bookId' | 'updatedAt'>,
): Promise<BookProgressDto> {
  return upsertRow(pool, userId, bookId, fields, Date.now())
}

/** Bulk import of pre-existing local progress: preserves each item's own `updatedAt` so recency ordering survives. */
export async function bulkImportProgress(pool: Pool, userId: string, items: BookProgressDto[]): Promise<number> {
  for (const item of items) {
    await upsertRow(pool, userId, item.bookId, item, item.updatedAt)
  }
  return items.length
}
