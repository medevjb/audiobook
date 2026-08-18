import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AutoAdvanceToggle } from './AutoAdvanceToggle'

describe('AutoAdvanceToggle (PRD §17)', () => {
  it('reflects the checked state it is given', () => {
    render(<AutoAdvanceToggle checked={true} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox', { name: /Auto-advance to next page/ })).toBeChecked()
  })

  it('reflects unchecked state', () => {
    render(<AutoAdvanceToggle checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox', { name: /Auto-advance to next page/ })).not.toBeChecked()
  })

  it('reports the new value on toggle', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<AutoAdvanceToggle checked={true} onChange={onChange} />)

    await user.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('is a controlled input: clicking does not change appearance without a prop update', async () => {
    const user = userEvent.setup()
    render(<AutoAdvanceToggle checked={true} onChange={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)
    // Still checked because the parent hasn't re-rendered with checked={false}.
    expect(checkbox).toBeChecked()
  })
})
