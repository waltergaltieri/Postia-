/**
 * Default Recovery Strategies for Tour Errors
 * Provides sensible defaults for handling common tour execution errors
 */

import {
  ErrorRecoveryStrategy,
  TourElementNotFoundError,
  TourNavigationError,
  TourPermissionError,
  TourTimeoutError,
  TourError
} from './error-handling'

export class DefaultRecoveryStrategies implements ErrorRecoveryStrategy {
  private maxRetries = 3
  private retryDelay = 1000

  async onElementNotFound(error: TourElementNotFoundError): Promise<boolean> {
    console.log(`Attempting to recover from element not found: ${error.message}`)

    // Strategy 1: Wait and retry (element might be loading)
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      await this.delay(this.retryDelay * attempt)
      
      const element = document.querySelector(error.message.split(': ')[1])
      if (element) {
        console.log(`Element found on attempt ${attempt}`)
        return true
      }
    }

    // Strategy 2: Try alternative selectors
    const alternativeSelectors = this.getAlternativeSelectors(
      error.message.split(': ')[1]
    )
    
    for (const selector of alternativeSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        console.log(`Found element with alternative selector: ${selector}`)
        // Update the tour step with the working selector
        this.notifyTourSystem('update_selector', {
          tourId: error.tourId,
          stepIndex: error.stepIndex,
          newSelector: selector
        })
        return true
      }
    }

    // Strategy 3: Check if we're on the wrong page
    const expectedPage = this.inferPageFromSelector(error.message.split(': ')[1])
    if (expectedPage && !window.location.pathname.includes(expectedPage)) {
      console.log(`Wrong page detected, navigating to: ${expectedPage}`)
      // Navigate to the correct page
      window.location.href = expectedPage
      return true
    }

    return false
  }

  async onNavigationError(error: TourNavigationError): Promise<boolean> {
    console.log(`Attempting to recover from navigation error: ${error.message}`)

    const [, expectedPath, actualPath] = error.message.match(
      /expected (.+), got (.+)/
    ) || []

    if (!expectedPath || !actualPath) return false

    // Strategy 1: Navigate to expected path
    try {
      window.history.pushState({}, '', expectedPath)
      await this.delay(500) // Wait for navigation to complete
      
      if (window.location.pathname === expectedPath) {
        console.log(`Successfully navigated to: ${expectedPath}`)
        return true
      }
    } catch (navError) {
      console.error('Navigation recovery failed:', navError)
    }

    // Strategy 2: Check if it's a similar path (e.g., with different ID)
    if (this.arePathsSimilar(expectedPath, actualPath)) {
      console.log('Paths are similar, continuing tour on current page')
      return true
    }

    return false
  }

  async onPermissionError(error: TourPermissionError): Promise<boolean> {
    console.log(`Handling permission error: ${error.message}`)

    // Permission errors are typically not recoverable automatically
    // But we can provide helpful guidance to the user
    
    const requiredPermission = error.message.split(': ')[1]
    
    // Show user-friendly message about missing permissions
    this.showPermissionGuidance(requiredPermission)
    
    // Skip this step and continue with tour
    this.notifyTourSystem('skip_step_with_message', {
      tourId: error.tourId,
      stepIndex: error.stepIndex,
      message: `This step requires ${requiredPermission} permission. Skipping...`
    })

    return false // Not recovered, but handled gracefully
  }

  async onTimeout(error: TourTimeoutError): Promise<boolean> {
    console.log(`Attempting to recover from timeout: ${error.message}`)

    // Strategy 1: Check if the page is still loading
    if (document.readyState !== 'complete') {
      console.log('Page still loading, waiting for completion')
      await this.waitForPageLoad()
      return true
    }

    // Strategy 2: Check for slow network requests
    if (this.hasActiveNetworkRequests()) {
      console.log('Active network requests detected, waiting...')
      await this.waitForNetworkIdle()
      return true
    }

    // Strategy 3: Check if element appeared after timeout
    await this.delay(1000)
    const currentStep = this.getCurrentTourStep(error.tourId, error.stepIndex!)
    if (currentStep?.element) {
      const element = typeof currentStep.element === 'string' 
        ? document.querySelector(currentStep.element)
        : currentStep.element
      
      if (element) {
        console.log('Element appeared after timeout, continuing')
        return true
      }
    }

    return false
  }

  async onGenericError(error: TourError): Promise<boolean> {
    console.log(`Attempting to recover from generic error: ${error.message}`)

    // Strategy 1: Retry after delay
    await this.delay(this.retryDelay)
    
    // Strategy 2: Check if the error condition still exists
    // This is a generic approach - specific implementations would be better
    
    // For now, we'll just log and continue
    console.log('Generic error recovery: continuing tour')
    return false
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private getAlternativeSelectors(originalSelector: string): string[] {
    const alternatives: string[] = []

    // If it's an ID selector, try data-testid
    if (originalSelector.startsWith('#')) {
      const id = originalSelector.substring(1)
      alternatives.push(`[data-testid="${id}"]`)
      alternatives.push(`[data-id="${id}"]`)
    }

    // If it's a class selector, try variations
    if (originalSelector.startsWith('.')) {
      const className = originalSelector.substring(1)
      alternatives.push(`[class*="${className}"]`)
    }

    // Try aria-label alternatives
    if (originalSelector.includes('button') || originalSelector.includes('link')) {
      alternatives.push('[role="button"]')
      alternatives.push('[role="link"]')
    }

    return alternatives
  }

  private inferPageFromSelector(selector: string): string | null {
    // Simple heuristics to infer page from selector
    if (selector.includes('dashboard')) return '/dashboard'
    if (selector.includes('content')) return '/content'
    if (selector.includes('campaign')) return '/campaigns'
    if (selector.includes('settings')) return '/settings'
    return null
  }

  private arePathsSimilar(path1: string, path2: string): boolean {
    // Remove IDs and query parameters for comparison
    const normalize = (path: string) => 
      path.replace(/\/\d+/g, '/:id').split('?')[0]
    
    return normalize(path1) === normalize(path2)
  }

  private showPermissionGuidance(permission: string): void {
    // In a real app, this would show a proper notification
    console.warn(`Permission guidance: You need ${permission} to access this feature`)
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve()
      } else {
        window.addEventListener('load', () => resolve(), { once: true })
      }
    })
  }

  private hasActiveNetworkRequests(): boolean {
    // Simple check for active fetch requests
    // In a real app, you might have a more sophisticated way to track this
    return (window as any).__activeRequests > 0
  }

  private async waitForNetworkIdle(timeout = 5000): Promise<void> {
    const startTime = Date.now()
    
    while (this.hasActiveNetworkRequests() && Date.now() - startTime < timeout) {
      await this.delay(100)
    }
  }

  private getCurrentTourStep(tourId: string, stepIndex: number): any {
    // This would integrate with your tour system to get current step
    // For now, return null as placeholder
    return null
  }

  private notifyTourSystem(event: string, data: any): void {
    window.dispatchEvent(
      new CustomEvent('tour-recovery-action', {
        detail: { event, data }
      })
    )
  }
}