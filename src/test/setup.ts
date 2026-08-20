import '@testing-library/jest-dom/vitest'

// pdfjs-dist v6 touches DOMMatrix/Path2D/ImageData at module-evaluation time
// (src/display/canvas.js). jsdom implements none of them, so importing the
// library in any test file throws without these stubs. They are sufficient for
// text-extraction tests; canvas rendering must be verified in a real browser.
const g = globalThis as Record<string, unknown>
g.DOMMatrix ??= class DOMMatrix {}
g.Path2D ??= class Path2D {}
g.ImageData ??= class ImageData {}

// Provide a standard localStorage in test environments where Node 22 doesn't provide one
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.clear !== 'function') {
  let store: Record<string, string> = {}
  const storageMock: Storage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    writable: true,
    configurable: true,
  })
}

