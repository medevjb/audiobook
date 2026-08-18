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
      className={`rounded-lg border-2 border-dashed p-10 text-center transition-colors duration-150 ${
        isDragging ? 'border-brass bg-brass/10' : 'border-ink-on-page-soft/30'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <p className="font-display text-lg text-ink-on-page">Drag a PDF here</p>
      <p className="mt-1 text-sm text-ink-on-page-soft">or choose a file from your computer</p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-6 rounded-md bg-ink-on-page px-6 py-2.5 text-sm font-semibold text-page transition-colors hover:bg-ink-on-page/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-50"
      >
        Upload PDF
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Upload PDF"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Reset so re-picking the same file fires change again.
          event.target.value = ''
          if (file) onFileSelected(file)
        }}
      />
    </div>
  )
}
