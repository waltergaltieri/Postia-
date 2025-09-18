/**
 * Tour Error Reporting System
 * Handles logging, reporting, and monitoring of tour errors
 */

import { ErrorReport, TourError, TourErrorContext } from './error-handling'

export interface ErrorReportingConfig {
  enableConsoleLogging: boolean
  enableRemoteLogging: boolean
  enableLocalStorage: boolean
  maxStoredReports: number
  reportingEndpoint?: string
  apiKey?: string
  batchSize: number
  flushInterval: number
}

export class TourErrorReporter {
  private config: ErrorReportingConfig
  private reportQueue: ErrorReport[] = []
  private flushTimer?: NodeJS.Timeout

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      enableLocalStorage: true,
      maxStoredReports: 100,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    }

    if (this.config.enableRemoteLogging) {
      this.startBatchReporting()
    }
  }

  async reportError(errorReport: ErrorReport): Promise<void> {
    try {
      // Console logging
      if (this.config.enableConsoleLogging) {
        this.logToConsole(errorReport)
      }

      // Local storage
      if (this.config.enableLocalStorage) {
        this.storeLocally(errorReport)
      }

      // Remote logging
      if (this.config.enableRemoteLogging) {
        this.queueForRemoteReporting(errorReport)
      }

      // Real-time critical error reporting
      if (this.isCriticalError(errorReport.error)) {
        await this.reportCriticalError(errorReport)
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError)
    }
  }

  private logToConsole(errorReport: ErrorReport): void {
    const { error, context } = errorReport

    console.group(`🚨 Tour Error: ${error.name}`)
    console.error('Message:', error.message)
    console.log('Tour ID:', error.tourId)
    console.log('Step Index:', error.stepIndex)
    console.log('Context:', {
      url: context.url,
      timestamp: context.timestamp,
      viewport: context.viewport,
      userAgent: context.userAgent
    })
    console.log('Recovery Attempted:', errorReport.recoveryAttempted)
    console.log('Recovery Successful:', errorReport.recoverySuccessful)
    
    if (errorReport.stackTrace) {
      console.log('Stack Trace:', errorReport.stackTrace)
    }
    
    console.groupEnd()
  }

  private storeLocally(errorReport: ErrorReport): void {
    try {
      const key = 'tour-error-reports'
      const stored = localStorage.getItem(key)
      const reports: ErrorReport[] = stored ? JSON.parse(stored) : []

      // Add new report
      reports.push({
        ...errorReport,
        // Convert dates to strings for JSON storage
        context: {
          ...errorReport.context,
          timestamp: errorReport.context.timestamp.toISOString()
        }
      } as any)

      // Keep only the most recent reports
      if (reports.length > this.config.maxStoredReports) {
        reports.splice(0, reports.length - this.config.maxStoredReports)
      }

      localStorage.setItem(key, JSON.stringify(reports))
    } catch (storageError) {
      console.warn('Failed to store error report locally:', storageError)
    }
  }

  private queueForRemoteReporting(errorReport: ErrorReport): void {
    this.reportQueue.push(errorReport)

    // Flush immediately if queue is full
    if (this.reportQueue.length >= this.config.batchSize) {
      this.flushReports()
    }
  }

  private startBatchReporting(): void {
    this.flushTimer = setInterval(() => {
      if (this.reportQueue.length > 0) {
        this.flushReports()
      }
    }, this.config.flushInterval)
  }

  private async flushReports(): Promise<void> {
    if (this.reportQueue.length === 0 || !this.config.reportingEndpoint) {
      return
    }

    const reportsToSend = this.reportQueue.splice(0, this.config.batchSize)

    try {
      const response = await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          reports: reportsToSend.map(this.serializeErrorReport),
          timestamp: new Date().toISOString(),
          source: 'tour-system'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log(`Successfully reported ${reportsToSend.length} tour errors`)
    } catch (error) {
      console.error('Failed to send error reports:', error)
      
      // Put reports back in queue for retry
      this.reportQueue.unshift(...reportsToSend)
    }
  }

  private async reportCriticalError(errorReport: ErrorReport): Promise<void> {
    if (!this.config.reportingEndpoint) return

    try {
      await fetch(`${this.config.reportingEndpoint}/critical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          report: this.serializeErrorReport(errorReport),
          priority: 'critical',
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to report critical error:', error)
    }
  }

  private isCriticalError(error: TourError): boolean {
    // Define what constitutes a critical error
    return (
      error.name === 'TourPermissionError' ||
      (error.name === 'TourError' && !error.recoverable) ||
      error.message.includes('security') ||
      error.message.includes('authentication')
    )
  }

  private serializeErrorReport(errorReport: ErrorReport): any {
    return {
      error: {
        name: errorReport.error.name,
        message: errorReport.error.message,
        tourId: errorReport.error.tourId,
        stepIndex: errorReport.error.stepIndex,
        recoverable: errorReport.error.recoverable
      },
      context: {
        ...errorReport.context,
        timestamp: errorReport.context.timestamp.toISOString()
      },
      recoveryAttempted: errorReport.recoveryAttempted,
      recoverySuccessful: errorReport.recoverySuccessful,
      stackTrace: errorReport.stackTrace
    }
  }

  // Public methods for monitoring and management
  getStoredReports(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('tour-error-reports')
      if (!stored) return []

      const reports = JSON.parse(stored)
      return reports.map((report: any) => ({
        ...report,
        context: {
          ...report.context,
          timestamp: new Date(report.context.timestamp)
        }
      }))
    } catch (error) {
      console.warn('Failed to retrieve stored error reports:', error)
      return []
    }
  }

  clearStoredReports(): void {
    try {
      localStorage.removeItem('tour-error-reports')
    } catch (error) {
      console.warn('Failed to clear stored error reports:', error)
    }
  }

  getQueuedReportsCount(): number {
    return this.reportQueue.length
  }

  async flushNow(): Promise<void> {
    await this.flushReports()
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    // Flush any remaining reports
    if (this.reportQueue.length > 0) {
      this.flushReports()
    }
  }
}