import { useEffect } from 'react'
import { ImportLocalLibraryPrompt } from '../components/Auth/ImportLocalLibraryPrompt'
import { useLocalLibraryImport } from '../hooks/useLocalLibraryImport'
import { App } from './App'

/**
 * The `/app` route's element. Owns the local-library-import prompt — specific
 * to entering the reader app after signing in, not relevant to the admin
 * panel, so it lives here rather than in `AuthGate` (which now only
 * bootstraps the session for the whole route tree).
 */
export function AppShell() {
  const localImport = useLocalLibraryImport()
  const { check } = localImport

  useEffect(() => {
    void check()
  }, [check])

  return (
    <>
      {localImport.pendingCount > 0 && (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-2xl sm:inset-x-0">
          <ImportLocalLibraryPrompt
            pendingCount={localImport.pendingCount}
            onImport={localImport.importNow}
            onDismiss={localImport.dismiss}
          />
        </div>
      )}
      <App />
    </>
  )
}
