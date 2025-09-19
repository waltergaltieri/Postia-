'use client'

import * as React from 'react'
import { useCallback, useEffect } from 'react'

export interface KeyboardNavigationOptions {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  onHome?: () => void
  onEnd?: () => void
  onPageUp?: () => void
  onPageDown?: () => void
  preventDefault?: boolean
  stopPropagation?: boolean
  enabled?: boolean
}

/**
 * Hook for comprehensive keyboard navigation support
 * Provides standardized keyboard shortcuts for tour navigation
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onSpace,
    onEscape,
    onTab,
    onShiftTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    preventDefault = true,
    stopPropagation = true,
    enabled = true
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    let handled = false

    switch (event.key) {
      case 'ArrowUp':
        if (onArrowUp) {
          onArrowUp()
          handled = true
        }
        break
      case 'ArrowDown':
        if (onArrowDown) {
          onArrowDown()
          handled = true
        }
        break
      case 'ArrowLeft':
        if (onArrowLeft) {
          onArrowLeft()
          handled = true
        }
        break
      case 'ArrowRight':
        if (onArrowRight) {
          onArrowRight()
          handled = true
        }
        break
      case 'Enter':
        if (onEnter) {
          onEnter()
          handled = true
        }
        break
      case ' ':
        if (onSpace) {
          onSpace()
          handled = true
        }
        break
      case 'Escape':
        if (onEscape) {
          onEscape()
          handled = true
        }
        break
      case 'Tab':
        if (event.shiftKey && onShiftTab) {
          onShiftTab()
          handled = true
        } else if (!event.shiftKey && onTab) {
          onTab()
          handled = true
        }
        break
      case 'Home':
        if (onHome) {
          onHome()
          handled = true
        }
        break
      case 'End':
        if (onEnd) {
          onEnd()
          handled = true
        }
        break
      case 'PageUp':
        if (onPageUp) {
          onPageUp()
          handled = true
        }
        break
      case 'PageDown':
        if (onPageDown) {
          onPageDown()
          handled = true
        }
        break
    }

    if (handled) {
      if (preventDefault) {
        event.preventDefault()
      }
      if (stopPropagation) {
        event.stopPropagation()
      }
    }
  }, [
    enabled,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onSpace,
    onEscape,
    onTab,
    onShiftTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    preventDefault,
    stopPropagation
  ])

  return handleKeyDown
}

/**
 * Hook for managing keyboard shortcuts with visual indicators
 */
export function useKeyboardShortcuts() {
  const shortcuts = {
    navigation: [
      { key: '←', description: 'Paso anterior' },
      { key: '→', description: 'Siguiente paso' },
      { key: 'Esc', description: 'Cerrar tour' },
      { key: 'Space', description: 'Pausar/Reanudar' },
      { key: 'Home', description: 'Reiniciar tour' },
      { key: 'End', description: 'Omitir tour' }
    ],
    accessibility: [
      { key: 'Tab', description: 'Navegar controles' },
      { key: 'Enter', description: 'Activar control' },
      { key: 'Shift+Tab', description: 'Navegar atrás' }
    ]
  }

  const getShortcutText = useCallback((shortcutList: Array<{ key: string; description: string }>) => {
    return shortcutList.map(s => `${s.key}: ${s.description}`).join(', ')
  }, [])

  return {
    shortcuts,
    getShortcutText
  }
}

/**
 * Utility to check if an element is focusable
 */
export function isFocusable(element: Element): boolean {
  if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
    return false
  }

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ]

  return focusableSelectors.some(selector => element.matches(selector))
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: Element): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter(element => {
      // Check if element is visible
      const style = window.getComputedStyle(element)
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0'
    }) as HTMLElement[]
}

/**
 * Move focus to the next/previous focusable element
 */
export function moveFocus(
  container: Element, 
  direction: 'next' | 'previous' = 'next'
): boolean {
  const focusableElements = getFocusableElements(container)
  const currentIndex = focusableElements.findIndex(el => el === document.activeElement)
  
  if (focusableElements.length === 0) return false

  let nextIndex: number
  if (direction === 'next') {
    nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
  } else {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
  }

  focusableElements[nextIndex]?.focus()
  return true
}

/**
 * Restore focus to a previously focused element
 */
export function restoreFocus(element: HTMLElement | null) {
  if (element && document.contains(element)) {
    element.focus()
    return true
  }
  return false
}

/**
 * Save the currently focused element for later restoration
 */
export function saveFocus(): HTMLElement | null {
  return document.activeElement as HTMLElement | null
}

/**
 * Create keyboard event handler with multiple key bindings
 * @param handlers - Object mapping keys to handler functions
 * @returns Keyboard event handler function
 */
export function createKeyboardHandler(handlers: {
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onHome?: () => void
  onEnd?: () => void
}) {
  return (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        handlers.onEnter?.()
        break
      case ' ':
        event.preventDefault()
        handlers.onSpace?.()
        break
      case 'Escape':
        event.preventDefault()
        handlers.onEscape?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        handlers.onArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        handlers.onArrowDown?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        handlers.onArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        handlers.onArrowRight?.()
        break
      case 'Tab':
        handlers.onTab?.()
        break
      case 'Home':
        event.preventDefault()
        handlers.onHome?.()
        break
      case 'End':
        event.preventDefault()
        handlers.onEnd?.()
        break
    }
  }
}

/**
 * Hook for creating keyboard navigation handlers
 * @param handlers - Keyboard handler configuration
 * @returns Memoized keyboard event handler
 */
export function useKeyboardNavigationHandler(handlers: Parameters<typeof createKeyboardHandler>[0]) {
  return React.useCallback(createKeyboardHandler(handlers), [handlers])
}

/**
 * Legacy hook for keyboard navigation (for backward compatibility)
 * @param handlers - Keyboard handler configuration
 * @returns Memoized keyboard event handler
 * @deprecated Use useKeyboardNavigationHandler instead
 */
export function useKeyboardNavigationLegacy(handlers: Parameters<typeof createKeyboardHandler>[0]) {
  return React.useCallback(createKeyboardHandler(handlers), [handlers])
}