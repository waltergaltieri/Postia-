/**
 * Tour monitoring and analytics system for production deployment
 */

import { getDeploymentManager } from '@/lib/deployment/tour-deployment-config'

export interface TourMetric {
  tourId: string
  userId: string
  sessionId: string
  timestamp: number
  event: TourEvent
  metadata?: Record<string, any>
}

export interface TourEvent {
  type: 'tour_started' | 'tour_completed' | 'tour_skipped' | 'step_viewed' | 'step_completed' | 'error_occurred' | 'performance_metric'
  stepIndex?: number
  duration?: number
  errorMessage?: string
  performanceData?: PerformanceData
}

export interface PerformanceData {
  loadTime: number
  renderTime: number
  interactionTime: number
  memoryUsage?: number
  bundleSize?: number
}

export interface TourAnalyticsData {
  tourId: string
  totalStarts: number
  totalCompletions: number
  totalSkips: number
  completionRate: number
  averageDuration: number
  dropoffPoints: { stepIndex: number; count: number }[]
  errorRate: number
  performanceMetrics: {
    averageLoadTime: number
    averageRenderTime: number
    memoryUsage: number
  }
}

export interface AlertThreshold {
  metric: string
  threshold: number
  operator: 'greater_than' | 'less_than' | 'equals'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Tour monitoring system
 */
export class TourMonitoringSystem {
  private metrics: TourMetric[] = []
  private alertThresholds: AlertThreshold[] = []
  private isEnabled: boolean = false
  private analyticsProvider: string = 'internal'
  
  constructor() {
    const deploymentManager = getDeploymentManager()
    const monitoringConfig = deploymentManager.getMonitoringConfig()
    
    this.isEnabled = monitoringConfig.enabled
    
    if (this.isEnabled) {
      this.initializeMonitoring(monitoringConfig)
    }
  }
  
  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(config: any) {
    // Set up alert thresholds
    this.alertThresholds = [
      {
        metric: 'error_rate',
        threshold: config.alertThresholds.errorRate,
        operator: 'greater_than',
        severity: 'high'
      },
      {
        metric: 'completion_rate',
        threshold: config.alertThresholds.completionRate,
        operator: 'less_than',
        severity: 'medium'
      },
      {
        metric: 'average_duration',
        threshold: config.alertThresholds.averageDuration,
        operator: 'greater_than',
        severity: 'low'
      }
    ]
    
    // Initialize analytics provider
    this.initializeAnalyticsProvider(config)
    
    // Set up periodic reporting
    this.setupPeriodicReporting()
    
    // Set up error handling
    this.setupErrorHandling()
  }
  
  /**
   * Initialize analytics provider
   */
  private initializeAnalyticsProvider(config: any) {
    this.analyticsProvider = config.provider || 'internal'
    
    switch (this.analyticsProvider) {
      case 'google_analytics':
        this.initializeGoogleAnalytics()
        break
      case 'mixpanel':
        this.initializeMixpanel()
        break
      case 'amplitude':
        this.initializeAmplitude()
        break
      default:
        // Use internal analytics
        break
    }
  }
  
  /**
   * Track tour metric
   */
  trackMetric(metric: TourMetric): void {
    if (!this.isEnabled) return
    
    // Store metric internally
    this.metrics.push(metric)
    
    // Send to analytics provider
    this.sendToAnalyticsProvider(metric)
    
    // Check for alerts
    this.checkAlerts(metric)
    
    // Clean up old metrics (keep last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }
  
  /**
   * Track tour start
   */
  trackTourStart(tourId: string, userId: string, sessionId: string, metadata?: Record<string, any>): void {
    this.trackMetric({
      tourId,
      userId,
      sessionId,
      timestamp: Date.now(),
      event: {
        type: 'tour_started'
      },
      metadata
    })
  }
  
  /**
   * Track tour completion
   */
  trackTourCompletion(tourId: string, userId: string, sessionId: string, duration: number, metadata?: Record<string, any>): void {
    this.trackMetric({
      tourId,
      userId,
      sessionId,
      timestamp: Date.now(),
      event: {
        type: 'tour_completed',
        duration
      },
      metadata
    })
  }
  
  /**
   * Track tour skip
   */
  trackTourSkip(tourId: string, userId: string, sessionId: string, stepIndex: number, metadata?: Record<string, any>): void {
    this.trackMetric({
      tourId,
      userId,
      sessionId,
      timestamp: Date.now(),
      event: {
        type: 'tour_skipped',
        stepIndex
      },
      metadata
    })
  }
  
  /**
   * Track step view
   */
  trackStepView(tourId: string, userId: string, sessionId: string, stepIndex: number, metadata?: Record<string, any>): void {
    this.trackMetric({
      tourId,
      userId,
      sessionId,
      timestamp: Date.now(),
      event: {
        type: 'step_viewed',
        stepIndex
      },
      metadata
    })
  }
  
  /**
   * Track error
   */
  trackError(tourId: string, userId: string, sessionId: string, errorMessage: string, stepIndex?: number, metadata?: Record<string, any>): void {
    this.trackMetric({
      tourId,
      userId,
      sessionId,
      timestamp: Date.now(),
      event: {
        type: 'error_occurred',
        stepIndex,
        errorMessage
      },
      metadata
    })
  }
  
  /**
   * Track performance metric
   */
  trackPerformance(tourId: string, userId: string, sessionId: string, performanceData: PerformanceData, metadata?: Record<string, any>): void {
    this.trackMetric({
      tourId,
      userId,
      sessionId,
      timestamp: Date.now(),
      event: {
        type: 'performance_metric',
        performanceData
      },
      metadata
    })
  }
  
  /**
   * Get analytics data for a tour
   */
  getTourAnalytics(tourId: string, timeRange?: { start: number; end: number }): TourAnalyticsData {
    let relevantMetrics = this.metrics.filter(m => m.tourId === tourId)
    
    if (timeRange) {
      relevantMetrics = relevantMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }
    
    const starts = relevantMetrics.filter(m => m.event.type === 'tour_started').length
    const completions = relevantMetrics.filter(m => m.event.type === 'tour_completed').length
    const skips = relevantMetrics.filter(m => m.event.type === 'tour_skipped').length
    const errors = relevantMetrics.filter(m => m.event.type === 'error_occurred').length
    
    const completionRate = starts > 0 ? completions / starts : 0
    const errorRate = starts > 0 ? errors / starts : 0
    
    // Calculate average duration
    const completedTours = relevantMetrics.filter(m => m.event.type === 'tour_completed' && m.event.duration)
    const averageDuration = completedTours.length > 0 
      ? completedTours.reduce((sum, m) => sum + (m.event.duration || 0), 0) / completedTours.length
      : 0
    
    // Calculate dropoff points
    const dropoffPoints = this.calculateDropoffPoints(relevantMetrics)
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(relevantMetrics)
    
    return {
      tourId,
      totalStarts: starts,
      totalCompletions: completions,
      totalSkips: skips,
      completionRate,
      averageDuration,
      dropoffPoints,
      errorRate,
      performanceMetrics
    }
  }
  
  /**
   * Calculate dropoff points
   */
  private calculateDropoffPoints(metrics: TourMetric[]): { stepIndex: number; count: number }[] {
    const dropoffs: Record<number, number> = {}
    
    metrics
      .filter(m => m.event.type === 'tour_skipped' && m.event.stepIndex !== undefined)
      .forEach(m => {
        const stepIndex = m.event.stepIndex!
        dropoffs[stepIndex] = (dropoffs[stepIndex] || 0) + 1
      })
    
    return Object.entries(dropoffs)
      .map(([stepIndex, count]) => ({ stepIndex: parseInt(stepIndex), count }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(metrics: TourMetric[]): any {
    const performanceMetrics = metrics
      .filter(m => m.event.type === 'performance_metric' && m.event.performanceData)
      .map(m => m.event.performanceData!)
    
    if (performanceMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        averageRenderTime: 0,
        memoryUsage: 0
      }
    }
    
    const averageLoadTime = performanceMetrics.reduce((sum, p) => sum + p.loadTime, 0) / performanceMetrics.length
    const averageRenderTime = performanceMetrics.reduce((sum, p) => sum + p.renderTime, 0) / performanceMetrics.length
    const memoryUsage = performanceMetrics.reduce((sum, p) => sum + (p.memoryUsage || 0), 0) / performanceMetrics.length
    
    return {
      averageLoadTime,
      averageRenderTime,
      memoryUsage
    }
  }
  
  /**
   * Send metric to analytics provider
   */
  private sendToAnalyticsProvider(metric: TourMetric): void {
    switch (this.analyticsProvider) {
      case 'google_analytics':
        this.sendToGoogleAnalytics(metric)
        break
      case 'mixpanel':
        this.sendToMixpanel(metric)
        break
      case 'amplitude':
        this.sendToAmplitude(metric)
        break
      default:
        // Internal analytics - already stored in this.metrics
        break
    }
  }
  
  /**
   * Check for alert conditions
   */
  private checkAlerts(metric: TourMetric): void {
    // Get recent analytics for the tour
    const analytics = this.getTourAnalytics(metric.tourId, {
      start: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
      end: Date.now()
    })
    
    // Check each threshold
    this.alertThresholds.forEach(threshold => {
      let currentValue: number
      
      switch (threshold.metric) {
        case 'error_rate':
          currentValue = analytics.errorRate
          break
        case 'completion_rate':
          currentValue = analytics.completionRate
          break
        case 'average_duration':
          currentValue = analytics.averageDuration
          break
        default:
          return
      }
      
      const alertTriggered = this.evaluateThreshold(currentValue, threshold)
      
      if (alertTriggered) {
        this.triggerAlert(threshold, currentValue, analytics)
      }
    })
  }
  
  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(value: number, threshold: AlertThreshold): boolean {
    switch (threshold.operator) {
      case 'greater_than':
        return value > threshold.threshold
      case 'less_than':
        return value < threshold.threshold
      case 'equals':
        return value === threshold.threshold
      default:
        return false
    }
  }
  
  /**
   * Trigger alert
   */
  private triggerAlert(threshold: AlertThreshold, currentValue: number, analytics: TourAnalyticsData): void {
    const alert = {
      timestamp: Date.now(),
      severity: threshold.severity,
      metric: threshold.metric,
      threshold: threshold.threshold,
      currentValue,
      tourId: analytics.tourId,
      message: `Tour ${analytics.tourId} ${threshold.metric} (${currentValue.toFixed(2)}) ${threshold.operator.replace('_', ' ')} threshold (${threshold.threshold})`
    }
    
    console.warn('🚨 Tour Alert:', alert)
    
    // In production, this would send to alerting system (PagerDuty, Slack, etc.)
    this.sendAlert(alert)
  }
  
  /**
   * Send alert to alerting system
   */
  private sendAlert(alert: any): void {
    // Implementation would depend on alerting system
    // Examples: PagerDuty, Slack webhook, email, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Alert would be sent:', alert)
    }
  }
  
  /**
   * Set up periodic reporting
   */
  private setupPeriodicReporting(): void {
    // Report metrics every hour
    setInterval(() => {
      this.generatePeriodicReport()
    }, 60 * 60 * 1000)
  }
  
  /**
   * Generate periodic report
   */
  private generatePeriodicReport(): void {
    const uniqueTours = [...new Set(this.metrics.map(m => m.tourId))]
    
    const report = {
      timestamp: Date.now(),
      period: '1 hour',
      tours: uniqueTours.map(tourId => this.getTourAnalytics(tourId, {
        start: Date.now() - 60 * 60 * 1000,
        end: Date.now()
      }))
    }
    
    console.log('📊 Hourly Tour Report:', report)
    
    // In production, this would be sent to monitoring dashboard
  }
  
  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    // Global error handler for tour-related errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && event.error.message.includes('tour')) {
        this.trackError(
          'unknown',
          'unknown',
          'unknown',
          event.error.message,
          undefined,
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        )
      }
    })
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('tour')) {
        this.trackError(
          'unknown',
          'unknown',
          'unknown',
          event.reason.message,
          undefined,
          {
            type: 'unhandled_promise_rejection'
          }
        )
      }
    })
  }
  
  /**
   * Initialize Google Analytics
   */
  private initializeGoogleAnalytics(): void {
    // Implementation for Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      console.log('Google Analytics initialized for tour tracking')
    }
  }
  
  /**
   * Send to Google Analytics
   */
  private sendToGoogleAnalytics(metric: TourMetric): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.event.type, {
        tour_id: metric.tourId,
        user_id: metric.userId,
        session_id: metric.sessionId,
        step_index: metric.event.stepIndex,
        duration: metric.event.duration,
        custom_parameters: metric.metadata
      })
    }
  }
  
  /**
   * Initialize Mixpanel
   */
  private initializeMixpanel(): void {
    // Implementation for Mixpanel
    console.log('Mixpanel initialized for tour tracking')
  }
  
  /**
   * Send to Mixpanel
   */
  private sendToMixpanel(metric: TourMetric): void {
    // Implementation for Mixpanel tracking
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(metric.event.type, {
        tour_id: metric.tourId,
        user_id: metric.userId,
        session_id: metric.sessionId,
        step_index: metric.event.stepIndex,
        duration: metric.event.duration,
        ...metric.metadata
      })
    }
  }
  
  /**
   * Initialize Amplitude
   */
  private initializeAmplitude(): void {
    // Implementation for Amplitude
    console.log('Amplitude initialized for tour tracking')
  }
  
  /**
   * Send to Amplitude
   */
  private sendToAmplitude(metric: TourMetric): void {
    // Implementation for Amplitude tracking
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().logEvent(metric.event.type, {
        tour_id: metric.tourId,
        user_id: metric.userId,
        session_id: metric.sessionId,
        step_index: metric.event.stepIndex,
        duration: metric.event.duration,
        ...metric.metadata
      })
    }
  }
  
  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    metrics: {
      totalMetrics: number
      recentErrors: number
      averagePerformance: number
    }
    alerts: number
  } {
    const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 60 * 60 * 1000)
    const recentErrors = recentMetrics.filter(m => m.event.type === 'error_occurred').length
    const errorRate = recentMetrics.length > 0 ? recentErrors / recentMetrics.length : 0
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (errorRate > 0.1) {
      status = 'critical'
    } else if (errorRate > 0.05) {
      status = 'warning'
    }
    
    return {
      status,
      metrics: {
        totalMetrics: this.metrics.length,
        recentErrors,
        averagePerformance: 0 // Would calculate from performance metrics
      },
      alerts: 0 // Would track active alerts
    }
  }
}

/**
 * Global monitoring instance
 */
let globalMonitoringSystem: TourMonitoringSystem | null = null

/**
 * Get the global monitoring system
 */
export function getTourMonitoring(): TourMonitoringSystem {
  if (!globalMonitoringSystem) {
    globalMonitoringSystem = new TourMonitoringSystem()
  }
  
  return globalMonitoringSystem
}

/**
 * Initialize monitoring system
 */
export function initializeTourMonitoring(): TourMonitoringSystem {
  globalMonitoringSystem = new TourMonitoringSystem()
  return globalMonitoringSystem
}

// Extend window type for analytics providers
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    mixpanel?: any
    amplitude?: any
  }
}