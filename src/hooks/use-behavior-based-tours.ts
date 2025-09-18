'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTour } from './use-tour'
import { useTourProgress } from './use-tour-progress'
import { ContextualSuggestionEngine, type ContextualSuggestion, type ContextualSuggestionConfig } from '@/lib/tour/triggers/contextual-suggestion-engine'

/**
 * Configuration for behavior-based tours hook
 */
export interface UseBehaviorBasedToursConfig extends Partial<ContextualSuggestionConfig> {
  enableAutoTrigger?: boolean
  enableManualTrigger?: boolean
  enableAnalytics?: boolean
  debugMode?: boolean
}

/**
 * Hook return type
 */
export interface UseBehaviorBasedToursReturn {
  // Current state
  activeSuggestion: ContextualSuggestion | null
  pendingSuggestions: ContextualSuggestion[]
  queueStatus: {
    pending: number
    active: boolean
    dismissed: number
    completed: number
    suggestionsThisSession: number
  }
  
  // Actions
  acceptSuggestion: (suggestionId?: string) => Promise<boolean>
  dismissSuggestion: (suggestionId?: string, reason?: string) => boolean
  triggerManualSuggestion: (tourId: string, message?: string) => boolean
  showNextSuggestion: () => boolean
  
  // Tracking
  trackUserAction: (action: string, success: boolean, context?: Record<string, any>) => void
  trackError: (errorType: string, context?: string) => void
  trackFeatureUsage: (featureName: string) => void
  trackHelpRequest: (context: string) => void
  
  // Analytics
  getAnalyticsData: () => Record<string, any>
  
  // Configuration
  updateConfig: (newConfig: Partial<UseBehaviorBasedToursConfig>) => void
  
  // Debug
  debugInfo?: {
    engineStatus: string
    behaviorData: Record<string, any>
    timingStats: Record<string, any>
  }
}

/**
 * Hook for behavior-based tour triggering
 * Implements requirements 8.1, 8.2, 8.3 for intelligent tour suggestions
 */
export function useBehaviorBasedTours(
  config: UseBehaviorBasedToursConfig = {}
): UseBehaviorBasedToursReturn {
  const router = useRouter()
  const { startTour } = useTour()
  const { trackAnalyticsEvent } = useTourProgress({ enableAnalytics: config.enableAnalytics })

  // Default configuration
  const defaultConfig: UseBehaviorBasedToursConfig = {
    enableAutoTrigger: true,
    enableManualTrigger: true,
    enableAnalytics: true,
    debugMode: false,
    maxSuggestionsPerSession: 3,
    suggestionCooldownPeriod: 300000, // 5 minutes
    behaviorConfig: {
      enableInactivityDetection: true,
      enableErrorPatternDetection: true,
      enableNavigationConfusionDetection: true,
      enableFeatureStruggleDetection: true,
      inactivityThreshold: 30000, // 30 seconds
      errorThreshold: 3,
      confusionThreshold: 5,
      triggerSensitivity: 'medium'
    },
    timingConfig: {
      enableTimeOfDayOptimization: true,
      enableCognitiveLoadDetection: true,
      enableInterruptibilityDetection: true,
      enableActivityBasedTiming: true,
      maxCognitiveLoad: 'medium',
      minInterruptibility: 'medium'
    },
    ...config
  }

  // State
  const [activeSuggestion, setActiveSuggestion] = useState<ContextualSuggestion | null>(null)
  const [pendingSuggestions, setPendingSuggestions] = useState<ContextualSuggestion[]>([])
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    active: false,
    dismissed: 0,
    completed: 0,
    suggestionsThisSession: 0
  })
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Refs
  const suggestionEngine = useRef<ContextualSuggestionEngine | null>(null)
  const isInitialized = useRef(false)

  // Initialize suggestion engine
  useEffect(() => {
    if (isInitialized.current) return

    suggestionEngine.current = new ContextualSuggestionEngine(defaultConfig)
    
    // Setup event handlers
    suggestionEngine.current.onSuggestionCreated = (suggestion) => {
      setPendingSuggestions(suggestionEngine.current?.getPendingSuggestions() || [])
      setQueueStatus(suggestionEngine.current?.getQueueStatus() || queueStatus)
      
      if (defaultConfig.enableAnalytics) {
        trackAnalyticsEvent('current-user', 'behavior-suggestion', {
          type: 'help_requested',
          metadata: {
            suggestionId: suggestion.id,
            tourId: suggestion.tourId,
            reason: suggestion.reason,
            confidence: suggestion.confidence,
            triggerSource: suggestion.triggerSource
          }
        })
      }
    }

    suggestionEngine.current.onSuggestionShown = (suggestion) => {
      setActiveSuggestion(suggestion)
      setQueueStatus(suggestionEngine.current?.getQueueStatus() || queueStatus)
      
      if (defaultConfig.enableAnalytics) {
        trackAnalyticsEvent('current-user', suggestion.tourId, {
          type: 'help_requested',
          metadata: {
            suggestionId: suggestion.id,
            action: 'shown',
            confidence: suggestion.confidence,
            optimalDelay: suggestion.optimalDelay
          }
        })
      }
    }

    suggestionEngine.current.onSuggestionAccepted = (suggestion) => {
      setActiveSuggestion(null)
      setQueueStatus(suggestionEngine.current?.getQueueStatus() || queueStatus)
      
      if (defaultConfig.enableAnalytics) {
        trackAnalyticsEvent('current-user', suggestion.tourId, {
          type: 'tour_started',
          metadata: {
            suggestionId: suggestion.id,
            source: 'behavior_trigger',
            confidence: suggestion.confidence
          }
        })
      }
    }

    suggestionEngine.current.onSuggestionDismissed = (suggestion) => {
      setActiveSuggestion(null)
      setQueueStatus(suggestionEngine.current?.getQueueStatus() || queueStatus)
      
      if (defaultConfig.enableAnalytics) {
        trackAnalyticsEvent('current-user', 'behavior-suggestion', {
          type: 'help_requested',
          metadata: {
            suggestionId: suggestion.id,
            tourId: suggestion.tourId,
            action: 'dismissed',
            reason: suggestion.userContext.dismissReason
          }
        })
      }
    }

    suggestionEngine.current.onSuggestionExpired = (suggestion) => {
      setActiveSuggestion(current => current?.id === suggestion.id ? null : current)
      setPendingSuggestions(suggestionEngine.current?.getPendingSuggestions() || [])
      setQueueStatus(suggestionEngine.current?.getQueueStatus() || queueStatus)
    }

    isInitialized.current = true

    return () => {
      suggestionEngine.current?.destroy()
    }
  }, [])

  // Update debug info in debug mode
  useEffect(() => {
    if (!defaultConfig.debugMode || !suggestionEngine.current) return

    const updateDebugInfo = () => {
      const analyticsData = suggestionEngine.current?.getAnalyticsData()
      setDebugInfo({
        engineStatus: 'active',
        behaviorData: analyticsData?.behaviorData || {},
        timingStats: analyticsData?.timingStats || {}
      })
    }

    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [defaultConfig.debugMode])

  // Handle page navigation
  useEffect(() => {
    const handleNavigation = () => {
      suggestionEngine.current?.updatePageContext()
      setPendingSuggestions(suggestionEngine.current?.getPendingSuggestions() || [])
      setActiveSuggestion(suggestionEngine.current?.getActiveSuggestion() || null)
    }

    // Listen for route changes (Next.js specific)
    const handleRouteChange = () => {
      setTimeout(handleNavigation, 100) // Small delay to ensure page is loaded
    }

    // For client-side navigation
    window.addEventListener('popstate', handleNavigation)
    
    // For Next.js router events (if available)
    if (router.events) {
      router.events.on('routeChangeComplete', handleRouteChange)
    }

    return () => {
      window.removeEventListener('popstate', handleNavigation)
      if (router.events) {
        router.events.off('routeChangeComplete', handleRouteChange)
      }
    }
  }, [router])

  // Accept suggestion and start tour
  const acceptSuggestion = useCallback(async (suggestionId?: string): Promise<boolean> => {
    if (!suggestionEngine.current) return false

    const suggestion = suggestionId 
      ? suggestionEngine.current.getPendingSuggestions().find(s => s.id === suggestionId) ||
        (suggestionEngine.current.getActiveSuggestion()?.id === suggestionId ? suggestionEngine.current.getActiveSuggestion() : null)
      : suggestionEngine.current.getActiveSuggestion()

    if (!suggestion) return false

    try {
      // Accept the suggestion
      const accepted = suggestionEngine.current.acceptSuggestion(suggestionId)
      
      if (accepted) {
        // Start the tour
        await startTour(suggestion.tourId, {
          autoStart: true,
          source: 'behavior_trigger',
          metadata: {
            suggestionId: suggestion.id,
            confidence: suggestion.confidence,
            triggerSource: suggestion.triggerSource
          }
        })
        
        return true
      }
    } catch (error) {
      console.error('Failed to accept suggestion and start tour:', error)
      
      if (defaultConfig.enableAnalytics) {
        trackAnalyticsEvent('current-user', 'behavior-suggestion', {
          type: 'help_requested',
          metadata: {
            suggestionId: suggestion.id,
            action: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    return false
  }, [startTour, trackAnalyticsEvent, defaultConfig.enableAnalytics])

  // Dismiss suggestion
  const dismissSuggestion = useCallback((suggestionId?: string, reason?: string): boolean => {
    if (!suggestionEngine.current) return false

    return suggestionEngine.current.dismissSuggestion(suggestionId, reason)
  }, [])

  // Trigger manual suggestion
  const triggerManualSuggestion = useCallback((tourId: string, message?: string): boolean => {
    if (!suggestionEngine.current) return false

    return suggestionEngine.current.triggerManualSuggestion(tourId, message)
  }, [])

  // Show next suggestion
  const showNextSuggestion = useCallback((): boolean => {
    if (!suggestionEngine.current) return false

    return suggestionEngine.current.showNextSuggestion()
  }, [])

  // Track user action
  const trackUserAction = useCallback((action: string, success: boolean, context?: Record<string, any>): void => {
    suggestionEngine.current?.trackUserAction(action, success, context)
  }, [])

  // Track error
  const trackError = useCallback((errorType: string, context?: string): void => {
    suggestionEngine.current?.trackUserAction(errorType, false, { error: true, context })
  }, [])

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName: string): void => {
    suggestionEngine.current?.trackUserAction('feature_usage', true, { feature: featureName })
  }, [])

  // Track help request
  const trackHelpRequest = useCallback((context: string): void => {
    suggestionEngine.current?.trackUserAction('help_request', true, { helpContext: context })
  }, [])

  // Get analytics data
  const getAnalyticsData = useCallback((): Record<string, any> => {
    return suggestionEngine.current?.getAnalyticsData() || {}
  }, [])

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<UseBehaviorBasedToursConfig>): void => {
    // This would require updating the engine configuration
    // For now, we'll just log the update
    console.log('Config update requested:', newConfig)
  }, [])

  return {
    // State
    activeSuggestion,
    pendingSuggestions,
    queueStatus,
    
    // Actions
    acceptSuggestion,
    dismissSuggestion,
    triggerManualSuggestion,
    showNextSuggestion,
    
    // Tracking
    trackUserAction,
    trackError,
    trackFeatureUsage,
    trackHelpRequest,
    
    // Analytics
    getAnalyticsData,
    
    // Configuration
    updateConfig,
    
    // Debug
    ...(defaultConfig.debugMode && { debugInfo })
  }
}

/**
 * Simplified hook for basic behavior-based tour triggering
 */
export function useSimpleBehaviorTours() {
  const {
    activeSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    trackUserAction,
    trackError,
    trackFeatureUsage
  } = useBehaviorBasedTours({
    maxSuggestionsPerSession: 2,
    behaviorConfig: {
      triggerSensitivity: 'medium',
      inactivityThreshold: 45000, // 45 seconds
      errorThreshold: 2
    },
    timingConfig: {
      enableTimeOfDayOptimization: false, // Simplified timing
      maxCognitiveLoad: 'high' // More permissive
    }
  })

  return {
    suggestion: activeSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    trackUserAction,
    trackError,
    trackFeatureUsage
  }
}

/**
 * Hook for advanced behavior analysis and tour triggering
 */
export function useAdvancedBehaviorTours() {
  return useBehaviorBasedTours({
    enableAnalytics: true,
    debugMode: process.env.NODE_ENV === 'development',
    maxSuggestionsPerSession: 5,
    behaviorConfig: {
      enableInactivityDetection: true,
      enableErrorPatternDetection: true,
      enableNavigationConfusionDetection: true,
      enableFeatureStruggleDetection: true,
      triggerSensitivity: 'high',
      inactivityThreshold: 20000, // 20 seconds
      errorThreshold: 2,
      confusionThreshold: 3
    },
    timingConfig: {
      enableTimeOfDayOptimization: true,
      enableCognitiveLoadDetection: true,
      enableInterruptibilityDetection: true,
      enableActivityBasedTiming: true,
      maxCognitiveLoad: 'medium',
      minInterruptibility: 'medium',
      adaptToUserBehavior: true
    }
  })
}