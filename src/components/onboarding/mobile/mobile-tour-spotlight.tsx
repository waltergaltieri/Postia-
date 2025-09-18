'use client'

import * as React from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion, announceToScreenReader } from '@/lib/accessibility'

interface MobileTourSpotlightProps {
  targetElement?: HTMLElement | null
  isVisible?: boolean
  onTap?: () => void
  onSwipeNext?: () => void
  onSwipePrevious?: () => void
  className?: string
  // Mobile-specific props
  enableSwipeGestures?: boolean
  swipeThreshold?: number
  enableTapToAdvance?: boolean
  enableHapticFeedback?: boolean
  spotlightRadius?: number
  spotlightPadding?: number
  // Animation props
  animationDuration?: number
  pulseAnimation?: boolean
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
}

const overlayVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const spotlightVariants = {
  hidden: {
    scale: 0,
    opacity: 0
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export const MobileTourSpotlight = React.forwardRef<HTMLDivElement, MobileTourSpotlightProps>(
  ({
    targetElement,
    isVisible = true,
    onTap,
    onSwipeNext,
    onSwipePrevious,
    className,
    enableSwipeGestures = true,
    swipeThreshold = 50,
    enableTapToAdvance = true,
    enableHapticFeedback = true,
    spotlightRadius = 8,
    spotlightPadding = 8,
    animationDuration = 0.3,
    pulseAnimation = true,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const [spotlightPosition, setSpotlightPosition] = React.useState<{
      x: number
      y: number
      width: number
      height: number
    } | null>(null)

    // Generate unique ID for accessibility
    const spotlightId = React.useId()

    // Haptic feedback function
    const triggerHapticFeedback = React.useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!enableHapticFeedback) return
      
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        }
        navigator.vibrate(patterns[type])
      }
    }, [enableHapticFeedback])

    // Calculate spotlight position based on target element
    const updateSpotlightPosition = React.useCallback(() => {
      if (!targetElement) {
        setSpotlightPosition(null)
        return
      }

      const rect = targetElement.getBoundingClientRect()
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft
      const scrollY = window.pageYOffset || document.documentElement.scrollTop

      setSpotlightPosition({
        x: rect.left + scrollX - spotlightPadding,
        y: rect.top + scrollY - spotlightPadding,
        width: rect.width + (spotlightPadding * 2),
        height: rect.height + (spotlightPadding * 2)
      })
    }, [targetElement, spotlightPadding])

    // Update position when target element changes or on resize
    React.useEffect(() => {
      updateSpotlightPosition()

      const handleResize = () => updateSpotlightPosition()
      const handleScroll = () => updateSpotlightPosition()

      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, { passive: true })

      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll)
      }
    }, [updateSpotlightPosition])

    // Swipe gesture handling
    const handlePan = React.useCallback((event: any, info: PanInfo) => {
      if (!enableSwipeGestures) return

      const { offset, velocity } = info
      const swipeDistance = Math.abs(offset.x)
      const swipeVelocity = Math.abs(velocity.x)

      // Determine if it's a valid swipe
      if (swipeDistance > swipeThreshold || swipeVelocity > 500) {
        triggerHapticFeedback('medium')
        
        if (offset.x > 0) {
          // Swipe right - previous step
          onSwipePrevious?.()
          announceToScreenReader('Deslizado hacia el paso anterior', 'assertive')
        } else if (offset.x < 0) {
          // Swipe left - next step
          onSwipeNext?.()
          announceToScreenReader('Deslizado hacia el siguiente paso', 'assertive')
        }
      }
    }, [enableSwipeGestures, swipeThreshold, onSwipeNext, onSwipePrevious, triggerHapticFeedback])

    // Tap handling
    const handleTap = React.useCallback(() => {
      if (enableTapToAdvance && onTap) {
        triggerHapticFeedback('light')
        onTap()
        announceToScreenReader('Elemento tocado, avanzando', 'assertive')
      }
    }, [enableTapToAdvance, onTap, triggerHapticFeedback])

    // Create SVG mask for spotlight effect
    const createSpotlightMask = () => {
      if (!spotlightPosition) return null

      const { x, y, width, height } = spotlightPosition
      const centerX = x + width / 2
      const centerY = y + height / 2
      const radius = Math.max(width, height) / 2 + spotlightRadius

      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <mask id={`spotlight-mask-${spotlightId}`}>
              <rect width="100%" height="100%" fill="black" />
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="white"
              />
            </mask>
            <filter id={`spotlight-glow-${spotlightId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Spotlight glow effect */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius + 4}
            fill="rgba(59, 130, 246, 0.1)"
            filter={`url(#spotlight-glow-${spotlightId})`}
          />
        </svg>
      )
    }

    // Create spotlight cutout overlay
    const createOverlayWithCutout = () => {
      if (!spotlightPosition) return null

      const { x, y, width, height } = spotlightPosition
      const centerX = x + width / 2
      const centerY = y + height / 2
      const radius = Math.max(width, height) / 2 + spotlightRadius

      return (
        <div
          className="absolute inset-0 bg-black/60"
          style={{
            mask: `radial-gradient(circle at ${centerX}px ${centerY}px, transparent ${radius}px, black ${radius + 2}px)`,
            WebkitMask: `radial-gradient(circle at ${centerX}px ${centerY}px, transparent ${radius}px, black ${radius + 2}px)`
          }}
        />
      )
    }

    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(
              'mobile-tour-spotlight fixed inset-0 z-40 touch-pan-x',
              className
            )}
            variants={prefersReducedMotion ? undefined : overlayVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            exit={prefersReducedMotion ? 'visible' : 'exit'}
            onPan={enableSwipeGestures ? handlePan : undefined}
            onTap={enableTapToAdvance ? handleTap : undefined}
            role="presentation"
            aria-label={ariaLabel || 'Elemento destacado del tour'}
            aria-describedby={ariaDescribedBy}
            {...props}
          >
            {/* Overlay with spotlight cutout */}
            {createOverlayWithCutout()}
            
            {/* Spotlight glow effect */}
            {createSpotlightMask()}

            {/* Highlighted element indicator */}
            {spotlightPosition && (
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: spotlightPosition.x,
                  top: spotlightPosition.y,
                  width: spotlightPosition.width,
                  height: spotlightPosition.height
                }}
                variants={prefersReducedMotion ? undefined : spotlightVariants}
                initial={prefersReducedMotion ? 'visible' : 'hidden'}
                animate="visible"
                exit={prefersReducedMotion ? 'visible' : 'exit'}
              >
                {/* Pulsing border for highlighted element */}
                <motion.div
                  className="absolute inset-0 border-2 border-primary-400 rounded-lg"
                  variants={prefersReducedMotion || !pulseAnimation ? undefined : pulseVariants}
                  animate={prefersReducedMotion || !pulseAnimation ? undefined : 'pulse'}
                  style={{
                    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)'
                  }}
                />

                {/* Corner indicators for mobile */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 rounded-full shadow-lg" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full shadow-lg" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-500 rounded-full shadow-lg" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 rounded-full shadow-lg" />
              </motion.div>
            )}

            {/* Touch interaction hints */}
            {enableSwipeGestures && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-black/80 text-white text-sm rounded-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.3 }}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span>Desliza para navegar</span>
                </motion.div>
              </div>
            )}

            {enableTapToAdvance && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
                <motion.div
                  className="px-4 py-2 bg-black/80 text-white text-sm rounded-full"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  Toca para continuar
                </motion.div>
              </div>
            )}

            {/* Screen reader announcements */}
            <div 
              aria-live="polite" 
              aria-atomic="true" 
              className="sr-only"
            >
              Elemento destacado en el tour. 
              {enableTapToAdvance && 'Toque para avanzar. '}
              {enableSwipeGestures && 'Deslice horizontalmente para navegar entre pasos.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

MobileTourSpotlight.displayName = 'MobileTourSpotlight'

// Hook for managing mobile spotlight state
export function useMobileTourSpotlight() {
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  const showSpotlight = React.useCallback((element: HTMLElement | string) => {
    if (typeof element === 'string') {
      const el = document.querySelector(element) as HTMLElement
      setTargetElement(el)
    } else {
      setTargetElement(element)
    }
    setIsVisible(true)
  }, [])

  const hideSpotlight = React.useCallback(() => {
    setIsVisible(false)
    // Delay clearing target element to allow exit animation
    setTimeout(() => setTargetElement(null), 300)
  }, [])

  const updateTarget = React.useCallback((element: HTMLElement | string) => {
    if (typeof element === 'string') {
      const el = document.querySelector(element) as HTMLElement
      setTargetElement(el)
    } else {
      setTargetElement(element)
    }
  }, [])

  return {
    targetElement,
    isVisible,
    showSpotlight,
    hideSpotlight,
    updateTarget
  }
}