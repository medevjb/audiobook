import type { Pool } from 'pg'
import type { BookSummaryDto } from '../../types.js'

interface LibraryBookRow {
  book_id: string
  filename: string
  size: string
  last_modified: string
  total_pages: number
  added_at: Date
}

function toDto(row: LibraryBookRow): BookSummaryDto {
  return {
    bookId: row.book_id,
    filename: row.filename,
    size: Number(row.size),
    lastModified: Number(row.last_modified),
    totalPages: row.total_pages,
    addedAt: row.added_at.getTime(),
  }
}

export async function listLibraryByUser(pool: Pool, userId: string): Promise<BookSummaryDto[]> {
  const result = await pool.query<LibraryBookRow>(
    'SELECT book_id, filename, size, last_modified, total_pages, added_at FROM library_books WHERE user_id = $1 ORDER BY added_at DESC',
    [userId],
  )
  return result.rows.map(toDto)
}

export async function upsertLibraryBook(pool: Pool, userId: string, book: BookSummaryDto): Promise<BookSummaryDto> {
  const result = await pool.query<LibraryBookRow>(
    `INSERT INTO library_books (user_id, book_id, filename, size, last_modified, total_pages, added_at)
     VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0))
     ON CONFLICT (user_id, book_id) DO UPDATE SET
       filename = EXCLUDED.filename, size = EXCLUDED.size, last_modified = EXCLUDED.last_modified,
       total_pages = EXCLUDED.total_pages, added_at = EXCLUDED.added_at, updated_at = now()
     RETURNING book_id, filename, size, last_modified, total_pages, added_at`,
    [userId, book.bookId, book.filename, book.size, book.lastModified, book.totalPages, book.addedAt],
  )
  return toDto(result.rows[0]!)
}

export async function deleteLibraryBook(pool: Pool, userId: string, bookId: string): Promise<void> {
  await pool.query('DELETE FROM library_books WHERE user_id = $1 AND book_id = $2', [userId, bookId])
}

export async function bulkUpsertLibraryBooks(pool: Pool, userId: string, books: BookSummaryDto[]): Promise<number> {
  for (const book of books) {
    await upsertLibraryBook(pool, userId, book)
  }
  return books.length
}
