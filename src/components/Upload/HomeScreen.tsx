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
    <div className="relative mx-auto max-w-5xl py-8 sm:py-14">
      {/* Dynamic ambient backdrop lights */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[550px] w-[850px] rounded-full bg-gradient-to-tr from-amber-500/12 via-amber-600/6 to-transparent blur-3xl opacity-80" />
      </div>

      {/* 1. Super Awesome Hero Section */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brass-strong shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-brass animate-pulse" />
          Aloud — Your book reader
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-normal tracking-tight text-ink-strong sm:text-6xl sm:leading-[1.15]">
          Read with your eyes.{' '}
          <span className="block sm:inline font-medium italic text-brass-strong">
            Listen with your ears.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl font-sans text-base leading-relaxed text-ink-soft sm:text-lg">
          Turn any PDF into a natural, spoken companion. Built-in voices, real-time sentence tracking,
          and offline OCR scanning — completely private on your device.
        </p>
      </section>

      {/* 2. Interactive Drop & Upload Studio Console */}
      <section id="dropzone" className="mt-10 sm:mt-12">
        <div className="overflow-hidden rounded-3xl bg-page p-3 sm:p-5 shadow-2xl border border-[var(--color-border)] ring-1 ring-black/5">
          <DropZone onFileSelected={onFileSelected} disabled={busy} />
        </div>
      </section>

      {/* 3. Recent Books Library Shelf (if available) */}
      {recentBooks.length > 0 && (
        <section className="mt-12">
          <RecentBooks entries={recentBooks} onOpen={onOpenRecent} />
        </section>
      )}

      {/* 4. Interactive Live Showcase Preview Card */}
      <section id="how-it-works" className="mt-16 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-room-2/80 p-6 sm:p-8 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-brass/10 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-brass-strong">
              ✨ Live Experience
            </div>
            <h2 className="mt-3 font-display text-2xl font-normal text-ink-strong sm:text-3xl">
              Distraction-free reading, seamlessly spoken.
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft font-sans">
              As your book is narrated, words highlight gently in amber so you never lose your spot.
              Pause, resume, or jump between chapters with natural keyboard flow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-ink-soft">
              <span className="rounded-lg bg-room-3 px-3 py-1.5 font-medium border border-[var(--color-border)]">
                ⌨️ Space to play/pause
              </span>
              <span className="rounded-lg bg-room-3 px-3 py-1.5 font-medium border border-[var(--color-border)]">
                ← / → Turn pages
              </span>
              <span className="rounded-lg bg-room-3 px-3 py-1.5 font-medium border border-[var(--color-border)]">
                ⚡ 0.5× to 2.0× speed
              </span>
            </div>
          </div>

          {/* Interactive Mock Book Page Simulation */}
          <div className="flex-1 rounded-2xl bg-page p-5 shadow-md border border-[var(--color-border)] max-w-lg lg:max-w-none text-ink-on-page">
            <div className="flex items-center justify-between border-b border-ink-on-page/10 pb-3 mb-3 text-xs text-ink-on-page-soft font-medium">
              <span>Chapter 1 · The Open Sea</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Speaking · 1.0×
              </span>
            </div>
            <p className="font-content text-sm sm:text-base leading-relaxed">
              <span className="text-ink-on-page-soft opacity-60">The morning sun crept over the horizon, casting golden reflections across the calm water. </span>
              <span className="rounded-md bg-brass/35 px-1.5 py-0.5 font-medium text-ink-on-page shadow-sm ring-1 ring-brass/30">
                He opened the weathered journal, listening intently to the quiet rustle of the wind against the sails.
              </span>
              <span className="text-ink-on-page-soft opacity-60"> Every word on the parchment carried the memories of voyages long past.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 5. The Three Core Pillars */}
      <section id="features" className="mt-14">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-normal text-ink-strong sm:text-3xl">
            Engineered for readers and listeners
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Everything you need for effortless, private, and customizable reading.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border border-[var(--color-border)] bg-room-2/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-brass/40 hover:-translate-y-0.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brass/20 to-amber-500/10 text-brass ring-1 ring-brass/25 mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h3 className="font-sans font-bold text-base text-ink-strong">Natural System Voices</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Access your device's full suite of high-fidelity speech engines with multi-dialect support and custom pace controls.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-room-2/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-brass/40 hover:-translate-y-0.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brass/20 to-amber-500/10 text-brass ring-1 ring-brass/25 mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="font-sans font-bold text-base text-ink-strong">Smart Extraction & OCR</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Digital textbooks, articles, or scanned photocopies — built-in OCR automatically extracts prose into readable text.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-room-2/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-brass/40 hover:-translate-y-0.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brass/20 to-amber-500/10 text-brass ring-1 ring-brass/25 mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-sans font-bold text-base text-ink-strong">100% Private & Offline</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              No cloud servers, accounts, or telemetry. Your books, voice synthesis, and reading history remain entirely local.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer Privacy Statement */}
      <footer className="mt-14 flex items-center justify-center gap-2.5 text-center text-xs text-ink-soft border-t border-[var(--color-border-subtle)] pt-6">
        <svg className="h-4 w-4 text-brass/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span>Your PDF stays on your device. Books are processed locally and are never uploaded.</span>
      </footer>
    </div>
  )
}
