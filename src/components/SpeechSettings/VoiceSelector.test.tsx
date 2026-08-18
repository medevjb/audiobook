import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Voice } from '../../services/speech/types'
import { VoiceSelector } from './VoiceSelector'

function voice(overrides: Partial<Voice> & Pick<Voice, 'voiceURI' | 'lang'>): Voice {
  return { name: overrides.voiceURI, localService: true, isDefault: false, ...overrides }
}

describe('VoiceSelector (PRD §20/§22)', () => {
  it('shows a loading state before voices arrive', () => {
    render(<VoiceSelector language="en" voiceURI={undefined} voices={[]} voicesLoaded={false} onChange={vi.fn()} />)
    expect(screen.getByText('Loading voices…')).toBeInTheDocument()
  })

  it('lists only voices matching the language by default', () => {
    const voices = [
      voice({ voiceURI: 'david', name: 'Microsoft David', lang: 'en-US' }),
      voice({ voiceURI: 'bangla', name: 'Google বাংলা', lang: 'bn-BD' }),
    ]
    render(<VoiceSelector language="en" voiceURI="david" voices={voices} voicesLoaded onChange={vi.fn()} />)

    expect(screen.getByRole('option', { name: 'Microsoft David — en-US' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Google বাংলা/ })).not.toBeInTheDocument()
  })

  it('shows the required warning when no voice matches the language', () => {
    const voices = [voice({ voiceURI: 'david', lang: 'en-US' })]
    render(<VoiceSelector language="bn" voiceURI={undefined} voices={voices} voicesLoaded onChange={vi.fn()} />)

    expect(screen.getByText('No Bengali voice is available on this device.')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('shows a distinct message when the device has no voices at all (PRD §35)', () => {
    render(<VoiceSelector language="en" voiceURI={undefined} voices={[]} voicesLoaded onChange={vi.fn()} />)

    expect(
      screen.getByText('No voices are available on this device. Text-to-speech cannot play here.'),
    ).toBeInTheDocument()
    // Nothing to "show all" of — that action must not appear here.
    expect(screen.queryByRole('button', { name: 'Show all available voices' })).not.toBeInTheDocument()
  })

  it('reveals every voice after "Show all available voices"', async () => {
    const user = userEvent.setup()
    const voices = [voice({ voiceURI: 'david', name: 'Microsoft David', lang: 'en-US' })]
    render(<VoiceSelector language="bn" voiceURI={undefined} voices={voices} voicesLoaded onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Show all available voices' }))
    expect(screen.getByRole('option', { name: 'Microsoft David — en-US' })).toBeInTheDocument()
  })

  it('never invents an option when nothing matches and the user has not expanded it', () => {
    render(<VoiceSelector language="bn" voiceURI={undefined} voices={[]} voicesLoaded onChange={vi.fn()} />)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('reports the chosen voice', async () => {
    const user = userEvent.setup()
    const voices = [
      voice({ voiceURI: 'david', name: 'Microsoft David', lang: 'en-US' }),
      voice({ voiceURI: 'zira', name: 'Microsoft Zira', lang: 'en-GB' }),
    ]
    const onChange = vi.fn()
    render(<VoiceSelector language="en" voiceURI="david" voices={voices} voicesLoaded onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), 'Microsoft Zira — en-GB')
    expect(onChange).toHaveBeenCalledWith('zira')
  })

  it('resets to the warning state when the language changes away from a match', () => {
    const voices = [voice({ voiceURI: 'david', lang: 'en-US' })]
    const { rerender } = render(
      <VoiceSelector language="en" voiceURI="david" voices={voices} voicesLoaded onChange={vi.fn()} />,
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()

    rerender(<VoiceSelector language="bn" voiceURI={undefined} voices={voices} voicesLoaded onChange={vi.fn()} />)
    expect(screen.getByText('No Bengali voice is available on this device.')).toBeInTheDocument()
  })
})
