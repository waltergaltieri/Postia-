/**
 * Hook for managing tour preferences and settings
 */

import { useState, useEffect, useCallback } from 'react'

export interface TourPreferences {
  autoStart: boolean
  showProgress: boolean
  allowKeyboardControl: boolean
  enableAnimations: boolean
  enableSounds: boolean
  enableNotifications: boolean
  tourFrequency: 'always' | 'once_per_session' | 'once_per_week' | 'never'
  preferredCategories: string[]
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    screenReaderOptimized: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
}

const defaultPreferences: TourPreferences = {
  autoStart: true,
  showProgress: true,
  allowKeyboardControl: true,
  enableAnimations: true,
  enableSounds: false,
  enableNotifications: true,
  tourFrequency: 'always',
  preferredCategories: [],
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    fontSize: 'medium'
  }
}

const STORAGE_KEY = 'tour-preferences'
const SESSION_STORAGE_KEY = 'tour-session-data'

export function useTourPreferences() {
  const [preferences, setPreferences] = useState<TourPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setPreferences({ ...defaultPreferences, ...parsed })
      }
    } catch (error) {
      console.error('Failed to load tour preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Apply accessibility preferences to document
  useEffect(() => {
    if (loading) return

    // Apply high contrast
    if (preferences.accessibility.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Apply reduced motion
    if (preferences.accessibility.reducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }

    // Apply font size
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large')
    document.documentElement.classList.add(`font-${preferences.accessibility.fontSize}`)
  }, [preferences.accessibility, loading])

  // Save preferences to localStorage
  const savePreferences = useCallback(async (newPreferences: Partial<TourPreferences>) => {
    try {
      const updated = { ...preferences, ...newPreferences }
      setPreferences(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return true
    } catch (error) {
      console.error('Failed to save tour preferences:', error)
      return false
    }
  }, [preferences])

  // Update a specific preference
  const updatePreference = useCallback(<K extends keyof TourPreferences>(
    key: K,
    value: TourPreferences[K]
  ) => {
    return savePreferences({ [key]: value })
  }, [savePreferences])

  // Update accessibility preferences
  const updateAccessibilityPreference = useCallback(<K extends keyof TourPreferences['accessibility']>(
    key: K,
    value: TourPreferences['accessibility'][K]
  ) => {
    return savePreferences({
      accessibility: {
        ...preferences.accessibility,
        [key]: value
      }
    })
  }, [preferences.accessibility, savePreferences])

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Check if a tour should be shown based on frequency settings
  const shouldShowTour = useCallback((tourId: string) => {
    if (preferences.tourFrequency === 'never') {
      return false
    }

    if (preferences.tourFrequency === 'always') {
      return true
    }

    try {
      const sessionData = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || '{}')
      const tourData = sessionData[tourId] || {}

      if (preferences.tourFrequency === 'once_per_session') {
        return !tourData.shownThisSession
      }

      if (preferences.tourFrequency === 'once_per_week') {
        const lastShown = tourData.lastShown ? new Date(tourData.lastShown) : null
        if (!lastShown) return true
        
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return lastShown < weekAgo
      }
    } catch (error) {
      console.error('Failed to check tour frequency:', error)
    }

    return true
  }, [preferences.tourFrequency])

  // Mark a tour as shown for frequency tracking
  const markTourAsShown = useCallback((tourId: string) => {
    try {
      const sessionData = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || '{}')
      
      sessionData[tourId] = {
        ...sessionData[tourId],
        shownThisSession: true,
        lastShown: new Date().toISOString()
      }

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
    } catch (error) {
      console.error('Failed to mark tour as shown:', error)
    }
  }, [])

  // Get recommended categories based on preferences
  const getRecommendedCategories = useCallback(() => {
    if (preferences.preferredCategories.length > 0) {
      return preferences.preferredCategories
    }
    
    // Default recommendations
    return ['onboarding', 'feature']
  }, [preferences.preferredCategories])

  // Check if animations should be enabled
  const shouldUseAnimations = useCallback(() => {
    // Respect user's reduced motion preference
    if (preferences.accessibility.reducedMotion) {
      return false
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false
    }
    
    return preferences.enableAnimations
  }, [preferences.enableAnimations, preferences.accessibility.reducedMotion])

  // Check if sounds should be enabled
  const shouldUseSounds = useCallback(() => {
    return preferences.enableSounds
  }, [preferences.enableSounds])

  // Get tour configuration based on preferences
  const getTourConfig = useCallback(() => {
    return {
      showProgress: preferences.showProgress,
      allowKeyboardControl: preferences.allowKeyboardControl,
      animate: shouldUseAnimations(),
      enableSounds: shouldUseSounds(),
      accessibility: preferences.accessibility
    }
  }, [preferences, shouldUseAnimations, shouldUseSounds])

  // Export preferences data
  const exportPreferences = useCallback(() => {
    const data = {
      preferences,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tour-preferences-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [preferences])

  // Import preferences data
  const importPreferences = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          
          if (data.preferences) {
            const imported = { ...defaultPreferences, ...data.preferences }
            setPreferences(imported)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(imported))
            resolve(true)
          } else {
            resolve(false)
          }
        } catch (error) {
          console.error('Failed to import preferences:', error)
          resolve(false)
        }
      }
      reader.onerror = () => resolve(false)
      reader.readAsText(file)
    })
  }, [])

  return {
    preferences,
    loading,
    savePreferences,
    updatePreference,
    updateAccessibilityPreference,
    resetPreferences,
    shouldShowTour,
    markTourAsShown,
    getRecommendedCategories,
    shouldUseAnimations,
    shouldUseSounds,
    getTourConfig,
    exportPreferences,
    importPreferences
  }
}