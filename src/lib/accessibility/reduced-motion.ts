'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSSRSafeMediaQuery, safeBrowserExecution, safeWindow } from './ssr-utils'
import type { ReducedMotionHookReturn, AccessibilityError } from './types'

/**
 * Enhanced hook to detect user's reduced motion preference with error handling and SSR safety
 */
export function useReducedMotion(): ReducedMotionHookReturn {
  const { matches, isLoading, error } = useSSRSafeMediaQuery('(prefers-reduced-motion: reduce)', false)

  return {
    prefersReducedMotion: matches,
    isLoading,
    error
  }
}

/**
 * Legacy hook for backward compatibility (simplified return type)
 */
export function useReducedMotionLegacy(): boolean {
  const { prefersReducedMotion } = useReducedMotion()
  return prefersReducedMotion
}

/**
 * Get animation configuration based on reduced motion preference
 */
export function getAnimationConfig(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      duration: 0,
      transition: 'none',
      animate: false,
      initial: false,
      exit: false
    }
  }

  return {
    duration: 300,
    transition: 'all 0.3s ease-in-out',
    animate: true,
    initial: true,
    exit: true
  }
}

/**
 * Create motion-safe CSS transitions
 */
export function createMotionSafeTransition(
  property: string = 'all',
  duration: number = 300,
  easing: string = 'ease-in-out'
): string {
  return `
    @media (prefers-reduced-motion: no-preference) {
      transition: ${property} ${duration}ms ${easing};
    }
    
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `
}

/**
 * Framer Motion variants that respect reduced motion
 */
export function createMotionSafeVariants() {
  return {
    // Fade variants
    fadeIn: {
      hidden: { 
        opacity: 0,
        transition: { duration: 0 }
      },
      visible: { 
        opacity: 1,
        transition: { 
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    },
    
    // Scale variants
    scaleIn: {
      hidden: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0 }
      },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    },
    
    // Slide variants
    slideUp: {
      hidden: { 
        opacity: 0, 
        y: 20,
        transition: { duration: 0 }
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    },
    
    slideDown: {
      hidden: { 
        opacity: 0, 
        y: -20,
        transition: { duration: 0 }
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    },
    
    slideLeft: {
      hidden: { 
        opacity: 0, 
        x: 20,
        transition: { duration: 0 }
      },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { 
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    },
    
    slideRight: {
      hidden: { 
        opacity: 0, 
        x: -20,
        transition: { duration: 0 }
      },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { 
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    }
  }
}

/**
 * Hook for motion-safe animations with Framer Motion
 */
export function useMotionSafeAnimation() {
  const prefersReducedMotion = useReducedMotion()
  const variants = createMotionSafeVariants()

  const getVariant = (variantName: keyof typeof variants) => {
    if (prefersReducedMotion) {
      // Return static variants for reduced motion
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      }
    }
    return variants[variantName]
  }

  const getTransition = (duration: number = 300) => {
    if (prefersReducedMotion) {
      return { duration: 0 }
    }
    return {
      duration: duration / 1000,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }

  return {
    prefersReducedMotion,
    getVariant,
    getTransition,
    variants
  }
}

/**
 * CSS-in-JS helper for reduced motion
 */
export function motionSafe(styles: Record<string, any>) {
  return {
    '@media (prefers-reduced-motion: no-preference)': styles,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none !important',
      animation: 'none !important'
    }
  }
}

/**
 * Create scroll behavior that respects motion preferences with SSR safety
 */
export function createMotionSafeScrollBehavior(): ScrollBehavior {
  const result = safeBrowserExecution(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      return prefersReducedMotion ? 'auto' : 'smooth'
    },
    'auto' // Safe fallback for SSR
  )
  
  return result.data || 'auto'
}

/**
 * Utility to conditionally apply animations with SSR safety
 */
export function conditionalAnimation<T>(
  animatedValue: T,
  staticValue: T,
  prefersReducedMotion?: boolean
): T {
  if (prefersReducedMotion !== undefined) {
    return prefersReducedMotion ? staticValue : animatedValue
  }

  const result = safeBrowserExecution(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    true // Safe fallback - assume reduced motion for SSR
  )
  
  const shouldReduce = result.data ?? true
  return shouldReduce ? staticValue : animatedValue
}

/**
 * Create intersection observer with motion-safe options and error handling
 */
export function createMotionSafeIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  const result = safeBrowserExecution(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    const defaultOptions: IntersectionObserverInit = {
      threshold: prefersReducedMotion ? 0 : 0.1,
      rootMargin: prefersReducedMotion ? '0px' : '50px',
      ...options
    }

    return new IntersectionObserver(callback, defaultOptions)
  })

  if (!result.success) {
    console.warn('Failed to create motion-safe intersection observer:', result.error)
    return null
  }

  return result.data || null
}

/**
 * Debounced scroll handler that respects motion preferences with error handling
 */
export function createMotionSafeScrollHandler(
  handler: () => void,
  delay: number = 100
): () => void {
  const result = safeBrowserExecution(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    true // Assume reduced motion for safety
  )
  
  const prefersReducedMotion = result.data ?? true
  
  if (prefersReducedMotion) {
    // No debouncing for reduced motion users
    return () => {
      try {
        handler()
      } catch (error) {
        console.warn('Motion-safe scroll handler failed:', error)
      }
    }
  }

  let timeoutId: NodeJS.Timeout
  return () => {
    try {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        try {
          handler()
        } catch (error) {
          console.warn('Debounced scroll handler failed:', error)
        }
      }, delay)
    } catch (error) {
      console.warn('Failed to setup debounced scroll handler:', error)
      // Fallback to immediate execution
      try {
        handler()
      } catch (handlerError) {
        console.warn('Fallback handler execution failed:', handlerError)
      }
    }
  }
}