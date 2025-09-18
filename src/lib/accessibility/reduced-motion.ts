'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect user's reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

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
 * Create scroll behavior that respects motion preferences
 */
export function createMotionSafeScrollBehavior(): ScrollBehavior {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return prefersReducedMotion ? 'auto' : 'smooth'
}

/**
 * Utility to conditionally apply animations
 */
export function conditionalAnimation<T>(
  animatedValue: T,
  staticValue: T,
  prefersReducedMotion?: boolean
): T {
  const shouldReduce = prefersReducedMotion ?? 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  return shouldReduce ? staticValue : animatedValue
}

/**
 * Create intersection observer with motion-safe options
 */
export function createMotionSafeIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  const defaultOptions: IntersectionObserverInit = {
    threshold: prefersReducedMotion ? 0 : 0.1,
    rootMargin: prefersReducedMotion ? '0px' : '50px',
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

/**
 * Debounced scroll handler that respects motion preferences
 */
export function createMotionSafeScrollHandler(
  handler: () => void,
  delay: number = 100
): () => void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  if (prefersReducedMotion) {
    // No debouncing for reduced motion users
    return handler
  }

  let timeoutId: NodeJS.Timeout
  return () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(handler, delay)
  }
}