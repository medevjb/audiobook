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
 * The signed-in library view (PRD §8.1) — what a returning user sees with no
 * book currently open. The marketing pitch (hero, features, how it works)
 * now lives on the pre-login landing page (`components/Landing/LandingPage`)
 * instead of here, so a signed-in user isn't shown the same sales copy every
 * time their library happens to be empty; this screen is purely "upload or
 * continue reading."
 */
export function HomeScreen({ onFileSelected, recentBooks, onOpenRecent, busy }: HomeScreenProps) {
  return (
    <div className="relative mx-auto max-w-3xl py-10 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[420px] w-[700px] rounded-full bg-gradient-to-tr from-amber-500/10 via-amber-600/5 to-transparent blur-3xl opacity-80" />
      </div>

      <section id="dropzone">
        <div className="overflow-hidden rounded-3xl bg-page p-3 sm:p-5 shadow-2xl border border-[var(--color-border)] ring-1 ring-black/5">
          <DropZone onFileSelected={onFileSelected} disabled={busy} />
        </div>
      </section>

      {recentBooks.length > 0 && (
        <section className="mt-10">
          <RecentBooks entries={recentBooks} onOpen={onOpenRecent} />
        </section>
      )}
    </div>
  )
}
