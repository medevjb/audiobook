import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Voice } from '../../services/speech/types'
import { LanguageSelector } from './LanguageSelector'

function voice(overrides: Partial<Voice> & Pick<Voice, 'voiceURI' | 'lang'>): Voice {
  return { name: overrides.voiceURI, localService: true, isDefault: false, ...overrides }
}

describe('LanguageSelector (PRD §21)', () => {
  it('lists the PRD initial languages', () => {
    render(<LanguageSelector language="en" voices={[]} onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: 'Bengali' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Japanese' })).toBeInTheDocument()
  })

  it('adds a language the device can speak but the PRD list does not name', () => {
    const voices = [voice({ voiceURI: 'v1', lang: 'sv-SE' })]
    render(<LanguageSelector language="en" voices={voices} onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: 'sv' })).toBeInTheDocument()
  })

  it('picks a matching default voice when the language changes', async () => {
    const user = userEvent.setup()
    const voices = [
      voice({ voiceURI: 'david', lang: 'en-US', isDefault: true }),
      voice({ voiceURI: 'bangla', lang: 'bn-BD' }),
    ]
    const onChange = vi.fn()
    render(<LanguageSelector language="en" voices={voices} onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), 'Bengali')
    expect(onChange).toHaveBeenCalledWith('bn', 'bangla')
  })

  it('clears the voice when the new language has no match (PRD §22)', async () => {
    const user = userEvent.setup()
    const voices = [voice({ voiceURI: 'david', lang: 'en-US', isDefault: true })]
    const onChange = vi.fn()
    render(<LanguageSelector language="en" voices={voices} onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), 'Bengali')
    expect(onChange).toHaveBeenCalledWith('bn', undefined)
  })
})
