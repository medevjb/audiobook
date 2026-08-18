import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    alias: [
      // PDF.js ships a modern build that calls Promise.try, which Node 22 does
      // not implement. Tests run against the transpiled legacy build, exactly
      // as PDF.js recommends for non-browser environments. The browser bundle
      // is unaffected and still uses the modern build.
      { find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
    ],
  },
})
