# Architecture — Local Multilingual Audiobook Reader

Companion to `docs/PRD.md`. This document records the structure, the data
model, and the decisions taken where the PRD was ambiguous or self-conflicting.

---

## 1. Layers and the dependency rule

```
                 ┌──────────────────────────────┐
   UI            │ components/  ·  app/App.tsx  │   React, presentation only
                 └───────────────┬──────────────┘
                                 │ reads state, calls hook actions
                 ┌───────────────▼──────────────┐
   Orchestration │ hooks/                       │   sequencing, side effects
                 └───────┬──────────────┬───────┘
                         │              │
          ┌──────────────▼───┐   ┌──────▼───────────────────────┐
   State  │ store/ (zustand) │   │ services/                    │  browser APIs
          └──────────────────┘   │  pdf · speech · ocr · storage│
                                 └──────┬───────────────────────┘
                 ┌──────────────────────▼──────┐
   Foundation    │ types/  ·  utils/           │   pure, no browser APIs
                 └─────────────────────────────┘
```

**The dependency rule: arrows point down only.** A layer may import from layers
below it, never above or sideways.

| Rule | Why |
|---|---|
| Only `services/` touches a browser API | PRD Rule 5. PDF.js, `speechSynthesis`, IndexedDB, and Tesseract each have exactly one adapter module. |
| Stores hold state and never call a service | Keeps every transition synchronous and unit-testable; async orchestration lives in hooks. |
| `utils/` and `types/` are pure | They carry the logic PRD Rule 7 requires tests for, and run without a DOM. |
| Components never import a service | `App.tsx` composes; it contains no PDF, speech, OCR, or persistence logic (PRD Rule 4). |

## 2. Module map

```
src/
├── types/              book.ts · reader.ts · preferences.ts
├── utils/              file.ts · page.ts · language.ts · settings.ts · errors.ts
├── services/
│   ├── pdf/            pdfService.ts · textExtractor.ts
│   ├── speech/         types.ts · BrowserTTSProvider.ts · textChunker.ts
│   ├── ocr/            ocrService.ts            (contract only until M12)
│   └── storage/        db.ts · bookStorage.ts · progressStorage.ts · preferencesStorage.ts
├── store/              bookStore · readerStore · speechStore · preferencesStore
├── hooks/              usePdf · useSpeech · useReadingProgress
└── components/         Upload · PdfViewer · Player · SpeechSettings · ReaderText
```

Follows PRD §30, with one reconciliation: §30 lists two store files while §28
names four domains. The four domains win — each store stays small and
single-purpose.

## 3. Data model

Three persisted collections. Nothing is ever transmitted (PRD §3.1, §40).

### IndexedDB — `audiobook-reader` v1

```
books        keyPath bookId   index by-addedAt      BookSummary   metadata only
bookFiles    keyPath bookId                         BookFile      the PDF bytes
progress     keyPath bookId   index by-updatedAt    BookProgress  position + overrides
```

**`books` and `bookFiles` are separate stores on purpose.** Rendering the
library must not deserialize every stored PDF; the split keeps that read to a
few hundred bytes per book (PRD §38).

```ts
interface BookSummary {           // books
  bookId: BookId                  // filename + size + lastModified (§26)
  filename: string
  size: number
  lastModified: number
  totalPages: number
  addedAt: number
}

interface BookFile {              // bookFiles
  bookId: BookId
  blob: Blob                      // stored as a Blob, not ArrayBuffer — see §5
}

interface BookProgress {          // progress
  bookId: BookId
  filename: string
  currentPage: number
  totalPages: number
  updatedAt: number
  language?: string               // per-book overrides, all optional
  voiceURI?: string
  rate?: number
  autoAdvance?: boolean
}
```

### localStorage — `audiobook-reader:preferences`

```ts
interface UserPreferences { language: string; voiceURI?: string; rate: number; autoAdvance: boolean }
```

Small, read synchronously during first paint, and non-critical — a corrupt or
blocked store falls back to defaults rather than failing the app. Every field is
re-validated on read: stored JSON is untrusted input.

### Settings resolution

```
resolveReadingSettings(preferences, progress)  →  ReadingSettings
        global default ─────────────┘  └──── per-book override wins
```

`ReadingSettings` is derived state and is never persisted.

## 4. Runtime flows

**Opening a book**

```
File → isPdfFile → deriveBookId → saveBook(summary, blob)
                                → loadPdfDocument(blob)  ← dynamic import of PDF.js
                                → getProgress(bookId) → "Continue from page 57"
```

**Reading a page**

```
goToPage(n) ──stop speech──→ renderPage(n, canvas)
                          └→ extractPageText(n) → PageText
                                                   │ isLikelyScanned?
                                                   ├─ no  → chunkText → speech queue
                                                   └─ yes → OCR fallback (M12)
```

**Speaking a page**

```
chunks[0] ──speak──→ onEnd ──→ chunks[1] ──→ … ──→ page complete
                                                      │ autoAdvance?
                                                      └─ yes → goToPage(n+1)
```

One utterance is in flight at a time; `onEnd` drives the queue. This is why the
`TTSProvider` contract extends PRD §14 with callbacks — sequential chunks (§15)
and chunk highlighting (§23) are both unimplementable without completion events.

## 5. Decisions

Recorded where the PRD was ambiguous, self-conflicting, or silent. The first
four were confirmed with the product owner.

| # | Question | Decision |
|---|---|---|
| 1 | §53 wants resume after closing the app, but a `File` handle cannot survive a reload | **Store PDF bytes in IndexedDB.** Books reopen with no re-picking. Pulls a "recent books" list into V1 and makes storage quota a real failure mode (`storage-quota-exceeded`). |
| 2 | §25 persists language/voice/speed with the book; §27 puts them in global preferences | **Both.** Global defaults, per-book overrides; combined by `resolveReadingSettings`. A Bengali book no longer reopens in an English voice. |
| 3 | §22 requires a "no voice available" warning but does not say what Play does | **Warn and block Play** until the user picks a voice or changes language. Never speaks Bengali text with an English voice. |
| 4 | Tesseract downloads models from a CDN, which §3.3 and Rule 8 forbid without approval | **Ask first.** `ocrService` takes a configurable `modelBaseUrl` and a `ModelConsent` port; no fetch happens without an explicit grant. Book content still never leaves the device. |
| 5 | §14's `TTSProvider` has no completion signal | Extended with `SpeechCallbacks` (`onStart`/`onEnd`/`onError`/`onBoundary`) and `isSupported`/`onVoicesChanged`. |
| 6 | PDF.js is ~2.5 MB with its worker | **Imported dynamically.** A static import moved the entry bundle from 193 kB to 621 kB; the home screen must not pay for it (§37). |
| 7 | Bytes stored as `Blob` or `ArrayBuffer`? | **`Blob`.** A `File` is already a `Blob`, so import is a zero-copy handoff; an `ArrayBuffer` would spike the heap by the size of the book on every save (§38). Cost: not verifiable under jsdom — see §7. |
| 8 | `idb` added as a dependency | 1 kB promise wrapper over IndexedDB. Raw IndexedDB for a three-store schema with versioned migrations is materially more error-prone; not a framework, so Rule 3 is untouched. |

## 6. Security and privacy posture

- Uploaded PDFs are untrusted input. Extracted text is rendered as React text
  nodes; `dangerouslySetInnerHTML` is banned for book content (§39).
- No network call carries book content. The only outbound request in the entire
  product is the OCR model download, which is consent-gated (decision 4).
- Failures travel as `AppError` with a `ReaderErrorCode`, so the UI branches on
  a code and renders a recoverable state instead of crashing (§35).

## 7. Known verification gaps

| Gap | Why | Status |
|---|---|---|
| PDF.js canvas rendering, worker loading, dynamic-import chunking | jsdom has no canvas or `DOMMatrix` (stubbed in `src/test/setup.ts`) | **Verified manually in Chrome** at Milestone 2 — 3-page fixture rendered correctly, `Page 1 / 3` correct, worker chunk loaded, console clean. |
| Blob round-trip through IndexedDB | jsdom's `structuredClone` does not preserve `Blob`; fake-indexeddb returns a plain object | Still open — real IndexedDB clones Blobs faithfully per spec, but this needs a manual browser check once the library UI exists (Milestone 11). |
| Real voice availability | Voices are device-specific; CI has none | Manual multi-browser check at Milestone 9 |

## 8. Visual design system — "The Reading Room"

The product's real promise is a private, calm space where a page becomes a
voice. That is not a marketing thesis needing a hero banner — it is a feeling
the chrome should hold across long listening sessions. The signature idea:
**everything that is content sits on a lit paper surface; everything that is
control lives in a dim, warm room around it** — literally a page under a
reading lamp. One consistent light/dark relationship carries the app's
identity instead of a decorative accent color, and it extends naturally to
screens not yet built (the reading-text panel is paper; the player controls
are room).

### Tokens (`src/index.css`, Tailwind v4 `@theme`)

| Token | Hex | Role |
|---|---|---|
| `--color-room` | `#211E1B` | App background — the dim room |
| `--color-room-2` / `-3` | `#2B2723` / `#363029` | Header, status bar, control chrome |
| `--color-page` | `#FBF7EE` | The PDF canvas card, the future reading-text panel — anything that *is* the book |
| `--color-ink` / `-strong` / `-soft` | `#E8E2D6` / `#FFFCF5` / `#A89E8C` | Text on room surfaces, three weights |
| `--color-ink-on-page` / `-soft` | `#23201B` / `#6B6152` | Text on paper surfaces |
| `--color-brass` / `-strong` | `#D9A441` / `#EAB657` | The one accent — active states, focus rings, the lamp glow |
| `--color-rose` / `-soft` | `#D17A72` / `#4A2F2C` | Errors only — semantic, not brand |

Deliberately not the cream-serif-terracotta or near-black-neon-accent defaults:
the dark surface is warm, not cold; the accent is brass, not terracotta or
neon; and the two-surface (room/page) structure carries meaning rather than
being a flat single-mode palette.

### Type

- **Display — Fraunces** (self-hosted via `@fontsource/fraunces`, weights
  400/500/600 + italic): used with restraint — the wordmark, the empty-state
  headline. Never running text.
- **UI/body — Work Sans** (`@fontsource/work-sans`, 400/500/600/700): every
  control, label, and piece of English chrome.
- **Content — system stack** (`--font-content`): extracted book text and any
  label rendered in a non-Latin script (native voice/language names, PRD §21)
  must not be forced into Work Sans — it has no Bengali, Devanagari, Arabic or
  CJK glyphs, and self-hosting coverage for every PRD-required language would
  cost tens of MB. Non-Latin content renders in the OS's own font stack, which
  already covers it correctly.
- Page numbers, speed values and other counters use `tabular-nums`, not a
  third typeface — keeps the "printed folio" feel without another font family
  to ship.

**Fonts are self-hosted, not CDN-loaded** (`@fontsource/*` packages, bundled at
build time): the product's own privacy principle (PRD §3.2/§3.3 — no external
requests) applies to the app's own assets, not just book content. Zero runtime
network calls for typography.

### Signature element — the lit page

The PDF canvas sits inside a `--color-page` card with a soft brass-tinted glow
(`shadow-[0_0_40px_-18px_var(--color-brass)]`), inside the dark room chrome.
The same card also bounds its own height (`max-h-[65dvh]`) with internal
scroll — a Letter-size page at a legible render scale is taller than most
viewports, and page navigation must stay reachable without scrolling past it.
This became apparent in manual browser testing and was fixed before shipping
Milestone 3: the "running foot" navigation bar (`PageNavigation.tsx`, prev ·
tabular `PAGE 1 / 3` · next) now sits directly under the always-visible page
card rather than below the fold.

The Home screen introduces the same surface as "place a book under the lamp"
— the dropzone lives on paper, with one radial brass glow behind it (the only
place atmosphere is spent, per the design principle of spending boldness in
one place).
