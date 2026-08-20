import { create } from 'zustand'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'audiobook-reader.theme'

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // Ignore storage failure in restricted environments
  }
  // Default is dark mode per requirement
  return 'dark'
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
  }
}

interface ThemeState {
  theme: Theme
  setTheme(theme: Theme): void
  toggleTheme(): void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme()
  applyThemeToDocument(initial)

  return {
    theme: initial,
    setTheme(theme) {
      set({ theme })
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch {
        // Ignore
      }
      applyThemeToDocument(theme)
    },
    toggleTheme() {
      const next = get().theme === 'dark' ? 'light' : 'dark'
      get().setTheme(next)
    },
  }
})
