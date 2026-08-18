import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PLAYBACK_RATES } from '../../types/preferences'
import { SpeedControl } from './SpeedControl'

describe('SpeedControl (PRD §19)', () => {
  it('offers every required rate', () => {
    render(<SpeedControl rate={1.0} onChange={vi.fn()} />)
    for (const rate of PLAYBACK_RATES) {
      expect(screen.getByRole('option', { name: `${rate}×` })).toBeInTheDocument()
    }
  })

  it('reflects the current rate', () => {
    render(<SpeedControl rate={1.5} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('1.5')
  })

  it('reports the chosen rate as a number', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SpeedControl rate={1.0} onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), '1.75×')
    expect(onChange).toHaveBeenCalledWith(1.75)
  })

  it('defaults to 1.0x per PRD §19', () => {
    render(<SpeedControl rate={1.0} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('1')
  })
})
