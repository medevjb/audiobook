import { useEffect, useRef } from 'react'

interface PageCanvasProps {
  pageNumber: number
  /** Draws the page into the canvas. Stable identity expected. */
  render(pageNumber: number, canvas: HTMLCanvasElement): Promise<void>
}

/**
 * Holds the single canvas the current page is drawn into. Exactly one page is
 * live at a time — no pooling, no retained bitmaps (PRD §38).
 */
export function PageCanvas({ pageNumber, render }: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    void render(pageNumber, canvas)
  }, [pageNumber, render])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-auto max-w-full"
      aria-label={`Page ${pageNumber}`}
      role="img"
    />
  )
}
