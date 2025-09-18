'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useTour } from '@/hooks/use-tour'
import { useResponsiveTourAdapter, ResponsiveTourStep } from '@/lib/tour/responsive-tour-adapter'
import { useResponsiveContentGenerator } from '@/lib/tour/responsive-content-generator'
import { announceToScreenReader } from '@/lib/accessibility'

// Desktop components
import { TourPopover } from './tour-popover'
import { TourControls } from './tour-controls'
import { TourSpotlight } from './tour-spotlight'

// Mobile components
import { MobileTourLayout } from './mobile/mobile-tour-layout'

interface ResponsiveTourControllerProps {
  tourId: string
  steps: ResponsiveTourStep[]
  autoStart?: boolean
  onTourStart?: () => void
  onTourComplete?: () => void
  onTourSkip?: () => void
  onStepChange?: (step: number) => void
  className?: string
}

export const ResponsiveTourController = React.forwardRef<HTMLDivElement, ResponsiveTourControllerProps>(
  ({
    tourId,
    steps,
    autoStart = false,
    onTourStart,
    onTourComplete,
    onTourSkip,
    onStepChange,
    className,
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
      stopTour
    } = useTour()

    const {
      deviceInfo,
      adaptTourSteps,
      getOptimalLayout,
      getOptimalControls,
      isElementAccessible
    } = useResponsiveTourAdapter()

    const {
      generateContent,
      generateStepInstructions,
      generateAccessibilityContent
    } = useResponsiveContentGenerator()

    const [adaptedSteps, setAdaptedSteps] = React.useState<ResponsiveTourStep[]>([])
    const [currentStepData, setCurrentStepData] = React.useState<ResponsiveTourStep | null>(null)
    const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)

    // Adapt steps when device info or steps change
    React.useEffect(() => {
      if (deviceInfo && steps.length > 0) {
        const adapted = adaptTourSteps(steps)
        setAdaptedSteps(adapted)
        
        // Update total steps in tour context
        // This would need to be implemented in the tour context
      }
    }, [deviceInfo, steps, adaptTourSteps])

    // Update current step data when step changes
    React.useEffect(() => {
      if (adaptedSteps.length > 0 && currentStep > 0) {
        const stepData = adaptedSteps[currentStep - 1]
        setCurrentStepData(stepData)
        
        // Update target element
        if (stepData?.element) {
          const element = typeof stepData.element === 'string'
            ? document.querySelector(stepData.element) as HTMLElement
            : stepData.element
          
          if (element && isElementAccessible(element)) {
            setTargetElement(element)
          } else {
            setTargetElement(null)
          }
        }
        
        onStepChange?.(currentStep)
      }
    }, [adaptedSteps, currentStep, isElementAccessible, onStepChange])

    // Auto-start tour
    React.useEffect(() => {
      if (autoStart && !currentTour && adaptedSteps.length > 0) {
        startTour(tourId)
        onTourStart?.()
        announceToScreenReader('Tour responsivo iniciado', 'assertive')
      }
    }, [autoStart, currentTour, adaptedSteps.length, tourId, startTour, onTourStart])

    // Generate responsive content for current step
    const stepContent = React.useMemo(() => {
      if (!currentStepData || !deviceInfo) {
        return {
          title: 'Tour Step',
          description: 'Tour step description'
        }
      }

      const contentOptions = {
        deviceType: deviceInfo.deviceType,
        screenSize: deviceInfo.screenWidth < 480 ? 'small' as const : 
                   deviceInfo.screenWidth < 768 ? 'medium' as const : 'large' as const,
        orientation: deviceInfo.orientation,
        touchCapable: deviceInfo.touchCapable
      }

      return generateContent(
        `step-${currentStep}`,
        contentOptions,
        {
          title: {
            short: currentStepData.title,
            medium: currentStepData.title,
            long: currentStepData.title
          },
          description: {
            short: currentStepData.description,
            medium: currentStepData.description,
            long: currentStepData.description
          }
        }
      )
    }, [currentStepData, deviceInfo, currentStep, generateContent])

    // Generate accessibility content
    const accessibilityContent = React.useMemo(() => {
      if (!deviceInfo) return null

      const contentOptions = {
        deviceType: deviceInfo.deviceType,
        screenSize: deviceInfo.screenWidth < 480 ? 'small' as const : 
                   deviceInfo.screenWidth < 768 ? 'medium' as const : 'large' as const,
        orientation: deviceInfo.orientation,
        touchCapable: deviceInfo.touchCapable
      }

      return generateAccessibilityContent(stepContent, contentOptions)
    }, [stepContent, deviceInfo, generateAccessibilityContent])

    // Get optimal configuration for current device
    const optimalLayout = getOptimalLayout()
    const optimalControls = getOptimalControls()

    // Event handlers
    const handleNext = React.useCallback(() => {
      if (currentStep < totalSteps) {
        nextStep()
      } else {
        stopTour()
        onTourComplete?.()
        announceToScreenReader('Tour completado', 'assertive')
      }
    }, [currentStep, totalSteps, nextStep, stopTour, onTourComplete])

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
      announceToScreenReader('Tour cerrado', 'assertive')
    }, [stopTour])

    // Don't render if tour is not active or not the current tour
    if (!isActive || currentTour !== tourId || !deviceInfo) {
      return null
    }

    // Render mobile layout for mobile devices
    if (deviceInfo.deviceType === 'mobile') {
      return (
        <div
          ref={ref}
          className={cn('responsive-tour-controller mobile', className)}
          {...props}
        >
          <MobileTourLayout
            title={stepContent.title}
            description={stepContent.description}
            currentStep={currentStep}
            totalSteps={totalSteps}
            layout={optimalLayout as 'overlay' | 'bottom-sheet' | 'fullscreen'}
            isVisible={isActive}
            isActive={isActive}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onClose={handleClose}
            targetElement={targetElement}
            enableSwipeGestures={optimalControls.enableSwipeGestures}
            enableTapToAdvance={optimalControls.enableTapToAdvance}
            showProgress={optimalControls.showProgress}
            showControls={true}
            aria-label={accessibilityContent?.ariaLabel}
            aria-describedby={accessibilityContent?.ariaDescription}
          />
        </div>
      )
    }

    // Render desktop/tablet layout
    return (
      <div
        ref={ref}
        className={cn('responsive-tour-controller desktop', className)}
        {...props}
      >
        {/* Spotlight for highlighting elements */}
        {targetElement && (
          <TourSpotlight
            targetElement={targetElement}
            isVisible={isActive}
            className="responsive-spotlight"
          />
        )}

        {/* Tour popover */}
        <TourPopover
          title={stepContent.title}
          description={stepContent.description}
          currentStep={currentStep}
          totalSteps={totalSteps}
          position={currentStepData?.position || 'auto'}
          showProgress={optimalControls.showProgress}
          showButtons={false} // Use separate controls
          isVisible={isActive}
          aria-label={accessibilityContent?.ariaLabel}
          aria-describedby={accessibilityContent?.ariaDescription}
          className="responsive-popover"
        />

        {/* Tour controls */}
        <TourControls
          currentStep={currentStep}
          totalSteps={totalSteps}
          showProgress={!optimalControls.showProgress} // Avoid duplication
          showStepCounter={optimalControls.showStepCounter}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          onClose={handleClose}
          variant={optimalControls.variant}
          position={optimalControls.position}
          className="responsive-controls"
        />
      </div>
    )
  }
)

ResponsiveTourController.displayName = 'ResponsiveTourController'

// Hook for managing responsive tour state
export function useResponsiveTourController(tourId: string) {
  const { deviceInfo } = useResponsiveTourAdapter()
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
  const isVisible = isActive && isCurrentTour

  const startResponsiveTour = React.useCallback(() => {
    startTour(tourId)
  }, [startTour, tourId])

  const stopResponsiveTour = React.useCallback(() => {
    if (isCurrentTour) {
      stopTour()
    }
  }, [isCurrentTour, stopTour])

  const skipResponsiveTour = React.useCallback(() => {
    if (isCurrentTour) {
      skipTour()
    }
  }, [isCurrentTour, skipTour])

  // Get device-specific recommendations
  const getDeviceRecommendations = React.useCallback(() => {
    if (!deviceInfo) return null

    return {
      preferredLayout: deviceInfo.deviceType === 'mobile' ? 'bottom-sheet' : 'overlay',
      enableSwipeGestures: deviceInfo.touchCapable,
      enableTapToAdvance: deviceInfo.deviceType === 'mobile' && deviceInfo.touchCapable,
      showProgress: true,
      showControls: true,
      maxContentLength: deviceInfo.deviceType === 'mobile' ? 150 : 300
    }
  }, [deviceInfo])

  return {
    isVisible,
    isCurrentTour,
    currentStep,
    totalSteps,
    deviceInfo,
    startResponsiveTour,
    stopResponsiveTour,
    skipResponsiveTour,
    getDeviceRecommendations
  }
}

// Higher-order component for adding responsive tour support
export function withResponsiveTour<P extends object>(
  Component: React.ComponentType<P>,
  tourConfig: {
    tourId: string
    steps: ResponsiveTourStep[]
    autoStart?: boolean
  }
) {
  const ResponsiveTourEnhancedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <>
        <Component {...props} ref={ref} />
        <ResponsiveTourController
          tourId={tourConfig.tourId}
          steps={tourConfig.steps}
          autoStart={tourConfig.autoStart}
        />
      </>
    )
  })

  ResponsiveTourEnhancedComponent.displayName = `withResponsiveTour(${Component.displayName || Component.name})`
  
  return ResponsiveTourEnhancedComponent
}