# Audiobook Reader

A local-first web app that turns a PDF into an audiobook — upload a book,
pick a page, and have it read aloud in your browser. No account, no upload,
no paid API. Your PDF never leaves your device.

See [`docs/PRD.md`](docs/PRD.md) for the full product spec and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it's built: the layer
structure, the data model, and the "Reading Room" visual design system.

## Getting started

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev        # start the dev server
npm run build      # typecheck and build for production
npm test           # run the test suite once
npm run test:watch # run tests in watch mode
npm run lint        # lint
npm run typecheck   # typecheck only, no build
```

## Stack

React, TypeScript, Vite, Tailwind CSS, Zustand, PDF.js, and the browser's
built-in Web Speech API — no backend, no cloud services.
