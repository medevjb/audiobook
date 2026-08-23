import { Link } from 'react-router-dom'
import { usePublicSettings } from '../../hooks/usePublicSettings'

const HERO_SENTENCES = [
  'The library had gone quiet by the time she found the letter.',
  'It was tucked between two water-stained pages near the back of the drawer.',
  'She read it twice before she believed it.',
]

const DIFFERENCES = [
  {
    label: 'Natural voices',
    body: "Every voice already on your device, in your language — Bengali, Arabic, Japanese, and dozens more. Aloud won't read Hindi in an English accent.",
  },
  {
    label: 'Every page, even scanned ones',
    body: 'Photocopies and scans get read too. Aloud recognizes the text first, then speaks it — no page left silent.',
  },
  {
    label: 'Pick up where you left off',
    body: 'Close the tab mid-chapter. Come back tomorrow, from another device — Aloud remembers the page, the voice, the speed.',
  },
]

const STEPS = [
  { title: 'Upload your PDF', body: 'A novel, a textbook, a scanned chapter — drop it in.' },
  { title: 'Choose a voice', body: 'Pick a language; Aloud narrows to the voices that speak it.' },
  { title: 'Press play', body: 'Reading continues page to page on its own, or you drive.' },
]

/**
 * The pre-login landing page. Built with the `frontend-design` skill: the
 * hero's animated "lit page" is a direct demo of the product's real chunk-
 * highlighting during narration (PRD §23), not a screenshot — the sentences
 * genuinely take turns lighting up, echoing the app's own signature "page
 * under a lamp" surface (docs/ARCHITECTURE.md §8) rather than inventing a
 * new visual language for the marketing page alone.
 */
export function LandingPage() {
  const { siteName, tagline } = usePublicSettings()

  return (
    <div className="min-h-screen bg-room">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg font-semibold text-ink-strong">{siteName}</span>
          <span className="hidden text-xs text-ink-soft sm:inline">{tagline}</span>
        </div>
        <Link
          to="/login"
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink-strong"
        >
          Log in
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:px-8 sm:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center"
          >
            <div className="h-[520px] w-[900px] rounded-full bg-gradient-to-b from-amber-500/14 via-amber-600/6 to-transparent blur-3xl" />
          </div>

          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-normal tracking-tight text-ink-strong sm:text-6xl sm:leading-[1.1]">
              Read with your eyes.{' '}
              <span className="block font-medium italic text-brass-strong sm:inline">Listen with your ears.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Upload any PDF and {siteName} reads it back in a natural voice, picking up exactly where you left off.
              Your book stays on your device — only your place in it follows you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-room shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-amber-500/35"
              >
                Start listening
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-ink-strong transition-colors hover:bg-room-2"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* The signature moment: a lit page, sentences taking turns being narrated. */}
          <div className="relative mx-auto mt-16 max-w-xl sm:mt-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -top-10 -z-10 h-40 rounded-[100%] bg-brass/20 blur-3xl"
            />
            <div className="rounded-3xl bg-page p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/5 sm:p-8">
              <div className="flex items-center justify-between border-b border-ink-on-page/10 pb-3 text-xs font-medium text-ink-on-page-soft">
                <span>Chapter 4 · The Letter</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />
                  Narrating
                </span>
              </div>
              <p className="mt-4 font-content text-base leading-relaxed text-ink-on-page sm:text-lg">
                {HERO_SENTENCES.map((sentence, i) => (
                  <span
                    key={sentence}
                    className="rounded px-0.5 motion-safe:animate-[hero-sentence-highlight_9s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 3}s` }}
                  >
                    {sentence}{' '}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </section>

        {/* What's actually different */}
        <section className="border-t border-[var(--color-border-subtle)] px-6 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
            {DIFFERENCES.map((item) => (
              <div key={item.label}>
                <h2 className="font-display text-lg font-medium text-ink-strong">{item.label}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — a real sequence, so numbers earn their place here */}
        <section className="border-t border-[var(--color-border-subtle)] bg-room-2/50 px-6 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl font-normal text-ink-strong sm:text-3xl">How it works</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex flex-col gap-2">
                  <span className="font-display text-3xl font-normal text-brass/50">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="font-sans text-base font-semibold text-ink-strong">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-[var(--color-border-subtle)] px-6 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="font-display text-2xl font-normal text-ink-strong sm:text-3xl">
            Your next book is already a PDF somewhere.
          </h2>
          <Link
            to="/signup"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-room shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-amber-500/35"
          >
            Start listening
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border-subtle)] px-6 py-8 text-center text-xs text-ink-soft sm:px-8">
        Your PDF stays on your device — only your reading position, preferences, and library metadata sync to your
        account.
      </footer>
    </div>
  )
}
