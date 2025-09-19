'use client'

import * as React from 'react'
import { Component, ErrorInfo, ReactNode } from 'react'
import { announceToScreenReader } from './screen-reader'

export interface AccessibilityErrorBoundaryState {
  hasError: boolean
  errorMessage?: string
  errorStack?: string
  errorId?: string
}

export interface AccessibilityErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableScreenReaderAnnouncement?: boolean
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

/**
 * Error boundary specifically designed for accessibility features
 * Provides graceful degradation when accessibility features fail
 */
export class AccessibilityErrorBoundary extends Component<
  AccessibilityErrorBoundaryProps,
  AccessibilityErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: AccessibilityErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false
    }
  }

  static getDerivedStateFromError(error: Error): AccessibilityErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
      errorStack: error.stack,
      errorId: `accessibility-error-${Date.now()}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('Accessibility Error Boundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Announce error to screen readers if enabled
    if (this.props.enableScreenReaderAnnouncement !== false) {
      try {
        announceToScreenReader(
          'Se ha producido un error en las funciones de accesibilidad. La funcionalidad básica sigue disponible.',
          'assertive'
        )
      } catch (announceError) {
        console.warn('Failed to announce accessibility error to screen reader:', announceError)
      }
    }

    // Auto-reset after 5 seconds to attempt recovery
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({ hasError: false, errorMessage: undefined, errorStack: undefined })
    }, 5000)
  }

  componentDidUpdate(prevProps: AccessibilityErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    // Reset error state when specified props change
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey
      )

      if (hasResetKeyChanged) {
        this.setState({
          hasError: false,
          errorMessage: undefined,
          errorStack: undefined
        })
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="accessibility-error-fallback"
          style={{
            padding: '1rem',
            border: '2px solid #dc2626',
            borderRadius: '0.375rem',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 'bold' }}>
            Error de Accesibilidad
          </h3>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            Se ha producido un error en las funciones de accesibilidad. 
            La aplicación seguirá funcionando con funcionalidad básica.
          </p>
          <details style={{ marginTop: '0.5rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Detalles técnicos
            </summary>
            <pre style={{ 
              marginTop: '0.5rem', 
              padding: '0.5rem', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              overflow: 'auto'
            }}>
              {this.state.errorMessage}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ 
              hasError: false, 
              errorMessage: undefined, 
              errorStack: undefined 
            })}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
            aria-label="Reintentar funciones de accesibilidad"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for using accessibility error boundary
 */
export function useAccessibilityErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
    console.error('Accessibility error captured:', error)
  }, [])

  // Throw error to be caught by error boundary
  if (error) {
    throw error
  }

  return { captureError, resetError }
}

/**
 * Higher-order component for wrapping components with accessibility error boundary
 */
export function withAccessibilityErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<AccessibilityErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <AccessibilityErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </AccessibilityErrorBoundary>
  ))

  WrappedComponent.displayName = `withAccessibilityErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Safe execution wrapper for accessibility functions
 */
export function safeAccessibilityExecution<T extends (...args: any[]) => any>(
  fn: T,
  fallbackValue?: ReturnType<T>,
  onError?: (error: Error) => void
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args)
    } catch (error) {
      const accessibilityError = error instanceof Error 
        ? error 
        : new Error(`Accessibility function error: ${String(error)}`)

      console.warn('Accessibility function failed safely:', accessibilityError)
      
      onError?.(accessibilityError)

      // Try to announce error to screen readers
      try {
        announceToScreenReader(
          'Una función de accesibilidad no está disponible temporalmente.',
          'polite'
        )
      } catch (announceError) {
        console.warn('Failed to announce accessibility function error:', announceError)
      }

      return fallbackValue as ReturnType<T>
    }
  }) as T
}

/**
 * Create a safe version of an accessibility hook
 */
export function createSafeAccessibilityHook<T extends (...args: any[]) => any>(
  hook: T,
  fallbackValue: ReturnType<T>
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return hook(...args)
    } catch (error) {
      console.warn('Accessibility hook failed, using fallback:', error)
      
      // Announce hook failure to screen readers
      try {
        announceToScreenReader(
          'Algunas funciones de accesibilidad no están disponibles.',
          'polite'
        )
      } catch (announceError) {
        console.warn('Failed to announce hook failure:', announceError)
      }

      return fallbackValue
    }
  }) as T
}