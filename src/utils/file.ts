import type { BookId } from '../types/book'

/** The parts of a File that identify a book (PRD §26). */
export interface BookIdentity {
  name: string
  size: number
  lastModified: number
}

/**
 * Lightweight local book identifier (PRD §26): filename alone is not enough,
 * since two different books can share a name.
 *
 * The filename is percent-encoded so a name containing ":" cannot forge a
 * different book's id. A content hash is the documented later upgrade — it
 * would also let the library detect the same book saved under two names.
 */
export function deriveBookId(file: BookIdentity): BookId {
  const name = file.name.normalize('NFC')
  return `${encodeURIComponent(name)}:${file.size}:${file.lastModified}`
}

const PDF_EXTENSION = /\.pdf$/i

/**
 * PRD §9: validate before loading. Browsers report an empty or wrong MIME type
 * often enough that the extension is the more reliable signal, so accept
 * either — PDF.js still rejects anything that is not really a PDF.
 */
export function isPdfFile(file: Pick<File, 'name' | 'type'>): boolean {
  return file.type === 'application/pdf' || PDF_EXTENSION.test(file.name)
}

/** Human-readable size for the library UI, e.g. "12.4 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}
