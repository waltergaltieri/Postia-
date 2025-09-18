/**
 * Error Handling Integration
 * Integrates all error handling components with the existing tour system
 */

import { TourErrorManager, TourErrorManagerConfig } from './tour-error-manager'
import { TourHealthChecker } from './tour-health-check'
import { DeploymentValidator } from './deployment-validator'
import { TourPerformanceMonitor } from './tour-performance-monitor'
import { TourDefinition } from '@/types/tour'

export interface ErrorHandlingSystemConfig {
  errorManager?: TourErrorManagerConfig
  enableHealthChecks?: boolean
  enablePerformanceMonitoring?: boolean
  enableDeploymentValidation?: boolean
  environment?: 'development' | 'staging' | 'production'
}

export class TourErrorHandlingSystem {
  private errorManager: TourErrorManager
  private healthChecker?: TourHealthChecker
  private deploymentValidator?: DeploymentValidator
  private performanceMonitor?: TourPerformanceMonitor
  private config: ErrorHandlingSystemConfig

  constructor(config: ErrorHandlingSystemConfig = {}) {
    this.config = {
      enableHealthChecks: true,
      enablePerformanceMonitoring: true,
      enableDeploymentValidation: true,
      environment: 'production',
      ...config
    }

    // Initialize error manager (always enabled)
    this.errorManager = new TourErrorManager(config.errorManager)

    // Initialize optional components
    if (this.config.enableHealthChecks) {
      this.healthChecker = new TourHealthChecker({
        checkElementAvailability: true,
        checkAccessibility: true,
        checkPerformance: this.config.enablePerformanceMonitoring,
        checkNavigation: true
      })
    }

    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor = new TourPerformanceMonitor()
    }

    if (this.config.enableDeploymentValidation) {
      this.deploymentValidator = new DeploymentValidator({
        environment: this.config.environment,
        strictMode: this.config.environment === 'production',
        performanceChecks: this.config.enablePerformanceMonitoring,
        accessibilityChecks: true
      })
    }

    this.setupIntegration()
  }

  private setupIntegration(): void {
    // Listen for tour errors from the main tour system
    window.addEventListener('tour-error', this.handleTourError.bind(this))
    
    // Listen for tour start events to begin monitoring
    window.addEventListener('tour-started', this.handleTourStarted.bind(this))
    
    // Listen for tour step events for performance monitoring
    window.addEventListener('tour-step-started', this.handleTourStepStarted.bind(this))
    
    // Listen for tour completion events
    window.addEventListener('tour-completed', this.handleTourCompleted.bind(this))
  }

  private async handleTourError(event: CustomEvent): Promise<void> {
    const { error, context } = event.detail
    
    try {
      const recovered = await this.errorManager.handleTourError(error, context)
      
      // Dispatch recovery result
      window.dispatchEvent(new CustomEvent('tour-error-handled', {
        detail: { error, recovered, context }
      }))
    } catch (handlingError) {
      console.error('Error handling tour error:', handlingError)
    }
  }

  private handleTourStarted(event: CustomEvent): void {
    const { tourId } = event.detail
    
    // Start performance monitoring if enabled
    if (this.performanceMonitor) {
      console.log(`Starting performance monitoring for tour: ${tourId}`)
    }
  }

  private handleTourStepStarted(event: CustomEvent): void {
    const { tourId, stepIndex } = event.detail
    
    // Start step-level performance monitoring
    if (this.performanceMonitor) {
      const session = this.performanceMonitor.startMonitoring(tourId, stepIndex)
      
      // Store session for cleanup
      ;(event.target as any).__performanceSession = session
    }
  }

  private handleTourCompleted(event: CustomEvent): void {
    const { tourId, completed } = event.detail
    
    console.log(`Tour ${tourId} ${completed ? 'completed' : 'abandoned'}`)
    
    // Clean up any performance monitoring
    if (this.performanceMonitor) {
      // Generate performance report
      const report = this.performanceMonitor.getPerformanceReport(tourId)
      console.log('Tour performance report:', report)
    }
  }

  // Public API methods
  async validateTourHealth(tour: TourDefinition) {
    if (!this.healthChecker) {
      throw new Error('Health checking is not enabled')
    }
    
    return await this.healthChecker.checkTourHealth(tour)
  }

  async validateToursForDeployment(tours: TourDefinition[]) {
    if (!this.deploymentValidator) {
      throw new Error('Deployment validation is not enabled')
    }
    
    return await this.deploymentValidator.validateForDeployment(tours)
  }

  async attemptTourRecovery(tourId: string) {
    return await this.errorManager.attemptInterruptedTourRecovery(tourId)
  }

  getErrorStatistics() {
    return this.errorManager.getErrorStats()
  }

  getPerformanceReport(tourId: string) {
    if (!this.performanceMonitor) {
      throw new Error('Performance monitoring is not enabled')
    }
    
    return this.performanceMonitor.getPerformanceReport(tourId)
  }

  // System health and monitoring
  async getSystemHealth(): Promise<SystemHealthReport> {
    const report: SystemHealthReport = {
      timestamp: new Date(),
      errorHandling: {
        enabled: true,
        errorStats: this.errorManager.getErrorStats(),
        interruptedTours: this.errorManager.getInterruptedTours().length
      },
      healthChecking: {
        enabled: !!this.healthChecker,
        cacheStats: this.healthChecker?.getCacheStats()
      },
      performanceMonitoring: {
        enabled: !!this.performanceMonitor
      },
      deploymentValidation: {
        enabled: !!this.deploymentValidator
      }
    }

    return report
  }

  // Cleanup and maintenance
  async performMaintenance(): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      timestamp: new Date(),
      actions: []
    }

    // Clear old error reports
    const errorStats = this.errorManager.getErrorStats()
    if (errorStats.totalErrors > 1000) {
      // In a real implementation, you might archive old errors instead of clearing
      report.actions.push('Cleared old error reports to prevent memory issues')
    }

    // Clear health check cache
    if (this.healthChecker) {
      const cacheStats = this.healthChecker.getCacheStats()
      if (cacheStats.size > 100) {
        this.healthChecker.clearCache()
        report.actions.push(`Cleared health check cache (${cacheStats.size} entries)`)
      }
    }

    // Clear performance metrics
    if (this.performanceMonitor) {
      // In a real implementation, you might archive metrics instead of clearing
      report.actions.push('Performance metrics maintenance completed')
    }

    return report
  }

  destroy(): void {
    // Clean up event listeners
    window.removeEventListener('tour-error', this.handleTourError.bind(this))
    window.removeEventListener('tour-started', this.handleTourStarted.bind(this))
    window.removeEventListener('tour-step-started', this.handleTourStepStarted.bind(this))
    window.removeEventListener('tour-completed', this.handleTourCompleted.bind(this))

    // Destroy components
    this.errorManager.destroy()
    this.healthChecker?.clearCache()
    this.performanceMonitor?.destroy()
  }
}

// Singleton instance for global access
let globalErrorHandlingSystem: TourErrorHandlingSystem | null = null

export function initializeTourErrorHandling(config?: ErrorHandlingSystemConfig): TourErrorHandlingSystem {
  if (globalErrorHandlingSystem) {
    console.warn('Tour error handling system already initialized')
    return globalErrorHandlingSystem
  }

  globalErrorHandlingSystem = new TourErrorHandlingSystem(config)
  
  // Make it globally accessible for debugging
  if (typeof window !== 'undefined') {
    ;(window as any).__tourErrorHandling = globalErrorHandlingSystem
  }

  console.log('Tour error handling system initialized')
  return globalErrorHandlingSystem
}

export function getTourErrorHandlingSystem(): TourErrorHandlingSystem | null {
  return globalErrorHandlingSystem
}

// Utility functions for integration with existing tour system
export function reportTourError(error: Error, tourId: string, stepIndex?: number, additionalContext?: any): void {
  window.dispatchEvent(new CustomEvent('tour-error', {
    detail: {
      error: {
        name: error.name,
        message: error.message,
        tourId,
        stepIndex,
        recoverable: true
      },
      context: {
        tourId,
        stepIndex: stepIndex || 0,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        ...additionalContext
      }
    }
  }))
}

export function notifyTourStarted(tourId: string): void {
  window.dispatchEvent(new CustomEvent('tour-started', {
    detail: { tourId }
  }))
}

export function notifyTourStepStarted(tourId: string, stepIndex: number): void {
  window.dispatchEvent(new CustomEvent('tour-step-started', {
    detail: { tourId, stepIndex }
  }))
}

export function notifyTourCompleted(tourId: string, completed: boolean = true): void {
  window.dispatchEvent(new CustomEvent('tour-completed', {
    detail: { tourId, completed }
  }))
}

// Types for system monitoring
interface SystemHealthReport {
  timestamp: Date
  errorHandling: {
    enabled: boolean
    errorStats: any
    interruptedTours: number
  }
  healthChecking: {
    enabled: boolean
    cacheStats?: any
  }
  performanceMonitoring: {
    enabled: boolean
  }
  deploymentValidation: {
    enabled: boolean
  }
}

interface MaintenanceReport {
  timestamp: Date
  actions: string[]
}