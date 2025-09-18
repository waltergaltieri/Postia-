/**
 * Tour Health Check System
 * Validates tour configurations and checks element availability and flow integrity
 */

import { TourDefinition, TourStep } from '@/types/tour'
import { validateTourDefinition, TourValidationError } from './tour-validation'

export interface HealthCheckResult {
  tourId: string
  isHealthy: boolean
  score: number // 0-100
  issues: HealthCheckIssue[]
  warnings: HealthCheckWarning[]
  performance: PerformanceMetrics
  lastChecked: Date
}

export interface HealthCheckIssue {
  type: 'critical' | 'error' | 'warning'
  category: 'element' | 'navigation' | 'performance' | 'accessibility' | 'configuration'
  message: string
  stepIndex?: number
  selector?: string
  recommendation?: string
}

export interface HealthCheckWarning {
  type: 'performance' | 'accessibility' | 'usability'
  message: string
  stepIndex?: number
  impact: 'low' | 'medium' | 'high'
}

export interface PerformanceMetrics {
  elementCheckTime: number
  totalCheckTime: number
  slowSteps: number[]
  memoryUsage?: number
}

export interface HealthCheckConfig {
  checkElementAvailability: boolean
  checkAccessibility: boolean
  checkPerformance: boolean
  checkNavigation: boolean
  timeout: number
  retryAttempts: number
}

export class TourHealthChecker {
  private config: HealthCheckConfig
  private cache: Map<string, HealthCheckResult> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = {
      checkElementAvailability: true,
      checkAccessibility: true,
      checkPerformance: true,
      checkNavigation: true,
      timeout: 10000,
      retryAttempts: 3,
      ...config
    }
  }

  async checkTourHealth(tour: TourDefinition): Promise<HealthCheckResult> {
    const startTime = performance.now()
    
    // Check cache first
    const cached = this.getCachedResult(tour.id)
    if (cached) {
      return cached
    }

    const result: HealthCheckResult = {
      tourId: tour.id,
      isHealthy: true,
      score: 100,
      issues: [],
      warnings: [],
      performance: {
        elementCheckTime: 0,
        totalCheckTime: 0,
        slowSteps: []
      },
      lastChecked: new Date()
    }

    try {
      // 1. Validate tour configuration
      await this.validateConfiguration(tour, result)

      // 2. Check element availability
      if (this.config.checkElementAvailability) {
        await this.checkElementAvailability(tour, result)
      }

      // 3. Check accessibility compliance
      if (this.config.checkAccessibility) {
        await this.checkAccessibility(tour, result)
      }

      // 4. Check performance implications
      if (this.config.checkPerformance) {
        await this.checkPerformance(tour, result)
      }

      // 5. Check navigation flow
      if (this.config.checkNavigation) {
        await this.checkNavigationFlow(tour, result)
      }

      // Calculate final health score
      result.score = this.calculateHealthScore(result)
      result.isHealthy = result.score >= 70 && !result.issues.some(i => i.type === 'critical')

    } catch (error) {
      result.issues.push({
        type: 'critical',
        category: 'configuration',
        message: `Health check failed: ${error.message}`,
        recommendation: 'Review tour configuration and fix critical issues'
      })
      result.isHealthy = false
      result.score = 0
    }

    result.performance.totalCheckTime = performance.now() - startTime

    // Cache the result
    this.cacheResult(result)

    return result
  }

  async checkMultipleTours(tours: TourDefinition[]): Promise<HealthCheckResult[]> {
    const results = await Promise.all(
      tours.map(tour => this.checkTourHealth(tour))
    )

    return results
  }

  async validateForDeployment(tours: TourDefinition[]): Promise<{
    canDeploy: boolean
    blockers: HealthCheckIssue[]
    warnings: HealthCheckWarning[]
    summary: DeploymentSummary
  }> {
    const results = await this.checkMultipleTours(tours)
    
    const blockers: HealthCheckIssue[] = []
    const warnings: HealthCheckWarning[] = []

    results.forEach(result => {
      blockers.push(...result.issues.filter(i => i.type === 'critical'))
      warnings.push(...result.warnings)
    })

    const summary: DeploymentSummary = {
      totalTours: tours.length,
      healthyTours: results.filter(r => r.isHealthy).length,
      averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      criticalIssues: blockers.length,
      totalWarnings: warnings.length
    }

    return {
      canDeploy: blockers.length === 0,
      blockers,
      warnings,
      summary
    }
  }

  private async validateConfiguration(tour: TourDefinition, result: HealthCheckResult): Promise<void> {
    try {
      validateTourDefinition(tour)
    } catch (error) {
      if (error instanceof TourValidationError) {
        result.issues.push({
          type: 'critical',
          category: 'configuration',
          message: error.message,
          recommendation: 'Fix configuration errors before deployment'
        })
      }
    }

    // Additional configuration checks
    if (tour.steps.length > 20) {
      result.warnings.push({
        type: 'usability',
        message: 'Tour has many steps, consider breaking into smaller tours',
        impact: 'medium'
      })
    }

    if (tour.metadata.estimatedDuration > 600000) { // 10 minutes
      result.warnings.push({
        type: 'usability',
        message: 'Tour duration is very long, users may abandon',
        impact: 'high'
      })
    }
  }

  private async checkElementAvailability(tour: TourDefinition, result: HealthCheckResult): Promise<void> {
    const elementCheckStart = performance.now()
    
    for (let i = 0; i < tour.steps.length; i++) {
      const step = tour.steps[i]
      const stepStart = performance.now()

      try {
        const element = await this.findElement(step.element, this.config.timeout)
        
        if (!element) {
          result.issues.push({
            type: 'error',
            category: 'element',
            message: `Element not found: ${step.element}`,
            stepIndex: i,
            selector: step.element,
            recommendation: 'Verify element selector or add fallback selectors'
          })
        } else {
          // Check if element is visible and interactable
          const isVisible = this.isElementVisible(element)
          const isInteractable = this.isElementInteractable(element)

          if (!isVisible) {
            result.issues.push({
              type: 'warning',
              category: 'element',
              message: `Element is not visible: ${step.element}`,
              stepIndex: i,
              selector: step.element,
              recommendation: 'Ensure element is visible when tour step is shown'
            })
          }

          if (!isInteractable) {
            result.warnings.push({
              type: 'usability',
              message: `Element may not be interactable: ${step.element}`,
              stepIndex: i,
              impact: 'medium'
            })
          }
        }

        const stepTime = performance.now() - stepStart
        if (stepTime > 1000) { // Slow element lookup
          result.performance.slowSteps.push(i)
        }

      } catch (error) {
        result.issues.push({
          type: 'error',
          category: 'element',
          message: `Error checking element: ${error.message}`,
          stepIndex: i,
          selector: step.element
        })
      }
    }

    result.performance.elementCheckTime = performance.now() - elementCheckStart
  }

  private async checkAccessibility(tour: TourDefinition, result: HealthCheckResult): Promise<void> {
    for (let i = 0; i < tour.steps.length; i++) {
      const step = tour.steps[i]

      // Check for accessibility properties
      if (!step.accessibility?.ariaLabel && !step.accessibility?.ariaDescription) {
        result.warnings.push({
          type: 'accessibility',
          message: `Step ${i + 1} lacks accessibility labels`,
          stepIndex: i,
          impact: 'medium'
        })
      }

      // Check title and description length for screen readers
      if (step.title.length > 100) {
        result.warnings.push({
          type: 'accessibility',
          message: `Step ${i + 1} title is very long for screen readers`,
          stepIndex: i,
          impact: 'low'
        })
      }

      if (step.description.length > 300) {
        result.warnings.push({
          type: 'accessibility',
          message: `Step ${i + 1} description is very long for screen readers`,
          stepIndex: i,
          impact: 'medium'
        })
      }

      // Check for keyboard navigation support
      try {
        const element = document.querySelector(step.element)
        if (element && !this.isKeyboardAccessible(element)) {
          result.issues.push({
            type: 'warning',
            category: 'accessibility',
            message: `Element may not be keyboard accessible: ${step.element}`,
            stepIndex: i,
            selector: step.element,
            recommendation: 'Ensure element is focusable and has proper keyboard support'
          })
        }
      } catch (error) {
        // Element check already handled in availability check
      }
    }
  }

  private async checkPerformance(tour: TourDefinition, result: HealthCheckResult): Promise<void> {
    // Check for performance-impacting selectors
    for (let i = 0; i < tour.steps.length; i++) {
      const step = tour.steps[i]
      
      // Check for expensive selectors
      if (this.isExpensiveSelector(step.element)) {
        result.warnings.push({
          type: 'performance',
          message: `Step ${i + 1} uses potentially slow selector: ${step.element}`,
          stepIndex: i,
          impact: 'medium'
        })
      }

      // Check for complex animations
      if (step.customComponent) {
        result.warnings.push({
          type: 'performance',
          message: `Step ${i + 1} uses custom component, monitor performance`,
          stepIndex: i,
          impact: 'low'
        })
      }
    }

    // Check memory usage if available
    if ('memory' in performance) {
      result.performance.memoryUsage = (performance as any).memory.usedJSHeapSize
    }
  }

  private async checkNavigationFlow(tour: TourDefinition, result: HealthCheckResult): Promise<void> {
    // Check for navigation-dependent steps
    let currentPath = window.location.pathname
    
    for (let i = 0; i < tour.steps.length; i++) {
      const step = tour.steps[i]
      
      // Check if step requires navigation
      if (step.onBeforeHighlight) {
        result.warnings.push({
          type: 'usability',
          message: `Step ${i + 1} has navigation logic, ensure proper error handling`,
          stepIndex: i,
          impact: 'medium'
        })
      }

      // Check for cross-page tours
      const stepPath = this.inferPathFromSelector(step.element)
      if (stepPath && stepPath !== currentPath) {
        result.warnings.push({
          type: 'usability',
          message: `Step ${i + 1} may require navigation to ${stepPath}`,
          stepIndex: i,
          impact: 'high'
        })
        currentPath = stepPath
      }
    }
  }

  private async findElement(selector: string, timeout: number): Promise<Element | null> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      
      const checkElement = () => {
        const element = document.querySelector(selector)
        if (element) {
          resolve(element)
          return
        }
        
        if (Date.now() - startTime >= timeout) {
          resolve(null)
          return
        }
        
        setTimeout(checkElement, 100)
      }
      
      checkElement()
    })
  }

  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      parseFloat(style.opacity) > 0
    )
  }

  private isElementInteractable(element: Element): boolean {
    const style = window.getComputedStyle(element)
    return (
      style.pointerEvents !== 'none' &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true'
    )
  }

  private isKeyboardAccessible(element: Element): boolean {
    const tabIndex = element.getAttribute('tabindex')
    const tagName = element.tagName.toLowerCase()
    
    // Naturally focusable elements
    const focusableElements = ['a', 'button', 'input', 'select', 'textarea']
    
    return (
      focusableElements.includes(tagName) ||
      (tabIndex !== null && parseInt(tabIndex) >= 0) ||
      element.hasAttribute('contenteditable')
    )
  }

  private isExpensiveSelector(selector: string): boolean {
    // Check for potentially expensive CSS selectors
    return (
      selector.includes('*') ||
      selector.includes(':nth-child') ||
      selector.includes(':nth-of-type') ||
      selector.split(' ').length > 4 || // Deep nesting
      /\[.*\*=.*\]/.test(selector) // Attribute contains selectors
    )
  }

  private inferPathFromSelector(selector: string): string | null {
    // Simple heuristics to infer page from selector
    if (selector.includes('dashboard')) return '/dashboard'
    if (selector.includes('content')) return '/content'
    if (selector.includes('campaign')) return '/campaigns'
    if (selector.includes('settings')) return '/settings'
    return null
  }

  private calculateHealthScore(result: HealthCheckResult): number {
    let score = 100
    
    // Deduct points for issues
    result.issues.forEach(issue => {
      switch (issue.type) {
        case 'critical':
          score -= 30
          break
        case 'error':
          score -= 15
          break
        case 'warning':
          score -= 5
          break
      }
    })

    // Deduct points for warnings
    result.warnings.forEach(warning => {
      switch (warning.impact) {
        case 'high':
          score -= 10
          break
        case 'medium':
          score -= 5
          break
        case 'low':
          score -= 2
          break
      }
    })

    // Performance penalties
    if (result.performance.slowSteps.length > 0) {
      score -= result.performance.slowSteps.length * 3
    }

    return Math.max(0, Math.min(100, score))
  }

  private getCachedResult(tourId: string): HealthCheckResult | null {
    const cached = this.cache.get(tourId)
    if (!cached) return null

    const age = Date.now() - cached.lastChecked.getTime()
    if (age > this.cacheTimeout) {
      this.cache.delete(tourId)
      return null
    }

    return cached
  }

  private cacheResult(result: HealthCheckResult): void {
    this.cache.set(result.tourId, result)
  }

  // Public methods for monitoring
  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; oldestEntry?: Date } {
    const entries = Array.from(this.cache.values())
    return {
      size: entries.length,
      oldestEntry: entries.length > 0 
        ? new Date(Math.min(...entries.map(e => e.lastChecked.getTime())))
        : undefined
    }
  }
}

interface DeploymentSummary {
  totalTours: number
  healthyTours: number
  averageScore: number
  criticalIssues: number
  totalWarnings: number
}