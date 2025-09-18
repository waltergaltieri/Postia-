/**
 * Theme management utilities for the premium design system
 */

export type Theme = 'light' | 'dark' | 'system'

/**
 * Get the current theme from localStorage or default to system
 */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  
  const stored = localStorage.getItem('theme') as Theme
  return stored || 'system'
}

/**
 * Set the theme and apply it to the document
 */
export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  // Remove existing theme attributes
  root.removeAttribute('data-theme')
  root.classList.remove('dark')
  
  if (theme === 'system') {
    // Use system preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    if (systemTheme === 'dark') {
      root.classList.add('dark')
    }
    localStorage.removeItem('theme')
  } else {
    // Use explicit theme
    root.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      root.classList.add('dark')
    }
    localStorage.setItem('theme', theme)
  }
}

/**
 * Initialize theme on app startup
 */
export function initializeTheme() {
  if (typeof window === 'undefined') return
  
  const theme = getTheme()
  setTheme(theme)
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = () => {
    if (getTheme() === 'system') {
      setTheme('system') // Re-apply system theme
    }
  }
  
  mediaQuery.addEventListener('change', handleChange)
  
  return () => mediaQuery.removeEventListener('change', handleChange)
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme() {
  const current = getTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  setTheme(next)
}

/**
 * Check if the current theme is dark
 */
export function isDarkTheme(): boolean {
  if (typeof window === 'undefined') return false
  
  const theme = getTheme()
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return theme === 'dark'
}

/**
 * Get the effective theme (resolves 'system' to 'light' or 'dark')
 */
export function getEffectiveTheme(): 'light' | 'dark' {
  const theme = getTheme()
  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light'
  }
  return theme
}

/**
 * Theme configuration for the design system
 */
export const themeConfig = {
  // Animation durations based on user preferences
  getDuration: (duration: 'fast' | 'normal' | 'slow' | 'slower') => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return '0ms'
    }
    
    const durations = {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms'
    }
    
    return durations[duration]
  },
  
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  
  // Check if user prefers high contrast
  prefersHighContrast: () => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: high)').matches
  }
}