'use client'

import { useRef, useEffect, useCallback } from 'react'
import { getFocusableElements, saveFocus, restoreFocus } from './keyboard-navigation'

export interface FocusTrapOptions {
  enabled?: boolean
  autoFocus?: boolean
  restoreFocus?: boolean
  allowOutsideClick?: boolean
  onEscape?: () => void
}

/**
 * Hook for implementing focus trap functionality
 * Ensures keyboard navigation stays within the tour interface
 */
export function useFocusTrap(enabled: boolean = true, options: FocusTrapOptions = {}) {
  const containerRef = useRef<HTMLElement | null>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  const {
    autoFocus = true,
    restoreFocus: shouldRestoreFocus = true,
    allowOutsideClick = false,
    onEscape
  } = options

  // Save the currently focused element when trap is enabled
  useEffect(() => {
    if (enabled) {
      previouslyFocusedElement.current = saveFocus()
    }
  }, [enabled])

  // Handle focus trap
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = getFocusableElements(container)

    // Auto-focus first element if enabled
    if (autoFocus && focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
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
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        // Focus moved outside the container, bring it back
        const focusableElements = getFocusableElements(container)
        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!allowOutsideClick && !container.contains(event.target as Node)) {
        event.preventDefault()
        event.stopPropagation()
        
        // Return focus to container
        const focusableElements = getFocusableElements(container)
        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    if (!allowOutsideClick) {
      document.addEventListener('click', handleClick, true)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      if (!allowOutsideClick) {
        document.removeEventListener('click', handleClick, true)
      }
    }
  }, [enabled, autoFocus, allowOutsideClick, onEscape])

  // Restore focus when trap is disabled
  useEffect(() => {
    return () => {
      if (shouldRestoreFocus && previouslyFocusedElement.current) {
        restoreFocus(previouslyFocusedElement.current)
      }
    }
  }, [shouldRestoreFocus])

  return containerRef
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