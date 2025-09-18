/**
 * Tour Analytics Engine
 * 
 * Provides comprehensive analytics and tracking for tour interactions,
 * completion rates, and user behavior analysis.
 */

import { TourEvent, TourAnalytics, UserTourProgress } from '@/types/tour'

export interface TourMetrics {
  startRate: number        // % usuarios que inician tours
  completionRate: number   // % usuarios que completan tours
  dropoffPoints: number[]  // Pasos donde usuarios abandonan
  averageDuration: number  // Tiempo promedio de completación
  helpRequests: number     // Solicitudes de ayuda durante tours
  skipRate: number         // % usuarios que saltan tours
  stepMetrics: StepMetrics[]
}

export interface StepMetrics {
  stepIndex: number
  viewCount: number
  completionCount: number
  averageTimeSpent: number
  dropoffCount: number
  helpRequestCount: number
}

export interface AnalyticsConfig {
  enableTracking: boolean
  enableRealTime: boolean
  batchSize: number
  flushInterval: number
  storageKey: string
  apiEndpoint?: string
}

export class TourAnalyticsEngine {
  private events: TourEvent[] = []
  private analytics: Map<string, TourAnalytics> = new Map()
  private config: AnalyticsConfig
  private flushTimer?: NodeJS.Timeout
  private sessionId: string

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enableTracking: true,
      enableRealTime: false,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      storageKey: 'tour_analytics',
      ...config
    }
    
    this.sessionId = this.generateSessionId()
    this.loadStoredAnalytics()
    this.startFlushTimer()
  }

  /**
   * Track a tour event
   */
  trackEvent(event: Omit<TourEvent, 'timestamp'>): void {
    if (!this.config.enableTracking) return

    const fullEvent: TourEvent = {
      ...event,
      timestamp: new Date()
    }

    this.events.push(fullEvent)
    this.updateAnalytics(fullEvent)

    // Real-time processing if enabled
    if (this.config.enableRealTime) {
      this.processEventRealTime(fullEvent)
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Start a tour tracking session
   */
  startTourTracking(tourId: string, userId: string): void {
    const analytics: TourAnalytics = {
      tourId,
      userId,
      sessionId: this.sessionId,
      events: [],
      metrics: {
        totalDuration: 0,
        stepDurations: [],
        completionRate: 0,
        interactionCount: 0
      }
    }

    this.analytics.set(`${tourId}-${userId}`, analytics)

    this.trackEvent({
      type: 'tour_started',
      metadata: {
        tourId,
        userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    })
  }

  /**
   * Track step interaction
   */
  trackStepViewed(tourId: string, userId: string, stepIndex: number): void {
    this.trackEvent({
      type: 'step_viewed',
      stepIndex,
      metadata: {
        tourId,
        userId,
        sessionId: this.sessionId,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Track step completion
   */
  trackStepCompleted(tourId: string, userId: string, stepIndex: number, duration: number): void {
    this.trackEvent({
      type: 'step_completed',
      stepIndex,
      metadata: {
        tourId,
        userId,
        sessionId: this.sessionId,
        duration,
        timestamp: Date.now()
      }
    })

    // Update step duration metrics
    const key = `${tourId}-${userId}`
    const analytics = this.analytics.get(key)
    if (analytics) {
      analytics.metrics.stepDurations[stepIndex] = duration
      analytics.metrics.interactionCount++
    }
  }

  /**
   * Track tour completion
   */
  trackTourCompleted(tourId: string, userId: string, totalDuration: number): void {
    this.trackEvent({
      type: 'tour_completed',
      metadata: {
        tourId,
        userId,
        sessionId: this.sessionId,
        totalDuration,
        timestamp: Date.now()
      }
    })

    // Update completion metrics
    const key = `${tourId}-${userId}`
    const analytics = this.analytics.get(key)
    if (analytics) {
      analytics.metrics.totalDuration = totalDuration
      analytics.metrics.completionRate = 100
    }
  }

  /**
   * Track tour skip
   */
  trackTourSkipped(tourId: string, userId: string, stepIndex: number, reason?: string): void {
    this.trackEvent({
      type: 'tour_skipped',
      stepIndex,
      metadata: {
        tourId,
        userId,
        sessionId: this.sessionId,
        reason,
        timestamp: Date.now()
      }
    })

    // Update dropoff metrics
    const key = `${tourId}-${userId}`
    const analytics = this.analytics.get(key)
    if (analytics) {
      analytics.metrics.dropoffStep = stepIndex
    }
  }

  /**
   * Track help request
   */
  trackHelpRequested(tourId: string, userId: string, stepIndex: number, helpType: string): void {
    this.trackEvent({
      type: 'help_requested',
      stepIndex,
      metadata: {
        tourId,
        userId,
        sessionId: this.sessionId,
        helpType,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Calculate tour metrics for a specific tour
   */
  calculateTourMetrics(tourId: string): TourMetrics {
    const tourEvents = this.events.filter(event => 
      event.metadata?.tourId === tourId
    )

    const totalStarts = tourEvents.filter(e => e.type === 'tour_started').length
    const totalCompletions = tourEvents.filter(e => e.type === 'tour_completed').length
    const totalSkips = tourEvents.filter(e => e.type === 'tour_skipped').length
    const helpRequests = tourEvents.filter(e => e.type === 'help_requested').length

    // Calculate step metrics
    const stepMetrics = this.calculateStepMetrics(tourId, tourEvents)

    // Calculate dropoff points
    const dropoffPoints = tourEvents
      .filter(e => e.type === 'tour_skipped' && e.stepIndex !== undefined)
      .map(e => e.stepIndex!)

    // Calculate average duration
    const completedTours = tourEvents.filter(e => 
      e.type === 'tour_completed' && e.metadata?.totalDuration
    )
    const averageDuration = completedTours.length > 0
      ? completedTours.reduce((sum, e) => sum + (e.metadata?.totalDuration || 0), 0) / completedTours.length
      : 0

    return {
      startRate: totalStarts > 0 ? (totalStarts / (totalStarts + totalSkips)) * 100 : 0,
      completionRate: totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0,
      dropoffPoints,
      averageDuration,
      helpRequests,
      skipRate: totalStarts > 0 ? (totalSkips / totalStarts) * 100 : 0,
      stepMetrics
    }
  }

  /**
   * Calculate metrics for individual steps
   */
  private calculateStepMetrics(tourId: string, events: TourEvent[]): StepMetrics[] {
    const stepMap = new Map<number, StepMetrics>()

    events.forEach(event => {
      if (event.stepIndex === undefined) return

      const stepIndex = event.stepIndex
      if (!stepMap.has(stepIndex)) {
        stepMap.set(stepIndex, {
          stepIndex,
          viewCount: 0,
          completionCount: 0,
          averageTimeSpent: 0,
          dropoffCount: 0,
          helpRequestCount: 0
        })
      }

      const metrics = stepMap.get(stepIndex)!

      switch (event.type) {
        case 'step_viewed':
          metrics.viewCount++
          break
        case 'step_completed':
          metrics.completionCount++
          if (event.metadata?.duration) {
            metrics.averageTimeSpent = 
              (metrics.averageTimeSpent * (metrics.completionCount - 1) + event.metadata.duration) / 
              metrics.completionCount
          }
          break
        case 'tour_skipped':
          metrics.dropoffCount++
          break
        case 'help_requested':
          metrics.helpRequestCount++
          break
      }
    })

    return Array.from(stepMap.values()).sort((a, b) => a.stepIndex - b.stepIndex)
  }

  /**
   * Get analytics for a specific tour and user
   */
  getTourAnalytics(tourId: string, userId: string): TourAnalytics | undefined {
    return this.analytics.get(`${tourId}-${userId}`)
  }

  /**
   * Get all analytics data
   */
  getAllAnalytics(): TourAnalytics[] {
    return Array.from(this.analytics.values())
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): {
    events: TourEvent[]
    analytics: TourAnalytics[]
    sessionId: string
    exportedAt: Date
  } {
    return {
      events: [...this.events],
      analytics: this.getAllAnalytics(),
      sessionId: this.sessionId,
      exportedAt: new Date()
    }
  }

  /**
   * Clear all analytics data
   */
  clearAnalytics(): void {
    this.events = []
    this.analytics.clear()
    this.clearStoredAnalytics()
  }

  /**
   * Flush events to storage/API
   */
  flush(): void {
    if (this.events.length === 0) return

    // Store in localStorage
    this.storeAnalytics()

    // Send to API if configured
    if (this.config.apiEndpoint) {
      this.sendToAPI()
    }

    // Clear processed events
    this.events = []
  }

  /**
   * Process event in real-time
   */
  private processEventRealTime(event: TourEvent): void {
    // Emit event for real-time listeners
    window.dispatchEvent(new CustomEvent('tour-analytics-event', {
      detail: event
    }))
  }

  /**
   * Update analytics with new event
   */
  private updateAnalytics(event: TourEvent): void {
    const tourId = event.metadata?.tourId
    const userId = event.metadata?.userId

    if (!tourId || !userId) return

    const key = `${tourId}-${userId}`
    let analytics = this.analytics.get(key)

    if (!analytics) {
      analytics = {
        tourId,
        userId,
        sessionId: this.sessionId,
        events: [],
        metrics: {
          totalDuration: 0,
          stepDurations: [],
          completionRate: 0,
          interactionCount: 0
        }
      }
      this.analytics.set(key, analytics)
    }

    analytics.events.push(event)
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Load analytics from localStorage
   */
  private loadStoredAnalytics(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.events = data.events || []
        
        // Restore analytics map
        if (data.analytics) {
          data.analytics.forEach((analytics: TourAnalytics) => {
            const key = `${analytics.tourId}-${analytics.userId}`
            this.analytics.set(key, analytics)
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load stored analytics:', error)
    }
  }

  /**
   * Store analytics to localStorage
   */
  private storeAnalytics(): void {
    try {
      const data = {
        events: this.events,
        analytics: this.getAllAnalytics(),
        sessionId: this.sessionId,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(this.config.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to store analytics:', error)
    }
  }

  /**
   * Clear stored analytics
   */
  private clearStoredAnalytics(): void {
    try {
      localStorage.removeItem(this.config.storageKey)
    } catch (error) {
      console.warn('Failed to clear stored analytics:', error)
    }
  }

  /**
   * Send analytics to API endpoint
   */
  private async sendToAPI(): void {
    if (!this.config.apiEndpoint) return

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: this.events,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.warn('Failed to send analytics to API:', error)
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush() // Final flush before cleanup
  }
}

// Singleton instance for global use
export const tourAnalytics = new TourAnalyticsEngine()

// Hook for React components
export function useTourAnalytics() {
  return {
    trackEvent: tourAnalytics.trackEvent.bind(tourAnalytics),
    startTourTracking: tourAnalytics.startTourTracking.bind(tourAnalytics),
    trackStepViewed: tourAnalytics.trackStepViewed.bind(tourAnalytics),
    trackStepCompleted: tourAnalytics.trackStepCompleted.bind(tourAnalytics),
    trackTourCompleted: tourAnalytics.trackTourCompleted.bind(tourAnalytics),
    trackTourSkipped: tourAnalytics.trackTourSkipped.bind(tourAnalytics),
    trackHelpRequested: tourAnalytics.trackHelpRequested.bind(tourAnalytics),
    calculateTourMetrics: tourAnalytics.calculateTourMetrics.bind(tourAnalytics),
    getTourAnalytics: tourAnalytics.getTourAnalytics.bind(tourAnalytics),
    exportAnalytics: tourAnalytics.exportAnalytics.bind(tourAnalytics),
    clearAnalytics: tourAnalytics.clearAnalytics.bind(tourAnalytics)
  }
}