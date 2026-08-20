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
    <section aria-label="PDF viewer" className="flex flex-col items-center gap-5">
      <div className="w-full overflow-hidden rounded-2xl bg-page p-4 sm:p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-black/5">
        <div className="max-h-[68dvh] overflow-y-auto rounded-lg">
          <PageCanvas pageNumber={currentPage} render={render} />
        </div>
      </div>
      <PageNavigation currentPage={currentPage} totalPages={totalPages} onNavigate={onNavigate} />
    </section>
  )
}
