import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { StatusBar } from './StatusBar'

interface AppLayoutProps {
  children: ReactNode
  bookTitle?: string
  currentPage?: number
  totalPages?: number
  headerAction?: ReactNode
  status: string
  statusTone?: 'neutral' | 'error'
}

/**
 * The application frame: header, scrollable content, persistent status line
 * (PRD §31). Holds no reader logic — it only arranges regions.
 */
export function AppLayout({
  children,
  bookTitle,
  currentPage,
  totalPages,
  headerAction,
  status,
  statusTone,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-room text-ink">
      <AppHeader
        bookTitle={bookTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        action={headerAction}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <StatusBar message={status} tone={statusTone} />
    </div>
  )
}
