import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { OcrState } from '../../hooks/useOcr'
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

const idle: OcrState = { status: 'idle' }

function renderPanel(overrides: Partial<Parameters<typeof ReaderText>[0]> = {}) {
  return render(
    <ReaderText
      pageText={normalPage}
      ocrState={idle}
      onRecognize={vi.fn()}
      onAnswerConsent={vi.fn()}
      {...overrides}
    />,
  )
}

describe('ReaderText (PRD §24)', () => {
  it('shows a preparing state while extraction is in flight', () => {
    renderPanel({ pageText: undefined })
    expect(screen.getByText('Preparing page…')).toBeInTheDocument()
  })

  it('shows the PRD §12 message for a likely-scanned page', () => {
    renderPanel({ pageText: scannedPage })
    expect(screen.getByText('No readable text was detected on this page.')).toBeInTheDocument()
  })

  it('shows the extracted text for a normal page', () => {
    renderPanel()
    expect(screen.getByText(normalPage.text)).toBeInTheDocument()
  })

  it('can be collapsed and expanded again', async () => {
    const user = userEvent.setup()
    renderPanel()

    const toggle = screen.getByRole('button', { name: 'Hide' })
    expect(screen.getByText(normalPage.text)).toBeInTheDocument()

    await user.click(toggle)
    expect(screen.queryByText(normalPage.text)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText(normalPage.text)).toBeInTheDocument()
  })

  it('shows an OCR badge when the text came from recognition, not PDF', () => {
    renderPanel({ pageText: { ...normalPage, source: 'ocr' } })
    expect(screen.getByText('OCR')).toBeInTheDocument()
  })

  it('does not show an OCR badge for PDF-sourced text', () => {
    renderPanel()
    expect(screen.queryByText('OCR')).not.toBeInTheDocument()
  })
})

describe('ReaderText OCR flow (PRD §13)', () => {
  it('offers to recognize text on a scanned page', async () => {
    const user = userEvent.setup()
    const onRecognize = vi.fn()
    renderPanel({ pageText: scannedPage, onRecognize })

    await user.click(screen.getByRole('button', { name: 'Recognize text on this page' }))
    expect(onRecognize).toHaveBeenCalledOnce()
  })

  it('shows the consent prompt with the approximate download size', () => {
    renderPanel({
      pageText: scannedPage,
      ocrState: { status: 'awaiting-consent', request: { language: 'bn', approximateBytes: 2 * 1024 * 1024 } },
    })
    expect(screen.getByText(/Download the Bengali text-recognition model\? \(~2\.0 MB/)).toBeInTheDocument()
  })

  it('reports the user’s consent decision', async () => {
    const user = userEvent.setup()
    const onAnswerConsent = vi.fn()
    renderPanel({
      pageText: scannedPage,
      ocrState: { status: 'awaiting-consent', request: { language: 'bn', approximateBytes: 1024 } },
      onAnswerConsent,
    })

    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(onAnswerConsent).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onAnswerConsent).toHaveBeenCalledWith(false)
  })

  it('shows progress while recognizing (PRD §13/§36 loading state)', () => {
    renderPanel({
      pageText: scannedPage,
      ocrState: { status: 'recognizing', progress: { status: 'recognizing text', progress: 0.42 } },
    })
    expect(screen.getByText('Recognizing text on page 2… 42%')).toBeInTheDocument()
  })

  it('shows an error with a retry action', async () => {
    const user = userEvent.setup()
    const onRecognize = vi.fn()
    renderPanel({
      pageText: scannedPage,
      ocrState: { status: 'error', message: 'Text recognition failed on this page.' },
      onRecognize,
    })

    expect(screen.getByText('Text recognition failed on this page.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRecognize).toHaveBeenCalledOnce()
  })
})
