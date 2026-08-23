import { apiFetch } from '../api/client'
import type { BookSummary } from '../../types/book'

export function fetchLibrary(): Promise<BookSummary[]> {
  return apiFetch<{ books: BookSummary[] }>('/library').then((res) => res.books)
}

export function upsertLibraryBook(summary: BookSummary): Promise<BookSummary> {
  const { bookId, ...body } = summary
  return apiFetch<{ book: BookSummary }>(`/library/${encodeURIComponent(bookId)}`, { method: 'PUT', json: body }).then(
    (res) => res.book,
  )
}

export function importLibrary(books: BookSummary[]): Promise<number> {
  return apiFetch<{ imported: number }>('/library/import', { method: 'POST', json: { books } }).then(
    (res) => res.imported,
  )
}
