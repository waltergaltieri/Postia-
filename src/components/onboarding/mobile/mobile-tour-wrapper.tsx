'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useTour } from '@/hooks/use-tour'
import { useMobileUtils, useMobileGestureHandler } from '@/lib/tour/mobile-gesture-handler'
import { useMobilePositioning } from '@/lib/tour/mobile-positioning'
import { MobileTourLayout } from './mobile-tour-layout'
import { announceToScreenReader } from '@/lib/accessibility'

interface MobileTourWrapperProps {
  // Tour identification
  tourId: string
  
  // Content
  title?: string
  description?: string
  
  // Configuration
  autoStart?: boolean
  enableSwipeGestures?: boolean
  enableTapToAdvance?: boolean
  enableHapticFeedback?: boolean
  swipeThreshold?: number
  
  // Layout options
  layout?: 'overlay' | 'bottom-sheet' | 'fullscreen' | 'adaptive'
  position?: 'top' | 'bottom' | 'center' | 'auto'
  
  // UI options
  showProgress?: boolean
  showControls?: boolean
  showSpotlight?: boolean
  showCloseButton?: boolean
  
  // Event handlers
  onTourStart?: () => void
  onTourComplete?: () => void
  onTourSkip?: () => void
  onTourClose?: () => void
  onStepChange?: (step: number) => void
  
  // Styling
  className?: string
  
  // Children (for custom content)
  children?: React.ReactNode
}

export const MobileTourWrapper = React.forwardRef<HTMLDivElement, MobileTourWrapperProps>(
  ({
    tourId,
    title,
    description,
    autoStart = false,
    enableSwipeGestures = true,
    enableTapToAdvance = true,
    enableHapticFeedback = true,
    swipeThreshold = 50,
    layout = 'adaptive',
    position = 'auto',
    showProgress = true,
    showControls = true,
    showSpotlight = true,
    showCloseButton = true,
    onTourStart,
    onTourComplete,
    onTourSkip,
    onTourClose,
    onStepChange,
    className,
    children,
    ...props
  }, ref) => {
    const {
      currentTour,
      currentStep,
      totalSteps,
      isActive,
      startTour,
      nextStep,
      previousStep,
      skipTour,
      stopTour,
      getCurrentStepData
    } = useTour()

    const { isMobile, isTouch, orientation, screenSize } = useMobileUtils()
    const { viewport } = useMobilePositioning()
    
    const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)
    const [isFullscreen, setIsFullscreen] = React.useState(false)

    // Get current step data
    const stepData = getCurrentStepData()
    const effectiveTitle = title || stepData?.title || 'Tour Step'
    const effectiveDescription = description || stepData?.description || 'Tour description'

    // Handle tour lifecycle
    React.useEffect(() => {
      if (autoStart && isMobile && !currentTour) {
        startTour(tourId)
        onTourStart?.()
        announceToScreenReader('Tour móvil iniciado', 'assertive')
      }
    }, [autoStart, isMobile, tourId, currentTour, startTour, onTourStart])

    // Update target element when step changes
    React.useEffect(() => {
      if (stepData?.element) {
        const element = typeof stepData.element === 'string' 
          ? document.querySelector(stepData.element) as HTMLElement
          : stepData.element
        setTargetElement(element)
      }
    }, [stepData])

    // Handle step changes
    React.useEffect(() => {
      if (currentStep > 0) {
        onStepChange?.(currentStep)
      }
    }, [currentStep, onStepChange])

    // Mobile gesture handlers
    const gestureHandler = useMobileGestureHandler(
      {
        swipeThreshold,
        enableSwipeGestures,
        enableHapticFeedback,
        enableTapToAdvance
      },
      {
        onSwipeLeft: () => {
          if (currentStep < totalSteps) {
            nextStep()
          }
        },
        onSwipeRight: () => {
          if (currentStep > 1) {
            previousStep()
          }
        },
        onTap: () => {
          if (enableTapToAdvance && currentStep < totalSteps) {
            nextStep()
          }
        },
        onDoubleTap: () => {
          handleToggleFullscreen()
        }
      }
    )

    // Event handlers
    const handleNext = React.useCallback(() => {
      if (currentStep < totalSteps) {
        nextStep()
      } else {
        handleComplete()
      }
    }, [currentStep, totalSteps, nextStep])

    const handlePrevious = React.useCallback(() => {
      if (currentStep > 1) {
        previousStep()
      }
    }, [currentStep, previousStep])

    const handleSkip = React.useCallback(() => {
      skipTour()
      onTourSkip?.()
      announceToScreenReader('Tour omitido', 'assertive')
    }, [skipTour, onTourSkip])

    const handleClose = React.useCallback(() => {
      stopTour()
      onTourClose?.()
      announceToScreenReader('Tour cerrado', 'assertive')
    }, [stopTour, onTourClose])

    const handleComplete = React.useCallback(() => {
      stopTour()
      onTourComplete?.()
      announceToScreenReader('Tour completado', 'assertive')
    }, [stopTour, onTourComplete])

    const handleToggleFullscreen = React.useCallback(() => {
      setIsFullscreen(prev => !prev)
    }, [])

    // Don't render if not mobile or tour not active
    if (!isMobile || !isActive || currentTour !== tourId) {
      return children ? <>{children}</> : null
    }

    // Determine effective layout based on device characteristics
    const getEffectiveLayout = () => {
      if (layout !== 'adaptive') return layout
      
      if (isFullscreen) return 'fullscreen'
      
      // Adaptive logic
      if (screenSize === 'small' || orientation === 'landscape') {
        return 'bottom-sheet'
      }
      
      return 'overlay'
    }

    const effectiveLayout = getEffectiveLayout()

    return (
      <div
        ref={ref}
        className={cn('mobile-tour-wrapper', className)}
        {...props}
      >
        {/* Render children (original content) */}
        {children}

        {/* Mobile tour overlay */}
        <MobileTourLayout
          title={effectiveTitle}
          description={effectiveDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          layout={effectiveLayout}
          position={position}
          isVisible={isActive}
          isActive={isActive}
          isFullscreen={isFullscreen}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          onClose={showCloseButton ? handleClose : undefined}
          onToggleFullscreen={handleToggleFullscreen}
          enableSwipeGestures={enableSwipeGestures}
          enableTapToAdvance={enableTapToAdvance}
          enableHapticFeedback={enableHapticFeedback}
          swipeThreshold={swipeThreshold}
          targetElement={targetElement}
          showSpotlight={showSpotlight}
          showProgress={showProgress}
          showControls={showControls}
          showCloseButton={showCloseButton}
        />
      </div>
    )
  }
)

MobileTourWrapper.displayName = 'MobileTourWrapper'

// Hook for using mobile tour wrapper
export function useMobileTourWrapper(tourId: string) {
  const { isMobile } = useMobileUtils()
  const {
    currentTour,
    currentStep,
    totalSteps,
    isActive,
    startTour,
    stopTour,
    skipTour
  } = useTour()

  const isCurrentTour = currentTour === tourId
  const isVisible = isMobile && isActive && isCurrentTour

  const startMobileTour = React.useCallback(() => {
    if (isMobile) {
      startTour(tourId)
    }
  }, [isMobile, startTour, tourId])

  const stopMobileTour = React.useCallback(() => {
    if (isCurrentTour) {
      stopTour()
    }
  }, [isCurrentTour, stopTour])

  const skipMobileTour = React.useCallback(() => {
    if (isCurrentTour) {
      skipTour()
    }
  }, [isCurrentTour, skipTour])

  return {
    isVisible,
    isCurrentTour,
    currentStep,
    totalSteps,
    startMobileTour,
    stopMobileTour,
    skipMobileTour,
    isMobile
  }
}

// Higher-order component for adding mobile tour support
export function withMobileTour<P extends object>(
  Component: React.ComponentType<P>,
  tourConfig: {
    tourId: string
    autoStart?: boolean
    enableSwipeGestures?: boolean
    enableTapToAdvance?: boolean
    layout?: 'overlay' | 'bottom-sheet' | 'fullscreen' | 'adaptive'
  }
) {
  const MobileTourEnhancedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <MobileTourWrapper
        tourId={tourConfig.tourId}
        autoStart={tourConfig.autoStart}
        enableSwipeGestures={tourConfig.enableSwipeGestures}
        enableTapToAdvance={tourConfig.enableTapToAdvance}
        layout={tourConfig.layout}
      >
        <Component {...props} ref={ref} />
      </MobileTourWrapper>
    )
  })

  MobileTourEnhancedComponent.displayName = `withMobileTour(${Component.displayName || Component.name})`
  
  return MobileTourEnhancedComponent
}