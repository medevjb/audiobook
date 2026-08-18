import '@testing-library/jest-dom/vitest'

// pdfjs-dist v6 touches DOMMatrix/Path2D/ImageData at module-evaluation time
// (src/display/canvas.js). jsdom implements none of them, so importing the
// library in any test file throws without these stubs. They are sufficient for
// text-extraction tests; canvas rendering must be verified in a real browser.
const g = globalThis as Record<string, unknown>
g.DOMMatrix ??= class DOMMatrix {}
g.Path2D ??= class Path2D {}
g.ImageData ??= class ImageData {}
