import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Keeps the browser same-origin with the API in dev, so session
      // cookies work with SameSite=Lax and no CORS preflight is needed.
      '/api': 'http://127.0.0.1:8787',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // The server/ directory is a separate Node package with its own
    // vitest.config.ts (run via `npm --prefix server test`) — without this,
    // Vitest's default glob picks up server/src/**/*.test.ts here too, but
    // against this jsdom config, which can't run them.
    exclude: ['**/node_modules/**', 'server/**'],
    alias: [
      // PDF.js ships a modern build that calls Promise.try, which Node 22 does
      // not implement. Tests run against the transpiled legacy build, exactly
      // as PDF.js recommends for non-browser environments. The browser bundle
      // is unaffected and still uses the modern build.
      { find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
    ],
  },
})
