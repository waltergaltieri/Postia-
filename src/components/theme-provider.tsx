'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Theme, getTheme, setTheme, initializeTheme } from '@/lib/theme'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Initialize theme on mount
    const currentTheme = getTheme()
    setThemeState(currentTheme)
    
    // Set up theme initialization and system preference listener
    const cleanup = initializeTheme()
    
    // Update effective theme
    const updateEffectiveTheme = () => {
      const current = getTheme()
      if (current === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setEffectiveTheme(systemDark ? 'dark' : 'light')
      } else {
        setEffectiveTheme(current)
      }
    }
    
    updateEffectiveTheme()
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateEffectiveTheme)
    
    return () => {
      cleanup?.()
      mediaQuery.removeEventListener('change', updateEffectiveTheme)
    }
  }, [])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    setThemeState(newTheme)
    
    // Update effective theme
    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setEffectiveTheme(systemDark ? 'dark' : 'light')
    } else {
      setEffectiveTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Theme toggle button component
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }
  
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'system':
        return '💻'
      default:
        return '☀️'
    }
  }
  
  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light theme'
      case 'dark':
        return 'Dark theme'
      case 'system':
        return 'System theme'
      default:
        return 'Toggle theme'
    }
  }
  
  return (
    <button
      onClick={toggleTheme}
      className="btn-premium-secondary"
      aria-label={getLabel()}
      title={getLabel()}
    >
      <span className="text-lg">{getIcon()}</span>
    </button>
  )
}