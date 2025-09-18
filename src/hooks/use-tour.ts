'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNavigation } from '@/components/navigation/navigation-context'
import { TourConfigLoader } from '@/lib/tour/tour-config'
import { announceToScreenReader } from '@/lib/accessibility/screen-reader'
import type { 
  TourDefinition, 
  TourOptions, 
  UserTourProgress,
  TourEvent,
  TourError as TourErrorType
} from '@/types/tour'

// Create TourError class since it can't be imported as value
class TourError extends Error {
  constructor(
    message: string,
    public tourId: string,
    public stepIndex?: number,
    public cause?: Error
  ) {
    super(message)
    this.name = 'TourError'
  }
}

interface TourState {
  currentTour: string | null
  currentStep: number
  totalSteps: number
  isActive: boolean
  tourDefinition: TourDefinition | null
  progress: UserTourProgress | null
  events: TourEvent[]
}

interface UseTourConfig {
  enableAnalytics?: boolean
  autoSaveProgress?: boolean
  maxConcurrentTours?: number
  onTourComplete?: (tourId: string) => void
  onTourSkip?: (tourId: string) => void
  onTourError?: (error: TourError) => void
}

interface UserPreferences {
  autoStartTours: boolean
  showProgress: boolean
  enableKeyboardNavigation: boolean
  enableScreenReaderSupport: boolean
  tourFrequency: 'always' | 'once' | 'never'
  completedTours: string[]
  skippedTours: string[]
}

/**
 * Main hook for tour control - implements requirements 1.1, 1.3, 7.3, 7.4
 * Provides tour state management, progress tracking, and user preferences integration
 */
export function useTour(config: UseTourConfig = {}) {
  const navigation = useNavigation()
  
  const [tourState, setTourState] = useState<TourState>({
    currentTour: null,
    currentStep: 0,
    totalSteps: 0,
    isActive: false,
    tourDefinition: null,
    progress: null,
    events: []
  })

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    autoStartTours: true,
    showProgress: true,
    enableKeyboardNavigation: true,
    enableScreenReaderSupport: true,
    tourFrequency: 'once',
    completedTours: [],
    skippedTours: []
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TourError | null>(null)

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences()
  }, [])

  // Track tour events for analytics
  const trackEvent = useCallback((event: Omit<TourEvent, 'timestamp'>) => {
    const tourEvent: TourEvent = {
      ...event,
      timestamp: new Date()
    }
    
    setTourState(prev => ({
      ...prev,
      events: [...prev.events, tourEvent]
    }))

    // Send to analytics if enabled
    if (config.enableAnalytics) {
      console.log('Tour Event:', tourEvent)
      // This would integrate with your analytics system
    }
  }, [config.enableAnalytics])

  // Load user preferences from localStorage
  const loadUserPreferences = useCallback(async () => {
    try {
      const saved = localStorage.getItem('tour_user_preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        setUserPreferences(prev => ({ ...prev, ...preferences }))
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error)
    }
  }, [])

  // Save user preferences to localStorage
  const saveUserPreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    try {
      const updated = { ...userPreferences, ...preferences }
      setUserPreferences(updated)
      localStorage.setItem('tour_user_preferences', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save user preferences:', error)
    }
  }, [userPreferences])

  // Save progress to localStorage or API
  const saveProgress = useCallback(async (progress: UserTourProgress) => {
    if (!config.autoSaveProgress) return

    try {
      const key = `tour_progress_${progress.userId}_${progress.tourId}`
      localStorage.setItem(key, JSON.stringify(progress))
    } catch (error) {
      console.error('Failed to save tour progress:', error)
    }
  }, [config.autoSaveProgress])

  // Load progress from localStorage or API
  const loadProgress = useCallback(async (userId: string, tourId: string): Promise<UserTourProgress | null> => {
    try {
      const key = `tour_progress_${userId}_${tourId}`
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load tour progress:', error)
      return null
    }
  }, [])

  // Check if tour should be shown based on user preferences
  const shouldShowTour = useCallback((tourId: string): boolean => {
    if (!userPreferences.autoStartTours) return false
    
    switch (userPreferences.tourFrequency) {
      case 'never':
        return false
      case 'once':
        return !userPreferences.completedTours.includes(tourId) && 
               !userPreferences.skippedTours.includes(tourId)
      case 'always':
        return true
      default:
        return true
    }
  }, [userPreferences])

  // Evaluate tour conditions
  const evaluateTourConditions = useCallback(async (conditions: any[]): Promise<boolean> => {
    for (const condition of conditions) {
      switch (condition.type) {
        case 'user_role':
          // This would integrate with your auth system
          // For now, assume all roles are allowed
          break
        case 'client_selected':
          if (condition.operator === 'exists' && !navigation.currentClient) {
            return false
          }
          if (condition.operator === 'equals' && navigation.currentClient?.id !== condition.value) {
            return false
          }
          break
        case 'page_path':
          const currentPath = window.location.pathname
          if (condition.operator === 'equals' && currentPath !== condition.value) {
            return false
          }
          if (condition.operator === 'contains' && !currentPath.includes(condition.value)) {
            return false
          }
          break
        default:
          console.warn(`Unknown condition type: ${condition.type}`)
      }
    }
    return true
  }, [navigation.currentClient])

  // Start a tour
  const startTour = useCallback(async (tourId: string, options: TourOptions = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      // Prevent multiple concurrent tours if configured
      if (tourState.isActive && config.maxConcurrentTours === 1) {
        throw new TourError('Cannot start tour: another tour is already active', tourId)
      }

      // Check user preferences
      if (!shouldShowTour(tourId) && !options.autoStart) {
        console.log(`Tour skipped due to user preferences: ${tourId}`)
        return false
      }

      // Load tour configuration
      let tourDefinition: TourDefinition
      try {
        tourDefinition = TourConfigLoader.getTourConfig(tourId) || 
          await TourConfigLoader.loadTourConfigFromFile(tourId, `/tours/${tourId}.json`)
      } catch (error) {
        const tourError = new TourError(`Failed to load tour configuration: ${tourId}`, tourId, undefined, error as Error)
        setError(tourError)
        config.onTourError?.(tourError)
        throw tourError
      }

      // Check tour conditions
      if (tourDefinition.conditions) {
        const conditionsMet = await evaluateTourConditions(tourDefinition.conditions)
        if (!conditionsMet) {
          console.log(`Tour conditions not met for: ${tourId}`)
          return false
        }
      }

      // Load existing progress if available
      const userId = 'current-user' // This would come from your auth system
      const existingProgress = await loadProgress(userId, tourId)
      
      const progress: UserTourProgress = existingProgress || {
        userId,
        tourId,
        status: 'not_started',
        currentStep: 0,
        completedSteps: [],
        lastInteractionAt: new Date(),
        metadata: {
          device: getDeviceType(),
          userAgent: navigator.userAgent,
          sessionId: generateSessionId()
        }
      }

      // Update progress to in_progress
      progress.status = 'in_progress'
      progress.startedAt = progress.startedAt || new Date()
      progress.lastInteractionAt = new Date()

      // Update state
      setTourState({
        currentTour: tourId,
        currentStep: progress.currentStep,
        totalSteps: tourDefinition.steps.length,
        isActive: true,
        tourDefinition,
        progress,
        events: []
      })

      // Save progress
      await saveProgress(progress)

      // Track event
      trackEvent({
        type: 'tour_started',
        stepIndex: 0,
        metadata: {
          tourId,
          userId,
          sessionId: progress.metadata.sessionId
        }
      })

      // Announce tour start to screen readers if enabled
      if (userPreferences.enableScreenReaderSupport) {
        announceToScreenReader(
          `Tour iniciado: ${tourDefinition.name || tourId}. ${tourDefinition.steps.length} pasos disponibles.`,
          'assertive'
        )
      }

      console.log(`Started tour: ${tourId}`)
      return true
    } catch (error) {
      const tourError = error instanceof TourError ? error : 
        new TourError(`Failed to start tour: ${tourId}`, tourId, undefined, error as Error)
      setError(tourError)
      config.onTourError?.(tourError)
      throw tourError
    } finally {
      setIsLoading(false)
    }
  }, [
    tourState.isActive, 
    config, 
    shouldShowTour, 
    evaluateTourConditions, 
    loadProgress, 
    saveProgress, 
    trackEvent, 
    userPreferences.enableScreenReaderSupport
  ])

  // Stop current tour
  const stopTour = useCallback(async () => {
    if (!tourState.isActive || !tourState.progress) return

    try {
      // Update progress
      const updatedProgress: UserTourProgress = {
        ...tourState.progress,
        status: 'skipped',
        skippedAt: new Date(),
        lastInteractionAt: new Date()
      }

      // Save progress
      await saveProgress(updatedProgress)

      // Update user preferences to track skipped tour
      await saveUserPreferences({
        skippedTours: [...userPreferences.skippedTours, tourState.currentTour!]
      })

      // Track event
      trackEvent({
        type: 'tour_skipped',
        stepIndex: tourState.currentStep,
        metadata: {
          tourId: tourState.currentTour!,
          userId: updatedProgress.userId,
          sessionId: updatedProgress.metadata.sessionId
        }
      })

      // Announce tour skip if screen reader support is enabled
      if (userPreferences.enableScreenReaderSupport) {
        announceToScreenReader('Tour omitido', 'polite')
      }

      // Call callback
      config.onTourSkip?.(tourState.currentTour!)

      // Reset state
      setTourState({
        currentTour: null,
        currentStep: 0,
        totalSteps: 0,
        isActive: false,
        tourDefinition: null,
        progress: null,
        events: []
      })

      console.log(`Stopped tour: ${tourState.currentTour}`)
    } catch (error) {
      console.error('Failed to stop tour:', error)
    }
  }, [tourState, saveProgress, saveUserPreferences, userPreferences, trackEvent, config])

  // Move to next step
  const nextStep = useCallback(async () => {
    if (!tourState.isActive || !tourState.progress || !tourState.tourDefinition) return

    const nextStepIndex = tourState.currentStep + 1

    // Check if tour is complete
    if (nextStepIndex >= tourState.totalSteps) {
      // Complete the tour
      const updatedProgress: UserTourProgress = {
        ...tourState.progress,
        status: 'completed',
        currentStep: tourState.totalSteps,
        completedSteps: [...tourState.progress.completedSteps, tourState.currentStep],
        completedAt: new Date(),
        lastInteractionAt: new Date()
      }

      await saveProgress(updatedProgress)

      // Update user preferences to track completed tour
      await saveUserPreferences({
        completedTours: [...userPreferences.completedTours, tourState.currentTour!]
      })

      trackEvent({
        type: 'tour_completed',
        stepIndex: tourState.currentStep,
        metadata: {
          tourId: tourState.currentTour!,
          userId: updatedProgress.userId,
          sessionId: updatedProgress.metadata.sessionId
        }
      })

      // Announce tour completion if screen reader support is enabled
      if (userPreferences.enableScreenReaderSupport) {
        announceToScreenReader('Tour completado exitosamente', 'assertive')
      }

      config.onTourComplete?.(tourState.currentTour!)

      // Reset state
      setTourState({
        currentTour: null,
        currentStep: 0,
        totalSteps: 0,
        isActive: false,
        tourDefinition: null,
        progress: null,
        events: []
      })

      return
    }

    // Move to next step
    const updatedProgress: UserTourProgress = {
      ...tourState.progress,
      currentStep: nextStepIndex,
      completedSteps: [...tourState.progress.completedSteps, tourState.currentStep],
      lastInteractionAt: new Date()
    }

    setTourState(prev => ({
      ...prev,
      currentStep: nextStepIndex,
      progress: updatedProgress
    }))

    await saveProgress(updatedProgress)

    trackEvent({
      type: 'step_completed',
      stepIndex: tourState.currentStep,
      metadata: {
        tourId: tourState.currentTour!,
        userId: updatedProgress.userId,
        sessionId: updatedProgress.metadata.sessionId
      }
    })

    trackEvent({
      type: 'step_viewed',
      stepIndex: nextStepIndex,
      metadata: {
        tourId: tourState.currentTour!,
        userId: updatedProgress.userId,
        sessionId: updatedProgress.metadata.sessionId
      }
    })

    // Announce step change if screen reader support is enabled
    if (userPreferences.enableScreenReaderSupport) {
      announceToScreenReader(
        `Paso ${nextStepIndex + 1} de ${tourState.totalSteps}`,
        'polite'
      )
    }
  }, [tourState, saveProgress, saveUserPreferences, userPreferences, trackEvent, config])

  // Move to previous step
  const previousStep = useCallback(async () => {
    if (!tourState.isActive || !tourState.progress || tourState.currentStep <= 0) return

    const prevStepIndex = tourState.currentStep - 1

    const updatedProgress: UserTourProgress = {
      ...tourState.progress,
      currentStep: prevStepIndex,
      lastInteractionAt: new Date()
    }

    setTourState(prev => ({
      ...prev,
      currentStep: prevStepIndex,
      progress: updatedProgress
    }))

    await saveProgress(updatedProgress)

    trackEvent({
      type: 'step_viewed',
      stepIndex: prevStepIndex,
      metadata: {
        tourId: tourState.currentTour!,
        userId: updatedProgress.userId,
        sessionId: updatedProgress.metadata.sessionId
      }
    })

    // Announce step change if screen reader support is enabled
    if (userPreferences.enableScreenReaderSupport) {
      announceToScreenReader(
        `Paso ${prevStepIndex + 1} de ${tourState.totalSteps}`,
        'polite'
      )
    }
  }, [tourState, saveProgress, trackEvent, userPreferences.enableScreenReaderSupport])

  // Skip current tour
  const skipTour = useCallback(async () => {
    await stopTour()
  }, [stopTour])

  // Reset tour progress (for testing or re-running tours)
  const resetTourProgress = useCallback(async (tourId: string) => {
    try {
      const userId = 'current-user'
      const key = `tour_progress_${userId}_${tourId}`
      localStorage.removeItem(key)
      
      // Remove from completed/skipped lists
      await saveUserPreferences({
        completedTours: userPreferences.completedTours.filter(id => id !== tourId),
        skippedTours: userPreferences.skippedTours.filter(id => id !== tourId)
      })
      
      console.log(`Reset progress for tour: ${tourId}`)
    } catch (error) {
      console.error('Failed to reset tour progress:', error)
    }
  }, [userPreferences, saveUserPreferences])

  // Get tour status
  const getTourStatus = useCallback((tourId: string): 'not_started' | 'in_progress' | 'completed' | 'skipped' => {
    if (userPreferences.completedTours.includes(tourId)) return 'completed'
    if (userPreferences.skippedTours.includes(tourId)) return 'skipped'
    if (tourState.currentTour === tourId && tourState.isActive) return 'in_progress'
    return 'not_started'
  }, [userPreferences, tourState])

  // Utility functions
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  const generateSessionId = (): string => {
    return `tour_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  return {
    // State
    currentTour: tourState.currentTour,
    currentStep: tourState.currentStep,
    totalSteps: tourState.totalSteps,
    isActive: tourState.isActive,
    isLoading,
    error,
    tourDefinition: tourState.tourDefinition,
    progress: tourState.progress,
    events: tourState.events,
    
    // User preferences
    userPreferences,
    
    // Actions
    startTour,
    stopTour,
    nextStep,
    previousStep,
    skipTour,
    resetTourProgress,
    
    // Utilities
    getTourStatus,
    shouldShowTour,
    saveUserPreferences,
    loadUserPreferences
  }
}

// Convenience hooks for specific use cases
export function useTourState() {
  const { currentTour, currentStep, totalSteps, isActive, isLoading, error } = useTour()
  return { currentTour, currentStep, totalSteps, isActive, isLoading, error }
}

export function useTourControls() {
  const { startTour, stopTour, nextStep, previousStep, skipTour } = useTour()
  return { startTour, stopTour, nextStep, previousStep, skipTour }
}

export function useTourPreferences() {
  const { userPreferences, saveUserPreferences, loadUserPreferences } = useTour()
  return { userPreferences, saveUserPreferences, loadUserPreferences }
}