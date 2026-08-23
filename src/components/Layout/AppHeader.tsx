import { useState } from 'react'
import { AdminLink } from '../Auth/AdminLink'
import { UserMenu } from '../Auth/UserMenu'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'

interface AppHeaderProps {
  /** Optional book information if a book is currently open. */
  bookTitle?: string
  currentPage?: number
  totalPages?: number
  /** Rendered on the right — the "Upload New PDF" action once a book is open. */
  action?: React.ReactNode
}

export function AppHeader({ bookTitle, currentPage, totalPages, action }: AppHeaderProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-room-2/85 backdrop-blur-xl transition-all shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-amber-500/40 before:to-transparent">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Identity + Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-8 select-none">
            {/* Logo + Wordmark */}
            <div className="flex items-center gap-3">
              <div className="group relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[1.5px] shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/40">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-gradient-to-b from-room-2 to-room transition-colors group-hover:from-room-3 group-hover:to-room-2">
                  <svg className="h-5 w-5 text-brass-strong transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M8 7h8" strokeWidth="2" />
                    <path d="M8 11h5" strokeWidth="2" />
                    <path d="M16 16a3 3 0 0 0 3-3" strokeWidth="2" />
                    <path d="M19 10a6 6 0 0 0-6-6" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent drop-shadow-xs">
                  Aloud
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-brass-strong shadow-xs backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Your book reader
                </span>
              </div>
            </div>

            {/* Nav Items beside the logo */}
            {!bookTitle && (
              <nav className="hidden md:flex items-center gap-1 border-l border-[var(--color-border)] pl-6">
                <button
                  type="button"
                  onClick={() => scrollTo('how-it-works')}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-soft transition-all duration-150 hover:text-brass-strong hover:bg-room-3/80 active:scale-95 cursor-pointer"
                >
                  How it works
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo('features')}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-soft transition-all duration-150 hover:text-brass-strong hover:bg-room-3/80 active:scale-95 cursor-pointer"
                >
                  Features
                </button>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(true)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-soft transition-all duration-150 hover:text-brass-strong hover:bg-room-3/80 active:scale-95 cursor-pointer"
                >
                  Shortcuts
                </button>
              </nav>
            )}
          </div>

          {/* Center: Live Document Context when reading */}
          {bookTitle && (
            <div className="hidden md:flex items-center gap-3 rounded-full border border-amber-500/25 bg-gradient-to-r from-room-3/90 via-room-2/90 to-room-3/90 px-4 py-1.5 text-xs text-ink shadow-md backdrop-blur-md">
              {/* Animated Live Equalizer Bars */}
              <div className="flex items-end gap-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <span className="w-0.5 bg-amber-400 rounded-full h-full animate-[pulse_1s_ease-in-out_infinite]" />
                <span className="w-0.5 bg-amber-500 rounded-full h-2/3 animate-[pulse_1.2s_ease-in-out_infinite]" />
                <span className="w-0.5 bg-amber-300 rounded-full h-4/5 animate-[pulse_0.8s_ease-in-out_infinite]" />
              </div>
              <span className="font-medium truncate max-w-[200px] lg:max-w-[320px] text-ink-strong">
                {bookTitle}
              </span>
              {currentPage && totalPages && (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-brass-strong font-mono text-[0.7rem] font-semibold shrink-0">
                  Page {currentPage} / {totalPages}
                </span>
              )}
            </div>
          )}

          {/* Right side: Mode Switcher + Action CTA */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <AdminLink />
            <UserMenu />
            {action}
          </div>
        </div>
      </header>

      {/* Shortcuts Quick Modal */}
      {showShortcuts && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-room-2 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="font-display text-lg font-semibold text-ink-strong">⌨️ Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-room-3 hover:text-ink-strong cursor-pointer"
              >
                ✕
              </button>
            </div>
            <ul className="mt-4 flex flex-col gap-3 text-xs">
              <li className="flex items-center justify-between">
                <span className="text-ink-soft">Play / Pause Narration</span>
                <kbd className="rounded-md border border-[var(--color-border)] bg-room-3 px-2.5 py-1 font-mono text-brass-strong shadow-xs">Space</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-soft">Next Page</span>
                <kbd className="rounded-md border border-[var(--color-border)] bg-room-3 px-2.5 py-1 font-mono text-brass-strong shadow-xs">→</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-soft">Previous Page</span>
                <kbd className="rounded-md border border-[var(--color-border)] bg-room-3 px-2.5 py-1 font-mono text-brass-strong shadow-xs">←</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-soft">Stop Playback</span>
                <kbd className="rounded-md border border-[var(--color-border)] bg-room-3 px-2.5 py-1 font-mono text-brass-strong shadow-xs">S</kbd>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
