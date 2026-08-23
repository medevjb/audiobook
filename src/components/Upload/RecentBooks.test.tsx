import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LibraryEntry } from '../../hooks/useLibrary'
import type { BookSummary } from '../../types/book'
import { RecentBooks } from './RecentBooks'

function summary(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    bookId: 'b1',
    filename: 'book.pdf',
    size: 2_500_000,
    lastModified: 1,
    totalPages: 324,
    addedAt: 1,
    ...overrides,
  }
}

describe('RecentBooks (PRD §25)', () => {
  it('renders nothing for an empty library', () => {
    const { container } = render(<RecentBooks entries={[]} onOpen={vi.fn()} />);
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "page 1" for a book with no saved progress', () => {
    const entries: LibraryEntry[] = [{ summary: summary(), hasFile: true }]
    render(<RecentBooks entries={entries} onOpen={vi.fn()} />)
    expect(screen.getByText('Page 1 / 324')).toBeInTheDocument()
  })

  it('shows "continue from page N" for a book with progress (PRD §25 example)', () => {
    const entries: LibraryEntry[] = [
      {
        summary: summary(),
        progress: { bookId: 'b1', filename: 'book.pdf', currentPage: 57, totalPages: 324, updatedAt: 1 },
        hasFile: true,
      },
    ]
    render(<RecentBooks entries={entries} onOpen={vi.fn()} />)
    expect(screen.getByText('Continue — page 57 / 324')).toBeInTheDocument()
  })

  it('opens the book when the row is clicked', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const entry: LibraryEntry = { summary: summary(), hasFile: true }
    render(<RecentBooks entries={[entry]} onOpen={onOpen} />)

    await user.click(screen.getByText('book.pdf'))
    expect(onOpen).toHaveBeenCalledWith(entry)
  })

  it('offers "start over" only when there is real progress to discard', () => {
    const noProgress: LibraryEntry[] = [{ summary: summary({ bookId: 'a' }), hasFile: true }]
    render(<RecentBooks entries={noProgress} onOpen={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Start over' })).not.toBeInTheDocument()
  })

  it('"start over" reopens at page 1 without touching the saved position', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const entry: LibraryEntry = {
      summary: summary(),
      progress: { bookId: 'b1', filename: 'book.pdf', currentPage: 57, totalPages: 324, updatedAt: 1 },
      hasFile: true,
    }
    render(<RecentBooks entries={[entry]} onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(onOpen).toHaveBeenCalledWith(entry, 1)
  })

  it('shows a "not on this device" entry for synced-but-not-local books instead of a dead Open button', () => {
    const entry: LibraryEntry = { summary: summary(), hasFile: false }
    render(<RecentBooks entries={[entry]} onOpen={vi.fn()} />)

    expect(screen.getByText('book.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
