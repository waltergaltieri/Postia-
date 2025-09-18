'use client'

import { useCallback, useEffect, useState } from 'react'
import type { 
  UserTourProgress, 
  TourEvent, 
  TourAnalytics 
} from '@/types/tour'

interface ProgressMetrics {
  completionRate: number
  averageStepDuration: number
  totalDuration: number
  dropoffStep?: number
  interactionCount: number
  helpRequests: number
}

interface UseTourProgressConfig {
  enableAnalytics?: boolean
  enablePersistence?: boolean
  syncInterval?: number
  onProgressUpdate?: (progress: UserTourProgress) => void
  onAnalyticsUpdate?: (analytics: TourAnalytics) => void
}

/**
 * Hook for tracking and persisting tour progress - implements requirements 1.4, 7.3, 8.1
 * Provides completion status management, analytics, and progress restoration
 */
export function useTourProgress(config: UseTourProgressConfig = {}) {
  const [progressData, setProgressData] = useState<Map<string, UserTourProgress>>(new Map())
  const [analyticsData, setAnalyticsData] = useState<Map<string, TourAnalytics>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Load progress data on mount
  useEffect(() => {
    if (config.enablePersistence) {
      loadAllProgress()
    }
  }, [config.enablePersistence])

  // Auto-sync progress data at intervals
  useEffect(() => {
    if (!config.syncInterval || !config.enablePersistence) return

    const interval = setInterval(() => {
      syncProgressData()
    }, config.syncInterval)

    return () => clearInterval(interval)
  }, [config.syncInterval, config.enablePersistence])

  // Load all progress data from storage
  const loadAllProgress = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const progressMap = new Map<string, UserTourProgress>()
      const analyticsMap = new Map<string, TourAnalytics>()

      // Load from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        if (key.startsWith('tour_progress_')) {
          const data = localStorage.getItem(key)
          if (data) {
            const progress: UserTourProgress = JSON.parse(data)
            const progressKey = `${progress.userId}_${progress.tourId}`
            progressMap.set(progressKey, progress)
          }
        }

        if (key.startsWith('tour_analytics_')) {
          const data = localStorage.getItem(key)
          if (data) {
            const analytics: TourAnalytics = JSON.parse(data)
            const analyticsKey = `${analytics.userId}_${analytics.tourId}`
            analyticsMap.set(analyticsKey, analytics)
          }
        }
      }

      setProgressData(progressMap)
      setAnalyticsData(analyticsMap)
    } catch (error) {
      setError(error as Error)
      console.error('Failed to load progress data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save progress data to storage
  const saveProgress = useCallback(async (progress: UserTourProgress) => {
    try {
      const key = `tour_progress_${progress.userId}_${progress.tourId}`
      const progressKey = `${progress.userId}_${progress.tourId}`
      
      // Update in-memory data
      setProgressData(prev => new Map(prev.set(progressKey, progress)))
      
      // Persist to localStorage if enabled
      if (config.enablePersistence) {
        localStorage.setItem(key, JSON.stringify(progress))
      }

      // Call callback if provided
      config.onProgressUpdate?.(progress)

      console.log(`Saved progress for tour: ${progress.tourId}`)
    } catch (error) {
      setError(error as Error)
      console.error('Failed to save progress:', error)
    }
  }, [config])

  // Load specific tour progress
  const loadProgress = useCallback(async (userId: string, tourId: string): Promise<UserTourProgress | null> => {
    try {
      const progressKey = `${userId}_${tourId}`
      
      // Check in-memory first
      const memoryProgress = progressData.get(progressKey)
      if (memoryProgress) {
        return memoryProgress
      }

      // Load from localStorage if persistence is enabled
      if (config.enablePersistence) {
        const key = `tour_progress_${userId}_${tourId}`
        const data = localStorage.getItem(key)
        if (data) {
          const progress: UserTourProgress = JSON.parse(data)
          
          // Update in-memory cache
          setProgressData(prev => new Map(prev.set(progressKey, progress)))
          
          return progress
        }
      }

      return null
    } catch (error) {
      console.error('Failed to load progress:', error)
      return null
    }
  }, [progressData, config.enablePersistence])

  // Create new progress entry
  const createProgress = useCallback((userId: string, tourId: string): UserTourProgress => {
    const progress: UserTourProgress = {
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

    return progress
  }, [])

  // Update progress step
  const updateProgress = useCallback(async (
    userId: string, 
    tourId: string, 
    updates: Partial<UserTourProgress>
  ) => {
    try {
      const existing = await loadProgress(userId, tourId)
      const progress = existing || createProgress(userId, tourId)
      
      const updatedProgress: UserTourProgress = {
        ...progress,
        ...updates,
        lastInteractionAt: new Date()
      }

      await saveProgress(updatedProgress)
      return updatedProgress
    } catch (error) {
      setError(error as Error)
      console.error('Failed to update progress:', error)
      throw error
    }
  }, [loadProgress, createProgress, saveProgress])

  // Mark tour as started
  const startTourProgress = useCallback(async (userId: string, tourId: string) => {
    return updateProgress(userId, tourId, {
      status: 'in_progress',
      startedAt: new Date(),
      currentStep: 0
    })
  }, [updateProgress])

  // Mark step as completed
  const completeStep = useCallback(async (userId: string, tourId: string, stepIndex: number) => {
    const existing = await loadProgress(userId, tourId)
    if (!existing) throw new Error('No progress found for tour')

    const completedSteps = [...existing.completedSteps]
    if (!completedSteps.includes(stepIndex)) {
      completedSteps.push(stepIndex)
    }

    return updateProgress(userId, tourId, {
      currentStep: stepIndex + 1,
      completedSteps
    })
  }, [loadProgress, updateProgress])

  // Mark tour as completed
  const completeTour = useCallback(async (userId: string, tourId: string) => {
    return updateProgress(userId, tourId, {
      status: 'completed',
      completedAt: new Date()
    })
  }, [updateProgress])

  // Mark tour as skipped
  const skipTour = useCallback(async (userId: string, tourId: string) => {
    return updateProgress(userId, tourId, {
      status: 'skipped',
      skippedAt: new Date()
    })
  }, [updateProgress])

  // Reset tour progress
  const resetProgress = useCallback(async (userId: string, tourId: string) => {
    try {
      const progressKey = `${userId}_${tourId}`
      const key = `tour_progress_${userId}_${tourId}`
      
      // Remove from memory
      setProgressData(prev => {
        const newMap = new Map(prev)
        newMap.delete(progressKey)
        return newMap
      })
      
      // Remove from localStorage
      if (config.enablePersistence) {
        localStorage.removeItem(key)
      }

      console.log(`Reset progress for tour: ${tourId}`)
    } catch (error) {
      setError(error as Error)
      console.error('Failed to reset progress:', error)
    }
  }, [config.enablePersistence])

  // Get progress for specific tour
  const getProgress = useCallback((userId: string, tourId: string): UserTourProgress | null => {
    const progressKey = `${userId}_${tourId}`
    return progressData.get(progressKey) || null
  }, [progressData])

  // Get all progress for user
  const getUserProgress = useCallback((userId: string): UserTourProgress[] => {
    const userProgress: UserTourProgress[] = []
    
    progressData.forEach((progress) => {
      if (progress.userId === userId) {
        userProgress.push(progress)
      }
    })
    
    return userProgress
  }, [progressData])

  // Calculate progress metrics
  const calculateMetrics = useCallback((userId: string, tourId: string): ProgressMetrics | null => {
    const progress = getProgress(userId, tourId)
    const analytics = analyticsData.get(`${userId}_${tourId}`)
    
    if (!progress || !analytics) return null

    const totalSteps = progress.completedSteps.length
    const completionRate = totalSteps > 0 ? (progress.completedSteps.length / totalSteps) * 100 : 0
    
    const stepDurations = analytics.metrics.stepDurations || []
    const averageStepDuration = stepDurations.length > 0 
      ? stepDurations.reduce((sum, duration) => sum + duration, 0) / stepDurations.length 
      : 0

    return {
      completionRate,
      averageStepDuration,
      totalDuration: analytics.metrics.totalDuration || 0,
      dropoffStep: analytics.metrics.dropoffStep,
      interactionCount: analytics.metrics.interactionCount || 0,
      helpRequests: analytics.events.filter(e => e.type === 'help_requested').length
    }
  }, [getProgress, analyticsData])

  // Track analytics event
  const trackAnalyticsEvent = useCallback(async (
    userId: string, 
    tourId: string, 
    event: Omit<TourEvent, 'timestamp'>
  ) => {
    if (!config.enableAnalytics) return

    try {
      const analyticsKey = `${userId}_${tourId}`
      const existing = analyticsData.get(analyticsKey)
      
      const tourEvent: TourEvent = {
        ...event,
        timestamp: new Date()
      }

      const analytics: TourAnalytics = existing || {
        tourId,
        userId,
        sessionId: generateSessionId(),
        events: [],
        metrics: {
          totalDuration: 0,
          stepDurations: [],
          completionRate: 0,
          interactionCount: 0
        }
      }

      analytics.events.push(tourEvent)
      analytics.metrics.interactionCount++

      // Update analytics data
      setAnalyticsData(prev => new Map(prev.set(analyticsKey, analytics)))

      // Persist to localStorage if enabled
      if (config.enablePersistence) {
        const key = `tour_analytics_${userId}_${tourId}`
        localStorage.setItem(key, JSON.stringify(analytics))
      }

      // Call callback if provided
      config.onAnalyticsUpdate?.(analytics)
    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }, [config, analyticsData])

  // Restore interrupted tour
  const restoreInterruptedTour = useCallback(async (userId: string): Promise<UserTourProgress | null> => {
    try {
      const userProgress = getUserProgress(userId)
      
      // Find the most recent interrupted tour (in_progress status)
      const interruptedTour = userProgress
        .filter(p => p.status === 'in_progress')
        .sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime())[0]

      if (interruptedTour) {
        console.log(`Found interrupted tour: ${interruptedTour.tourId}`)
        return interruptedTour
      }

      return null
    } catch (error) {
      console.error('Failed to restore interrupted tour:', error)
      return null
    }
  }, [getUserProgress])

  // Sync progress data (for future API integration)
  const syncProgressData = useCallback(async () => {
    try {
      // This would sync with a backend API in a real implementation
      console.log('Syncing progress data...')
      
      // For now, just ensure localStorage is up to date
      if (config.enablePersistence) {
        progressData.forEach((progress, key) => {
          const storageKey = `tour_progress_${progress.userId}_${progress.tourId}`
          localStorage.setItem(storageKey, JSON.stringify(progress))
        })

        analyticsData.forEach((analytics, key) => {
          const storageKey = `tour_analytics_${analytics.userId}_${analytics.tourId}`
          localStorage.setItem(storageKey, JSON.stringify(analytics))
        })
      }
    } catch (error) {
      console.error('Failed to sync progress data:', error)
    }
  }, [config.enablePersistence, progressData, analyticsData])

  // Get completion statistics
  const getCompletionStats = useCallback((userId: string) => {
    const userProgress = getUserProgress(userId)
    
    const total = userProgress.length
    const completed = userProgress.filter(p => p.status === 'completed').length
    const skipped = userProgress.filter(p => p.status === 'skipped').length
    const inProgress = userProgress.filter(p => p.status === 'in_progress').length
    
    return {
      total,
      completed,
      skipped,
      inProgress,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      skipRate: total > 0 ? (skipped / total) * 100 : 0
    }
  }, [getUserProgress])

  // Utility functions
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  return {
    // State
    progressData: Array.from(progressData.values()),
    analyticsData: Array.from(analyticsData.values()),
    isLoading,
    error,

    // Progress management
    loadProgress,
    saveProgress,
    createProgress,
    updateProgress,
    resetProgress,
    
    // Tour lifecycle
    startTourProgress,
    completeStep,
    completeTour,
    skipTour,
    
    // Data retrieval
    getProgress,
    getUserProgress,
    restoreInterruptedTour,
    
    // Analytics
    trackAnalyticsEvent,
    calculateMetrics,
    getCompletionStats,
    
    // Utilities
    syncProgressData,
    loadAllProgress
  }
}

// Convenience hook for basic progress tracking
export function useTourProgressTracker(userId: string, tourId: string) {
  const {
    getProgress,
    updateProgress,
    completeStep,
    completeTour,
    skipTour,
    calculateMetrics
  } = useTourProgress({ enablePersistence: true, enableAnalytics: true })

  const progress = getProgress(userId, tourId)
  const metrics = calculateMetrics(userId, tourId)

  return {
    progress,
    metrics,
    updateProgress: (updates: Partial<UserTourProgress>) => updateProgress(userId, tourId, updates),
    completeStep: (stepIndex: number) => completeStep(userId, tourId, stepIndex),
    completeTour: () => completeTour(userId, tourId),
    skipTour: () => skipTour(userId, tourId)
  }
}

// Hook for analytics-focused progress tracking
export function useTourAnalytics(userId: string, tourId: string) {
  const {
    trackAnalyticsEvent,
    calculateMetrics,
    getCompletionStats
  } = useTourProgress({ enableAnalytics: true, enablePersistence: true })

  const metrics = calculateMetrics(userId, tourId)
  const stats = getCompletionStats(userId)

  return {
    metrics,
    stats,
    trackEvent: (event: Omit<TourEvent, 'timestamp'>) => trackAnalyticsEvent(userId, tourId, event)
  }
}