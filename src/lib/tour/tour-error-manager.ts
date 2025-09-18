/**
 * Tour Error Manager
 * Integrates error handling with the existing tour system
 */

import { 
  TourErrorHandler, 
  TourError, 
  TourErrorContext,
  ErrorRecoveryStrategy 
} from './error-handling'
import { DefaultRecoveryStrategies } from './recovery-strategies'
import { TourErrorReporter, ErrorReportingConfig } from './error-reporter'

export interface TourErrorManagerConfig {
  recoveryStrategies?: ErrorRecoveryStrategy
  reportingConfig?: Partial<ErrorReportingConfig>
  enableInterruptedTourRecovery?: boolean
  maxRecoveryAttempts?: number
}

export class TourErrorManager {
  private errorHandler: TourErrorHandler
  private errorReporter: TourErrorReporter
  private config: TourErrorManagerConfig
  private interruptedTours: Map<string, InterruptedTourState> = new Map()

  constructor(config: TourErrorManagerConfig = {}) {
    this.config = {
      enableInterruptedTourRecovery: true,
      maxRecoveryAttempts: 3,
      ...config
    }

    const recoveryStrategies = config.recoveryStrategies || new DefaultRecoveryStrategies()
    this.errorHandler = new TourErrorHandler(recoveryStrategies)
    this.errorReporter = new TourErrorReporter(config.reportingConfig)

    this.setupEventListeners()
  }

  async handleTourError(
    error: TourError,
    additionalContext?: Partial<TourErrorContext>
  ): Promise<boolean> {
    const context = this.createErrorContext(error, additionalContext)
    
    // Handle the error with recovery strategies
    const recovered = await this.errorHandler.handleError(error, context)
    
    // Report the error
    await this.errorReporter.reportError({
      error,
      context,
      recoveryAttempted: error.recoverable,
      recoverySuccessful: recovered
    })

    // Handle interrupted tour recovery if needed
    if (!recovered && this.config.enableInterruptedTourRecovery) {
      this.handleInterruptedTour(error, context)
    }

    return recovered
  }

  private createErrorContext(
    error: TourError,
    additionalContext?: Partial<TourErrorContext>
  ): TourErrorContext {
    return {
      tourId: error.tourId,
      stepIndex: error.stepIndex || 0,
      sessionId: this.getSessionId(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...additionalContext
    }
  }

  private handleInterruptedTour(error: TourError, context: TourErrorContext): void {
    const interruptedState: InterruptedTourState = {
      tourId: error.tourId,
      stepIndex: error.stepIndex || 0,
      timestamp: context.timestamp,
      error: error.message,
      context: {
        url: context.url,
        viewport: context.viewport
      },
      recoveryAttempts: 0
    }

    this.interruptedTours.set(error.tourId, interruptedState)
    
    // Store in localStorage for persistence across sessions
    this.persistInterruptedTour(interruptedState)
  }

  async attemptInterruptedTourRecovery(tourId: string): Promise<boolean> {
    const interruptedState = this.interruptedTours.get(tourId) || 
                            this.getPersistedInterruptedTour(tourId)

    if (!interruptedState) return false

    if (interruptedState.recoveryAttempts >= (this.config.maxRecoveryAttempts || 3)) {
      console.log(`Max recovery attempts reached for tour ${tourId}`)
      this.clearInterruptedTour(tourId)
      return false
    }

    try {
      // Increment recovery attempts
      interruptedState.recoveryAttempts++
      this.interruptedTours.set(tourId, interruptedState)
      this.persistInterruptedTour(interruptedState)

      // Attempt to resume the tour
      const resumed = await this.resumeTour(interruptedState)
      
      if (resumed) {
        console.log(`Successfully resumed interrupted tour: ${tourId}`)
        this.clearInterruptedTour(tourId)
        return true
      }

      return false
    } catch (error) {
      console.error(`Failed to recover interrupted tour ${tourId}:`, error)
      return false
    }
  }

  private async resumeTour(state: InterruptedTourState): Promise<boolean> {
    // Check if we're on the right page
    if (state.context.url !== window.location.href) {
      // Try to navigate to the correct page
      const shouldNavigate = await this.confirmNavigation(state.context.url)
      if (shouldNavigate) {
        window.location.href = state.context.url
        return true // Navigation will trigger page reload
      }
    }

    // Dispatch event to tour system to resume
    window.dispatchEvent(
      new CustomEvent('tour-resume-requested', {
        detail: {
          tourId: state.tourId,
          stepIndex: state.stepIndex,
          timestamp: state.timestamp
        }
      })
    )

    return true
  }

  private async confirmNavigation(url: string): Promise<boolean> {
    // In a real app, you might show a confirmation dialog
    // For now, we'll automatically navigate
    return true
  }

  private persistInterruptedTour(state: InterruptedTourState): void {
    try {
      const key = `interrupted-tour-${state.tourId}`
      localStorage.setItem(key, JSON.stringify({
        ...state,
        timestamp: state.timestamp.toISOString()
      }))
    } catch (error) {
      console.warn('Failed to persist interrupted tour state:', error)
    }
  }

  private getPersistedInterruptedTour(tourId: string): InterruptedTourState | null {
    try {
      const key = `interrupted-tour-${tourId}`
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp)
      }
    } catch (error) {
      console.warn('Failed to retrieve persisted interrupted tour:', error)
      return null
    }
  }

  private clearInterruptedTour(tourId: string): void {
    this.interruptedTours.delete(tourId)
    
    try {
      const key = `interrupted-tour-${tourId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear persisted interrupted tour:', error)
    }
  }

  private setupEventListeners(): void {
    // Listen for tour error recovery events
    window.addEventListener('tour-error-recovery', (event: any) => {
      const { event: eventType, data } = event.detail
      this.handleRecoveryEvent(eventType, data)
    })

    // Listen for page unload to save interrupted tours
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload()
    })

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForInterruptedTours()
      }
    })
  }

  private handleRecoveryEvent(eventType: string, data: any): void {
    switch (eventType) {
      case 'skip_step':
        console.log(`Skipping step ${data.stepIndex} in tour ${data.tourId}: ${data.reason}`)
        break
      case 'update_selector':
        console.log(`Updating selector for tour ${data.tourId}, step ${data.stepIndex}`)
        break
      default:
        console.log(`Unknown recovery event: ${eventType}`, data)
    }
  }

  private handlePageUnload(): void {
    // Save any active tours as interrupted
    // This would integrate with your tour system to get active tours
    console.log('Page unloading, checking for active tours to save')
  }

  private checkForInterruptedTours(): void {
    // Check localStorage for interrupted tours and offer to resume
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('interrupted-tour-')
    )

    keys.forEach(key => {
      const tourId = key.replace('interrupted-tour-', '')
      const state = this.getPersistedInterruptedTour(tourId)
      
      if (state && this.shouldOfferResume(state)) {
        this.offerTourResume(state)
      }
    })
  }

  private shouldOfferResume(state: InterruptedTourState): boolean {
    // Don't offer resume if too much time has passed
    const hoursSinceInterruption = 
      (Date.now() - state.timestamp.getTime()) / (1000 * 60 * 60)
    
    return hoursSinceInterruption < 24 // 24 hours
  }

  private offerTourResume(state: InterruptedTourState): void {
    // In a real app, you might show a notification or modal
    console.log(`Offering to resume interrupted tour: ${state.tourId}`)
    
    // Dispatch event for UI to handle
    window.dispatchEvent(
      new CustomEvent('tour-resume-offer', {
        detail: state
      })
    )
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('tour-session-id')
    if (!sessionId) {
      sessionId = `tour-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('tour-session-id', sessionId)
    }
    return sessionId
  }

  // Public methods for integration
  getErrorStats() {
    return this.errorHandler.getErrorStats()
  }

  getInterruptedTours(): InterruptedTourState[] {
    return Array.from(this.interruptedTours.values())
  }

  async clearAllInterruptedTours(): Promise<void> {
    this.interruptedTours.clear()
    
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('interrupted-tour-')
    )
    
    keys.forEach(key => localStorage.removeItem(key))
  }

  destroy(): void {
    this.errorReporter.destroy()
    this.interruptedTours.clear()
  }
}

interface InterruptedTourState {
  tourId: string
  stepIndex: number
  timestamp: Date
  error: string
  context: {
    url: string
    viewport: { width: number; height: number }
  }
  recoveryAttempts: number
}