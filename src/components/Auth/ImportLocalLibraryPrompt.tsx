import { useState } from 'react'

interface ImportLocalLibraryPromptProps {
  pendingCount: number
  onImport(): Promise<void>
  onDismiss(): void
}

/**
 * Offers to associate books already in this browser's local library with the
 * account just signed into (`useLocalLibraryImport`). Declining doesn't
 * delete anything locally — it just clears this prompt for now.
 */
export function ImportLocalLibraryPrompt({ pendingCount, onImport, onDismiss }: ImportLocalLibraryPromptProps) {
  const [importing, setImporting] = useState(false)

  async function handleImport() {
    setImporting(true)
    try {
      await onImport()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brass/30 bg-brass/10 p-4 shadow-sm">
      <p className="flex-1 min-w-[16rem] text-sm text-ink-strong">
        You have {pendingCount} {pendingCount === 1 ? 'book' : 'books'} from before signing in — add{' '}
        {pendingCount === 1 ? 'it' : 'them'} to your account?
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-room-3 cursor-pointer"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={importing}
          className="rounded-lg bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-bold text-room shadow-sm transition-all hover:shadow-md disabled:opacity-60 cursor-pointer"
        >
          {importing ? 'Adding…' : 'Add to account'}
        </button>
      </div>
    </div>
  )
}
