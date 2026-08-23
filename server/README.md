# Audiobook Reader — API server

A small Express + TypeScript API providing authentication and per-account
sync of library metadata, reading progress, and preferences for the
audiobook reader frontend. PDF bytes themselves stay client-side (IndexedDB)
— see `docs/ARCHITECTURE.md` in the repo root for the full design.

## One-time local setup

Requires a local PostgreSQL server. Create a dedicated low-privilege role and
two databases (the app never connects as a superuser):

```sql
CREATE ROLE audiobook_app WITH LOGIN PASSWORD 'choose-a-password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE audiobook_reader OWNER audiobook_app;
CREATE DATABASE audiobook_reader_test OWNER audiobook_app;
```

Copy `.env.example` to `.env` and fill in `DATABASE_URL` with that role's
credentials. Create `.env.test` the same way, pointing at
`audiobook_reader_test`.

## Commands

```bash
npm install
npm run db:migrate   # applies server/db/migrations/*.sql, tracked in schema_migrations
npm run dev          # tsx watch src/index.ts, http://127.0.0.1:8787
npm run build        # tsc -b
npm run typecheck
npm test             # vitest against a real audiobook_reader_test database
```

Run `npm run dev` alongside the frontend's `npm run dev` (or use the root
`npm run dev:all`, which runs both via `concurrently`). Vite proxies `/api`
to this server in dev, so the browser only ever talks to one origin.
