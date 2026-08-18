import { create } from 'zustand'
import type { BookSummary } from '../types/book'

interface BookState {
  /** The book being read, or undefined on the home screen. */
  current?: BookSummary
  /** Local library listing, newest first. Metadata only — never PDF bytes. */
  library: BookSummary[]
  setCurrent(book: BookSummary | undefined): void
  setLibrary(books: BookSummary[]): void
}

export const useBookStore = create<BookState>((set) => ({
  current: undefined,
  library: [],
  setCurrent(current) {
    set({ current })
  },
  setLibrary(library) {
    set({ library })
  },
}))
