'use client'

import { AccessibilityError, SafeExecutionResult } from './types'

/**
 * Creates a standardized accessibility error
 */
export function createAccessibilityError(
  message: string,
  code: string,
  severity: 'low' | 'medium' | 'high' = 'medium',
  recoverable: boolean = true,
  context?: Record<string, any>
): AccessibilityError {
  const error = new Error(message) as AccessibilityError
  error.code = code
  error.severity = severity
  error.recoverable = recoverable
  error.context = context
  return error
}

/**
 * Safely executes an accessibility function with error handling
 */
export function safeAccessibilityExecution<T>(
  fn: () => T,
  fallback?: T,
  errorCode: string = 'ACCESSIBILITY_EXECUTION_ERROR'
): SafeExecutionResult<T> {
  try {
    const result = fn()
    return {
      success: true,
      data: result
    }
  } catch (error) {
    const accessibilityError = createAccessibilityError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode,
      'medium',
      true,
      { originalError: error }
    )

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Accessibility function failed:', accessibilityError)
    }

    return {
      success: false,
      error: accessibilityError,
      data: fallback
    }
  }
}

/**
 * Safely executes an async accessibility function with error handling
 */
export async function safeAsyncAccessibilityExecution<T>(
  fn: () => Promise<T>,
  fallback?: T,
  errorCode: string = 'ACCESSIBILITY_ASYNC_EXECUTION_ERROR'
): Promise<SafeExecutionResult<T>> {
  try {
    const result = await fn()
    return {
      success: true,
      data: result
    }
  } catch (error) {
    const accessibilityError = createAccessibilityError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode,
      'medium',
      true,
      { originalError: error }
    )

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Async accessibility function failed:', accessibilityError)
    }

    return {
      success: false,
      error: accessibilityError,
      data: fallback
    }
  }
}

/**
 * Validates if the current environment supports accessibility features
 */
export function validateAccessibilityEnvironment(): SafeExecutionResult<boolean> {
  return safeAccessibilityExecution(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false
    }

    // Check for basic DOM APIs
    if (!document || !document.createElement) {
      return false
    }

    // Check for accessibility APIs
    const hasAriaSupport = 'setAttribute' in document.createElement('div')
    const hasFocusSupport = 'focus' in document.createElement('button')
    
    return hasAriaSupport && hasFocusSupport
  }, false, 'ENVIRONMENT_VALIDATION_ERROR')
}

/**
 * Logs accessibility events for debugging
 */
export function logAccessibilityEvent(
  event: string,
  data?: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      event,
      ...data
    }

    switch (level) {
      case 'error':
        console.error('[Accessibility Error]', logData)
        break
      case 'warn':
        console.warn('[Accessibility Warning]', logData)
        break
      default:
        console.log('[Accessibility Info]', logData)
        break
    }
  }
}