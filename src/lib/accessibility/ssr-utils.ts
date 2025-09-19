'use client'

import * as React from 'react'
import { useEffect, useState, useCallback } from 'react'
import type { AccessibilityError, SafeExecutionResult } from './types'

/**
 * Check if we're running in a server-side rendering environment
 */
export function isSSR(): boolean {
  return typeof window === 'undefined'
}

/**
 * Check if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Safe window access that handles SSR scenarios
 */
export function safeWindow<T>(
  callback: (window: Window) => T,
  fallback?: T
): T | undefined {
  if (isSSR()) {
    return fallback
  }

  try {
    return callback(window)
  } catch (error) {
    console.warn('Safe window access failed:', error)
    return fallback
  }
}

/**
 * Safe document access that handles SSR scenarios
 */
export function safeDocument<T>(
  callback: (document: Document) => T,
  fallback?: T
): T | undefined {
  if (isSSR()) {
    return fallback
  }

  try {
    return callback(document)
  } catch (error) {
    console.warn('Safe document access failed:', error)
    return fallback
  }
}

/**
 * Safe media query access that handles SSR scenarios
 */
export function safeMatchMedia(
  query: string,
  fallback: boolean = false
): boolean {
  return safeWindow(
    (window) => window.matchMedia(query).matches,
    fallback
  ) ?? fallback
}

/**
 * Hook for detecting hydration state
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Hook for SSR-safe state initialization
 */
export function useSSRSafeState<T>(
  initialValue: T,
  serverValue?: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(isSSR() ? (serverValue ?? initialValue) : initialValue)
  const isHydrated = useIsHydrated()

  // Update state after hydration if server and client values differ
  useEffect(() => {
    if (isHydrated && serverValue !== undefined && serverValue !== initialValue) {
      setState(initialValue)
    }
  }, [isHydrated, initialValue, serverValue])

  return [state, setState]
}

/**
 * Hook for SSR-safe media query detection
 */
export function useSSRSafeMediaQuery(
  query: string,
  fallback: boolean = false
): { matches: boolean; isLoading: boolean; error: AccessibilityError | null } {
  const [matches, setMatches] = useSSRSafeState(fallback, fallback)
  const [isLoading, setIsLoading] = useState(!isBrowser())
  const [error, setError] = useState<AccessibilityError | null>(null)
  const isHydrated = useIsHydrated()

  useEffect(() => {
    if (!isHydrated) return

    try {
      const mediaQuery = window.matchMedia(query)
      setMatches(mediaQuery.matches)
      setIsLoading(false)
      setError(null)

      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches)
      }

      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    } catch (err) {
      const accessibilityError: AccessibilityError = {
        name: 'MediaQueryError',
        message: `Failed to setup media query: ${query}`,
        code: 'MEDIA_QUERY_FAILED',
        severity: 'medium',
        recoverable: true,
        context: { query },
        stack: err instanceof Error ? err.stack : undefined
      }

      setError(accessibilityError)
      setIsLoading(false)
      console.warn('Media query setup failed:', accessibilityError)
    }
  }, [query, isHydrated])

  return { matches, isLoading, error }
}

/**
 * Safe execution wrapper for browser-only functions
 */
export function safeBrowserExecution<T>(
  fn: () => T,
  fallback?: T,
  onError?: (error: AccessibilityError) => void
): SafeExecutionResult<T> {
  if (isSSR()) {
    return {
      success: false,
      data: fallback,
      error: {
        name: 'SSRError',
        message: 'Function cannot be executed during server-side rendering',
        code: 'SSR_EXECUTION',
        severity: 'low',
        recoverable: true
      }
    }
  }

  try {
    const result = fn()
    return {
      success: true,
      data: result
    }
  } catch (err) {
    const error: AccessibilityError = {
      name: 'BrowserExecutionError',
      message: err instanceof Error ? err.message : 'Unknown browser execution error',
      code: 'BROWSER_EXECUTION_FAILED',
      severity: 'medium',
      recoverable: true,
      stack: err instanceof Error ? err.stack : undefined
    }

    onError?.(error)
    
    return {
      success: false,
      data: fallback,
      error
    }
  }
}

/**
 * Hook for safe browser-only effects
 */
export function useSafeBrowserEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const isHydrated = useIsHydrated()

  useEffect(() => {
    if (!isHydrated) return

    try {
      return effect()
    } catch (error) {
      console.warn('Browser effect failed safely:', error)
    }
  }, [isHydrated, ...(deps || [])])
}

/**
 * Hook for delayed execution after hydration
 */
export function useDelayedExecution(
  callback: () => void,
  delay: number = 0,
  deps: React.DependencyList = []
): void {
  const isHydrated = useIsHydrated()

  useEffect(() => {
    if (!isHydrated) return

    const timeoutId = setTimeout(() => {
      try {
        callback()
      } catch (error) {
        console.warn('Delayed execution failed:', error)
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [isHydrated, delay, ...deps])
}

/**
 * Safe localStorage access
 */
export function safeLocalStorage() {
  const getItem = useCallback((key: string, fallback?: string): string | null => {
    return safeBrowserExecution(
      () => localStorage.getItem(key),
      fallback || null
    ).data
  }, [])

  const setItem = useCallback((key: string, value: string): boolean => {
    return safeBrowserExecution(
      () => {
        localStorage.setItem(key, value)
        return true
      },
      false
    ).success
  }, [])

  const removeItem = useCallback((key: string): boolean => {
    return safeBrowserExecution(
      () => {
        localStorage.removeItem(key)
        return true
      },
      false
    ).success
  }, [])

  return { getItem, setItem, removeItem }
}

/**
 * Safe sessionStorage access
 */
export function safeSessionStorage() {
  const getItem = useCallback((key: string, fallback?: string): string | null => {
    return safeBrowserExecution(
      () => sessionStorage.getItem(key),
      fallback || null
    ).data
  }, [])

  const setItem = useCallback((key: string, value: string): boolean => {
    return safeBrowserExecution(
      () => {
        sessionStorage.setItem(key, value)
        return true
      },
      false
    ).success
  }, [])

  const removeItem = useCallback((key: string): boolean => {
    return safeBrowserExecution(
      () => {
        sessionStorage.removeItem(key)
        return true
      },
      false
    ).success
  }, [])

  return { getItem, setItem, removeItem }
}

/**
 * Hook for SSR-safe event listeners
 */
export function useSSRSafeEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Element | Window | null,
  options?: boolean | AddEventListenerOptions
): void {
  const isHydrated = useIsHydrated()

  useEffect(() => {
    if (!isHydrated) return

    const targetElement = element || window

    if (!targetElement || !targetElement.addEventListener) {
      return
    }

    try {
      targetElement.addEventListener(eventName, handler as EventListener, options)

      return () => {
        targetElement.removeEventListener(eventName, handler as EventListener, options)
      }
    } catch (error) {
      console.warn(`Failed to add event listener for ${eventName}:`, error)
    }
  }, [eventName, handler, element, options, isHydrated])
}

/**
 * Create SSR-safe version of any hook
 */
export function createSSRSafeHook<T extends (...args: any[]) => any>(
  hook: T,
  fallbackValue: ReturnType<T>
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const isHydrated = useIsHydrated()
    const [result, setResult] = useState<ReturnType<T>>(fallbackValue)

    useEffect(() => {
      if (!isHydrated) return

      try {
        const hookResult = hook(...args)
        setResult(hookResult)
      } catch (error) {
        console.warn('SSR-safe hook execution failed:', error)
        setResult(fallbackValue)
      }
    }, [isHydrated, ...args])

    return isHydrated ? result : fallbackValue
  }) as T
}

/**
 * Debounced SSR-safe function execution
 */
export function useSSRSafeDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const isHydrated = useIsHydrated()
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (!isHydrated) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      try {
        callback(...args)
      } catch (error) {
        console.warn('Debounced callback failed:', error)
      }
    }, delay)
  }, [callback, delay, isHydrated])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback as T
}

/**
 * SSR-safe intersection observer
 */
export function useSSRSafeIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): {
  observe: (element: Element) => void
  unobserve: (element: Element) => void
  disconnect: () => void
  isSupported: boolean
} {
  const isHydrated = useIsHydrated()
  const observerRef = React.useRef<IntersectionObserver | null>(null)

  const isSupported = isHydrated && 'IntersectionObserver' in window

  useEffect(() => {
    if (!isSupported) return

    try {
      observerRef.current = new IntersectionObserver(callback, options)
    } catch (error) {
      console.warn('Failed to create IntersectionObserver:', error)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [callback, options, isSupported])

  const observe = useCallback((element: Element) => {
    if (observerRef.current && isSupported) {
      try {
        observerRef.current.observe(element)
      } catch (error) {
        console.warn('Failed to observe element:', error)
      }
    }
  }, [isSupported])

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current && isSupported) {
      try {
        observerRef.current.unobserve(element)
      } catch (error) {
        console.warn('Failed to unobserve element:', error)
      }
    }
  }, [isSupported])

  const disconnect = useCallback(() => {
    if (observerRef.current && isSupported) {
      try {
        observerRef.current.disconnect()
      } catch (error) {
        console.warn('Failed to disconnect observer:', error)
      }
    }
  }, [isSupported])

  return { observe, unobserve, disconnect, isSupported }
}