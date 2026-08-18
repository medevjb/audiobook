import { useEffect } from 'react'

export interface KeyboardShortcutActions {
  /** Only listens while a book is actually open and readable. */
  enabled: boolean
  onPlayPause(): void
  onStop(): void
  onNext(): void
  onPrevious(): void
  onIncreaseSpeed(): void
  onDecreaseSpeed(): void
}

/**
 * Global keyboard shortcuts (PRD §34). Ignored while the user is typing
 * anywhere — the page-number field and the language/voice/speed selects are
 * all real inputs a Right Arrow or "-" keystroke must reach normally, not
 * get hijacked by a page-turn or speed change.
 */
export function useKeyboardShortcuts({
  enabled,
  onPlayPause,
  onStop,
  onNext,
  onPrevious,
  onIncreaseSpeed,
  onDecreaseSpeed,
}: KeyboardShortcutActions) {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }

      switch (event.key) {
        case ' ':
          event.preventDefault() // otherwise the browser scrolls the page
          onPlayPause()
          break
        case 'ArrowRight':
          onNext()
          break
        case 'ArrowLeft':
          onPrevious()
          break
        case 'Escape':
          onStop()
          break
        case '+':
        case '=':
          onIncreaseSpeed()
          break
        case '-':
        case '_':
          onDecreaseSpeed()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onPlayPause, onStop, onNext, onPrevious, onIncreaseSpeed, onDecreaseSpeed])
}
