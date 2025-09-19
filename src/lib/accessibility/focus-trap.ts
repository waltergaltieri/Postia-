'use client'

import * as React from 'react'
import { useRef, useEffect, useCallback } from 'react'
import { getFocusableElements, saveFocus, restoreFocus } from './keyboard-navigation'
import { useSafeBrowserEffect, safeBrowserExecution } from './ssr-utils'
import { safeAccessibilityExecution } from './error-utils'
import type { FocusTrapOptions, FocusTrapHookReturn, AccessibilityError } from './types'

/**
 * Enhanced hook for implementing focus trap functionality with error handling
 * Ensures keyboard navigation stays within the tour interface
 */
export function useFocusTrap(enabled: boolean = true, options: FocusTrapOptions = {}): FocusTrapHookReturn {
  const containerRef = useRef<HTMLElement | null>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  const [error, setError] = React.useState<AccessibilityError | null>(null)
  
  const {
    autoFocus = true,
    restoreFocus: shouldRestoreFocus = true,
    allowOutsideClick = false,
    onEscape,
    onActivate,
    onDeactivate
  } = options

  // Save the currently focused element when trap is enabled
  useSafeBrowserEffect(() => {
    if (enabled) {
      try {
        previouslyFocusedElement.current = saveFocus()
        onActivate?.()
      } catch (err) {
        const accessibilityError: AccessibilityError = {
          name: 'FocusTrapActivationError',
          message: 'Failed to activate focus trap',
          code: 'FOCUS_TRAP_ACTIVATION_FAILED',
          severity: 'medium',
          recoverable: true,
          context: { enabled, options }
        }
        setError(accessibilityError)
        console.warn('Focus trap activation failed:', err)
      }
    }
  }, [enabled])

  // Handle focus trap with comprehensive error handling
  useSafeBrowserEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current

    try {
      const focusableElements = getFocusableElements(container)

      // Auto-focus first element if enabled
      if (autoFocus && focusableElements.length > 0) {
        focusableElements[0].focus()
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        try {
          if (event.key === 'Escape' && onEscape) {
            onEscape()
            return
          }

          if (event.key !== 'Tab') return

          const currentFocusableElements = getFocusableElements(container)
          const firstElement = currentFocusableElements[0]
          const lastElement = currentFocusableElements[currentFocusableElements.length - 1]

          if (!firstElement || !lastElement) return

          if (event.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
              event.preventDefault()
              lastElement.focus()
            }
          } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
              event.preventDefault()
              firstElement.focus()
            }
          }
        } catch (error) {
          setError({
            name: 'FocusTrapKeyboardError',
            message: 'Keyboard handling in focus trap failed',
            code: 'FOCUS_TRAP_KEYBOARD_FAILED',
            severity: 'medium',
            recoverable: true,
            context: { container: container.tagName }
          })
        }
      }

      const handleFocusIn = (event: FocusEvent) => {
        try {
          if (!container.contains(event.target as Node)) {
            // Focus moved outside the container, bring it back
            const focusableElements = getFocusableElements(container)
            if (focusableElements.length > 0) {
              focusableElements[0].focus()
            }
          }
        } catch (error) {
          setError({
            name: 'FocusTrapFocusError',
            message: 'Focus management in focus trap failed',
            code: 'FOCUS_TRAP_FOCUS_FAILED',
            severity: 'medium',
            recoverable: true
          })
        }
      }

      const handleClick = (event: MouseEvent) => {
        try {
          if (!allowOutsideClick && !container.contains(event.target as Node)) {
            event.preventDefault()
            event.stopPropagation()
            
            // Return focus to container
            const focusableElements = getFocusableElements(container)
            if (focusableElements.length > 0) {
              focusableElements[0].focus()
            }
          }
        } catch (error) {
          setError({
            name: 'FocusTrapClickError',
            message: 'Click handling in focus trap failed',
            code: 'FOCUS_TRAP_CLICK_FAILED',
            severity: 'low',
            recoverable: true
          })
        }
      }

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('focusin', handleFocusIn)
      if (!allowOutsideClick) {
        document.addEventListener('click', handleClick, true)
      }

      return () => {
        try {
          document.removeEventListener('keydown', handleKeyDown)
          document.removeEventListener('focusin', handleFocusIn)
          if (!allowOutsideClick) {
            document.removeEventListener('click', handleClick, true)
          }
          onDeactivate?.()
        } catch (err) {
          console.warn('Focus trap cleanup failed:', err)
        }
      }
    } catch (err) {
      const accessibilityError: AccessibilityError = {
        name: 'FocusTrapSetupError',
        message: 'Failed to setup focus trap',
        code: 'FOCUS_TRAP_SETUP_FAILED',
        severity: 'high',
        recoverable: true,
        context: { container: container.tagName }
      }
      setError(accessibilityError)
      console.error('Focus trap setup failed:', err)
    }
  }, [enabled, autoFocus, allowOutsideClick, onEscape])

  // Restore focus when trap is disabled
  useSafeBrowserEffect(() => {
    return () => {
      if (shouldRestoreFocus && previouslyFocusedElement.current) {
        try {
          restoreFocus(previouslyFocusedElement.current)
        } catch (err) {
          console.warn('Focus restoration failed:', err)
        }
      }
    }
  }, [shouldRestoreFocus])

  return {
    containerRef,
    isActive: enabled,
    error
  }
}

/**
 * Focus trap manager for handling multiple focus traps
 */
export class FocusTrapManager {
  private static instance: FocusTrapManager
  private traps: Set<HTMLElement> = new Set()
  private activeTraps: HTMLElement[] = []

  static getInstance(): FocusTrapManager {
    if (!FocusTrapManager.instance) {
      FocusTrapManager.instance = new FocusTrapManager()
    }
    return FocusTrapManager.instance
  }

  addTrap(element: HTMLElement): void {
    this.traps.add(element)
    this.activeTraps.push(element)
    this.updateFocusTrap()
  }

  removeTrap(element: HTMLElement): void {
    this.traps.delete(element)
    const index = this.activeTraps.indexOf(element)
    if (index > -1) {
      this.activeTraps.splice(index, 1)
    }
    this.updateFocusTrap()
  }

  private updateFocusTrap(): void {
    // Only the most recent trap should be active
    const activeTrap = this.activeTraps[this.activeTraps.length - 1]
    
    if (activeTrap) {
      const focusableElements = getFocusableElements(activeTrap)
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }
  }

  getActiveTrap(): HTMLElement | null {
    return this.activeTraps[this.activeTraps.length - 1] || null
  }

  hasActiveTraps(): boolean {
    return this.activeTraps.length > 0
  }
}

/**
 * Create a focus trap for a specific element
 */
export function createFocusTrap(
  element: HTMLElement,
  options: FocusTrapOptions = {}
): () => void {
  const manager = FocusTrapManager.getInstance()
  const previouslyFocused = saveFocus()

  // Add trap
  manager.addTrap(element)

  // Auto-focus if enabled
  if (options.autoFocus !== false) {
    const focusableElements = getFocusableElements(element)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }

  // Return cleanup function
  return () => {
    manager.removeTrap(element)
    
    // Restore focus if enabled
    if (options.restoreFocus !== false && previouslyFocused) {
      restoreFocus(previouslyFocused)
    }
  }
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const savedFocus = useRef<HTMLElement | null>(null)

  const saveFocusedElement = useCallback(() => {
    savedFocus.current = saveFocus()
  }, [])

  const restoreFocusedElement = useCallback(() => {
    if (savedFocus.current) {
      restoreFocus(savedFocus.current)
      savedFocus.current = null
    }
  }, [])

  return {
    saveFocusedElement,
    restoreFocusedElement
  }
}

/**
 * Trap focus within a specific element
 * @param element - Element to trap focus within
 * @returns Cleanup function to remove the focus trap
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)
  firstElement?.focus()

  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Hook for accessible focus management
 * @param autoFocus - Whether to auto-focus the element
 * @returns Ref to attach to the focusable element
 */
export function useAccessibleFocus(autoFocus: boolean = false) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
    }
  }, [autoFocus])

  return ref
}

/**
 * Hook for focus trap with simplified API
 * @param isActive - Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrapSimple(isActive: boolean = true) {
  const ref = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !ref.current) return

    previousFocusRef.current = document.activeElement as HTMLElement
    const cleanup = trapFocus(ref.current)

    return () => {
      cleanup()
      restoreFocus(previousFocusRef.current)
    }
  }, [isActive])

  return ref
}