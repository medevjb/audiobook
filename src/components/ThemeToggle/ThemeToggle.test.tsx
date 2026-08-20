import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useThemeStore } from '../../store/themeStore'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle & useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.getState().setTheme('dark')
  })

  it('defaults to dark mode', () => {
    expect(useThemeStore.getState().theme).toBe('dark')
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('toggles from dark to light mode on click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: 'Switch to light mode' })
    await user.click(button)

    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorage.getItem('audiobook-reader.theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles from light to dark mode', async () => {
    const user = userEvent.setup()
    useThemeStore.getState().setTheme('light')
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: 'Switch to dark mode' })
    await user.click(button)

    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem('audiobook-reader.theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })
})
