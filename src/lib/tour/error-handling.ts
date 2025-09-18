/**
 * Tour Error Handling System
 * Provides robust error handling and recovery strategies for tour execution
 */

export class TourError extends Error {
  constructor(
    message: string,
    public tourId: string,
    public stepIndex?: number,
    public cause?: Error,
    public recoverable: boolean = true
  ) {
    super(message)
    this.name = 'TourError'
  }
}

export class TourElementNotFoundError extends TourError {
  constructor(tourId: string, selector: string, stepIndex: number) {
    super(
      `Element not found: ${selector}`,
      tourId,
      stepIndex,
      undefined,
      true
    )
    this.name = 'TourElementNotFoundError'
  }
}

export class TourNavigationError extends TourError {
  constructor(
    tourId: string,
    expectedPath: string,
    actualPath: string,
    stepIndex: number
  ) {
    super(
      `Navigation error: expected ${expectedPath}, got ${actualPath}`,
      tourId,
      stepIndex,
      undefined,
      true
    )
    this.name = 'TourNavigationError'
  }
}

export class TourPermissionError extends TourError {
  constructor(tourId: string, requiredPermission: string, stepIndex: number) {
    super(
      `Permission denied: ${requiredPermission}`,
      tourId,
      stepIndex,
      undefined,
      false
    )
    this.name = 'TourPermissionError'
  }
}

export class TourTimeoutError extends TourError {
  constructor(tourId: string, stepIndex: number, timeout: number) {
    super(
      `Tour step timed out after ${timeout}ms`,
      tourId,
      stepIndex,
      undefined,
      true
    )
    this.name = 'TourTimeoutError'
  }
}

export interface ErrorRecoveryStrategy {
  onElementNotFound: (error: TourElementNotFoundError) => Promise<boolean>
  onNavigationError: (error: TourNavigationError) => Promise<boolean>
  onPermissionError: (error: TourPermissionError) => Promise<boolean>
  onTimeout: (error: TourTimeoutError) => Promise<boolean>
  onGenericError: (error: TourError) => Promise<boolean>
}

export interface TourErrorContext {
  tourId: string
  stepIndex: number
  userId?: string
  sessionId: string
  timestamp: Date
  userAgent: string
  url: string
  viewport: {
    width: number
    height: number
  }
  additionalData?: Record<string, any>
}

export interface ErrorReport {
  error: TourError
  context: TourErrorContext
  recoveryAttempted: boolean
  recoverySuccessful?: boolean
  stackTrace?: string
}

export class TourErrorHandler {
  private recoveryStrategies: ErrorRecoveryStrategy
  private errorReports: ErrorReport[] = []
  private maxRetries = 3
  private retryDelay = 1000

  constructor(recoveryStrategies: ErrorRecoveryStrategy) {
    this.recoveryStrategies = recoveryStrategies
  }

  async handleError(
    error: TourError,
    context: TourErrorContext
  ): Promise<boolean> {
    const errorReport: ErrorReport = {
      error,
      context,
      recoveryAttempted: false,
      stackTrace: error.stack
    }

    try {
      // Log error for monitoring
      this.logError(errorReport)

      // Attempt recovery if error is recoverable
      if (error.recoverable) {
        errorReport.recoveryAttempted = true
        const recovered = await this.attemptRecovery(error)
        errorReport.recoverySuccessful = recovered

        if (recovered) {
          console.log(`Tour error recovered: ${error.message}`)
          return true
        }
      }

      // If recovery failed or error is not recoverable, handle gracefully
      await this.handleGracefulFailure(error, context)
      return false
    } catch (recoveryError) {
      console.error('Error during tour error recovery:', recoveryError)
      await this.handleGracefulFailure(error, context)
      return false
    } finally {
      this.errorReports.push(errorReport)
    }
  }

  private async attemptRecovery(error: TourError): Promise<boolean> {
    try {
      switch (error.constructor) {
        case TourElementNotFoundError:
          return await this.recoveryStrategies.onElementNotFound(
            error as TourElementNotFoundError
          )
        case TourNavigationError:
          return await this.recoveryStrategies.onNavigationError(
            error as TourNavigationError
          )
        case TourPermissionError:
          return await this.recoveryStrategies.onPermissionError(
            error as TourPermissionError
          )
        case TourTimeoutError:
          return await this.recoveryStrategies.onTimeout(
            error as TourTimeoutError
          )
        default:
          return await this.recoveryStrategies.onGenericError(error)
      }
    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError)
      return false
    }
  }

  private async handleGracefulFailure(
    error: TourError,
    context: TourErrorContext
  ): Promise<void> {
    // Show user-friendly error message
    const message = this.getUserFriendlyMessage(error)
    
    // You would integrate with your notification system here
    console.warn(`Tour error: ${message}`)
    
    // Optionally skip to next step or end tour gracefully
    if (error.stepIndex !== undefined) {
      // Signal to tour system to skip current step
      this.notifyTourSystem('skip_step', {
        tourId: error.tourId,
        stepIndex: error.stepIndex,
        reason: error.message
      })
    }
  }

  private getUserFriendlyMessage(error: TourError): string {
    switch (error.constructor) {
      case TourElementNotFoundError:
        return 'Some content has moved. We\'ll skip this step and continue.'
      case TourNavigationError:
        return 'Navigation issue detected. Continuing with the tour.'
      case TourPermissionError:
        return 'You don\'t have permission to access this feature.'
      case TourTimeoutError:
        return 'This step is taking longer than expected. Moving to the next step.'
      default:
        return 'A minor issue occurred. The tour will continue.'
    }
  }

  private logError(errorReport: ErrorReport): void {
    // In a real application, you would send this to your logging service
    console.error('Tour Error Report:', {
      tourId: errorReport.error.tourId,
      errorType: errorReport.error.name,
      message: errorReport.error.message,
      stepIndex: errorReport.error.stepIndex,
      context: errorReport.context,
      timestamp: errorReport.context.timestamp
    })
  }

  private notifyTourSystem(event: string, data: any): void {
    // Dispatch custom event for tour system to handle
    window.dispatchEvent(
      new CustomEvent('tour-error-recovery', {
        detail: { event, data }
      })
    )
  }

  // Public methods for monitoring and debugging
  getErrorReports(): ErrorReport[] {
    return [...this.errorReports]
  }

  clearErrorReports(): void {
    this.errorReports = []
  }

  getErrorStats(): {
    totalErrors: number
    recoverableErrors: number
    recoveredErrors: number
    errorsByType: Record<string, number>
  } {
    const stats = {
      totalErrors: this.errorReports.length,
      recoverableErrors: 0,
      recoveredErrors: 0,
      errorsByType: {} as Record<string, number>
    }

    this.errorReports.forEach(report => {
      const errorType = report.error.name
      stats.errorsByType[errorType] = (stats.errorsByType[errorType] || 0) + 1

      if (report.error.recoverable) {
        stats.recoverableErrors++
      }

      if (report.recoverySuccessful) {
        stats.recoveredErrors++
      }
    })

    return stats
  }
}