'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/accessibility'
import { MobileTourPopover } from './mobile-tour-popover'
import { MobileTourControls } from './mobile-tour-controls'
import { MobileTourSpotlight } from './mobile-tour-spotlight'

interface MobileTourLayoutProps {
  // Tour content
  title: string
  description: string
  currentStep: number
  totalSteps: number
  
  // Layout configuration
  layout?: 'overlay' | 'bottom-sheet' | 'fullscreen' | 'adaptive'
  position?: 'top' | 'bottom' | 'center' | 'auto'
  
  // Visibility and state
  isVisible?: boolean
  isActive?: boolean
  isFullscreen?: boolean
  
  // Event handlers
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onClose?: () => void
  onToggleFullscreen?: () => void
  
  // Mobile-specific features
  enableSwipeGestures?: boolean
  enableTapToAdvance?: boolean
  enableHapticFeedback?: boolean
  swipeThreshold?: number
  
  // Spotlight configuration
  targetElement?: HTMLElement | null
  showSpotlight?: boolean
  spotlightRadius?: number
  
  // UI configuration
  showProgress?: boolean
  showControls?: boolean
  showCloseButton?: boolean
  
  // Styling
  className?: string
  popoverClassName?: string
  controlsClassName?: string
  spotlightClassName?: string
  
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
}

const layoutVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  },
  bottomSheet: {
    hidden: { 
      opacity: 0,
      y: '100%'
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0,
      y: '100%',
      transition: { 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  fullscreen: {
    hidden: { 
      opacity: 0,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      transition: { 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }
}

export const MobileTourLayout = React.forwardRef<HTMLDivElement, MobileTourLayoutProps>(
  ({
    title,
    description,
    currentStep,
    totalSteps,
    layout = 'adaptive',
    position = 'auto',
    isVisible = true,
    isActive = true,
    isFullscreen = false,
    onNext,
    onPrevious,
    onSkip,
    onClose,
    onToggleFullscreen,
    enableSwipeGestures = true,
    enableTapToAdvance = true,
    enableHapticFeedback = true,
    swipeThreshold = 50,
    targetElement,
    showSpotlight = true,
    spotlightRadius = 8,
    showProgress = true,
    showControls = true,
    showCloseButton = true,
    className,
    popoverClassName,
    controlsClassName,
    spotlightClassName,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const [screenSize, setScreenSize] = React.useState<'small' | 'medium' | 'large'>('medium')
    const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait')

    // Detect screen size and orientation for adaptive layout
    React.useEffect(() => {
      const updateScreenInfo = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        
        // Determine screen size
        if (width < 480) {
          setScreenSize('small')
        } else if (width < 768) {
          setScreenSize('medium')
        } else {
          setScreenSize('large')
        }
        
        // Determine orientation
        setOrientation(width > height ? 'landscape' : 'portrait')
      }

      updateScreenInfo()
      window.addEventListener('resize', updateScreenInfo)
      window.addEventListener('orientationchange', updateScreenInfo)

      return () => {
        window.removeEventListener('resize', updateScreenInfo)
        window.removeEventListener('orientationchange', updateScreenInfo)
      }
    }, [])

    // Determine effective layout based on adaptive settings
    const getEffectiveLayout = () => {
      if (layout !== 'adaptive') return layout
      
      if (isFullscreen) return 'fullscreen'
      
      // Adaptive logic based on screen size and orientation
      if (screenSize === 'small' || orientation === 'landscape') {
        return 'bottom-sheet'
      }
      
      return 'overlay'
    }

    const effectiveLayout = getEffectiveLayout()

    // Determine popover position based on layout and screen info
    const getPopoverPosition = () => {
      if (position !== 'auto') return position
      
      switch (effectiveLayout) {
        case 'bottom-sheet':
          return 'bottom'
        case 'fullscreen':
          return 'center'
        default:
          return orientation === 'landscape' ? 'center' : 'bottom'
      }
    }

    const popoverPosition = getPopoverPosition()

    // Determine control variant based on layout
    const getControlsVariant = () => {
      switch (effectiveLayout) {
        case 'bottom-sheet':
          return 'bottom-sheet'
        case 'fullscreen':
          return 'default'
        default:
          return screenSize === 'small' ? 'compact' : 'default'
      }
    }

    const controlsVariant = getControlsVariant()

    // Handle swipe gestures at layout level
    const handleSwipeNext = React.useCallback(() => {
      onNext?.()
    }, [onNext])

    const handleSwipePrevious = React.useCallback(() => {
      onPrevious?.()
    }, [onPrevious])

    // Handle tap to advance
    const handleTapToAdvance = React.useCallback(() => {
      if (enableTapToAdvance && onNext) {
        onNext()
      }
    }, [enableTapToAdvance, onNext])

    return (
      <AnimatePresence mode="wait">
        {isVisible && isActive && (
          <motion.div
            ref={ref}
            className={cn(
              'mobile-tour-layout fixed inset-0 z-50',
              effectiveLayout === 'fullscreen' && 'bg-background',
              className
            )}
            variants={prefersReducedMotion ? undefined : layoutVariants[effectiveLayout]}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            exit={prefersReducedMotion ? 'visible' : 'exit'}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || `Tour móvil - ${title}`}
            aria-describedby={ariaDescribedBy}
            {...props}
          >
            {/* Spotlight overlay */}
            {showSpotlight && targetElement && effectiveLayout !== 'fullscreen' && (
              <MobileTourSpotlight
                targetElement={targetElement}
                isVisible={isVisible}
                onTap={handleTapToAdvance}
                onSwipeNext={handleSwipeNext}
                onSwipePrevious={handleSwipePrevious}
                enableSwipeGestures={enableSwipeGestures}
                enableTapToAdvance={enableTapToAdvance}
                enableHapticFeedback={enableHapticFeedback}
                swipeThreshold={swipeThreshold}
                spotlightRadius={spotlightRadius}
                className={spotlightClassName}
              />
            )}

            {/* Tour content popover */}
            <MobileTourPopover
              title={title}
              description={description}
              currentStep={currentStep}
              totalSteps={totalSteps}
              position={popoverPosition}
              showProgress={showProgress}
              showButtons={!showControls} // Show buttons in popover if controls are hidden
              onNext={showControls ? undefined : onNext}
              onPrevious={showControls ? undefined : onPrevious}
              onSkip={showControls ? undefined : onSkip}
              onClose={showCloseButton ? onClose : undefined}
              onSwipeNext={handleSwipeNext}
              onSwipePrevious={handleSwipePrevious}
              isVisible={isVisible}
              isFullscreen={effectiveLayout === 'fullscreen'}
              onToggleFullscreen={onToggleFullscreen}
              enableSwipeGestures={enableSwipeGestures}
              swipeThreshold={swipeThreshold}
              className={cn(
                popoverClassName,
                // Layout-specific positioning
                effectiveLayout === 'bottom-sheet' && 'bottom-0 left-0 right-0',
                effectiveLayout === 'fullscreen' && 'inset-4',
                effectiveLayout === 'overlay' && {
                  'top-20 left-4 right-4': popoverPosition === 'top',
                  'bottom-20 left-4 right-4': popoverPosition === 'bottom',
                  'top-1/2 left-4 right-4 transform -translate-y-1/2': popoverPosition === 'center'
                }
              )}
            />

            {/* Separate controls (when not integrated in popover) */}
            {showControls && effectiveLayout !== 'bottom-sheet' && (
              <MobileTourControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                showProgress={!showProgress} // Show progress in controls if not in popover
                showStepCounter={true}
                onNext={onNext}
                onPrevious={onPrevious}
                onSkip={onSkip}
                onClose={showCloseButton ? onClose : undefined}
                onSwipeNext={handleSwipeNext}
                onSwipePrevious={handleSwipePrevious}
                variant={controlsVariant}
                position="bottom"
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
                enableSwipeGestures={enableSwipeGestures}
                enableHapticFeedback={enableHapticFeedback}
                swipeThreshold={swipeThreshold}
                className={controlsClassName}
              />
            )}

            {/* Fullscreen mode backdrop */}
            {effectiveLayout === 'fullscreen' && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm -z-10" />
            )}

            {/* Screen reader announcements for layout changes */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {effectiveLayout === 'fullscreen' && 'Modo pantalla completa activado'}
              {effectiveLayout === 'bottom-sheet' && 'Vista de hoja inferior activada'}
              {orientation === 'landscape' && 'Orientación horizontal detectada'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

MobileTourLayout.displayName = 'MobileTourLayout'

// Hook for managing mobile tour layout state
export function useMobileTourLayout() {
  const [layout, setLayout] = React.useState<'overlay' | 'bottom-sheet' | 'fullscreen' | 'adaptive'>('adaptive')
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)

  // Detect if device is mobile
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const toggleFullscreen = React.useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const setTarget = React.useCallback((element: HTMLElement | string | null) => {
    if (typeof element === 'string') {
      const el = document.querySelector(element) as HTMLElement
      setTargetElement(el)
    } else {
      setTargetElement(element)
    }
  }, [])

  const adaptLayout = React.useCallback((screenWidth: number, orientation: 'portrait' | 'landscape') => {
    if (layout !== 'adaptive') return

    if (screenWidth < 480 || orientation === 'landscape') {
      // Use bottom sheet for small screens or landscape
      return 'bottom-sheet'
    } else if (screenWidth > 1024) {
      // Use overlay for larger screens
      return 'overlay'
    }

    return 'overlay'
  }, [layout])

  return {
    layout,
    setLayout,
    isFullscreen,
    toggleFullscreen,
    targetElement,
    setTarget,
    isMobile,
    adaptLayout
  }
}

// Utility function to determine optimal mobile layout
export function getOptimalMobileLayout(
  screenWidth: number,
  screenHeight: number,
  orientation: 'portrait' | 'landscape',
  hasTargetElement: boolean
): 'overlay' | 'bottom-sheet' | 'fullscreen' {
  // Very small screens always use bottom sheet
  if (screenWidth < 360) {
    return 'bottom-sheet'
  }

  // Landscape orientation prefers bottom sheet for better content visibility
  if (orientation === 'landscape') {
    return 'bottom-sheet'
  }

  // If no target element, fullscreen might be better for complex content
  if (!hasTargetElement && screenHeight > 800) {
    return 'fullscreen'
  }

  // Default to overlay for most cases
  return 'overlay'
}