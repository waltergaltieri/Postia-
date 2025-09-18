/**
 * Performance monitoring system for tour interactions and rendering
 * Tracks metrics, identifies bottlenecks, and provides optimization recommendations
 */

import type { TourDefinition } from '@/types/tour'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  tourId?: string
  stepIndex?: number
  metadata?: Record<string, any>
}

interface TourPerformanceData {
  tourId: string
  totalDuration: number
  stepDurations: number[]
  renderTimes: number[]
  interactionDelays: number[]
  memoryUsage: number[]
  errorCount: number
  completionRate: number
  userInteractions: number
}

interface PerformanceThresholds {
  maxStepRenderTime: number // milliseconds
  maxInteractionDelay: number // milliseconds
  maxMemoryUsage: number // MB
  minCompletionRate: number // percentage
  maxErrorRate: number // percentage
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  metric: string
  value: number
  threshold: number
  tourId?: string
  timestamp: Date
  recommendations: string[]
}

/**
 * Comprehensive performance monitoring for tour system
 */
export class TourPerformanceMonitor {
  private static instance: TourPerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private tourData = new Map<string, TourPerformanceData>()
  private alerts: PerformanceAlert[] = []
  private observers: PerformanceObserver[] = []
  private thresholds: PerformanceThresholds
  private isMonitoring = false

  private constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxStepRenderTime: 500, // 500ms
      maxInteractionDelay: 200, // 200ms
      maxMemoryUsage: 100, // 100MB
      minCompletionRate: 0.8, // 80%
      maxErrorRate: 0.05, // 5%
      ...thresholds
    }

    this.initializePerformanceObservers()
  }

  static getInstance(thresholds?: Partial<PerformanceThresholds>): TourPerformanceMonitor {
    if (!TourPerformanceMonitor.instance) {
      TourPerformanceMonitor.instance = new TourPerformanceMonitor(thresholds)
    }
    return TourPerformanceMonitor.instance
  }

  /**
   * Start monitoring tour performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('Tour performance monitoring started')

    // Start collecting metrics
    this.startMetricCollection()
  }

  /**
   * Stop monitoring tour performance
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    this.stopMetricCollection()
    console.log('Tour performance monitoring stopped')
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    tourId?: string,
    stepIndex?: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tourId,
      stepIndex,
      metadata
    }

    this.metrics.push(metric)

    // Keep only recent metrics (last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metric)

    // Update tour-specific data
    if (tourId) {
      this.updateTourData(tourId, metric)
    }
  }

  /**
   * Start monitoring a tour
   */
  startTourMonitoring(tourId: string, tour: TourDefinition): void {
    if (!this.isMonitoring) return

    const startTime = performance.now()
    
    // Initialize tour data
    this.tourData.set(tourId, {
      tourId,
      totalDuration: 0,
      stepDurations: [],
      renderTimes: [],
      interactionDelays: [],
      memoryUsage: [],
      errorCount: 0,
      completionRate: 0,
      userInteractions: 0
    })

    // Record tour start
    this.recordMetric('tour_started', startTime, tourId, undefined, {
      stepCount: tour.steps.length,
      category: tour.category
    })

    // Monitor memory usage
    this.monitorMemoryUsage(tourId)
  }

  /**
   * Monitor tour step performance
   */
  monitorStepPerformance(
    tourId: string,
    stepIndex: number,
    operation: 'render' | 'interaction' | 'navigation'
  ): {
    start: () => void
    end: () => void
  } {
    let startTime: number

    return {
      start: () => {
        startTime = performance.now()
        performance.mark(`tour-${tourId}-step-${stepIndex}-${operation}-start`)
      },
      end: () => {
        const endTime = performance.now()
        const duration = endTime - startTime

        performance.mark(`tour-${tourId}-step-${stepIndex}-${operation}-end`)
        performance.measure(
          `tour-${tourId}-step-${stepIndex}-${operation}`,
          `tour-${tourId}-step-${stepIndex}-${operation}-start`,
          `tour-${tourId}-step-${stepIndex}-${operation}-end`
        )

        this.recordMetric(`step_${operation}`, duration, tourId, stepIndex)
      }
    }
  }

  /**
   * Record tour completion
   */
  completeTour(tourId: string, completed: boolean, totalSteps: number, completedSteps: number): void {
    const tourData = this.tourData.get(tourId)
    if (!tourData) return

    const completionRate = completedSteps / totalSteps
    tourData.completionRate = completionRate
    tourData.totalDuration = performance.now() - (this.getFirstMetric(tourId)?.value || 0)

    this.recordMetric('tour_completed', completionRate, tourId, undefined, {
      completed,
      totalSteps,
      completedSteps,
      duration: tourData.totalDuration
    })

    // Generate performance report
    this.generateTourReport(tourId)
  }

  /**
   * Record tour error
   */
  recordTourError(tourId: string, error: Error, stepIndex?: number): void {
    const tourData = this.tourData.get(tourId)
    if (tourData) {
      tourData.errorCount++
    }

    this.recordMetric('tour_error', 1, tourId, stepIndex, {
      errorMessage: error.message,
      errorStack: error.stack
    })

    // Create error alert
    this.createAlert('error', `Tour error in ${tourId}`, 'tour_error', 1, 0, tourId, [
      'Check tour configuration for invalid selectors',
      'Verify element availability before tour starts',
      'Add error handling for missing elements'
    ])
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalTours: number
    averageCompletionRate: number
    averageStepRenderTime: number
    averageInteractionDelay: number
    errorRate: number
    memoryUsage: number
    alerts: PerformanceAlert[]
    recommendations: string[]
  } {
    const tours = Array.from(this.tourData.values())
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    )

    const stepRenderMetrics = recentMetrics.filter(m => m.name === 'step_render')
    const interactionMetrics = recentMetrics.filter(m => m.name === 'step_interaction')
    const errorMetrics = recentMetrics.filter(m => m.name === 'tour_error')

    const averageCompletionRate = tours.length > 0 
      ? tours.reduce((sum, tour) => sum + tour.completionRate, 0) / tours.length 
      : 0

    const averageStepRenderTime = stepRenderMetrics.length > 0
      ? stepRenderMetrics.reduce((sum, metric) => sum + metric.value, 0) / stepRenderMetrics.length
      : 0

    const averageInteractionDelay = interactionMetrics.length > 0
      ? interactionMetrics.reduce((sum, metric) => sum + metric.value, 0) / interactionMetrics.length
      : 0

    const errorRate = recentMetrics.length > 0 ? errorMetrics.length / recentMetrics.length : 0

    return {
      totalTours: tours.length,
      averageCompletionRate,
      averageStepRenderTime,
      averageInteractionDelay,
      errorRate,
      memoryUsage: this.getCurrentMemoryUsage(),
      alerts: this.getRecentAlerts(),
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * Get detailed tour performance data
   */
  getTourPerformanceData(tourId: string): TourPerformanceData | null {
    return this.tourData.get(tourId) || null
  }

  /**
   * Get performance metrics for a specific time range
   */
  getMetricsInRange(startTime: Date, endTime: Date): PerformanceMetric[] {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    )
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): {
    metrics: PerformanceMetric[]
    tourData: Record<string, TourPerformanceData>
    alerts: PerformanceAlert[]
    summary: ReturnType<TourPerformanceMonitor['getPerformanceSummary']>
  } {
    return {
      metrics: [...this.metrics],
      tourData: Object.fromEntries(this.tourData),
      alerts: [...this.alerts],
      summary: this.getPerformanceSummary()
    }
  }

  /**
   * Clear performance data
   */
  clearData(olderThan?: Date): void {
    if (olderThan) {
      this.metrics = this.metrics.filter(metric => metric.timestamp > olderThan)
      this.alerts = this.alerts.filter(alert => alert.timestamp > olderThan)
    } else {
      this.metrics = []
      this.alerts = []
      this.tourData.clear()
    }
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  /**
   * Private helper methods
   */
  private initializePerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.recordMetric('page_load_time', entry.duration)
          }
        })
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navigationObserver)

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.name.includes('tour') || entry.name.includes('driver')) {
            this.recordMetric('resource_load_time', entry.duration, undefined, undefined, {
              resourceName: entry.name,
              resourceType: (entry as any).initiatorType
            })
          }
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)

      // Observe measure timing (for our custom measurements)
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.name.startsWith('tour-')) {
            const parts = entry.name.split('-')
            const tourId = parts[1]
            const stepIndex = parts[3] ? parseInt(parts[3]) : undefined
            const operation = parts[4]

            this.recordMetric(`measure_${operation}`, entry.duration, tourId, stepIndex)
          }
        })
      })
      measureObserver.observe({ entryTypes: ['measure'] })
      this.observers.push(measureObserver)

    } catch (error) {
      console.warn('Failed to initialize performance observers:', error)
    }
  }

  private startMetricCollection(): void {
    // Collect metrics every 5 seconds
    const interval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(interval)
        return
      }

      // Collect memory usage
      this.recordMetric('memory_usage', this.getCurrentMemoryUsage())

      // Collect DOM metrics
      this.recordMetric('dom_nodes', document.querySelectorAll('*').length)

      // Collect tour-specific metrics
      this.collectTourMetrics()
    }, 5000)
  }

  private stopMetricCollection(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  private collectTourMetrics(): void {
    // Collect metrics for active tours
    for (const [tourId, tourData] of this.tourData.entries()) {
      // Check if tour is still active
      const recentMetrics = this.metrics.filter(m => 
        m.tourId === tourId && 
        Date.now() - m.timestamp.getTime() < 60000 // Last minute
      )

      if (recentMetrics.length > 0) {
        // Tour is active, collect additional metrics
        this.recordMetric('tour_activity', recentMetrics.length, tourId)
      }
    }
  }

  private updateTourData(tourId: string, metric: PerformanceMetric): void {
    const tourData = this.tourData.get(tourId)
    if (!tourData) return

    switch (metric.name) {
      case 'step_render':
        tourData.renderTimes.push(metric.value)
        break
      case 'step_interaction':
        tourData.interactionDelays.push(metric.value)
        tourData.userInteractions++
        break
      case 'memory_usage':
        tourData.memoryUsage.push(metric.value)
        break
      case 'tour_error':
        tourData.errorCount++
        break
    }
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    let alertCreated = false

    switch (metric.name) {
      case 'step_render':
        if (metric.value > this.thresholds.maxStepRenderTime) {
          this.createAlert('warning', 'Slow step rendering detected', metric.name, metric.value, this.thresholds.maxStepRenderTime, metric.tourId, [
            'Optimize tour step content',
            'Reduce DOM complexity',
            'Consider lazy loading'
          ])
          alertCreated = true
        }
        break

      case 'step_interaction':
        if (metric.value > this.thresholds.maxInteractionDelay) {
          this.createAlert('warning', 'High interaction delay detected', metric.name, metric.value, this.thresholds.maxInteractionDelay, metric.tourId, [
            'Optimize event handlers',
            'Reduce JavaScript execution time',
            'Consider debouncing interactions'
          ])
          alertCreated = true
        }
        break

      case 'memory_usage':
        if (metric.value > this.thresholds.maxMemoryUsage) {
          this.createAlert('error', 'High memory usage detected', metric.name, metric.value, this.thresholds.maxMemoryUsage, metric.tourId, [
            'Enable memory cleanup',
            'Reduce tour complexity',
            'Implement tour instance limits'
          ])
          alertCreated = true
        }
        break
    }

    if (alertCreated) {
      console.warn(`Performance alert created for ${metric.name}:`, metric.value)
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    message: string,
    metric: string,
    value: number,
    threshold: number,
    tourId?: string,
    recommendations: string[] = []
  ): void {
    const alert: PerformanceAlert = {
      type,
      message,
      metric,
      value,
      threshold,
      tourId,
      timestamp: new Date(),
      recommendations
    }

    this.alerts.push(alert)

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  private generateTourReport(tourId: string): void {
    const tourData = this.tourData.get(tourId)
    if (!tourData) return

    const report = {
      tourId,
      performance: {
        averageRenderTime: tourData.renderTimes.length > 0 
          ? tourData.renderTimes.reduce((sum, time) => sum + time, 0) / tourData.renderTimes.length 
          : 0,
        averageInteractionDelay: tourData.interactionDelays.length > 0
          ? tourData.interactionDelays.reduce((sum, delay) => sum + delay, 0) / tourData.interactionDelays.length
          : 0,
        peakMemoryUsage: Math.max(...tourData.memoryUsage, 0),
        completionRate: tourData.completionRate,
        errorRate: tourData.errorCount / Math.max(tourData.userInteractions, 1)
      },
      recommendations: this.generateTourRecommendations(tourData)
    }

    console.log(`Tour performance report for ${tourId}:`, report)
  }

  private generateTourRecommendations(tourData: TourPerformanceData): string[] {
    const recommendations: string[] = []

    const avgRenderTime = tourData.renderTimes.length > 0 
      ? tourData.renderTimes.reduce((sum, time) => sum + time, 0) / tourData.renderTimes.length 
      : 0

    if (avgRenderTime > this.thresholds.maxStepRenderTime) {
      recommendations.push('Optimize step rendering performance')
    }

    if (tourData.completionRate < this.thresholds.minCompletionRate) {
      recommendations.push('Improve tour engagement and completion rate')
    }

    if (tourData.errorCount > 0) {
      recommendations.push('Fix tour errors and improve error handling')
    }

    const peakMemory = Math.max(...tourData.memoryUsage, 0)
    if (peakMemory > this.thresholds.maxMemoryUsage) {
      recommendations.push('Reduce memory usage and implement cleanup')
    }

    return recommendations
  }

  private generateRecommendations(): string[] {
    const summary = this.getPerformanceSummary()
    const recommendations: string[] = []

    if (summary.averageStepRenderTime > this.thresholds.maxStepRenderTime) {
      recommendations.push('Optimize tour step rendering performance')
    }

    if (summary.averageCompletionRate < this.thresholds.minCompletionRate) {
      recommendations.push('Improve overall tour completion rates')
    }

    if (summary.errorRate > this.thresholds.maxErrorRate) {
      recommendations.push('Reduce tour error rates through better validation')
    }

    if (summary.memoryUsage > this.thresholds.maxMemoryUsage) {
      recommendations.push('Implement memory management and cleanup strategies')
    }

    return recommendations
  }

  private getFirstMetric(tourId: string): PerformanceMetric | undefined {
    return this.metrics.find(metric => metric.tourId === tourId && metric.name === 'tour_started')
  }

  private getRecentAlerts(): PerformanceAlert[] {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return this.alerts.filter(alert => alert.timestamp > oneDayAgo)
  }

  private getCurrentMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory
      return memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
    }
    return 0
  }

  private monitorMemoryUsage(tourId: string): void {
    const interval = setInterval(() => {
      const tourData = this.tourData.get(tourId)
      if (!tourData) {
        clearInterval(interval)
        return
      }

      const memoryUsage = this.getCurrentMemoryUsage()
      this.recordMetric('memory_usage', memoryUsage, tourId)
    }, 1000) // Every second

    // Stop monitoring after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000)
  }
}

/**
 * Convenience functions
 */
export function getTourPerformanceMonitor(thresholds?: Partial<PerformanceThresholds>): TourPerformanceMonitor {
  return TourPerformanceMonitor.getInstance(thresholds)
}

export function startTourPerformanceMonitoring(): void {
  const monitor = getTourPerformanceMonitor()
  monitor.startMonitoring()
}

export function stopTourPerformanceMonitoring(): void {
  const monitor = getTourPerformanceMonitor()
  monitor.stopMonitoring()
}

export function recordTourMetric(
  name: string,
  value: number,
  tourId?: string,
  stepIndex?: number,
  metadata?: Record<string, any>
): void {
  const monitor = getTourPerformanceMonitor()
  monitor.recordMetric(name, value, tourId, stepIndex, metadata)
}

export function getTourPerformanceSummary() {
  const monitor = getTourPerformanceMonitor()
  return monitor.getPerformanceSummary()
}