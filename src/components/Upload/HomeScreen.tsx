import type { LibraryEntry } from '../../hooks/useLibrary'
import { DropZone } from './DropZone'
import { RecentBooks } from './RecentBooks'

interface HomeScreenProps {
  onFileSelected(file: File): void
  recentBooks: readonly LibraryEntry[]
  onOpenRecent(entry: LibraryEntry, startPage?: number): void
  busy?: boolean
}

/**
 * Empty/home state (PRD §8.1). The "lit page" card is the app's signature
 * surface — the same warm paper the PDF itself will render on once a book is
 * open, introduced here as "place a book under the lamp."
 */
export function HomeScreen({ onFileSelected, recentBooks, onOpenRecent, busy }: HomeScreenProps) {
  return (
    <div className="relative mx-auto max-w-xl py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,var(--color-brass)_0%,transparent_65%)] opacity-[0.08]"
      />

      <div className="text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-brass">
          Local · Private · Free
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink-strong">
          Listen to your PDFs
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">
          Open a book, pick a page, and have it read aloud in the voice and language you choose.
        </p>
      </div>

      <div className="mt-8">
        <RecentBooks entries={recentBooks} onOpen={onOpenRecent} />

        <div className="rounded-xl bg-page p-2 shadow-[0_0_60px_-15px_var(--color-brass)]">
          <DropZone onFileSelected={onFileSelected} disabled={busy} />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Your PDF stays on your device. Books are processed locally and are never uploaded.
      </p>
    </div>
  )
}
