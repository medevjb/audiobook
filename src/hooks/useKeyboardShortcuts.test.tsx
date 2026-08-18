import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts, type KeyboardShortcutActions } from './useKeyboardShortcuts'

function TestHarness(actions: Partial<KeyboardShortcutActions>) {
  useKeyboardShortcuts({
    enabled: true,
    onPlayPause: vi.fn(),
    onStop: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onIncreaseSpeed: vi.fn(),
    onDecreaseSpeed: vi.fn(),
    ...actions,
  })
  return (
    <div>
      <input aria-label="page number" />
      <select aria-label="a select">
        <option>one</option>
      </select>
      <button type="button">a button</button>
    </div>
  )
}

describe('useKeyboardShortcuts (PRD §34)', () => {
  it('Space toggles play/pause', async () => {
    const user = userEvent.setup()
    const onPlayPause = vi.fn()
    render(<TestHarness onPlayPause={onPlayPause} />)

    await user.keyboard(' ')
    expect(onPlayPause).toHaveBeenCalledOnce()
  })

  it('Right Arrow goes to the next page', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<TestHarness onNext={onNext} />)

    await user.keyboard('{ArrowRight}')
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('Left Arrow goes to the previous page', async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()
    render(<TestHarness onPrevious={onPrevious} />)

    await user.keyboard('{ArrowLeft}')
    expect(onPrevious).toHaveBeenCalledOnce()
  })

  it('Escape stops playback', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()
    render(<TestHarness onStop={onStop} />)

    await user.keyboard('{Escape}')
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('+ increases speed', async () => {
    const user = userEvent.setup()
    const onIncreaseSpeed = vi.fn()
    render(<TestHarness onIncreaseSpeed={onIncreaseSpeed} />)

    await user.keyboard('+')
    expect(onIncreaseSpeed).toHaveBeenCalledOnce()
  })

  it('- decreases speed', async () => {
    const user = userEvent.setup()
    const onDecreaseSpeed = vi.fn()
    render(<TestHarness onDecreaseSpeed={onDecreaseSpeed} />)

    await user.keyboard('-')
    expect(onDecreaseSpeed).toHaveBeenCalledOnce()
  })

  it('does not trigger while typing in a text input (PRD §34)', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    const { getByLabelText } = render(<TestHarness onNext={onNext} />)

    await user.click(getByLabelText('page number'))
    await user.keyboard('{ArrowRight}')
    expect(onNext).not.toHaveBeenCalled()
  })

  it('does not trigger while a select is focused', async () => {
    const user = userEvent.setup()
    const onDecreaseSpeed = vi.fn()
    const { getByLabelText } = render(<TestHarness onDecreaseSpeed={onDecreaseSpeed} />)

    getByLabelText('a select').focus()
    await user.keyboard('-')
    expect(onDecreaseSpeed).not.toHaveBeenCalled()
  })

  it('does nothing when disabled (no book open)', async () => {
    const user = userEvent.setup()
    const onPlayPause = vi.fn()
    render(<TestHarness enabled={false} onPlayPause={onPlayPause} />)

    await user.keyboard(' ')
    expect(onPlayPause).not.toHaveBeenCalled()
  })

  it('still fires when a plain button (not a text field) has focus', async () => {
    const user = userEvent.setup()
    const onPlayPause = vi.fn()
    const { getByRole } = render(<TestHarness onPlayPause={onPlayPause} />)

    getByRole('button').focus()
    await user.keyboard(' ')
    expect(onPlayPause).toHaveBeenCalledOnce()
  })
})
