import { PageCanvas } from './PageCanvas'
import { PageNavigation } from './PageNavigation'

interface PdfViewerProps {
  currentPage: number
  totalPages: number
  render(pageNumber: number, canvas: HTMLCanvasElement): Promise<void>
  onNavigate(page: number): void
}

/**
 * Displays the currently selected page with navigation (PRD §10).
 *
 * The page card has a bounded height with its own scroll: a Letter-size page
 * rendered for legibility is taller than most viewports, and navigation must
 * stay reachable without hunting for it below the fold.
 */
export function PdfViewer({ currentPage, totalPages, render, onNavigate }: PdfViewerProps) {
  return (
    <section aria-label="PDF viewer" className="flex flex-col items-center gap-4">
      <div className="w-full rounded-xl bg-page p-4 shadow-[0_0_40px_-18px_var(--color-brass)] sm:p-6">
        <div className="max-h-[65dvh] overflow-y-auto">
          <PageCanvas pageNumber={currentPage} render={render} />
        </div>
      </div>
      <PageNavigation currentPage={currentPage} totalPages={totalPages} onNavigate={onNavigate} />
    </section>
  )
}
