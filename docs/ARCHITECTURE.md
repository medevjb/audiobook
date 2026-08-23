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
├── types/              book.ts · reader.ts · preferences.ts · auth.ts
├── utils/              file.ts · page.ts · language.ts · settings.ts · errors.ts · sync.ts
├── services/
│   ├── pdf/            pdfService.ts · textExtractor.ts
│   ├── speech/         types.ts · BrowserTTSProvider.ts · textChunker.ts
│   ├── ocr/            ocrService.ts            (contract only until M12)
│   ├── storage/        db.ts · bookStorage.ts · progressStorage.ts · preferencesStorage.ts
│   ├── api/             client.ts                (fetch adapter, §9)
│   ├── auth/            authService.ts
│   └── sync/             libraryApi.ts · progressApi.ts · preferencesApi.ts
├── store/              bookStore · readerStore · speechStore · preferencesStore · authStore
├── hooks/              usePdf · useSpeech · useReadingProgress · useAuth · usePreferencesSync ·
│                        useLocalLibraryImport
└── components/         Upload · PdfViewer · Player · SpeechSettings · ReaderText · Auth

server/                 Express + PostgreSQL API — accounts and sync (§9); see server/README.md
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
- No network call carries book *content* — PDF bytes are never uploaded, and
  the only outbound requests are the OCR model download (consent-gated,
  decision 4) and, once signed in, the account/sync calls to `server/`
  described in §9. Those calls carry book *metadata* (filename, page count,
  reading position, language/voice/speed preferences) but never a PDF's
  bytes.
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

Two full palettes now — dark (default) and `[data-theme='light']`/`html.light`
— added by a later "polish + dark mode" pass. Values below are current as of
this section's last edit; **this table drifted out of sync with the code
once already** (the version replaced here still showed the pre-dark-mode V1
hex values), so treat `src/index.css` as the source of truth if they ever
disagree again.

| Token | Dark | Light | Role |
|---|---|---|---|
| `--color-room` | `#0c0e12` | `#f5f3ef` | App background — the dim room |
| `--color-room-2` / `-3` | `#14171f` / `#1c212c` | `#ffffff` / `#eae5dc` | Header, status bar, control chrome |
| `--color-page` / `-dim` | `#fbf9f5` / `#f2ece1` | `#ffffff` / `#f5f0e6` | The PDF canvas card, the reading-text panel — anything that *is* the book |
| `--color-ink` / `-strong` / `-soft` | `#e2e8f0` / `#ffffff` / `#94a3b8` | `#334155` / `#0f172a` / `#64748b` | Text on room surfaces |
| `--color-ink-on-page` / `-soft` | `#18181b` / `#52525b` | `#0f172a` / `#64748b` | Text on paper surfaces |
| `--color-brass` / `-strong` | `#f59e0b` / `#fbbf24` | `#d97706` / `#b45309` | The one accent — active states, focus rings, the lamp glow |
| `--color-rose` / `-soft` | `#f43f5e` / `#3f171d` | `#e11d48` / `#ffe4e6` | Errors only — semantic, not brand |
| `--color-emerald` | `#10b981` | `#059669` | Success/active states (added with the admin panel, §10) |
| `--color-border` / `-subtle` | `rgba(255,255,255,.08)` / `.05` | `rgba(0,0,0,.09)` / `.05` | Hairlines |

Deliberately not the cream-serif-terracotta or near-black-neon-accent defaults:
the dark surface is warm, not cold; the accent is brass, not terracotta or
neon; and the two-surface (room/page) structure carries meaning rather than
being a flat single-mode palette.

### Type

Current stacks (`--font-display`/`--font-sans`/`--font-content` in
`src/index.css`) lead with **Newsreader** (display, serif), **Plus Jakarta
Sans** (UI/body), and **Lora** (content) respectively, falling back to the
V1 self-hosted pair — **Fraunces** (`@fontsource/fraunces`, 400/500/600 +
italic) and **Work Sans** (`@fontsource/work-sans`, 400/500/600/700) — and
then system stacks.

- **Display**: used with restraint — the wordmark, headlines. Never running text.
- **UI/body**: every control, label, and piece of English chrome.
- **Content** (`--font-content`): extracted book text and any label rendered
  in a non-Latin script (native voice/language names, PRD §21) must not be
  forced into the UI face — it has no Bengali, Devanagari, Arabic or CJK
  glyphs. Non-Latin content renders in the OS's own font stack.
- Page numbers, speed values and other counters use `tabular-nums`, not a
  third typeface.

**Known privacy-posture gap, introduced by the same dark-mode pass, not yet
fixed:** Newsreader/Lora/Plus Jakarta Sans are loaded via a Google Fonts
`<link>` in `index.html`, not self-hosted — the V1 principle documented here
("fonts are self-hosted... zero runtime network calls for typography," PRD
§3.2/§3.3) currently does not hold for the *lead* faces, only their
self-hosted fallbacks. This is a real deviation worth closing (self-host the
three Google fonts the same way Fraunces/Work Sans already are), not
something this pass fixes — flagged here so it isn't mistaken for still-true.

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

## 9. Accounts and sync

V1's "no accounts, no backend" principles (PRD Rule 1/2/11, §47) were an
intentional constraint for that milestone, not a permanent architectural
ceiling — the product has since grown a second, deliberately thin layer: a
custom Express/PostgreSQL API (`server/`) that gates the app behind a
session and syncs library metadata, reading progress, and preferences per
account, while the local-first storage described in §3 is unchanged and
remains the source of truth for the PDF bytes themselves.

### 9.1 Why hybrid, not full-cloud

The app stays **local-first with sync**, not cloud-storage-first:

- **PDF bytes never leave the device that opened them.** IndexedDB's
  `bookFiles` store (§3) is still the only place a book's content lives.
  `server/` only ever sees `BookSummary`/`BookProgress`/`UserPreferences` —
  metadata, never a `Blob`.
- Every sync call is **best-effort and fire-and-forget**: a failed or absent
  network request never blocks, delays, or breaks the local save it
  accompanies. Logged-out and offline behavior are byte-for-byte what V1
  shipped.
- This means a book known to an account from one device is not necessarily
  *openable* on another until it's re-uploaded there too. `LibraryEntry`
  (`useLibrary.ts`) carries a `hasFile: boolean` for exactly this: `true`
  when this browser's IndexedDB actually has the blob, `false` when the
  entry is metadata synced in from elsewhere. `RecentBooks.tsx` renders the
  latter as "synced from another device" rather than a dead Open button.
  Making a synced book fully portable would mean moving PDF storage
  server-side (object storage) — a real future step, deliberately not taken
  here to keep this pass additive rather than a rewrite of §3's model.

### 9.2 Auth mechanics

- **Custom-built, not a managed provider** (no Supabase/Clerk/Auth0) —
  against a local PostgreSQL instance the app owns via a dedicated
  low-privilege role (`server/README.md`), on the reasoning that per-user
  data isolation should be something this codebase can reason about
  directly rather than a third party's black box.
- **Sessions, not JWTs.** `sessions` is a real table (`server/db/migrations/
  0002_create_sessions.sql`); the cookie holds only an opaque random token,
  and the server stores just its SHA-256 hash. A stolen DB snapshot alone
  can't be replayed as a live session, and revocation is a `DELETE` rather
  than waiting out a token's expiry — the property a JWT can't give you
  without adding a revocation list back on top, at which point it isn't
  simpler than a session table.
- Passwords are `bcrypt` (cost 12). Login runs `bcrypt.compare` against a
  precomputed dummy hash even for an unknown email, so response timing can't
  be used to enumerate registered addresses.
- CSRF defense is SameSite=Lax cookies plus a required `X-Requested-With`
  header on every mutating request (`server/src/app.ts`) — deliberately not
  a double-submit token scheme, since the header already can't be attached
  by a plain cross-site form post, and a script-based cross-site request
  would need CORS permission the server doesn't grant.
- **Authorization is an app-layer discipline, not just a schema property.**
  Every table that holds user data is keyed by `user_id` with a
  `REFERENCES users(id)` foreign key, but the FK alone only guarantees
  referential integrity — it does not stop a query that forgot its `WHERE`.
  The actual isolation boundary is that every repository function
  (`server/src/db/repositories/*.ts`) takes `userId` as its first parameter,
  sourced from the session by `requireAuth` middleware, never from the
  request body, and every query filters or sets by it. Cross-user isolation
  is covered by dedicated tests in `server/src/routes/*.test.ts`.

### 9.3 Data model addendum

Postgres (`server/db/migrations/`), scoped by `user_id` throughout:

```
users             id · email · password_hash
sessions          token_hash (PK) · user_id · expires_at · last_seen_at
library_books     user_id + book_id (unique) · filename · size · last_modified · total_pages · added_at
reading_progress  user_id + book_id (PK) · filename · current_page · total_pages · language? · voice_uri? · rate? · auto_advance? · updated_at
user_preferences  user_id (PK) · language · voice_uri? · rate · auto_advance
```

`book_id` is the same client-derived `deriveBookId()` string from §3 —
opaque to the server, just a sync key. `library_books` and `reading_progress`
are intentionally not foreign-keyed to each other, mirroring the client's own
independent IndexedDB stores: deletion is coordinated in application code on
both sides, not via cascade, and the client's two sync calls (on book save,
on progress save) don't need a strict write order relative to each other.

### 9.4 Frontend integration and the `preferencesStore` precedent

`authStore.ts` and every other store touched by this feature stay pure
reducers — no service calls — matching the dependency rule in §1. All async
orchestration (`checkSession`/`login`/`signup`/`logout`, the sync calls
themselves) lives in hooks (`useAuth.ts`, `usePreferencesSync.ts`, and
additions to `usePdf.ts`/`useReadingProgress.ts`/`useLibrary.ts`).

`preferencesStore.ts` predates this feature and is the one existing store
that calls a service directly (`loadPreferences`/`savePreferences` at module
scope and inside `update()`) — a known, pre-existing exception to §1's rule.
This feature deliberately does **not** extend that exception: preference
*sync* is a separate hook (`usePreferencesSync.ts`) rather than a change to
`preferencesStore.ts` itself, and does not attempt a drive-by fix of the
store's existing localStorage-in-store pattern either. Both remain as
documented tech debt, unchanged by this pass.

### 9.5 Out of scope (by design, this pass)

Billing, organizations/teams, and any other multi-tenant concept — every
table's isolation key is `user_id`, and adding an `account_id` layer later is
additive (a nullable column, a 1:1 backfill, a table-by-table cutover), not a
rewrite. Also out of scope: moving PDF bytes server-side (§9.1), social
login, and email verification/password reset (a forgotten password is
currently unrecoverable — acceptable at this scale; the schema's separate
`email`/`password_hash` columns don't block adding a reset-token table
later).

## 10. Admin panel, client-side routing, and the public landing page

Implements [GitHub issue #9](https://github.com/medevjb/audiobook/issues/9).
Two gaps §9 left open: nobody could manage accounts or app-wide settings
without touching the database directly, and gating the whole app behind
login (§9) removed the pre-login page visitors used to see. This section
covers both, plus the routing layer both required.

### 10.1 Roles, suspension, and why it's enforced per-request

`users` gained `role` (`'user' | 'admin'`) and `status` (`'active' |
'suspended'`). The load-bearing decision: **suspension is checked on every
authenticated request, not just at login.** `requireAuth`'s session lookup
now joins `users` for `role`/`status` in the same query it already ran (no
extra round trip); a `suspended` status deletes the session and 403s
immediately. Without this, an admin suspending someone mid-session would
have no visible effect until that person's session naturally expired —
plausibly days later, per §9.2's TTL.

Authorization for `/api/admin/*` follows the same app-layer-discipline
principle as §9.2: a `requireAdmin` middleware checks `req.userRole`, but
the FK/schema alone doesn't enforce anything — every admin repository
function still just runs the query it's given.

### 10.2 `app_settings` and `audit_log`

`app_settings` is a **singleton row** (`id` fixed to `1`, seeded by
migration) rather than a key-value table — five settings values don't
justify EAV modeling, and a fixed-shape row means `getSettings()` never
needs upsert-on-read logic. Fields: `site_name`, `tagline`, `logo_url`
(branding — the public landing page's only view into this table, via
`GET /api/settings/public`), `session_ttl_hours`, `min_password_length`
(security policy), `signups_enabled`, `maintenance_mode` +
`maintenance_message` (signup control).

Two settings changed how `routes/auth.ts` behaves, deliberately narrowly:

- **Session TTL is read at session-creation time**, not baked into a
  constant — an admin lowering it only affects sessions created afterward;
  existing sessions keep the expiry they were issued with. Force-logging
  everyone out is a separate, unbuilt "revoke all" action.
- **Password length is a runtime check**, not a static zod `.min(8)` — the
  zod schema only sanity-bounds length (`min(1).max(200)`); the real minimum
  is compared against `app_settings.minPasswordLength` inside the route
  handler, so lowering or raising the policy takes effect on the very next
  signup.

`audit_log` records every admin mutation (`user.suspend`, `user.reactivate`,
`settings.update`) with actor, action, target, and a `metadata` jsonb blob
(settings updates store `{before, after}`). Every admin mutation writes its
data change and its audit row **inside one transaction**
(`withTransaction` in `server/src/db/pool.ts`) — an action and its audit
record can never diverge. `audit_log.actor_user_id` is `ON DELETE CASCADE`;
since this app has no user-*delete* feature (only suspend), that edge case
doesn't currently arise in practice, but note `app_settings.updated_by` is
a plain `REFERENCES` with no cascade — a user who has ever saved settings
can't be deleted while that FK points at them (again, moot today; there is
no delete-user feature to trip it).

### 10.3 Routing — the app's first router

`App.tsx`/`AuthGate.tsx` used to be the *entire* client-side navigation
model: a Zustand-state ternary (book open → reader, else → home), with
`AuthGate` blocking everything behind a full-screen login form. A public
landing page plus a multi-view admin panel is real navigable surface area a
state ternary doesn't scale to, so this is the point `react-router-dom` was
introduced — scoped narrowly, not a rewrite of the reader's own internal
navigation, which is untouched and still Zustand-driven.

```
/                    RequireGuest   LandingPage
/login, /signup      RequireGuest   AuthScreen (initialMode prop, one component for both)
/app                 RequireAuth    AppShell → App.tsx (unchanged)
/admin/*             RequireAdmin   AdminLayout + nested pages
```

`AuthGate` was **narrowed**: it now only resolves `authStore.status` once on
mount (splash while unknown) and renders `children` — the route tree. It no
longer renders the login screen itself; that moved to the `/login` route via
`RequireGuest`, since an unauthenticated visitor now has somewhere else to
land first (`/`). `RequireAuth`/`RequireGuest`/`RequireAdmin`
(`src/app/routeGuards.tsx`) are thin `<Outlet/>`-or-`<Navigate/>` wrappers
reading `authStore` — **UX only**; `requireAuth`/`requireAdmin` on the
server are the actual boundary, same relationship as §9's client/server
auth split.

The local-library-import prompt (`useLocalLibraryImport`, previously in
`AuthGate`) moved to a new `AppShell.tsx` — the `/app` route's element —
since it's specific to entering the reader app, not relevant to `/admin`.

### 10.4 Admin UI and the landing page

Admin UI (`src/components/Admin/`) mirrors the `useLibrary` fetch/refresh
hook shape already established in §3/§9 (`hooks/admin/use*`) — deliberately
plain: a sidebar shell (`AdminLayout.tsx`, §10.6), tables, a settings form.
This is a tool for one person to act quickly, not a marketing surface, so it
takes no visual risks and reuses the existing tokens (§8) directly rather
than inventing new ones.

The landing page (`src/components/Landing/LandingPage.tsx`) is the opposite
brief — built with the `frontend-design` skill specifically so it wouldn't
read as templated. Its signature element is the hero's "lit page": a real
excerpt of book text where sentences take turns highlighting in amber,
directly demonstrating the product's actual chunk-highlighting during
narration (PRD §23) rather than a static screenshot — the CSS keyframe lives
in `src/index.css` (`hero-sentence-highlight`) alongside the rest of the
token system it draws from, and degrades to a plain, unhighlighted page
under `prefers-reduced-motion` via the existing global reduced-motion rule.
Branding text (site name, tagline) comes from `GET /api/settings/public`
via `usePublicSettings`, with the same defaults the database seeds, so it
never renders blank while loading or offline.

Because the landing page now carries the marketing pitch, **`HomeScreen.tsx`
was trimmed** to just `DropZone` + `RecentBooks` — the hero/features/how-it-
works sections that used to live there would otherwise repeat the same pitch
to an already-signed-in user every time their library happened to be empty.

### 10.5 Out of scope

Editing user account data (email/password) or deleting accounts
(suspend/reactivate only), multiple admin permission levels beyond the
binary `user`/`admin` role, and email notifications on account actions.
(Self-service admin *promotion via signup* is still impossible — role
changes are an existing-admin-only action, §10.6 — but promotion/demotion
through the panel itself now exists, superseding the original "manual
database update only" decision; see §10.6.)

### 10.6 Follow-up: sidebar dashboard, role management, reading activity, language allowlist

A second pass, requested immediately after §10.1–10.5 shipped, once real use
surfaced three gaps: the top-bar admin layout didn't scale as a "dashboard,"
there was no way to grant/revoke the admin role without a manual SQL
`UPDATE`, and there was no admin-side control over which languages the
reader offers.

- **`AdminLayout.tsx` rewritten as a sidebar shell** (fixed `w-60` left nav:
  Dashboard/Users/Settings/Audit log, account controls pinned at the
  bottom) rather than a top bar — the standard shape for a panel with more
  than two or three destinations. New `AdminDashboardPage.tsx` is the
  `/admin` index route (previously a bare redirect to `/admin/users`):
  user/active/suspended/admin counts and the 5 most recent audit entries,
  computed client-side from data `useAdminUsers`/`useAdminAuditLog` already
  fetch — no new aggregation endpoint needed at this scale.
- **Role change** (`PUT /api/admin/users/:id/role`) follows the exact
  suspend/reactivate pattern in §10.1 (`withTransaction` + audit row,
  action `user.role_change`, metadata `{from, to}`), with one added guard:
  **an admin cannot change their own role.** Without it, the only admin
  could demote themselves with no other admin left to reverse it — the only
  recovery would again be the manual database update this feature was
  built to avoid needing. The button is disabled client-side for your own
  row too, but the server check is what actually matters.
- **Read-only reading activity** on the user detail page
  (`GET /api/admin/users/:id/library` and `/progress`) reuses the existing
  `libraryRepo.listLibraryByUser`/`progressRepo.listProgressByUser`
  unchanged — both already took an arbitrary `userId` (previously always
  called with the requester's own id from `req.userId`), so exposing them
  to an admin for any target user needed no repository changes, only new
  thin routes and a cross-user-isolation test.
- **Language allowlist**: `app_settings.allowed_languages` (`TEXT[]`,
  defaults to all 12 codes from `src/utils/language.ts`'s `LANGUAGES` — the
  same list is duplicated as `LANGUAGE_CODES` in the server's
  `lib/validation.ts` for zod validation, no shared package between the two
  TS projects). A new authenticated-but-not-admin-only route,
  `GET /api/settings/languages`, exists because every signed-in user's
  `LanguageSelector` needs this, not just admins — distinct from the
  admin-only full settings endpoint. **Voices themselves are deliberately
  not admin-controllable**: they're enumerated client-side per
  device/browser via `speechSynthesis.getVoices()`, so the server has no
  visibility into what any given user's OS actually offers. Restricting
  language is the practical equivalent at the app level, since voice choice
  is already filtered by language in the UI. Device-detected languages
  outside the curated 12 (`allVoiceLanguages` in `utils/language.ts`, PRD
  §1's "other languages the browser supports") are **not** subject to the
  allowlist — they're a capability fallback, not a curated catalog to
  police.
