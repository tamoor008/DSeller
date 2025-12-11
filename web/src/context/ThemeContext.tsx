import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface Theme {
  primaryOrange: string
  black: string
  black10: string
  black50: string
  black25: string
  white: string
  white50: string
  bgcolor: string
  black80: string
  white80: string
  orange20: string
  border: string
  red: string
  green: string
  greenbg: string
  card: string
  surface: string
  textPrimary: string
  textSecondary: string
  muted: string
  statusBar: string
}

interface ThemeContextType {
  theme: Theme
  themeMode: ThemeMode
  isDark: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const lightTheme: Theme = {
  primaryOrange: '#F85606',
  black: '#333333',
  black10: '#00000010',
  black50: '#00000050',
  black25: '#00000025',
  white: '#FFFFFF',
  white50: '#FFFFFF50',
  bgcolor: '#F9F9F9',
  black80: '#00000080',
  white80: '#FFFFFF80',
  orange20: '#F8560620',
  border: '#D9D9D9',
  red: '#FF0000',
  green: '#28a745',
  greenbg: '#e6f4ea',
  card: '#FFFFFF',
  surface: '#F4F4F6',
  textPrimary: '#111111',
  textSecondary: '#5C5C5C',
  muted: '#8A8A8A',
  statusBar: '#F9F9F9',
}

const darkTheme: Theme = {
  primaryOrange: '#FF6B2E',
  black: '#E0E0E0',
  black10: '#FFFFFF10',
  black50: '#FFFFFF50',
  black25: '#FFFFFF25',
  white: '#1A1A1A',
  white50: '#1A1A1A50',
  bgcolor: '#0F0F0F',
  black80: '#FFFFFF80',
  white80: '#1A1A1A80',
  orange20: '#FF6B2E20',
  border: '#2A2A2A',
  red: '#FF4444',
  green: '#4CAF50',
  greenbg: '#1B3A1F',
  card: '#1E1E1E',
  surface: '#252525',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  muted: '#707070',
  statusBar: '#0F0F0F',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = '@dseller_theme_mode'

// Check system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light')
  const [isLoading, setIsLoading] = useState(true)

  // Load theme preference from localStorage
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeModeState(savedTheme as ThemeMode)
        }
      } catch (error) {
        console.error('Error loading theme:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTheme()
  }, [])

  // Save theme preference to localStorage
  const setThemeMode = (mode: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
      setThemeModeState(mode)
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  // Toggle between light and dark (not system)
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
  }

  // Listen to system theme changes
  useEffect(() => {
    if (themeMode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // Force re-render when system theme changes
      setThemeModeState('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeMode])

  // Determine if dark mode should be active
  const isDark = themeMode === 'system' 
    ? getSystemTheme() === 'dark' 
    : themeMode === 'dark'

  // Get current theme based on mode
  const theme = isDark ? darkTheme : lightTheme

  // Apply theme to document root for CSS variables (optional)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }
  }, [isDark])

  // Don't render until theme is loaded
  if (isLoading) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

