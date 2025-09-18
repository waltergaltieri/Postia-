'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTour } from './use-tour'
import { useTourProgress } from './use-tour-progress'
import { 
  FeatureDiscoveryEngine, 
  type FeatureDiscoveryRecommendation, 
  type WhatsNewItem, 
  type FeatureDiscoveryConfig,
  type FeatureDefinition
} from '@/lib/tour/discovery/feature-discovery-engine'

/**
 * Configuration for feature discovery hook
 */
export interface UseFeatureDiscoveryConfig extends Partial<FeatureDiscoveryConfig> {
  enableAutoSuggestions?: boolean
  enableWhatsNewNotifications?: boolean
  userId?: string
}

/**
 * Hook return type
 */
export interface UseFeatureDiscoveryReturn {
  // Recommendations
  recommendations: FeatureDiscoveryRecommendation[]
  activeRecommendation: FeatureDiscoveryRecommendation | null
  
  // What's New
  whatsNewItems: WhatsNewItem[]
  unreadWhatsNewCount: number
  
  // Actions
  acceptRecommendation: (recommendationId: string) => Promise<boolean>
  dismissRecommendation: (recommendationId: string, reason?: string) => void
  showNextRecommendation: () => boolean
  
  // Feature tracking
  trackFeatureUsage: (featureId: string) => void
  markWhatsNewAsRead: (itemId: string) => void
  
  // Discovery management
  refreshRecommendations: () => void
  getPersonalizedTours: () => string[]
  
  // Analytics
  getDiscoveryAnalytics: () => Record<string, any>
  
  // Configuration
  updateConfig: (newConfig: Partial<UseFeatureDiscoveryConfig>) => void
}

/**
 * Hook for feature discovery and "what's new" functionality
 * Implements requirements 2.3, 8.5 for feature discovery and personalized recommendations
 */
export function useFeatureDiscovery(
  config: UseFeatureDiscoveryConfig = {}
): UseFeatureDiscoveryReturn {
  const { startTour } = useTour()
  const { trackAnalyticsEvent } = useTourProgress({ enableAnalytics: true })

  // Default configuration
  const defaultConfig: UseFeatureDiscoveryConfig = {
    enableFeatureDiscovery: true,
    enableWhatsNew: true,
    enablePersonalization: true,
    enableAutoSuggestions: true,
    enableWhatsNewNotifications: true,
    maxRecommendationsPerSession: 2,
    recommendationCooldownPeriod: 1800000, // 30 minutes
    newUserGracePeriod: 7,
    minimumConfidenceThreshold: 0.6,
    unusedFeatureThreshold: 14,
    whatsNewRetentionDays: 30,
    maxWhatsNewItems: 10,
    userId: 'current-user',
    ...config
  }

  // State
  const [recommendations, setRecommendations] = useState<FeatureDiscoveryRecommendation[]>([])
  const [activeRecommendation, setActiveRecommendation] = useState<FeatureDiscoveryRecommendation | null>(null)
  const [whatsNewItems, setWhatsNewItems] = useState<WhatsNewItem[]>([])
  const [readWhatsNewItems, setReadWhatsNewItems] = useState<Set<string>>(new Set())
  const [lastRecommendationTime, setLastRecommendationTime] = useState<Date | null>(null)

  // Refs
  const discoveryEngine = useRef<FeatureDiscoveryEngine | null>(null)
  const isInitialized = useRef(false)

  // Initialize discovery engine
  useEffect(() => {
    if (isInitialized.current) return

    discoveryEngine.current = new FeatureDiscoveryEngine(
      defaultConfig,
      [], // Initial features will be loaded by the engine
      defaultConfig.userId
    )

    // Load initial data
    refreshRecommendations()
    loadWhatsNewItems()

    // Setup periodic refresh
    const refreshInterval = setInterval(() => {
      if (defaultConfig.enableAutoSuggestions) {
        refreshRecommendations()
      }
    }, 300000) // Refresh every 5 minutes

    isInitialized.current = true

    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  // Load recommendations
  const refreshRecommendations = useCallback(() => {
    if (!discoveryEngine.current) return

    // Check cooldown period
    if (lastRecommendationTime && 
        Date.now() - lastRecommendationTime.getTime() < defaultConfig.recommendationCooldownPeriod!) {
      return
    }

    const newRecommendations = discoveryEngine.current.generateRecommendations()
    setRecommendations(newRecommendations)

    // Auto-show first recommendation if enabled
    if (defaultConfig.enableAutoSuggestions && newRecommendations.length > 0 && !activeRecommendation) {
      setTimeout(() => {
        showNextRecommendation()
      }, newRecommendations[0].suggestedDelay)
    }

    // Track analytics
    if (newRecommendations.length > 0) {
      trackAnalyticsEvent('current-user', 'feature-discovery', {
        type: 'help_requested',
        metadata: {
          recommendationCount: newRecommendations.length,
          topRecommendation: newRecommendations[0].featureId,
          confidence: newRecommendations[0].confidence
        }
      })
    }
  }, [lastRecommendationTime, activeRecommendation, defaultConfig, trackAnalyticsEvent])

  // Load what's new items
  const loadWhatsNewItems = useCallback(() => {
    if (!discoveryEngine.current) return

    const items = discoveryEngine.current.getWhatsNewItems()
    setWhatsNewItems(items)

    // Load read status from localStorage
    const readItems = localStorage.getItem('whats-new-read-items')
    if (readItems) {
      try {
        const parsedReadItems = JSON.parse(readItems)
        setReadWhatsNewItems(new Set(parsedReadItems))
      } catch (error) {
        console.error('Failed to parse read what\'s new items:', error)
      }
    }
  }, [])

  // Accept recommendation and start tour
  const acceptRecommendation = useCallback(async (recommendationId: string): Promise<boolean> => {
    if (!discoveryEngine.current) return false

    const recommendation = recommendations.find(r => r.featureId === recommendationId) || activeRecommendation
    if (!recommendation) return false

    try {
      // Mark as accepted in discovery engine
      discoveryEngine.current.acceptFeatureSuggestion(recommendation.featureId)

      // Start tour if available
      if (recommendation.feature.tourId) {
        await startTour(recommendation.feature.tourId, {
          autoStart: true,
          source: 'feature_discovery',
          metadata: {
            recommendationId: recommendation.featureId,
            reason: recommendation.reason,
            confidence: recommendation.confidence
          }
        })
      }

      // Update state
      setActiveRecommendation(null)
      setRecommendations(prev => prev.filter(r => r.featureId !== recommendationId))
      setLastRecommendationTime(new Date())

      // Track analytics
      trackAnalyticsEvent('current-user', recommendation.feature.tourId || 'feature-discovery', {
        type: 'tour_started',
        metadata: {
          source: 'feature_discovery',
          featureId: recommendation.featureId,
          reason: recommendation.reason,
          confidence: recommendation.confidence
        }
      })

      return true
    } catch (error) {
      console.error('Failed to accept recommendation:', error)
      
      trackAnalyticsEvent('current-user', 'feature-discovery', {
        type: 'help_requested',
        metadata: {
          action: 'accept_error',
          featureId: recommendation.featureId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return false
    }
  }, [recommendations, activeRecommendation, startTour, trackAnalyticsEvent])

  // Dismiss recommendation
  const dismissRecommendation = useCallback((recommendationId: string, reason?: string): void => {
    if (!discoveryEngine.current) return

    const recommendation = recommendations.find(r => r.featureId === recommendationId) || activeRecommendation
    if (!recommendation) return

    // Mark as dismissed in discovery engine
    discoveryEngine.current.dismissFeatureSuggestion(recommendation.featureId, reason)

    // Update state
    setActiveRecommendation(null)
    setRecommendations(prev => prev.filter(r => r.featureId !== recommendationId))
    setLastRecommendationTime(new Date())

    // Track analytics
    trackAnalyticsEvent('current-user', 'feature-discovery', {
      type: 'help_requested',
      metadata: {
        action: 'dismissed',
        featureId: recommendation.featureId,
        reason: reason || 'no_reason',
        confidence: recommendation.confidence
      }
    })
  }, [recommendations, activeRecommendation, trackAnalyticsEvent])

  // Show next recommendation
  const showNextRecommendation = useCallback((): boolean => {
    if (activeRecommendation || recommendations.length === 0) return false

    const nextRecommendation = recommendations[0]
    setActiveRecommendation(nextRecommendation)
    setLastRecommendationTime(new Date())

    // Track analytics
    trackAnalyticsEvent('current-user', 'feature-discovery', {
      type: 'help_requested',
      metadata: {
        action: 'shown',
        featureId: nextRecommendation.featureId,
        reason: nextRecommendation.reason,
        confidence: nextRecommendation.confidence
      }
    })

    return true
  }, [activeRecommendation, recommendations, trackAnalyticsEvent])

  // Track feature usage
  const trackFeatureUsage = useCallback((featureId: string): void => {
    if (!discoveryEngine.current) return

    discoveryEngine.current.trackFeatureUsage(featureId)

    // Refresh recommendations after usage tracking
    setTimeout(() => {
      refreshRecommendations()
    }, 1000)

    // Track analytics
    trackAnalyticsEvent('current-user', 'feature-usage', {
      type: 'help_requested',
      metadata: {
        featureId,
        timestamp: new Date()
      }
    })
  }, [refreshRecommendations, trackAnalyticsEvent])

  // Mark what's new item as read
  const markWhatsNewAsRead = useCallback((itemId: string): void => {
    setReadWhatsNewItems(prev => {
      const newSet = new Set(prev)
      newSet.add(itemId)
      
      // Persist to localStorage
      localStorage.setItem('whats-new-read-items', JSON.stringify(Array.from(newSet)))
      
      return newSet
    })

    // Track analytics
    trackAnalyticsEvent('current-user', 'whats-new', {
      type: 'help_requested',
      metadata: {
        action: 'read',
        itemId,
        timestamp: new Date()
      }
    })
  }, [trackAnalyticsEvent])

  // Get personalized tour recommendations
  const getPersonalizedTours = useCallback((): string[] => {
    if (!discoveryEngine.current) return []

    return discoveryEngine.current.getPersonalizedTourRecommendations()
  }, [])

  // Get discovery analytics
  const getDiscoveryAnalytics = useCallback((): Record<string, any> => {
    if (!discoveryEngine.current) return {}

    return {
      ...discoveryEngine.current.getDiscoveryAnalytics(),
      activeRecommendations: recommendations.length,
      whatsNewItems: whatsNewItems.length,
      unreadWhatsNew: whatsNewItems.length - readWhatsNewItems.size,
      lastRecommendationTime
    }
  }, [recommendations.length, whatsNewItems.length, readWhatsNewItems.size, lastRecommendationTime])

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<UseFeatureDiscoveryConfig>): void => {
    Object.assign(defaultConfig, newConfig)
    
    // Refresh recommendations with new config
    refreshRecommendations()
  }, [refreshRecommendations])

  // Calculate unread what's new count
  const unreadWhatsNewCount = whatsNewItems.length - readWhatsNewItems.size

  return {
    // Recommendations
    recommendations,
    activeRecommendation,
    
    // What's New
    whatsNewItems,
    unreadWhatsNewCount,
    
    // Actions
    acceptRecommendation,
    dismissRecommendation,
    showNextRecommendation,
    
    // Feature tracking
    trackFeatureUsage,
    markWhatsNewAsRead,
    
    // Discovery management
    refreshRecommendations,
    getPersonalizedTours,
    
    // Analytics
    getDiscoveryAnalytics,
    
    // Configuration
    updateConfig
  }
}

/**
 * Simplified hook for basic feature discovery
 */
export function useSimpleFeatureDiscovery() {
  const {
    activeRecommendation,
    acceptRecommendation,
    dismissRecommendation,
    trackFeatureUsage,
    whatsNewItems,
    unreadWhatsNewCount,
    markWhatsNewAsRead
  } = useFeatureDiscovery({
    maxRecommendationsPerSession: 1,
    enableAutoSuggestions: true,
    minimumConfidenceThreshold: 0.7
  })

  return {
    recommendation: activeRecommendation,
    acceptRecommendation,
    dismissRecommendation,
    trackFeatureUsage,
    whatsNewItems: whatsNewItems.slice(0, 3), // Limit to 3 items
    unreadWhatsNewCount,
    markWhatsNewAsRead
  }
}

/**
 * Hook for "What's New" functionality only
 */
export function useWhatsNew() {
  const {
    whatsNewItems,
    unreadWhatsNewCount,
    markWhatsNewAsRead,
    getDiscoveryAnalytics
  } = useFeatureDiscovery({
    enableFeatureDiscovery: false,
    enableWhatsNew: true,
    enableAutoSuggestions: false
  })

  return {
    whatsNewItems,
    unreadWhatsNewCount,
    markWhatsNewAsRead,
    getAnalytics: getDiscoveryAnalytics
  }
}

/**
 * Hook for personalized tour recommendations
 */
export function usePersonalizedTours() {
  const {
    getPersonalizedTours,
    trackFeatureUsage,
    refreshRecommendations
  } = useFeatureDiscovery({
    enableFeatureDiscovery: true,
    enablePersonalization: true,
    enableAutoSuggestions: false
  })

  return {
    getPersonalizedTours,
    trackFeatureUsage,
    refreshRecommendations
  }
}