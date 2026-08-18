import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlayerControls } from './PlayerControls'

function baseProps() {
  return {
    canPlay: true,
    hasPrevious: true,
    hasNext: true,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStop: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
  }
}

describe('PlayerControls (PRD §16)', () => {
  it('shows Play and disables Stop when stopped', () => {
    render(<PlayerControls {...baseProps()} playback="stopped" />)
    expect(screen.getByRole('button', { name: /Play/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
  })

  it('disables Play when there is nothing readable on the page', () => {
    render(<PlayerControls {...baseProps()} playback="stopped" canPlay={false} />)
    expect(screen.getByRole('button', { name: /Play/ })).toBeDisabled()
  })

  it('shows Pause and enables Stop while playing', () => {
    render(<PlayerControls {...baseProps()} playback="playing" />)
    expect(screen.getByRole('button', { name: /Pause/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
  })

  it('shows Resume while paused', () => {
    render(<PlayerControls {...baseProps()} playback="paused" />)
    expect(screen.getByRole('button', { name: /Resume/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
  })

  it('calls the right handler for each toggle state', async () => {
    const user = userEvent.setup()
    const playing = baseProps()
    const { rerender } = render(<PlayerControls {...playing} playback="stopped" />)
    await user.click(screen.getByRole('button', { name: /Play/ }))
    expect(playing.onPlay).toHaveBeenCalledOnce()

    const paused = baseProps()
    rerender(<PlayerControls {...paused} playback="playing" />)
    await user.click(screen.getByRole('button', { name: /Pause/ }))
    expect(paused.onPause).toHaveBeenCalledOnce()

    const resumed = baseProps()
    rerender(<PlayerControls {...resumed} playback="paused" />)
    await user.click(screen.getByRole('button', { name: /Resume/ }))
    expect(resumed.onResume).toHaveBeenCalledOnce()
  })

  it('disables Previous on the first page and Next on the last page', () => {
    render(<PlayerControls {...baseProps()} playback="stopped" hasPrevious={false} hasNext={false} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('calls onPrevious and onNext', async () => {
    const user = userEvent.setup()
    const props = baseProps()
    render(<PlayerControls {...props} playback="stopped" />)

    await user.click(screen.getByRole('button', { name: 'Previous page' }))
    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(props.onPrevious).toHaveBeenCalledOnce()
    expect(props.onNext).toHaveBeenCalledOnce()
  })

  it('calls onStop only when stop is enabled', async () => {
    const user = userEvent.setup()
    const props = baseProps()
    render(<PlayerControls {...props} playback="playing" />)
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(props.onStop).toHaveBeenCalledOnce()
  })
})
