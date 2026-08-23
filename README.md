# Audiobook Reader

A local-first web app that turns a PDF into an audiobook — upload a book,
pick a page, and have it read aloud in your browser. Sign in to sync your
library, reading progress, and preferences across sessions; your PDF bytes
themselves still never leave the device that opened them. A signed-in
account with the admin role can manage users and app-wide settings at
`/admin`.

See [`docs/PRD.md`](docs/PRD.md) for the full product spec and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it's built: the layer
structure, the data model, the account/sync design, the admin panel and
routing (§10), and the "Reading Room" visual design system.

To grant the admin role, update the database directly (there's no
self-service promotion):

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Getting started

The frontend runs standalone (`npm run dev`), but signing in requires the API
server — see [`server/README.md`](server/README.md) for one-time local
Postgres setup, then:

```bash
npm install
npm run dev:all   # frontend + API together, via concurrently
```

## Commands

```bash
npm run dev        # start the frontend dev server only
npm run dev:server # start the API server only
npm run dev:all    # start both together
npm run build      # typecheck and build for production
npm test           # run the frontend test suite once
npm run test:watch # run tests in watch mode
npm run lint        # lint
npm run typecheck   # typecheck only, no build
```

Backend commands (`npm --prefix server run <script>`) are documented in
[`server/README.md`](server/README.md).

## Stack

React, TypeScript, Vite, Tailwind CSS, Zustand, PDF.js, and the browser's
built-in Web Speech API on the frontend; Node, Express, TypeScript, and
PostgreSQL on the API server. No paid APIs, no cloud storage of PDF content.
