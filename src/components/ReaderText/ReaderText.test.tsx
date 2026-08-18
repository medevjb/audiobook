import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { PageText } from '../../types/reader'
import { ReaderText } from './ReaderText'

const normalPage: PageText = {
  pageNumber: 1,
  text: 'This is the extracted text of the page.',
  source: 'pdf',
  isLikelyScanned: false,
}

const scannedPage: PageText = {
  pageNumber: 2,
  text: '',
  source: 'pdf',
  isLikelyScanned: true,
}

describe('ReaderText (PRD §24)', () => {
  it('shows a preparing state while extraction is in flight', () => {
    render(<ReaderText pageText={undefined} />)
    expect(screen.getByText('Preparing page…')).toBeInTheDocument()
  })

  it('shows the PRD §12 message for a likely-scanned page', () => {
    render(<ReaderText pageText={scannedPage} />)
    expect(screen.getByText('No readable text was detected on this page.')).toBeInTheDocument()
  })

  it('shows the extracted text for a normal page', () => {
    render(<ReaderText pageText={normalPage} />)
    expect(screen.getByText(normalPage.text)).toBeInTheDocument()
  })

  it('can be collapsed and expanded again', async () => {
    const user = userEvent.setup()
    render(<ReaderText pageText={normalPage} />)

    const toggle = screen.getByRole('button', { name: 'Hide' })
    expect(screen.getByText(normalPage.text)).toBeInTheDocument()

    await user.click(toggle)
    expect(screen.queryByText(normalPage.text)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText(normalPage.text)).toBeInTheDocument()
  })
})
