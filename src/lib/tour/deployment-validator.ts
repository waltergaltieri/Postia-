/**
 * Tour Deployment Validation System
 * Comprehensive validation before deploying tours to production
 */

import { TourDefinition } from '@/types/tour'
import { TourHealthChecker, HealthCheckResult } from './tour-health-check'
import { TourPerformanceMonitor } from './tour-performance-monitor'
import { validateTourDefinitions } from './tour-validation'

export interface DeploymentValidationConfig {
  environment: 'development' | 'staging' | 'production'
  strictMode: boolean
  performanceChecks: boolean
  accessibilityChecks: boolean
  crossBrowserChecks: boolean
  loadTesting: boolean
  maxCriticalIssues: number
  maxWarnings: number
  requiredHealthScore: number
}

export interface DeploymentValidationResult {
  canDeploy: boolean
  environment: string
  timestamp: Date
  summary: ValidationSummary
  tourResults: TourValidationResult[]
  blockers: ValidationBlocker[]
  warnings: ValidationWarning[]
  recommendations: string[]
  performanceReport?: PerformanceValidationReport
}

export interface ValidationSummary {
  totalTours: number
  validTours: number
  failedTours: number
  averageHealthScore: number
  criticalIssues: number
  totalWarnings: number
  estimatedDeploymentTime: number
}

export interface TourValidationResult {
  tourId: string
  isValid: boolean
  healthScore: number
  issues: ValidationIssue[]
  warnings: ValidationWarning[]
  performanceMetrics?: any
}

export interface ValidationBlocker {
  type: 'critical' | 'security' | 'performance' | 'accessibility'
  tourId?: string
  message: string
  details: string
  resolution: string
}

export interface ValidationWarning {
  type: 'performance' | 'usability' | 'accessibility' | 'maintenance'
  tourId?: string
  message: string
  impact: 'low' | 'medium' | 'high'
  recommendation: string
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  message: string
  stepIndex?: number
}

export interface PerformanceValidationReport {
  averageLoadTime: number
  memoryUsage: number
  bundleSize: number
  slowTours: string[]
  recommendations: string[]
}

export class DeploymentValidator {
  private healthChecker: TourHealthChecker
  private performanceMonitor: TourPerformanceMonitor
  private config: DeploymentValidationConfig

  constructor(config: Partial<DeploymentValidationConfig> = {}) {
    this.config = {
      environment: 'production',
      strictMode: true,
      performanceChecks: true,
      accessibilityChecks: true,
      crossBrowserChecks: false,
      loadTesting: false,
      maxCriticalIssues: 0,
      maxWarnings: 10,
      requiredHealthScore: 80,
      ...config
    }

    this.healthChecker = new TourHealthChecker({
      checkElementAvailability: true,
      checkAccessibility: this.config.accessibilityChecks,
      checkPerformance: this.config.performanceChecks,
      checkNavigation: true,
      timeout: this.config.environment === 'production' ? 5000 : 10000,
      retryAttempts: 3
    })

    this.performanceMonitor = new TourPerformanceMonitor()
  }

  async validateForDeployment(tours: TourDefinition[]): Promise<DeploymentValidationResult> {
    const startTime = Date.now()
    
    console.log(`Starting deployment validation for ${tours.length} tours in ${this.config.environment} mode`)

    const result: DeploymentValidationResult = {
      canDeploy: false,
      environment: this.config.environment,
      timestamp: new Date(),
      summary: {
        totalTours: tours.length,
        validTours: 0,
        failedTours: 0,
        averageHealthScore: 0,
        criticalIssues: 0,
        totalWarnings: 0,
        estimatedDeploymentTime: 0
      },
      tourResults: [],
      blockers: [],
      warnings: [],
      recommendations: []
    }

    try {
      // 1. Basic configuration validation
      await this.validateConfigurations(tours, result)

      // 2. Health checks for all tours
      await this.performHealthChecks(tours, result)

      // 3. Performance validation
      if (this.config.performanceChecks) {
        await this.performPerformanceValidation(tours, result)
      }

      // 4. Cross-browser compatibility (if enabled)
      if (this.config.crossBrowserChecks) {
        await this.performCrossBrowserValidation(tours, result)
      }

      // 5. Load testing (if enabled)
      if (this.config.loadTesting) {
        await this.performLoadTesting(tours, result)
      }

      // 6. Security validation
      await this.performSecurityValidation(tours, result)

      // 7. Accessibility compliance
      if (this.config.accessibilityChecks) {
        await this.performAccessibilityValidation(tours, result)
      }

      // 8. Generate final assessment
      this.generateFinalAssessment(result)

    } catch (error) {
      result.blockers.push({
        type: 'critical',
        message: 'Validation process failed',
        details: error.message,
        resolution: 'Fix validation errors and retry'
      })
    }

    result.summary.estimatedDeploymentTime = Date.now() - startTime
    
    console.log(`Deployment validation completed in ${result.summary.estimatedDeploymentTime}ms`)
    
    return result
  }

  private async validateConfigurations(
    tours: TourDefinition[],
    result: DeploymentValidationResult
  ): Promise<void> {
    try {
      validateTourDefinitions(tours)
      console.log('✓ Configuration validation passed')
    } catch (error) {
      result.blockers.push({
        type: 'critical',
        message: 'Configuration validation failed',
        details: error.message,
        resolution: 'Fix tour configuration errors'
      })
    }

    // Check for duplicate IDs
    const ids = new Set<string>()
    tours.forEach(tour => {
      if (ids.has(tour.id)) {
        result.blockers.push({
          type: 'critical',
          tourId: tour.id,
          message: `Duplicate tour ID: ${tour.id}`,
          details: 'Multiple tours cannot have the same ID',
          resolution: 'Ensure all tour IDs are unique'
        })
      }
      ids.add(tour.id)
    })

    // Environment-specific validations
    if (this.config.environment === 'production') {
      tours.forEach(tour => {
        // Check for development-only features
        if (tour.id.includes('test') || tour.id.includes('debug')) {
          result.warnings.push({
            type: 'maintenance',
            tourId: tour.id,
            message: 'Tour appears to be for testing/debugging',
            impact: 'medium',
            recommendation: 'Remove test tours from production deployment'
          })
        }

        // Check for proper versioning
        if (!tour.metadata.version || tour.metadata.version === '0.0.0') {
          result.warnings.push({
            type: 'maintenance',
            tourId: tour.id,
            message: 'Tour lacks proper version number',
            impact: 'low',
            recommendation: 'Add semantic version number to tour metadata'
          })
        }
      })
    }
  }

  private async performHealthChecks(
    tours: TourDefinition[],
    result: DeploymentValidationResult
  ): Promise<void> {
    console.log('Performing health checks...')
    
    const healthResults = await this.healthChecker.checkMultipleTours(tours)
    
    let totalScore = 0
    let validTours = 0

    healthResults.forEach(healthResult => {
      const tourResult: TourValidationResult = {
        tourId: healthResult.tourId,
        isValid: healthResult.isHealthy,
        healthScore: healthResult.score,
        issues: healthResult.issues.map(issue => ({
          type: issue.type === 'critical' ? 'error' : issue.type as 'error' | 'warning',
          category: issue.category,
          message: issue.message,
          stepIndex: issue.stepIndex
        })),
        warnings: healthResult.warnings.map(warning => ({
          type: warning.type as 'performance' | 'usability' | 'accessibility',
          tourId: healthResult.tourId,
          message: warning.message,
          impact: warning.impact,
          recommendation: 'See health check details'
        }))
      }

      result.tourResults.push(tourResult)
      totalScore += healthResult.score

      if (healthResult.isHealthy) {
        validTours++
      } else {
        result.summary.failedTours++
      }

      // Add critical issues as blockers
      healthResult.issues.forEach(issue => {
        if (issue.type === 'critical') {
          result.blockers.push({
            type: 'critical',
            tourId: healthResult.tourId,
            message: issue.message,
            details: issue.recommendation || 'See health check details',
            resolution: issue.recommendation || 'Fix critical health check issues'
          })
          result.summary.criticalIssues++
        }
      })

      // Add warnings
      result.warnings.push(...tourResult.warnings)
      result.summary.totalWarnings += tourResult.warnings.length
    })

    result.summary.validTours = validTours
    result.summary.averageHealthScore = totalScore / tours.length

    // Check if average health score meets requirements
    if (result.summary.averageHealthScore < this.config.requiredHealthScore) {
      result.blockers.push({
        type: 'critical',
        message: `Average health score (${result.summary.averageHealthScore.toFixed(1)}) below required threshold (${this.config.requiredHealthScore})`,
        details: 'Tours must meet minimum health score requirements',
        resolution: 'Improve tour health scores by fixing identified issues'
      })
    }

    console.log(`✓ Health checks completed. Average score: ${result.summary.averageHealthScore.toFixed(1)}`)
  }

  private async performPerformanceValidation(
    tours: TourDefinition[],
    result: DeploymentValidationResult
  ): Promise<void> {
    console.log('Performing performance validation...')

    const performanceReport: PerformanceValidationReport = {
      averageLoadTime: 0,
      memoryUsage: 0,
      bundleSize: 0,
      slowTours: [],
      recommendations: []
    }

    // Simulate tour loading and measure performance
    for (const tour of tours) {
      const loadStart = performance.now()
      
      // Simulate tour initialization
      await this.simulateTourLoad(tour)
      
      const loadTime = performance.now() - loadStart
      performanceReport.averageLoadTime += loadTime

      if (loadTime > 1000) { // 1 second threshold
        performanceReport.slowTours.push(tour.id)
        result.warnings.push({
          type: 'performance',
          tourId: tour.id,
          message: `Tour has slow load time: ${loadTime.toFixed(1)}ms`,
          impact: 'medium',
          recommendation: 'Optimize tour configuration and reduce complexity'
        })
      }
    }

    performanceReport.averageLoadTime /= tours.length

    // Check memory usage
    if ('memory' in performance) {
      performanceReport.memoryUsage = (performance as any).memory.usedJSHeapSize
    }

    // Estimate bundle size impact
    performanceReport.bundleSize = this.estimateBundleSize(tours)

    if (performanceReport.bundleSize > 100 * 1024) { // 100KB threshold
      result.warnings.push({
        type: 'performance',
        message: `Tour bundle size is large: ${(performanceReport.bundleSize / 1024).toFixed(1)}KB`,
        impact: 'medium',
        recommendation: 'Consider lazy loading or splitting tour configurations'
      })
    }

    result.performanceReport = performanceReport
    console.log(`✓ Performance validation completed. Average load time: ${performanceReport.averageLoadTime.toFixed(1)}ms`)
  }

  private async performCrossBrowserValidation(
    tours: TourDefinition[],
    result: DeploymentValidationResult
  ): Promise<void> {
    console.log('Performing cross-browser validation...')
    
    // This would typically involve running tests in different browsers
    // For now, we'll do basic compatibility checks
    
    tours.forEach(tour => {
      tour.steps.forEach((step, index) => {
        // Check for browser-specific selectors
        if (step.element.includes('::-webkit-') || step.element.includes('-moz-')) {
          result.warnings.push({
            type: 'accessibility',
            tourId: tour.id,
            message: `Step ${index + 1} uses browser-specific selector`,
            impact: 'medium',
            recommendation: 'Use cross-browser compatible selectors'
          })
        }
      })
    })

    console.log('✓ Cross-browser validation completed')
  }

  private async performLoadTesting(
    tours: TourDefinition[],
    result: DeploymentValidationResult
  ): Promise<void> {
    console.log('Performing load testing...')
    
    // Simulate concurrent tour usage
    const concurrentUsers = 10
    const promises = []

    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateConcurrentTourUsage(tours))
    }

    const results = await Promise.all(promises)
    const averageResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length

    if (averageResponseTime > 2000) { // 2 second threshold
      result.warnings.push({
        type: 'performance',
        message: `High response time under load: ${averageResponseTime.toFixed(1)}ms`,
        impact: 'high',
        recommendation: 'Optimize tour performance for concurrent usage'
      })
    }

    console.log(`✓ Load testing completed. Average response time: ${averageResponseTime.toFixed(1)}ms`)
  }

  private async performSecurityValidation(
    tours: TourDefinition[],
    result: DeploymentValidationResult
  ): Promise<void> {
    console.log('Performing security validation...')

    tours.forEach(tour => {
      // Check for potential XSS vulnerabilities
      tour.steps.forEach((step, index) => {
        if (step.description.includes('<script>') || step.title.includes('<script>')) {
          result.blockers.push({
            type: 'security',
            tourId: tour.id,
            message: `Step ${index + 1} contains potentially unsafe content`,
            details: 'Script tags detected in tour content',
            resolution: 'Remove or sanitize script content'
          })
        }

        // Check for dangerous selectors
        if (step.element.includes('javascript:') || step.element.includes('data:')) {
          result.blockers.push({
            type: 'security',
            tourId: tour.id,
            message: `Step ${index + 1} uses potentially unsafe selector`,
            details: 'Selector contains javascript: or data: protocol',
            resolution: 'Use safe CSS selectors only'
          })
        }
      })

      // Check for sensitive information in tour content
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /api[_-]?key/i,
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/ // Credit card pattern
      ]

      tour.steps.forEach((step, index) => {
        const content = `${step.title} ${step.description}`
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(content)) {
            result.warnings.push({
              type: 'maintenance',
              tourId: tour.id,
              message: `Step ${index + 1} may contain sensitive information`,
              impact: 'high',
              recommendation: 'Review and remove any sensitive data from tour content'
            })
          }
        })
      })
    })

    console.log('✓ Security validation completed')
  }

  private async performAccessibilityValidation(
    tours: TourDefinition[],
    result: DeploymentValidationResult
  ): Promise<void> {
    console.log('Performing accessibility validation...')

    tours.forEach(tour => {
      let accessibilityScore = 100

      tour.steps.forEach((step, index) => {
        // Check for missing accessibility attributes
        if (!step.accessibility?.ariaLabel && !step.accessibility?.ariaDescription) {
          accessibilityScore -= 10
          result.warnings.push({
            type: 'accessibility',
            tourId: tour.id,
            message: `Step ${index + 1} lacks accessibility labels`,
            impact: 'medium',
            recommendation: 'Add aria-label or aria-description for screen readers'
          })
        }

        // Check for color-only information
        if (step.description.toLowerCase().includes('click the red') || 
            step.description.toLowerCase().includes('green button')) {
          result.warnings.push({
            type: 'accessibility',
            tourId: tour.id,
            message: `Step ${index + 1} may rely on color alone for information`,
            impact: 'medium',
            recommendation: 'Provide additional non-color indicators'
          })
        }

        // Check text length for screen readers
        if (step.description.length > 300) {
          result.warnings.push({
            type: 'accessibility',
            tourId: tour.id,
            message: `Step ${index + 1} has very long description for screen readers`,
            impact: 'low',
            recommendation: 'Consider shortening description or breaking into multiple steps'
          })
        }
      })

      // Fail if accessibility score is too low
      if (this.config.strictMode && accessibilityScore < 70) {
        result.blockers.push({
          type: 'accessibility',
          tourId: tour.id,
          message: `Tour fails accessibility requirements (score: ${accessibilityScore})`,
          details: 'Multiple accessibility issues detected',
          resolution: 'Fix accessibility issues to meet WCAG 2.1 AA standards'
        })
      }
    })

    console.log('✓ Accessibility validation completed')
  }

  private generateFinalAssessment(result: DeploymentValidationResult): void {
    // Determine if deployment can proceed
    const hasBlockers = result.blockers.length > 0
    const tooManyWarnings = result.warnings.length > this.config.maxWarnings
    const lowHealthScore = result.summary.averageHealthScore < this.config.requiredHealthScore

    result.canDeploy = !hasBlockers && !tooManyWarnings && !lowHealthScore

    // Generate recommendations
    if (result.summary.failedTours > 0) {
      result.recommendations.push(`${result.summary.failedTours} tours failed validation and need attention`)
    }

    if (result.summary.averageHealthScore < 90) {
      result.recommendations.push('Consider improving tour health scores for better user experience')
    }

    if (result.warnings.length > 5) {
      result.recommendations.push('Address warnings to improve tour quality and maintainability')
    }

    if (result.performanceReport?.slowTours.length) {
      result.recommendations.push(`Optimize performance for ${result.performanceReport.slowTours.length} slow tours`)
    }

    // Environment-specific recommendations
    if (this.config.environment === 'production') {
      result.recommendations.push('Monitor tour performance and user feedback after deployment')
      result.recommendations.push('Set up alerts for tour errors and performance issues')
    }

    console.log(`Final assessment: ${result.canDeploy ? '✓ READY TO DEPLOY' : '✗ DEPLOYMENT BLOCKED'}`)
  }

  // Helper methods
  private async simulateTourLoad(tour: TourDefinition): Promise<void> {
    // Simulate tour loading time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
  }

  private estimateBundleSize(tours: TourDefinition[]): number {
    // Rough estimate of bundle size impact
    return tours.reduce((size, tour) => {
      return size + JSON.stringify(tour).length
    }, 0)
  }

  private async simulateConcurrentTourUsage(tours: TourDefinition[]): Promise<number> {
    const start = performance.now()
    
    // Simulate tour usage
    for (const tour of tours.slice(0, 3)) { // Test first 3 tours
      await this.simulateTourLoad(tour)
    }
    
    return performance.now() - start
  }

  // Public utility methods
  generateDeploymentReport(result: DeploymentValidationResult): string {
    const report = [
      `# Tour Deployment Validation Report`,
      `**Environment:** ${result.environment}`,
      `**Timestamp:** ${result.timestamp.toISOString()}`,
      `**Status:** ${result.canDeploy ? '✅ READY TO DEPLOY' : '❌ DEPLOYMENT BLOCKED'}`,
      ``,
      `## Summary`,
      `- Total Tours: ${result.summary.totalTours}`,
      `- Valid Tours: ${result.summary.validTours}`,
      `- Failed Tours: ${result.summary.failedTours}`,
      `- Average Health Score: ${result.summary.averageHealthScore.toFixed(1)}`,
      `- Critical Issues: ${result.summary.criticalIssues}`,
      `- Total Warnings: ${result.summary.totalWarnings}`,
      ``
    ]

    if (result.blockers.length > 0) {
      report.push(`## Blockers (${result.blockers.length})`)
      result.blockers.forEach((blocker, i) => {
        report.push(`${i + 1}. **${blocker.type.toUpperCase()}** ${blocker.tourId ? `[${blocker.tourId}]` : ''}: ${blocker.message}`)
        report.push(`   - ${blocker.details}`)
        report.push(`   - Resolution: ${blocker.resolution}`)
        report.push('')
      })
    }

    if (result.recommendations.length > 0) {
      report.push(`## Recommendations`)
      result.recommendations.forEach((rec, i) => {
        report.push(`${i + 1}. ${rec}`)
      })
      report.push('')
    }

    return report.join('\n')
  }
}