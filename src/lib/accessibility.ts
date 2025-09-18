"use client"

import * as React from "react"

// WCAG 2.1 AA Compliance Utilities

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

export function meetsWCAGContrast(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background)
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7
  }
  
  return size === 'large' ? ratio >= 3 : ratio >= 4.5
}

// Keyboard navigation utilities
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

// Focus management utilities
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

export function restoreFocus(previousElement: HTMLElement | null) {
  if (previousElement && document.contains(previousElement)) {
    previousElement.focus()
  }
}

// ARIA utilities
export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Screen reader utilities
export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: '0'
}

// Reduced motion utilities
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// High contrast utilities
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Touch target utilities
export function meetsTouchTargetSize(width: number, height: number): boolean {
  // WCAG 2.1 AA requires minimum 44x44px touch targets
  return width >= 44 && height >= 44
}

// Hooks for accessibility
export function useAccessibleFocus(autoFocus: boolean = false) {
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
    }
  }, [autoFocus])

  return ref
}

export function useKeyboardNavigation(handlers: Parameters<typeof createKeyboardHandler>[0]) {
  return React.useCallback(createKeyboardHandler(handlers), [handlers])
}

export function useAnnouncement() {
  return React.useCallback(announceToScreenReader, [])
}

export function useFocusTrap(isActive: boolean = true) {
  const ref = React.useRef<HTMLElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
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

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReduced
}

export function useHighContrast() {
  const [prefersHigh, setPrefersHigh] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHigh(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHigh(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHigh
}

// Accessibility testing utilities
export function auditAccessibility(element: HTMLElement): {
  issues: Array<{
    type: string
    severity: 'error' | 'warning'
    message: string
    element: HTMLElement
  }>
  score: number
} {
  const issues: Array<{
    type: string
    severity: 'error' | 'warning'
    message: string
    element: HTMLElement
  }> = []

  // Check for missing alt text on images
  const images = element.querySelectorAll('img')
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push({
        type: 'missing-alt-text',
        severity: 'error',
        message: 'Image missing alt text or aria-label',
        element: img
      })
    }
  })

  // Check for missing form labels
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') ||
                    element.querySelector(`label[for="${input.id}"]`)
    
    if (!hasLabel) {
      issues.push({
        type: 'missing-form-label',
        severity: 'error',
        message: 'Form control missing label',
        element: input as HTMLElement
      })
    }
  })

  // Check for proper heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let lastLevel = 0
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    if (level > lastLevel + 1) {
      issues.push({
        type: 'heading-hierarchy',
        severity: 'warning',
        message: `Heading level ${level} follows level ${lastLevel}, skipping levels`,
        element: heading as HTMLElement
      })
    }
    lastLevel = level
  })

  // Check for interactive elements without proper roles
  const interactiveElements = element.querySelectorAll('[onclick], [onkeydown]')
  interactiveElements.forEach(el => {
    const hasRole = el.getAttribute('role')
    const isButton = el.tagName === 'BUTTON'
    const isLink = el.tagName === 'A'
    
    if (!hasRole && !isButton && !isLink) {
      issues.push({
        type: 'missing-role',
        severity: 'warning',
        message: 'Interactive element missing proper role',
        element: el as HTMLElement
      })
    }
  })

  // Calculate accessibility score
  const totalChecks = images.length + inputs.length + headings.length + interactiveElements.length
  const errorCount = issues.filter(issue => issue.severity === 'error').length
  const warningCount = issues.filter(issue => issue.severity === 'warning').length
  
  const score = totalChecks > 0 
    ? Math.max(0, 100 - (errorCount * 10) - (warningCount * 5))
    : 100

  return { issues, score }
}

// Color palette accessibility checker
export function checkColorPaletteAccessibility(colors: {
  primary: string
  secondary: string
  background: string
  foreground: string
  muted: string
  accent: string
}): {
  compliant: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check primary text on background
  if (!meetsWCAGContrast(colors.foreground, colors.background)) {
    issues.push('Primary text does not meet WCAG AA contrast requirements')
    suggestions.push('Increase contrast between foreground and background colors')
  }

  // Check primary button contrast
  if (!meetsWCAGContrast('#ffffff', colors.primary)) {
    issues.push('Primary button text may not be readable')
    suggestions.push('Consider using darker primary color or different text color')
  }

  // Check muted text contrast
  if (!meetsWCAGContrast(colors.muted, colors.background)) {
    issues.push('Muted text does not meet WCAG AA contrast requirements')
    suggestions.push('Increase contrast for muted text elements')
  }

  return {
    compliant: issues.length === 0,
    issues,
    suggestions
  }
}