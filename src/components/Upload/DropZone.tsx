import { useRef, useState, type DragEvent } from 'react'

interface DropZoneProps {
  onFileSelected(file: File): void
  disabled?: boolean
}

/**
 * File picker plus drag-and-drop target (PRD §9). Accepts any dropped file and
 * hands it upward — validation and error messaging belong to the caller, so
 * the user still gets told why a non-PDF was rejected.
 */
export function DropZone({ onFileSelected, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = event.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center transition-all duration-200 ${
        isDragging
          ? 'border-brass bg-brass/10 scale-[0.99] shadow-inner'
          : 'border-ink-on-page-soft/20 bg-page hover:border-ink-on-page-soft/45'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-page-dim shadow-inner text-brass-strong mb-5 transition-transform duration-200 hover:scale-110">
        <svg className="h-8 w-8 text-ink-on-page" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      </div>

      <p className="font-display text-2xl sm:text-3xl font-normal text-ink-on-page">Drag a PDF here</p>
      <p className="mt-2 text-sm text-ink-on-page-soft font-sans max-w-sm">
        or choose a file from your computer to start reading immediately
      </p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-ink-on-page px-8 py-3.5 text-sm font-semibold text-page shadow-md transition-all duration-150 hover:bg-ink-on-page/90 hover:shadow-xl active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <svg className="h-4 w-4 text-page" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Upload PDF
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[0.7rem] text-ink-on-page-soft/80">
        <span className="rounded-md bg-page-dim px-2.5 py-1 font-medium">📄 PDF format</span>
        <span className="rounded-md bg-page-dim px-2.5 py-1 font-medium">🔍 OCR support</span>
        <span className="rounded-md bg-page-dim px-2.5 py-1 font-medium">🔒 On-device</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Upload PDF"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onFileSelected(file)
        }}
      />
    </div>
  )
}
