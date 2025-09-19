'use client'

import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { driver, DriveStep, Config as DriverConfig } from 'driver.js'
import { useTheme } from '@/components/theme-provider'
import { useNavigation } from '@/components/navigation/navigation-context'
import { themeConfig } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { 
  useReducedMotion, 
  useHighContrast, 
  injectHighContrastCSS,
  highContrastClasses,
  createMotionSafeScrollBehavior 
} from '@/lib/accessibility'
import { useTourBranding } from '@/hooks/use-tour-branding'
import { applyBrandingStyles, removeBrandingStyles } from '@/lib/tour/client-branding-integration'
import { TourElementValidator, findTourElement } from '@/lib/tour/element-validator'
import type { 
  TourStep, 
  ClientBranding, 
  ThemedTourConfig
} from '@/types/tour'
import { TourError } from '@/types/tour'

// Import Driver.js CSS
import 'driver.js/dist/driver.css'

interface DriverWrapperProps {
  steps: TourStep[]
  isActive: boolean
  onStepChange?: (stepIndex: number) => void
  onComplete?: () => void
  onSkip?: () => void
  onError?: (error: TourError) => void
  config?: Partial<DriverConfig>
  className?: string
  clientBranding?: ClientBranding
}

export function DriverWrapper({
  steps,
  isActive,
  onStepChange,
  onComplete,
  onSkip,
  onError,
  config = {},
  className,
  clientBranding
}: DriverWrapperProps) {
  const { effectiveTheme } = useTheme()
  const { currentClient } = useNavigation()
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  const currentStepRef = useRef<number>(0)
  
  // Accessibility preferences
  const prefersReducedMotion = useReducedMotion()
  const prefersHighContrast = useHighContrast()
  
  // Tour branding integration
  const { 
    currentBranding, 
    updateBrandedContent, 
    getBrandedMessage 
  } = useTourBranding({
    autoApplyBranding: true,
    enableBrandedContent: true,
    enableBrandedMessages: true
  })

  // Generate themed CSS variables
  const themedStyles = useMemo(() => {
    // Use branding from hook or props, with fallback to current client
    const branding = currentBranding || clientBranding || (currentClient ? {
      primaryColor: currentClient.brandColors?.[0] || '#3b82f6',
      secondaryColor: currentClient.brandColors?.[1] || '#64748b',
      accentColor: currentClient.brandColors?.[2] || '#06b6d4',
      brandName: currentClient.brandName,
      logoUrl: currentClient.logoUrl
    } : null)

    const isDark = effectiveTheme === 'dark'

    // Base theme variables
    const baseStyles = {
      // Base colors
      '--driver-z-index': '10000',
      '--driver-text-color': isDark ? '#f8fafc' : '#1e293b',
      '--driver-bg-color': isDark ? '#1e293b' : '#ffffff',
      '--driver-border-color': isDark ? '#334155' : '#e2e8f0',
      
      // Primary colors (use client branding if available)
      '--driver-primary-color': branding?.primaryColor || (isDark ? '#3b82f6' : '#2563eb'),
      '--driver-accent-color': branding?.accentColor || (isDark ? '#06b6d4' : '#0891b2'),
      
      // Overlay
      '--driver-overlay-color': isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
      '--driver-overlay-opacity': '0.7',
      
      // Popover styling
      '--driver-popover-bg': isDark ? '#1e293b' : '#ffffff',
      '--driver-popover-border': isDark ? '#475569' : '#d1d5db',
      '--driver-popover-shadow': isDark 
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '--driver-popover-border-radius': '12px',
      '--driver-popover-arrow-size': '8px',
      
      // Button styling
      '--driver-btn-bg': branding?.primaryColor || (isDark ? '#3b82f6' : '#2563eb'),
      '--driver-btn-text': '#ffffff',
      '--driver-btn-hover-bg': branding?.accentColor || (isDark ? '#2563eb' : '#1d4ed8'),
      '--driver-btn-border-radius': '8px',
      
      // Close button
      '--driver-close-btn-bg': isDark ? '#374151' : '#f3f4f6',
      '--driver-close-btn-hover-bg': isDark ? '#4b5563' : '#e5e7eb',
      
      // Progress indicator
      '--driver-progress-bg': isDark ? '#374151' : '#e5e7eb',
      '--driver-progress-fill': branding?.primaryColor || (isDark ? '#3b82f6' : '#2563eb'),
      
      // Animation duration (respect reduced motion)
      '--driver-transition-duration': prefersReducedMotion ? '0ms' : '200ms',
      '--driver-animation-duration': prefersReducedMotion ? '0ms' : '300ms'
    }

    // High contrast overrides
    const highContrastOverrides = prefersHighContrast ? {
      '--driver-border-color': isDark ? '#ffffff' : '#000000',
      '--driver-text-color': isDark ? '#ffffff' : '#000000',
      '--driver-overlay-opacity': '0.95',
      '--driver-popover-border': isDark ? '#ffffff' : '#000000',
      '--driver-border-width': '2px',
      '--driver-focus-outline': `3px solid ${isDark ? '#ffff00' : '#0000ff'}`,
      '--driver-focus-outline-offset': '2px'
    } : {}

    return {
      ...baseStyles,
      ...highContrastOverrides
    } as React.CSSProperties
  }, [effectiveTheme, clientBranding, currentClient, currentBranding, prefersReducedMotion, prefersHighContrast])

  // Convert TourStep to DriveStep
  const convertSteps = useCallback((tourSteps: TourStep[]): DriveStep[] => {
    return tourSteps.map((step, index) => ({
      element: typeof step.element === 'string' ? 
        TourElementValidator.generateFallbackSelectors(step.element).join(', ') : 
        step.element,
      popover: {
        title: updateBrandedContent(step.title || ''),
        description: updateBrandedContent(step.description || ''),
        side: step.position || 'auto',
        align: 'start',
        showButtons: step.showButtons !== false ? ['next', 'previous', 'close'] : [],
        showProgress: step.showProgress !== false,
        progressText: `{{current}} de {{total}}`,
        nextBtnText: index === tourSteps.length - 1 ? 
          (getBrandedMessage('completion') || 'Finalizar') : 
          'Siguiente',
        prevBtnText: 'Anterior',
        closeBtnText: getBrandedMessage('skip') || 'Saltar tour',
        className: cn(
          'driver-popover-themed',
          step.customComponent && 'driver-popover-custom',
          className
        ),
        onNextClick: () => {
          currentStepRef.current = index + 1
          onStepChange?.(index + 1)
          step.onHighlight?.()
        },
        onPrevClick: () => {
          currentStepRef.current = index - 1
          onStepChange?.(index - 1)
        },
        onCloseClick: () => {
          onSkip?.()
        }
      },
      onHighlight: (element) => {
        currentStepRef.current = index
        onStepChange?.(index)
        
        // Add accessibility attributes
        if (element) {
          element.setAttribute('aria-describedby', `driver-popover-description-${index}`)
          element.setAttribute('aria-expanded', 'true')
        }
        
        // Announce to screen readers
        const announcement = step.accessibility?.announceOnFocus || 
          `Paso ${index + 1} de ${tourSteps.length}: ${step.title}`
        
        // Create live region for screen reader announcements
        const liveRegion = document.createElement('div')
        liveRegion.setAttribute('aria-live', 'polite')
        liveRegion.setAttribute('aria-atomic', 'true')
        liveRegion.className = 'sr-only'
        liveRegion.textContent = announcement
        document.body.appendChild(liveRegion)
        
        // Remove after announcement
        setTimeout(() => {
          document.body.removeChild(liveRegion)
        }, 1000)
        
        // Execute custom highlight callback
        step.onHighlight?.()
      },
      onDeselect: (element) => {
        // Remove accessibility attributes
        if (element) {
          element.removeAttribute('aria-describedby')
          element.removeAttribute('aria-expanded')
        }
        
        step.onDeselect?.()
      }
    }))
  }, [onStepChange, onSkip, className, updateBrandedContent, getBrandedMessage])

  // Create driver configuration
  const driverConfig = useMemo((): DriverConfig => ({
    animate: !prefersReducedMotion,
    allowClose: true,
    allowKeyboardControl: true,
    disableActiveInteraction: false,
    showProgress: true,
    stagePadding: prefersHighContrast ? 6 : 4,
    stageRadius: prefersHighContrast ? 12 : 8,
    smoothScroll: !prefersReducedMotion,
    
    // Popover configuration
    popoverClass: cn(
      'driver-popover-themed',
      effectiveTheme === 'dark' && 'driver-popover-dark',
      prefersHighContrast && 'driver-popover-high-contrast',
      prefersReducedMotion && 'driver-popover-reduced-motion',
      className
    ),
    
    // Overlay configuration
    overlayColor: effectiveTheme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    overlayOpacity: prefersHighContrast ? 0.95 : 0.7,
    
    // Callbacks
    onDestroyed: () => {
      onComplete?.()
    },
    
    onDestroyStarted: () => {
      // Cleanup accessibility attributes
      const highlightedElements = document.querySelectorAll('[aria-describedby^="driver-popover-description"]')
      highlightedElements.forEach(element => {
        element.removeAttribute('aria-describedby')
        element.removeAttribute('aria-expanded')
      })
    },
    
    onHighlightStarted: (element) => {
      // Ensure element is visible and focusable
      if (element) {
        element.scrollIntoView({ 
          behavior: createMotionSafeScrollBehavior(),
          block: 'center',
          inline: 'center'
        })
        
        // Add high contrast outline if needed
        if (prefersHighContrast) {
          element.style.outline = `3px solid ${effectiveTheme === 'dark' ? '#ffff00' : '#0000ff'}`
          element.style.outlineOffset = '2px'
        }
      }
    },
    
    onPopoverRender: (popover, { config, state }) => {
      // Add custom styling and accessibility attributes
      if (popover.wrapper) {
        popover.wrapper.setAttribute('role', 'dialog')
        popover.wrapper.setAttribute('aria-modal', 'true')
        popover.wrapper.setAttribute('aria-labelledby', 'driver-popover-title')
        popover.wrapper.setAttribute('aria-describedby', 'driver-popover-description')
        
        // Add keyboard navigation
        const handleKeyDown = (event: KeyboardEvent) => {
          switch (event.key) {
            case 'Escape':
              event.preventDefault()
              onSkip?.()
              break
            case 'ArrowRight':
            case 'ArrowDown':
              event.preventDefault()
              if (currentStepRef.current < steps.length - 1) {
                driverRef.current?.moveNext()
              }
              break
            case 'ArrowLeft':
            case 'ArrowUp':
              event.preventDefault()
              if (currentStepRef.current > 0) {
                driverRef.current?.movePrevious()
              }
              break
          }
        }
        
        popover.wrapper.addEventListener('keydown', handleKeyDown)
        
        // Focus management
        const focusableElements = popover.wrapper.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus()
        }
      }
      
      // Add progress indicator if enabled
      if (config.showProgress && popover.description) {
        const progressContainer = document.createElement('div')
        progressContainer.className = 'driver-progress-container'
        progressContainer.innerHTML = `
          <div class="driver-progress-bar">
            <div class="driver-progress-fill" style="width: ${((currentStepRef.current + 1) / steps.length) * 100}%"></div>
          </div>
          <span class="driver-progress-text">${currentStepRef.current + 1} de ${steps.length}</span>
        `
        
        popover.description.parentNode?.insertBefore(progressContainer, popover.description.nextSibling)
      }
    },
    
    // Merge with custom config
    ...config
  }), [
    effectiveTheme, 
    prefersReducedMotion,
    prefersHighContrast,
    className, 
    onComplete, 
    onSkip, 
    steps.length, 
    config
  ])

  // Initialize driver
  useEffect(() => {
    if (!isActive || steps.length === 0) {
      return
    }

    try {
      // Apply client branding styles if available
      if (currentBranding) {
        applyBrandingStyles(currentBranding)
      }

      const driverSteps = convertSteps(steps)
      const driverInstance = driver({
        ...driverConfig,
        steps: driverSteps
      })

      driverRef.current = driverInstance
      
      // Start the tour
      driverInstance.drive()
      
      return () => {
        driverInstance.destroy()
        driverRef.current = null
        
        // Remove branding styles when tour ends
        if (currentBranding) {
          removeBrandingStyles()
        }
      }
    } catch (error) {
      const tourError = new TourError(
        `Failed to initialize driver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'driver-wrapper',
        undefined,
        error as Error
      )
      onError?.(tourError)
    }
  }, [isActive, steps, convertSteps, driverConfig, onError, currentBranding])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy()
        driverRef.current = null
      }
    }
  }, [])

  // Apply themed styles to document
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.id = 'driver-theme-styles'
    
    const cssVariables = Object.entries(themedStyles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')
    
    styleElement.textContent = `
      :root {
        ${cssVariables};
      }
      
      .driver-popover-themed {
        background: var(--driver-popover-bg) !important;
        border: 1px solid var(--driver-popover-border) !important;
        border-radius: var(--driver-popover-border-radius) !important;
        box-shadow: var(--driver-popover-shadow) !important;
        color: var(--driver-text-color) !important;
      }
      
      .driver-popover-themed .driver-popover-title {
        color: var(--driver-text-color) !important;
        font-weight: 600 !important;
        margin-bottom: 8px !important;
      }
      
      .driver-popover-themed .driver-popover-description {
        color: var(--driver-text-color) !important;
        opacity: 0.8 !important;
        line-height: 1.5 !important;
      }
      
      .driver-popover-themed .driver-popover-next-btn,
      .driver-popover-themed .driver-popover-prev-btn {
        background: var(--driver-btn-bg) !important;
        color: var(--driver-btn-text) !important;
        border: none !important;
        border-radius: var(--driver-btn-border-radius) !important;
        padding: 8px 16px !important;
        font-weight: 500 !important;
        transition: all var(--driver-transition-duration) ease !important;
      }
      
      .driver-popover-themed .driver-popover-next-btn:hover,
      .driver-popover-themed .driver-popover-prev-btn:hover {
        background: var(--driver-btn-hover-bg) !important;
        transform: translateY(-1px) !important;
      }
      
      .driver-popover-themed .driver-popover-close-btn {
        background: var(--driver-close-btn-bg) !important;
        color: var(--driver-text-color) !important;
        border: 1px solid var(--driver-border-color) !important;
        border-radius: var(--driver-btn-border-radius) !important;
        padding: 8px 16px !important;
        transition: all var(--driver-transition-duration) ease !important;
      }
      
      .driver-popover-themed .driver-popover-close-btn:hover {
        background: var(--driver-close-btn-hover-bg) !important;
      }
      
      .driver-progress-container {
        margin: 12px 0 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      
      .driver-progress-bar {
        flex: 1 !important;
        height: 4px !important;
        background: var(--driver-progress-bg) !important;
        border-radius: 2px !important;
        overflow: hidden !important;
      }
      
      .driver-progress-fill {
        height: 100% !important;
        background: var(--driver-progress-fill) !important;
        transition: width var(--driver-animation-duration) ease !important;
      }
      
      .driver-progress-text {
        font-size: 12px !important;
        color: var(--driver-text-color) !important;
        opacity: 0.7 !important;
        white-space: nowrap !important;
      }
      
      .driver-popover-dark {
        --driver-text-color: #f8fafc !important;
        --driver-bg-color: #1e293b !important;
        --driver-border-color: #475569 !important;
      }
      
      .driver-popover-high-contrast {
        --driver-border-color: currentColor !important;
        border-width: 2px !important;
        outline: 2px solid var(--driver-focus-outline, currentColor) !important;
        outline-offset: var(--driver-focus-outline-offset, 2px) !important;
      }
      
      .driver-popover-high-contrast .driver-popover-next-btn,
      .driver-popover-high-contrast .driver-popover-prev-btn,
      .driver-popover-high-contrast .driver-popover-close-btn {
        border-width: 2px !important;
        outline: 1px solid currentColor !important;
        outline-offset: 1px !important;
      }
      
      .driver-popover-reduced-motion,
      .driver-popover-reduced-motion * {
        transition: none !important;
        animation: none !important;
        transform: none !important;
      }
      
      /* Reduced motion styles */
      @media (prefers-reduced-motion: reduce) {
        .driver-popover-themed,
        .driver-popover-themed * {
          transition: none !important;
          animation: none !important;
          transform: none !important;
        }
        
        .driver-overlay {
          transition: none !important;
        }
        
        .driver-stage {
          transition: none !important;
        }
      }
      
      /* High contrast mode */
      @media (prefers-contrast: high) {
        .driver-popover-themed {
          border-width: 2px !important;
          outline: 2px solid currentColor !important;
          outline-offset: 2px !important;
        }
        
        .driver-popover-themed .driver-popover-next-btn,
        .driver-popover-themed .driver-popover-prev-btn,
        .driver-popover-themed .driver-popover-close-btn {
          border-width: 2px !important;
          outline: 1px solid currentColor !important;
          outline-offset: 1px !important;
        }
        
        .driver-stage {
          outline: 3px solid var(--driver-focus-outline, #ffff00) !important;
          outline-offset: 2px !important;
        }
      }
      
      /* Focus management for accessibility */
      .driver-popover-themed:focus-within {
        outline: 3px solid var(--driver-focus-outline, #0066cc) !important;
        outline-offset: 2px !important;
      }
      
      /* Enhanced visibility for high contrast users */
      @media (prefers-contrast: high) and (prefers-color-scheme: dark) {
        .driver-popover-themed {
          --driver-text-color: #ffffff !important;
          --driver-bg-color: #000000 !important;
          --driver-border-color: #ffffff !important;
          --driver-focus-outline: #ffff00 !important;
        }
      }
      
      @media (prefers-contrast: high) and (prefers-color-scheme: light) {
        .driver-popover-themed {
          --driver-text-color: #000000 !important;
          --driver-bg-color: #ffffff !important;
          --driver-border-color: #000000 !important;
          --driver-focus-outline: #0000ff !important;
        }
      }
    `
    
    document.head.appendChild(styleElement)
    
    return () => {
      const existingStyle = document.getElementById('driver-theme-styles')
      if (existingStyle) {
        document.head.removeChild(existingStyle)
      }
    }
  }, [themedStyles])

  // Inject high contrast CSS when needed
  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (prefersHighContrast) {
      cleanup = injectHighContrastCSS(effectiveTheme === 'dark')
    }

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [prefersHighContrast, effectiveTheme])

  // This component doesn't render anything visible
  // The driver.js library handles all the UI rendering
  return null
}

export default DriverWrapper