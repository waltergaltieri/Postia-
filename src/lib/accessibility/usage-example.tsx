'use client'

import * as React from 'react'
import { 
  useReducedMotion, 
  useHighContrast, 
  useFocusTrap,
  AccessibilityErrorBoundary,
  announceToScreenReader,
  safeBrowserExecution
} from './index'

/**
 * Example component demonstrating the enhanced accessibility features
 */
export function AccessibilityUsageExample() {
  // Enhanced hooks with error handling
  const { prefersReducedMotion, isLoading: motionLoading, error: motionError } = useReducedMotion()
  const { prefersHighContrast, isLoading: contrastLoading, error: contrastError } = useHighContrast()
  
  // Focus trap with error handling
  const { containerRef, isActive, error: focusError } = useFocusTrap(true, {
    autoFocus: true,
    restoreFocus: true,
    onEscape: () => console.log('Focus trap escaped')
  })

  // Safe browser execution example
  const handleSafeOperation = () => {
    const result = safeBrowserExecution(
      () => {
        // Some potentially failing operation
        return window.getComputedStyle(document.body).backgroundColor
      },
      'transparent' // fallback value
    )

    if (result.success) {
      console.log('Background color:', result.data)
    } else {
      console.warn('Failed to get background color:', result.error)
    }
  }

  // Screen reader announcement
  const handleAnnouncement = () => {
    announceToScreenReader('This is a test announcement', 'polite')
  }

  return (
    <AccessibilityErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Accessibility error caught:', error, errorInfo)
      }}
      enableScreenReaderAnnouncement={true}
    >
      <div ref={containerRef} className="accessibility-demo">
        <h2>Accessibility Features Demo</h2>
        
        <div className="status-section">
          <h3>Accessibility Status</h3>
          <p>
            Reduced Motion: {motionLoading ? 'Loading...' : prefersReducedMotion ? 'Enabled' : 'Disabled'}
            {motionError && <span className="error"> (Error: {motionError.message})</span>}
          </p>
          <p>
            High Contrast: {contrastLoading ? 'Loading...' : prefersHighContrast ? 'Enabled' : 'Disabled'}
            {contrastError && <span className="error"> (Error: {contrastError.message})</span>}
          </p>
          <p>
            Focus Trap: {isActive ? 'Active' : 'Inactive'}
            {focusError && <span className="error"> (Error: {focusError.message})</span>}
          </p>
        </div>

        <div className="actions-section">
          <h3>Test Actions</h3>
          <button onClick={handleSafeOperation}>
            Test Safe Browser Operation
          </button>
          <button onClick={handleAnnouncement}>
            Test Screen Reader Announcement
          </button>
        </div>

        <div className="info-section">
          <h3>Features Demonstrated</h3>
          <ul>
            <li>✅ SSR-safe media query detection</li>
            <li>✅ Comprehensive error handling</li>
            <li>✅ Focus trap with error recovery</li>
            <li>✅ Safe browser API access</li>
            <li>✅ Screen reader announcements with fallbacks</li>
            <li>✅ TypeScript type safety</li>
            <li>✅ Error boundary for graceful degradation</li>
          </ul>
        </div>
      </div>
    </AccessibilityErrorBoundary>
  )
}

/**
 * Hook usage example for testing
 */
export function useAccessibilityExample() {
  const motionResult = useReducedMotion()
  const contrastResult = useHighContrast()
  const focusResult = useFocusTrap(false)

  return {
    motion: motionResult,
    contrast: contrastResult,
    focus: focusResult,
    hasErrors: !!(motionResult.error || contrastResult.error || focusResult.error)
  }
}