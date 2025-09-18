'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/components/navigation/navigation-context'
import { useTour } from './use-tour'
import { useTourProgress } from './use-tour-progress'
import type { TourDefinition, TourTrigger } from '@/types/tour'

interface UserActivity {
  pageViews: Map<string, number>
  timeOnPage: Map<string, number>
  interactions: Map<string, number>
  errors: Map<string, number>
  lastActivity: Date
  inactivityPeriods: number[]
  featureUsage: Map<string, Date>
}

interface ContextualSuggestion {
  tourId: string
  reason: 'inactivity' | 'error_pattern' | 'feature_discovery' | 'page_context' | 'behavior_pattern'
  confidence: number
  priority: 'low' | 'medium' | 'high'
  message: string
  delay?: number
}

interface UseContextualToursConfig {
  enableBehaviorTracking?: boolean
  enableInactivityDetection?: boolean
  enableErrorTracking?: boolean
  enableFeatureDiscovery?: boolean
  inactivityThreshold?: number
  errorThreshold?: number
  suggestionCooldown?: number
  maxSuggestionsPerSession?: number
}

/**
 * Hook for intelligent tour suggestions - implements requirements 8.1, 8.2, 8.3, 8.4
 * Provides behavior-based tour triggering, page context detection, and proactive suggestions
 */
export function useContextualTours(config: UseContextualToursConfig = {}) {
  const router = useRouter()
  const navigation = useNavigation()
  const { startTour, getTourStatus } = useTour()
  const { getUserProgress, trackAnalyticsEvent } = useTourProgress({ enableAnalytics: true })

  // Default configuration
  const defaultConfig = {
    enableBehaviorTracking: true,
    enableInactivityDetection: true,
    enableErrorTracking: true,
    enableFeatureDiscovery: true,
    inactivityThreshold: 30000, // 30 seconds
    errorThreshold: 3,
    suggestionCooldown: 300000, // 5 minutes
    maxSuggestionsPerSession: 3,
    ...config
  }

  // State
  const [userActivity, setUserActivity] = useState<UserActivity>({
    pageViews: new Map(),
    timeOnPage: new Map(),
    interactions: new Map(),
    errors: new Map(),
    lastActivity: new Date(),
    inactivityPeriods: [],
    featureUsage: new Map()
  })

  const [suggestions, setSuggestions] = useState<ContextualSuggestion[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState<ContextualSuggestion | null>(null)
  const [suggestionsShownThisSession, setSuggestionsShownThisSession] = useState(0)
  const [lastSuggestionTime, setLastSuggestionTime] = useState<Date | null>(null)

  // Refs for tracking
  const pageStartTime = useRef<Date>(new Date())
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const activityListeners = useRef<(() => void)[]>([])

  // Available tours for contextual suggestions
  const availableTours = useRef<Map<string, TourDefinition>>(new Map([
    ['welcome-tour', {
      id: 'welcome-tour',
      name: 'Tour de Bienvenida',
      description: 'Introducción a las funcionalidades principales',
      category: 'onboarding',
      triggers: [{ type: 'manual' }],
      steps: [],
      metadata: { version: '1.0', author: 'system', lastUpdated: '', estimatedDuration: 300 }
    }],
    ['content-generation-tour', {
      id: 'content-generation-tour',
      name: 'Generación de Contenido',
      description: 'Aprende a generar contenido con IA',
      category: 'feature',
      triggers: [{ type: 'conditional', condition: 'page_path=/content' }],
      steps: [],
      metadata: { version: '1.0', author: 'system', lastUpdated: '', estimatedDuration: 240 }
    }],
    ['campaign-management-tour', {
      id: 'campaign-management-tour',
      name: 'Gestión de Campañas',
      description: 'Maneja tus campañas de marketing',
      category: 'feature',
      triggers: [{ type: 'conditional', condition: 'page_path=/campaigns' }],
      steps: [],
      metadata: { version: '1.0', author: 'system', lastUpdated: '', estimatedDuration: 180 }
    }]
  ]))

  // Initialize activity tracking
  useEffect(() => {
    if (!defaultConfig.enableBehaviorTracking) return

    const trackActivity = () => {
      setUserActivity(prev => ({
        ...prev,
        lastActivity: new Date()
      }))
      resetInactivityTimer()
    }

    const trackPageView = () => {
      const currentPath = window.location.pathname
      setUserActivity(prev => ({
        ...prev,
        pageViews: new Map(prev.pageViews.set(currentPath, (prev.pageViews.get(currentPath) || 0) + 1))
      }))
      pageStartTime.current = new Date()
    }

    const trackPageLeave = () => {
      const currentPath = window.location.pathname
      const timeSpent = Date.now() - pageStartTime.current.getTime()
      setUserActivity(prev => ({
        ...prev,
        timeOnPage: new Map(prev.timeOnPage.set(currentPath, (prev.timeOnPage.get(currentPath) || 0) + timeSpent))
      }))
    }

    // Activity event listeners
    const events = ['click', 'keydown', 'scroll', 'mousemove']
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true })
      activityListeners.current.push(() => document.removeEventListener(event, trackActivity))
    })

    // Page navigation tracking
    trackPageView()
    window.addEventListener('beforeunload', trackPageLeave)
    activityListeners.current.push(() => window.removeEventListener('beforeunload', trackPageLeave))

    // Start inactivity detection
    resetInactivityTimer()

    return () => {
      activityListeners.current.forEach(cleanup => cleanup())
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
    }
  }, [defaultConfig.enableBehaviorTracking])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!defaultConfig.enableInactivityDetection) return

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    inactivityTimer.current = setTimeout(() => {
      handleInactivity()
    }, defaultConfig.inactivityThreshold)
  }, [defaultConfig.enableInactivityDetection, defaultConfig.inactivityThreshold])

  // Handle user inactivity
  const handleInactivity = useCallback(() => {
    const inactivityDuration = Date.now() - userActivity.lastActivity.getTime()
    
    setUserActivity(prev => ({
      ...prev,
      inactivityPeriods: [...prev.inactivityPeriods, inactivityDuration]
    }))

    // Suggest contextual tour based on current page
    const currentPath = window.location.pathname
    const suggestion = generateInactivitySuggestion(currentPath)
    
    if (suggestion) {
      addSuggestion(suggestion)
    }
  }, [userActivity.lastActivity])

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName: string) => {
    if (!defaultConfig.enableFeatureDiscovery) return

    setUserActivity(prev => ({
      ...prev,
      featureUsage: new Map(prev.featureUsage.set(featureName, new Date()))
    }))

    // Track analytics
    trackAnalyticsEvent('current-user', 'contextual-tracking', {
      type: 'help_requested',
      metadata: { feature: featureName, timestamp: new Date() }
    })
  }, [defaultConfig.enableFeatureDiscovery, trackAnalyticsEvent])

  // Track user errors
  const trackError = useCallback((errorType: string, context?: string) => {
    if (!defaultConfig.enableErrorTracking) return

    const errorKey = context ? `${errorType}:${context}` : errorType
    const errorCount = (userActivity.errors.get(errorKey) || 0) + 1

    setUserActivity(prev => ({
      ...prev,
      errors: new Map(prev.errors.set(errorKey, errorCount))
    }))

    // If error threshold is reached, suggest help tour
    if (errorCount >= defaultConfig.errorThreshold) {
      const suggestion = generateErrorSuggestion(errorType, context)
      if (suggestion) {
        addSuggestion(suggestion)
      }
    }
  }, [defaultConfig.enableErrorTracking, defaultConfig.errorThreshold, userActivity.errors])

  // Generate inactivity-based suggestion
  const generateInactivitySuggestion = useCallback((currentPath: string): ContextualSuggestion | null => {
    // Map paths to relevant tours
    const pathTourMap: Record<string, string> = {
      '/dashboard': 'welcome-tour',
      '/content': 'content-generation-tour',
      '/campaigns': 'campaign-management-tour'
    }

    const suggestedTourId = pathTourMap[currentPath]
    if (!suggestedTourId) return null

    const tourStatus = getTourStatus(suggestedTourId)
    if (tourStatus === 'completed' || tourStatus === 'skipped') return null

    return {
      tourId: suggestedTourId,
      reason: 'inactivity',
      confidence: 0.7,
      priority: 'medium',
      message: '¿Necesitas ayuda navegando esta sección? Te puedo mostrar un tour rápido.',
      delay: 2000
    }
  }, [getTourStatus])

  // Generate error-based suggestion
  const generateErrorSuggestion = useCallback((errorType: string, context?: string): ContextualSuggestion | null => {
    // Map error types to relevant tours
    const errorTourMap: Record<string, string> = {
      'content_generation_error': 'content-generation-tour',
      'campaign_creation_error': 'campaign-management-tour',
      'navigation_error': 'welcome-tour'
    }

    const suggestedTourId = errorTourMap[errorType]
    if (!suggestedTourId) return null

    const tourStatus = getTourStatus(suggestedTourId)
    if (tourStatus === 'completed') return null

    return {
      tourId: suggestedTourId,
      reason: 'error_pattern',
      confidence: 0.9,
      priority: 'high',
      message: 'Parece que tienes dificultades con esta función. ¿Te gustaría ver un tutorial?',
      delay: 1000
    }
  }, [getTourStatus])

  // Generate feature discovery suggestion
  const generateFeatureDiscoverySuggestion = useCallback((unusedFeatures: string[]): ContextualSuggestion | null => {
    if (unusedFeatures.length === 0) return null

    // Prioritize important features
    const importantFeatures = ['content-generation', 'campaign-management']
    const suggestedFeature = unusedFeatures.find(f => importantFeatures.includes(f)) || unusedFeatures[0]

    const featureTourMap: Record<string, string> = {
      'content-generation': 'content-generation-tour',
      'campaign-management': 'campaign-management-tour'
    }

    const suggestedTourId = featureTourMap[suggestedFeature]
    if (!suggestedTourId) return null

    const tourStatus = getTourStatus(suggestedTourId)
    if (tourStatus === 'completed' || tourStatus === 'skipped') return null

    return {
      tourId: suggestedTourId,
      reason: 'feature_discovery',
      confidence: 0.6,
      priority: 'low',
      message: `¿Sabías que puedes usar ${suggestedFeature}? Te muestro cómo funciona.`,
      delay: 5000
    }
  }, [getTourStatus])

  // Add suggestion to queue
  const addSuggestion = useCallback((suggestion: ContextualSuggestion) => {
    // Check cooldown period
    if (lastSuggestionTime && 
        Date.now() - lastSuggestionTime.getTime() < defaultConfig.suggestionCooldown) {
      return
    }

    // Check session limit
    if (suggestionsShownThisSession >= defaultConfig.maxSuggestionsPerSession) {
      return
    }

    setSuggestions(prev => {
      // Remove duplicates and add new suggestion
      const filtered = prev.filter(s => s.tourId !== suggestion.tourId)
      return [...filtered, suggestion].sort((a, b) => {
        // Sort by priority and confidence
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        return b.confidence - a.confidence
      })
    })
  }, [lastSuggestionTime, suggestionsShownThisSession, defaultConfig])

  // Show next suggestion
  const showNextSuggestion = useCallback(() => {
    if (suggestions.length === 0 || activeSuggestion) return

    const nextSuggestion = suggestions[0]
    setActiveSuggestion(nextSuggestion)
    setSuggestionsShownThisSession(prev => prev + 1)
    setLastSuggestionTime(new Date())

    // Remove from queue
    setSuggestions(prev => prev.slice(1))

    // Auto-hide after delay if specified
    if (nextSuggestion.delay) {
      setTimeout(() => {
        setActiveSuggestion(null)
      }, nextSuggestion.delay + 10000) // Show for 10 seconds after delay
    }

    // Track analytics
    trackAnalyticsEvent('current-user', 'contextual-suggestion', {
      type: 'help_requested',
      metadata: {
        tourId: nextSuggestion.tourId,
        reason: nextSuggestion.reason,
        confidence: nextSuggestion.confidence,
        priority: nextSuggestion.priority
      }
    })
  }, [suggestions, activeSuggestion, trackAnalyticsEvent])

  // Accept suggestion and start tour
  const acceptSuggestion = useCallback(async (suggestion: ContextualSuggestion) => {
    try {
      await startTour(suggestion.tourId, { autoStart: true })
      setActiveSuggestion(null)
      
      // Track acceptance
      trackAnalyticsEvent('current-user', suggestion.tourId, {
        type: 'tour_started',
        metadata: {
          source: 'contextual_suggestion',
          reason: suggestion.reason
        }
      })
    } catch (error) {
      console.error('Failed to start suggested tour:', error)
    }
  }, [startTour, trackAnalyticsEvent])

  // Dismiss suggestion
  const dismissSuggestion = useCallback((suggestion: ContextualSuggestion) => {
    setActiveSuggestion(null)
    
    // Track dismissal
    trackAnalyticsEvent('current-user', 'contextual-suggestion', {
      type: 'help_requested',
      metadata: {
        tourId: suggestion.tourId,
        action: 'dismissed',
        reason: suggestion.reason
      }
    })
  }, [trackAnalyticsEvent])

  // Analyze user behavior and generate suggestions
  const analyzeUserBehavior = useCallback(() => {
    const currentPath = window.location.pathname
    const pageViewCount = userActivity.pageViews.get(currentPath) || 0
    const timeOnCurrentPage = Date.now() - pageStartTime.current.getTime()
    
    // Check for feature discovery opportunities
    const allFeatures = ['content-generation', 'campaign-management', 'analytics', 'calendar']
    const usedFeatures = Array.from(userActivity.featureUsage.keys())
    const unusedFeatures = allFeatures.filter(f => !usedFeatures.includes(f))
    
    // Generate suggestions based on behavior patterns
    if (pageViewCount > 3 && timeOnCurrentPage > 60000) { // Multiple visits, long time on page
      const suggestion = generateInactivitySuggestion(currentPath)
      if (suggestion) {
        suggestion.reason = 'behavior_pattern'
        suggestion.message = 'Veo que pasas mucho tiempo en esta página. ¿Te ayudo a ser más eficiente?'
        addSuggestion(suggestion)
      }
    }
    
    if (unusedFeatures.length > 0 && usedFeatures.length > 0) { // Has used some features but not others
      const suggestion = generateFeatureDiscoverySuggestion(unusedFeatures)
      if (suggestion) {
        addSuggestion(suggestion)
      }
    }
  }, [userActivity, generateInactivitySuggestion, generateFeatureDiscoverySuggestion, addSuggestion])

  // Periodic behavior analysis
  useEffect(() => {
    const interval = setInterval(() => {
      analyzeUserBehavior()
      showNextSuggestion()
    }, 30000) // Analyze every 30 seconds

    return () => clearInterval(interval)
  }, [analyzeUserBehavior, showNextSuggestion])

  // Page context detection
  const detectPageContext = useCallback(() => {
    const currentPath = window.location.pathname
    const currentClient = navigation.currentClient
    
    // Detect if user is on a new page they haven't seen before
    const isNewPage = !userActivity.pageViews.has(currentPath)
    
    if (isNewPage) {
      // Suggest contextual tour for new pages
      const suggestion = generateInactivitySuggestion(currentPath)
      if (suggestion) {
        suggestion.reason = 'page_context'
        suggestion.message = 'Esta es tu primera vez en esta sección. ¿Te muestro las funcionalidades principales?'
        suggestion.delay = 3000 // Give user time to orient themselves
        addSuggestion(suggestion)
      }
    }
    
    return {
      currentPath,
      currentClient,
      isNewPage,
      pageViewCount: userActivity.pageViews.get(currentPath) || 0,
      timeOnPage: userActivity.timeOnPage.get(currentPath) || 0
    }
  }, [navigation.currentClient, userActivity, generateInactivitySuggestion, addSuggestion])

  // Monitor for "what's new" opportunities
  const checkForNewFeatures = useCallback(() => {
    // This would integrate with a feature flag system or version tracking
    // For now, simulate checking for new features
    const lastLoginDate = localStorage.getItem('last_login_date')
    const currentDate = new Date().toISOString().split('T')[0]
    
    if (lastLoginDate && lastLoginDate !== currentDate) {
      // User hasn't logged in today - might have new features to show
      const suggestion: ContextualSuggestion = {
        tourId: 'welcome-tour', // Could be a "what's new" tour
        reason: 'feature_discovery',
        confidence: 0.8,
        priority: 'medium',
        message: '¡Hay nuevas funcionalidades disponibles! ¿Te las muestro?',
        delay: 5000
      }
      
      addSuggestion(suggestion)
    }
    
    localStorage.setItem('last_login_date', currentDate)
  }, [addSuggestion])

  // Initialize new feature check
  useEffect(() => {
    checkForNewFeatures()
  }, [checkForNewFeatures])

  return {
    // State
    userActivity,
    suggestions,
    activeSuggestion,
    suggestionsShownThisSession,
    
    // Actions
    trackFeatureUsage,
    trackError,
    acceptSuggestion,
    dismissSuggestion,
    showNextSuggestion,
    
    // Analysis
    analyzeUserBehavior,
    detectPageContext,
    checkForNewFeatures,
    
    // Configuration
    config: defaultConfig
  }
}

// Convenience hook for simple contextual suggestions
export function useSimpleContextualTours() {
  const { 
    activeSuggestion, 
    acceptSuggestion, 
    dismissSuggestion, 
    trackFeatureUsage, 
    trackError 
  } = useContextualTours({
    enableBehaviorTracking: true,
    enableInactivityDetection: true,
    maxSuggestionsPerSession: 2
  })

  return {
    suggestion: activeSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    trackFeatureUsage,
    trackError
  }
}

// Hook for behavior-based tour triggering
export function useBehaviorBasedTours() {
  const {
    userActivity,
    analyzeUserBehavior,
    detectPageContext,
    trackFeatureUsage,
    trackError
  } = useContextualTours({
    enableBehaviorTracking: true,
    enableInactivityDetection: true,
    enableErrorTracking: true,
    enableFeatureDiscovery: true
  })

  return {
    userActivity,
    analyzeUserBehavior,
    detectPageContext,
    trackFeatureUsage,
    trackError
  }
}