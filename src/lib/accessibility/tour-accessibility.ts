'use client'

import { useEffect, useRef, useCallback } from 'react'
import { 
  announceToScreenReader, 
  useTourProgressAnnouncements,
  createAriaAttributes,
  generateScreenReaderDescription 
} from './screen-reader'
import { useFocusTrap } from './focus-trap'
import { saveFocus, restoreFocus } from './keyboard-navigation'
import { useKeyboardNavigation } from './keyboard-navigation'
import { useReducedMotion } from './reduced-motion'
import { useHighContrast, highContrastClasses } from './high-contrast'

export interface TourAccessibilityOptions {
  enableFocusTrap?: boolean
  enableKeyboardNavigation?: boolean
  enableScreenReaderSupport?: boolean
  enableHighContrastMode?: boolean
  autoAnnounceSteps?: boolean
  restoreFocusOnExit?: boolean
}

/**
 * Comprehensive accessibility manager for tour components
 */
export function useTourAccessibility(
  isActive: boolean,
  currentStep: number,
  totalSteps: number,
  options: TourAccessibilityOptions = {}
) {
  const {
    enableFocusTrap = true,
    enableKeyboardNavigation = true,
    enableScreenReaderSupport = true,
    enableHighContrastMode = true,
    autoAnnounceSteps = true,
    restoreFocusOnExit = true
  } = options

  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  const tourContainerRef = useRef<HTMLElement | null>(null)
  
  // Accessibility hooks
  const prefersReducedMotion = useReducedMotion()
  const prefersHighContrast = useHighContrast()
  const focusTrapRef = useFocusTrap(isActive && enableFocusTrap)
  const {
    announceStepChange,
    announceTourComplete,
    announceTourSkipped,
    announceKeyboardShortcuts
  } = useTourProgressAnnouncements()

  // Save focus when tour starts
  useEffect(() => {
    if (isActive && restoreFocusOnExit) {
      previouslyFocusedElement.current = saveFocus()
    }
  }, [isActive, restoreFocusOnExit])

  // Restore focus when tour ends
  useEffect(() => {
    return () => {
      if (restoreFocusOnExit && previouslyFocusedElement.current) {
        restoreFocus(previouslyFocusedElement.current)
      }
    }
  }, [restoreFocusOnExit])

  // Announce step changes
  useEffect(() => {
    if (isActive && autoAnnounceSteps && enableScreenReaderSupport && currentStep > 0) {
      const stepTitle = `Paso ${currentStep} de ${totalSteps}`
      announceStepChange(currentStep - 1, totalSteps, stepTitle, 'next')
    }
  }, [currentStep, totalSteps, isActive, autoAnnounceSteps, enableScreenReaderSupport, announceStepChange])

  // Keyboard navigation handler
  const createKeyboardHandler = useCallback((callbacks: {
    onNext?: () => void
    onPrevious?: () => void
    onClose?: () => void
    onSkip?: () => void
    onRestart?: () => void
    onHelp?: () => void
  }) => {
    if (!enableKeyboardNavigation) {
      return () => {}
    }

    return useKeyboardNavigation({
      onArrowRight: callbacks.onNext,
      onArrowLeft: callbacks.onPrevious,
      onEscape: callbacks.onClose,
      onEnd: callbacks.onSkip,
      onHome: callbacks.onRestart,
      onEnter: callbacks.onNext,
      enabled: isActive
    })
  }, [enableKeyboardNavigation, isActive])

  // Create ARIA attributes for tour elements
  const createTourAriaAttributes = useCallback((
    stepIndex: number,
    title: string,
    description: string
  ) => {
    if (!enableScreenReaderSupport) {
      return {}
    }

    return createAriaAttributes(stepIndex, totalSteps, title, description)
  }, [enableScreenReaderSupport, totalSteps])

  // Generate screen reader description
  const createScreenReaderDescription = useCallback((
    title: string,
    description: string,
    stepIndex: number,
    hasNext: boolean = true,
    hasPrevious: boolean = true
  ) => {
    if (!enableScreenReaderSupport) {
      return description
    }

    return generateScreenReaderDescription(
      title,
      description,
      stepIndex,
      totalSteps,
      hasNext,
      hasPrevious
    )
  }, [enableScreenReaderSupport, totalSteps])

  // Get accessibility classes
  const getAccessibilityClasses = useCallback(() => {
    const classes: string[] = []

    if (prefersHighContrast && enableHighContrastMode) {
      classes.push(highContrastClasses.enabled)
    }

    if (prefersReducedMotion) {
      classes.push('reduced-motion')
    }

    return classes.join(' ')
  }, [prefersHighContrast, prefersReducedMotion, enableHighContrastMode])

  // Announce tour completion
  const handleTourComplete = useCallback(() => {
    if (enableScreenReaderSupport) {
      announceTourComplete()
    }
  }, [enableScreenReaderSupport, announceTourComplete])

  // Announce tour skip
  const handleTourSkip = useCallback(() => {
    if (enableScreenReaderSupport) {
      announceTourSkipped()
    }
  }, [enableScreenReaderSupport, announceTourSkipped])

  // Announce keyboard shortcuts
  const handleAnnounceShortcuts = useCallback(() => {
    if (enableScreenReaderSupport) {
      announceKeyboardShortcuts()
    }
  }, [enableScreenReaderSupport, announceKeyboardShortcuts])

  // Create live region for announcements
  useEffect(() => {
    if (!isActive || !enableScreenReaderSupport) return

    const liveRegion = document.createElement('div')
    liveRegion.id = 'tour-live-region'
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    document.body.appendChild(liveRegion)

    return () => {
      const existingRegion = document.getElementById('tour-live-region')
      if (existingRegion) {
        document.body.removeChild(existingRegion)
      }
    }
  }, [isActive, enableScreenReaderSupport])

  return {
    // Refs
    focusTrapRef,
    tourContainerRef,
    
    // State
    prefersReducedMotion,
    prefersHighContrast,
    
    // Handlers
    createKeyboardHandler,
    createTourAriaAttributes,
    createScreenReaderDescription,
    handleTourComplete,
    handleTourSkip,
    handleAnnounceShortcuts,
    
    // Utilities
    getAccessibilityClasses,
    
    // Direct announcement functions
    announceStepChange,
    announceTourComplete,
    announceTourSkipped
  }
}

/**
 * Hook for managing focus during tour interactions
 */
export function useTourFocusManagement(isActive: boolean) {
  const previousFocus = useRef<HTMLElement | null>(null)
  const tourElements = useRef<HTMLElement[]>([])

  // Save focus when tour starts
  useEffect(() => {
    if (isActive) {
      previousFocus.current = document.activeElement as HTMLElement
    }
  }, [isActive])

  // Restore focus when tour ends
  useEffect(() => {
    return () => {
      if (previousFocus.current && document.contains(previousFocus.current)) {
        previousFocus.current.focus()
      }
    }
  }, [])

  const registerTourElement = useCallback((element: HTMLElement) => {
    if (!tourElements.current.includes(element)) {
      tourElements.current.push(element)
    }
  }, [])

  const unregisterTourElement = useCallback((element: HTMLElement) => {
    const index = tourElements.current.indexOf(element)
    if (index > -1) {
      tourElements.current.splice(index, 1)
    }
  }, [])

  const focusFirstTourElement = useCallback(() => {
    const firstElement = tourElements.current[0]
    if (firstElement) {
      firstElement.focus()
    }
  }, [])

  const focusLastTourElement = useCallback(() => {
    const lastElement = tourElements.current[tourElements.current.length - 1]
    if (lastElement) {
      lastElement.focus()
    }
  }, [])

  return {
    registerTourElement,
    unregisterTourElement,
    focusFirstTourElement,
    focusLastTourElement,
    tourElements: tourElements.current
  }
}

/**
 * Hook for managing tour keyboard shortcuts
 */
export function useTourKeyboardShortcuts(
  isActive: boolean,
  callbacks: {
    onNext?: () => void
    onPrevious?: () => void
    onClose?: () => void
    onSkip?: () => void
    onRestart?: () => void
    onHelp?: () => void
    onPlayPause?: () => void
  }
) {
  const handleKeyDown = useKeyboardNavigation({
    onArrowRight: callbacks.onNext,
    onArrowLeft: callbacks.onPrevious,
    onEscape: callbacks.onClose,
    onEnd: callbacks.onSkip,
    onHome: callbacks.onRestart,
    onSpace: callbacks.onPlayPause,
    enabled: isActive
  })

  useEffect(() => {
    if (!isActive) return

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, handleKeyDown])

  return { handleKeyDown }
}

/**
 * Create accessibility-compliant tour step configuration
 */
export function createAccessibleTourStep(
  element: string | HTMLElement,
  title: string,
  description: string,
  stepIndex: number,
  totalSteps: number,
  options: {
    customAriaLabel?: string
    customAriaDescription?: string
    announceOnFocus?: string
    keyboardShortcuts?: string[]
  } = {}
) {
  const {
    customAriaLabel,
    customAriaDescription,
    announceOnFocus,
    keyboardShortcuts = ['ArrowLeft', 'ArrowRight', 'Escape', 'Space', 'Home', 'End']
  } = options

  return {
    element,
    title,
    description,
    accessibility: {
      ariaLabel: customAriaLabel || `Paso ${stepIndex + 1} de ${totalSteps}: ${title}`,
      ariaDescription: customAriaDescription || generateScreenReaderDescription(
        title,
        description,
        stepIndex,
        totalSteps,
        stepIndex < totalSteps - 1,
        stepIndex > 0
      ),
      announceOnFocus: announceOnFocus || `Paso ${stepIndex + 1} de ${totalSteps}: ${title}`,
      keyboardShortcuts: keyboardShortcuts.join(' ')
    },
    onHighlight: () => {
      // Announce step to screen readers
      announceToScreenReader(
        announceOnFocus || `Paso ${stepIndex + 1} de ${totalSteps}: ${title}`,
        'assertive'
      )
    }
  }
}