'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/accessibility'

interface TourSpotlightProps {
  targetElement?: HTMLElement | null
  isVisible?: boolean
  padding?: number
  borderRadius?: number
  overlayColor?: string
  overlayOpacity?: number
  animationDuration?: number
  className?: string
  onOverlayClick?: () => void
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
}

interface SpotlightPosition {
  x: number
  y: number
  width: number
  height: number
}

const overlayVariants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
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
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.1
    }
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export const TourSpotlight = React.forwardRef<HTMLDivElement, TourSpotlightProps>(
  ({
    targetElement,
    isVisible = true,
    padding = 8,
    borderRadius = 8,
    overlayColor = 'rgba(0, 0, 0, 0.75)',
    overlayOpacity = 0.75,
    animationDuration = 0.4,
    className,
    onOverlayClick,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const [spotlightPosition, setSpotlightPosition] = React.useState<SpotlightPosition | null>(null)
    const prefersReducedMotion = useReducedMotion()
    const overlayRef = React.useRef<HTMLDivElement>(null)

    // Calculate spotlight position based on target element
    const calculateSpotlightPosition = React.useCallback(() => {
      if (!targetElement) {
        setSpotlightPosition(null)
        return
      }

      const rect = targetElement.getBoundingClientRect()
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft
      const scrollY = window.pageYOffset || document.documentElement.scrollTop

      setSpotlightPosition({
        x: rect.left + scrollX - padding,
        y: rect.top + scrollY - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2)
      })
    }, [targetElement, padding])

    // Update position when target element changes or window resizes
    React.useEffect(() => {
      if (!isVisible || !targetElement) return

      calculateSpotlightPosition()

      const handleResize = () => calculateSpotlightPosition()
      const handleScroll = () => calculateSpotlightPosition()

      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, { passive: true })

      // Use ResizeObserver to track target element size changes
      const resizeObserver = new ResizeObserver(calculateSpotlightPosition)
      resizeObserver.observe(targetElement)

      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll)
        resizeObserver.disconnect()
      }
    }, [isVisible, targetElement, calculateSpotlightPosition])

    // Handle overlay click
    const handleOverlayClick = React.useCallback((event: React.MouseEvent) => {
      // Only trigger if clicking on the overlay itself, not the spotlight area
      if (event.target === overlayRef.current && onOverlayClick) {
        onOverlayClick()
      }
    }, [onOverlayClick])

    // Generate SVG mask for spotlight effect
    const generateSpotlightMask = React.useCallback(() => {
      if (!spotlightPosition) return ''

      const { x, y, width, height } = spotlightPosition
      
      return `
        <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0; pointer-events: none;">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect 
                x="${x}" 
                y="${y}" 
                width="${width}" 
                height="${height}" 
                rx="${borderRadius}" 
                ry="${borderRadius}" 
                fill="black" 
              />
            </mask>
          </defs>
          <rect 
            width="100%" 
            height="100%" 
            fill="${overlayColor}" 
            mask="url(#spotlight-mask)" 
          />
        </svg>
      `
    }, [spotlightPosition, borderRadius, overlayColor])

    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(
              'tour-spotlight fixed inset-0 z-40 pointer-events-auto',
              className
            )}
            variants={prefersReducedMotion ? {} : overlayVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            exit={prefersReducedMotion ? 'visible' : 'exit'}
            role="presentation"
            aria-label={ariaLabel || 'Tour spotlight overlay'}
            aria-describedby={ariaDescribedBy}
            {...props}
          >
            {/* Main overlay with spotlight cutout */}
            <div
              ref={overlayRef}
              className="absolute inset-0 cursor-pointer"
              onClick={handleOverlayClick}
              style={{
                background: spotlightPosition ? 'transparent' : overlayColor,
                opacity: spotlightPosition ? 1 : overlayOpacity
              }}
              dangerouslySetInnerHTML={{
                __html: spotlightPosition ? generateSpotlightMask() : ''
              }}
            />

            {/* Spotlight highlight ring */}
            {spotlightPosition && (
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: spotlightPosition.x - 2,
                  top: spotlightPosition.y - 2,
                  width: spotlightPosition.width + 4,
                  height: spotlightPosition.height + 4,
                  borderRadius: borderRadius + 2
                }}
                variants={prefersReducedMotion ? {} : spotlightVariants}
                initial={prefersReducedMotion ? 'visible' : 'hidden'}
                animate="visible"
                exit={prefersReducedMotion ? 'visible' : 'exit'}
              >
                {/* Primary highlight ring */}
                <div
                  className="absolute inset-0 border-2 border-primary-400/60 rounded-lg"
                  style={{ borderRadius: borderRadius + 2 }}
                />
                
                {/* Animated pulse ring */}
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 border-2 border-primary-300/40 rounded-lg"
                    style={{ borderRadius: borderRadius + 2 }}
                    variants={pulseVariants}
                    animate="animate"
                  />
                )}

                {/* Subtle glow effect */}
                <div
                  className="absolute inset-0 rounded-lg shadow-lg shadow-primary-500/20"
                  style={{ borderRadius: borderRadius + 2 }}
                />
              </motion.div>
            )}

            {/* Accessibility: Screen reader description */}
            <div className="sr-only">
              {spotlightPosition 
                ? 'Elemento destacado en el tour. Presiona Escape para cerrar.'
                : 'Overlay del tour activo. Presiona Escape para cerrar.'
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

TourSpotlight.displayName = 'TourSpotlight'

// Hook for managing spotlight state
export function useSpotlight() {
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  const showSpotlight = React.useCallback((element: HTMLElement | string) => {
    const target = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element

    if (target) {
      setTargetElement(target)
      setIsVisible(true)
    }
  }, [])

  const hideSpotlight = React.useCallback(() => {
    setIsVisible(false)
    // Keep target element for exit animation
    setTimeout(() => setTargetElement(null), 300)
  }, [])

  const updateTarget = React.useCallback((element: HTMLElement | string | null) => {
    if (!element) {
      setTargetElement(null)
      return
    }

    const target = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element

    setTargetElement(target)
  }, [])

  return {
    targetElement,
    isVisible,
    showSpotlight,
    hideSpotlight,
    updateTarget
  }
}