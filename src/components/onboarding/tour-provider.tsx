'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useNavigation } from '@/components/navigation/navigation-context'
import { TourConfigLoader } from '@/lib/tour/tour-config'
import { 
  announceToScreenReader, 
  useTourProgressAnnouncements,
  useTourAccessibility
} from '@/lib/accessibility'
import type { 
  TourContextValue, 
  TourOptions, 
  TourDefinition, 
  UserTourProgress,
  TourEvent
} from '@/types/tour'
import { TourError } from '@/types/tour'

interface TourProviderProps {
  children: ReactNode
  config?: {
    enableAnalytics?: boolean
    autoSaveProgress?: boolean
    maxConcurrentTours?: number
  }
  onTourComplete?: (tourId: string) => void
  onTourSkip?: (tourId: string) => void
  onTourError?: (error: TourError) => void
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

const TourContext = createContext<TourContextValue | undefined>(undefined)

export function TourProvider({ 
  children, 
  config = {},
  onTourComplete,
  onTourSkip,
  onTourError
}: TourProviderProps) {
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

  // Enhanced accessibility support
  const {
    announceStepChange,
    announceTourComplete,
    announceTourSkipped,
    announceKeyboardShortcuts
  } = useTourProgressAnnouncements()

  const accessibility = useTourAccessibility(
    tourState.isActive,
    tourState.currentStep,
    tourState.totalSteps,
    {
      enableFocusTrap: true,
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableHighContrastMode: true,
      autoAnnounceSteps: true,
      restoreFocusOnExit: true
    }
  )

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
      // This would integrate with your analytics system
      console.log('Tour Event:', tourEvent)
    }
  }, [config.enableAnalytics])

  // Save progress to localStorage or API
  const saveProgress = useCallback(async (progress: UserTourProgress) => {
    if (!config.autoSaveProgress) return

    try {
      // Save to localStorage for now - could be extended to API
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

  // Start a tour
  const startTour = useCallback(async (tourId: string, options: TourOptions = {}) => {
    try {
      // Prevent multiple concurrent tours if configured
      if (tourState.isActive && config.maxConcurrentTours === 1) {
        console.warn('Cannot start tour: another tour is already active')
        return
      }

      // Load tour configuration
      let tourDefinition: TourDefinition
      try {
        tourDefinition = TourConfigLoader.getTourConfig(tourId) || 
          await TourConfigLoader.loadTourConfigFromFile(tourId, `/tours/${tourId}.json`)
      } catch (error) {
        const tourError = new TourError(`Failed to load tour configuration: ${tourId}`, tourId, undefined, error as Error)
        onTourError?.(tourError)
        throw tourError
      }

      // Check tour conditions
      if (tourDefinition.conditions && tourDefinition.conditions.length > 0) {
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

      // Announce tour start to screen readers
      announceToScreenReader(
        `Tour iniciado: ${tourDefinition.name || tourId}. ${tourDefinition.steps.length} pasos disponibles.`,
        'assertive'
      )

      // Announce keyboard shortcuts
      setTimeout(() => {
        announceKeyboardShortcuts()
      }, 2000)

      console.log(`Started tour: ${tourId}`)
    } catch (error) {
      const tourError = error instanceof TourError ? error : 
        new TourError(`Failed to start tour: ${tourId}`, tourId, undefined, error as Error)
      onTourError?.(tourError)
      throw tourError
    }
  }, [tourState.isActive, config.maxConcurrentTours, loadProgress, saveProgress, trackEvent, onTourError])

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

      // Announce tour skip
      announceTourSkipped()

      // Call callback
      onTourSkip?.(tourState.currentTour!)

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
  }, [tourState, saveProgress, trackEvent, onTourSkip])

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

      trackEvent({
        type: 'tour_completed',
        stepIndex: tourState.currentStep,
        metadata: {
          tourId: tourState.currentTour!,
          userId: updatedProgress.userId,
          sessionId: updatedProgress.metadata.sessionId
        }
      })

      // Announce tour completion
      announceTourComplete()

      onTourComplete?.(tourState.currentTour!)

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
  }, [tourState, saveProgress, trackEvent, onTourComplete])

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
  }, [tourState, saveProgress, trackEvent])

  // Skip current tour
  const skipTour = useCallback(async () => {
    await stopTour()
  }, [stopTour])

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

  // Utility functions
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  const generateSessionId = (): string => {
    return `tour_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  // Context value
  const contextValue: TourContextValue = {
    startTour,
    stopTour,
    nextStep,
    previousStep,
    skipTour,
    currentTour: tourState.currentTour,
    currentStep: tourState.currentStep,
    totalSteps: tourState.totalSteps,
    isActive: tourState.isActive
  }

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

// Convenience hooks
export function useTourState() {
  const { currentTour, currentStep, totalSteps, isActive } = useTour()
  return { currentTour, currentStep, totalSteps, isActive }
}

export function useTourControls() {
  const { startTour, stopTour, nextStep, previousStep, skipTour } = useTour()
  return { startTour, stopTour, nextStep, previousStep, skipTour }
}