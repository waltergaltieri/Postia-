'use client'

import * as React from 'react'
import { useTour } from './use-tour'
import { useResponsiveTourAdapter, ResponsiveTourStep } from '@/lib/tour/responsive-tour-adapter'
import { useResponsiveContentGenerator } from '@/lib/tour/responsive-content-generator'
import { announceToScreenReader } from '@/lib/accessibility'

export interface ResponsiveTourOptions {
  tourId: string
  steps: ResponsiveTourStep[]
  autoStart?: boolean
  adaptContent?: boolean
  adaptLayout?: boolean
  enableSwipeGestures?: boolean
  enableTapToAdvance?: boolean
  enableHapticFeedback?: boolean
  onTourStart?: () => void
  onTourComplete?: () => void
  onTourSkip?: () => void
  onStepChange?: (step: number, stepData: ResponsiveTourStep) => void
  onDeviceChange?: (deviceInfo: any) => void
}

export interface ResponsiveTourState {
  isActive: boolean
  currentStep: number
  totalSteps: number
  currentStepData: ResponsiveTourStep | null
  targetElement: HTMLElement | null
  adaptedSteps: ResponsiveTourStep[]
  deviceInfo: any
  optimalLayout: string
  optimalControls: any
  stepContent: any
  accessibilityContent: any
}

export function useResponsiveTour(options: ResponsiveTourOptions) {
  const {
    tourId,
    steps,
    autoStart = false,
    adaptContent = true,
    adaptLayout = true,
    enableSwipeGestures = true,
    enableTapToAdvance = true,
    enableHapticFeedback = true,
    onTourStart,
    onTourComplete,
    onTourSkip,
    onStepChange,
    onDeviceChange
  } = options

  // Core tour functionality
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

  // Responsive adaptation
  const {
    deviceInfo,
    adaptTourSteps,
    getOptimalLayout,
    getOptimalControls,
    isElementAccessible
  } = useResponsiveTourAdapter()

  // Content generation
  const {
    generateContent,
    generateStepInstructions,
    generateAccessibilityContent
  } = useResponsiveContentGenerator()

  // State management
  const [adaptedSteps, setAdaptedSteps] = React.useState<ResponsiveTourStep[]>([])
  const [currentStepData, setCurrentStepData] = React.useState<ResponsiveTourStep | null>(null)
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)
  const [isInitialized, setIsInitialized] = React.useState(false)

  // Initialize and adapt steps when device info or steps change
  React.useEffect(() => {
    if (deviceInfo && steps.length > 0) {
      const adapted = adaptTourSteps(steps)
      setAdaptedSteps(adapted)
      setIsInitialized(true)
      
      // Notify about device changes
      onDeviceChange?.(deviceInfo)
    }
  }, [deviceInfo, steps, adaptTourSteps, onDeviceChange])

  // Update current step data when step changes
  React.useEffect(() => {
    if (adaptedSteps.length > 0 && currentStep > 0 && currentTour === tourId) {
      const stepData = adaptedSteps[currentStep - 1]
      setCurrentStepData(stepData)
      
      // Update target element
      if (stepData?.element) {
        const element = typeof stepData.element === 'string'
          ? document.querySelector(stepData.element) as HTMLElement
          : stepData.element
        
        if (element && isElementAccessible(element)) {
          setTargetElement(element)
          
          // Scroll element into view for mobile
          if (deviceInfo?.deviceType === 'mobile') {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            })
          }
        } else {
          setTargetElement(null)
        }
      }
      
      // Notify about step changes
      onStepChange?.(currentStep, stepData)
    }
  }, [adaptedSteps, currentStep, currentTour, tourId, isElementAccessible, deviceInfo, onStepChange])

  // Auto-start tour when initialized
  React.useEffect(() => {
    if (autoStart && isInitialized && !currentTour && adaptedSteps.length > 0) {
      startTour(tourId)
      onTourStart?.()
      announceToScreenReader('Tour responsivo iniciado', 'assertive')
    }
  }, [autoStart, isInitialized, currentTour, adaptedSteps.length, tourId, startTour, onTourStart])

  // Generate responsive content for current step
  const stepContent = React.useMemo(() => {
    if (!currentStepData || !deviceInfo || !adaptContent) {
      return currentStepData ? {
        title: currentStepData.title,
        description: currentStepData.description
      } : null
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
          short: currentStepData.mobileTitle || currentStepData.title,
          medium: currentStepData.tabletTitle || currentStepData.title,
          long: currentStepData.desktopTitle || currentStepData.title
        },
        description: {
          short: currentStepData.mobileDescription || currentStepData.description,
          medium: currentStepData.tabletDescription || currentStepData.description,
          long: currentStepData.desktopDescription || currentStepData.description
        },
        touchInstructions: currentStepData.touchInstructions
      }
    )
  }, [currentStepData, deviceInfo, currentStep, adaptContent, generateContent])

  // Generate accessibility content
  const accessibilityContent = React.useMemo(() => {
    if (!stepContent || !deviceInfo) return null

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
  const optimalLayout = React.useMemo(() => {
    return adaptLayout ? getOptimalLayout() : 'overlay'
  }, [adaptLayout, getOptimalLayout, deviceInfo])

  const optimalControls = React.useMemo(() => {
    const controls = getOptimalControls()
    return {
      ...controls,
      enableSwipeGestures: enableSwipeGestures && controls.enableSwipeGestures,
      enableTapToAdvance: enableTapToAdvance && controls.enableTapToAdvance
    }
  }, [getOptimalControls, enableSwipeGestures, enableTapToAdvance, deviceInfo])

  // Tour control functions
  const startResponsiveTour = React.useCallback(() => {
    if (adaptedSteps.length > 0) {
      startTour(tourId)
      onTourStart?.()
      announceToScreenReader('Tour responsivo iniciado', 'assertive')
    }
  }, [adaptedSteps.length, startTour, tourId, onTourStart])

  const nextStepResponsive = React.useCallback(() => {
    if (currentStep < adaptedSteps.length) {
      nextStep()
    } else {
      stopTour()
      onTourComplete?.()
      announceToScreenReader('Tour completado', 'assertive')
    }
  }, [currentStep, adaptedSteps.length, nextStep, stopTour, onTourComplete])

  const previousStepResponsive = React.useCallback(() => {
    if (currentStep > 1) {
      previousStep()
    }
  }, [currentStep, previousStep])

  const skipResponsiveTour = React.useCallback(() => {
    skipTour()
    onTourSkip?.()
    announceToScreenReader('Tour omitido', 'assertive')
  }, [skipTour, onTourSkip])

  const stopResponsiveTour = React.useCallback(() => {
    stopTour()
    announceToScreenReader('Tour cerrado', 'assertive')
  }, [stopTour])

  // Haptic feedback function
  const triggerHapticFeedback = React.useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !deviceInfo?.touchCapable) return
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
  }, [enableHapticFeedback, deviceInfo])

  // Enhanced event handlers with haptic feedback
  const handleNext = React.useCallback(() => {
    triggerHapticFeedback('light')
    nextStepResponsive()
  }, [triggerHapticFeedback, nextStepResponsive])

  const handlePrevious = React.useCallback(() => {
    triggerHapticFeedback('light')
    previousStepResponsive()
  }, [triggerHapticFeedback, previousStepResponsive])

  const handleSkip = React.useCallback(() => {
    triggerHapticFeedback('heavy')
    skipResponsiveTour()
  }, [triggerHapticFeedback, skipResponsiveTour])

  const handleClose = React.useCallback(() => {
    triggerHapticFeedback('heavy')
    stopResponsiveTour()
  }, [triggerHapticFeedback, stopResponsiveTour])

  // Swipe gesture handlers
  const handleSwipeNext = React.useCallback(() => {
    if (optimalControls.enableSwipeGestures) {
      triggerHapticFeedback('medium')
      nextStepResponsive()
    }
  }, [optimalControls.enableSwipeGestures, triggerHapticFeedback, nextStepResponsive])

  const handleSwipePrevious = React.useCallback(() => {
    if (optimalControls.enableSwipeGestures) {
      triggerHapticFeedback('medium')
      previousStepResponsive()
    }
  }, [optimalControls.enableSwipeGestures, triggerHapticFeedback, previousStepResponsive])

  // Tap to advance handler
  const handleTapToAdvance = React.useCallback(() => {
    if (optimalControls.enableTapToAdvance) {
      triggerHapticFeedback('light')
      nextStepResponsive()
    }
  }, [optimalControls.enableTapToAdvance, triggerHapticFeedback, nextStepResponsive])

  // Get step instructions
  const getStepInstructions = React.useCallback(() => {
    if (!deviceInfo) return []

    const contentOptions = {
      deviceType: deviceInfo.deviceType,
      screenSize: deviceInfo.screenWidth < 480 ? 'small' as const : 
                 deviceInfo.screenWidth < 768 ? 'medium' as const : 'large' as const,
      orientation: deviceInfo.orientation,
      touchCapable: deviceInfo.touchCapable
    }

    return generateStepInstructions(currentStep, adaptedSteps.length, contentOptions)
  }, [deviceInfo, currentStep, adaptedSteps.length, generateStepInstructions])

  // Check if tour is active and current
  const isCurrentTour = currentTour === tourId
  const isVisible = isActive && isCurrentTour

  // Build state object
  const state: ResponsiveTourState = {
    isActive: isVisible,
    currentStep,
    totalSteps: adaptedSteps.length,
    currentStepData,
    targetElement,
    adaptedSteps,
    deviceInfo,
    optimalLayout,
    optimalControls,
    stepContent,
    accessibilityContent
  }

  return {
    // State
    ...state,
    isInitialized,
    isCurrentTour,
    isVisible,

    // Control functions
    startTour: startResponsiveTour,
    nextStep: handleNext,
    previousStep: handlePrevious,
    skipTour: handleSkip,
    stopTour: handleClose,

    // Gesture handlers
    handleSwipeNext,
    handleSwipePrevious,
    handleTapToAdvance,

    // Utility functions
    getStepInstructions,
    triggerHapticFeedback,

    // Raw control functions (without haptic feedback)
    rawNextStep: nextStepResponsive,
    rawPreviousStep: previousStepResponsive,
    rawSkipTour: skipResponsiveTour,
    rawStopTour: stopResponsiveTour
  }
}

// Hook for responsive tour configuration
export function useResponsiveTourConfig(tourId: string) {
  const [config, setConfig] = React.useState<ResponsiveTourOptions | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadTourConfig = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Try to load responsive tour config
        const response = await import(`@/lib/tour/configs/responsive-${tourId}.json`)
        const tourData = response.default

        if (tourData && tourData.steps) {
          setConfig({
            tourId: tourData.id,
            steps: tourData.steps,
            autoStart: false,
            adaptContent: true,
            adaptLayout: true,
            enableSwipeGestures: true,
            enableTapToAdvance: true,
            enableHapticFeedback: true
          })
        } else {
          throw new Error('Invalid tour configuration')
        }
      } catch (err) {
        console.warn(`Responsive tour config not found for ${tourId}, falling back to regular config`)
        setError(`Configuration not found: ${err}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadTourConfig()
  }, [tourId])

  return {
    config,
    isLoading,
    error,
    setConfig
  }
}