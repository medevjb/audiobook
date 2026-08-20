import type { ReactNode } from 'react'

interface ReaderLayoutProps {
  /** The PDF page itself — gets the wider column on desktop. */
  viewer: ReactNode
  /** Settings and controls — a narrower column on desktop, stacked below on
   * mobile and tablet (PRD §32). */
  sidebar: ReactNode
}

/**
 * Two-column reader layout on desktop, single stacked column below `lg`
 * (PRD §32): `PDF viewer / controls / extracted text` on mobile, viewer
 * beside a settings sidebar once there's room for both.
 */
export function ReaderLayout({ viewer, sidebar }: ReaderLayoutProps) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_460px] lg:items-start lg:gap-8 xl:gap-10">
      <div className="min-w-0 w-full">{viewer}</div>
      <div className="flex flex-col gap-4 min-w-0 w-full">{sidebar}</div>
    </div>
  )
}
