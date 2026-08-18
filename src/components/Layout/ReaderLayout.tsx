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
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-6">
      {viewer}
      <div className="flex flex-col gap-4">{sidebar}</div>
    </div>
  )
}
