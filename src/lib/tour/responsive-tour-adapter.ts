import * as React from 'react'
import { TourStep, TourDefinition } from '@/types/tour'

export interface ResponsiveBreakpoints {
  mobile: number
  tablet: number
  desktop: number
}

export interface ResponsiveTourConfig {
  breakpoints: ResponsiveBreakpoints
  adaptiveContent: boolean
  adaptiveLayout: boolean
  adaptiveControls: boolean
  mobileFirstApproach: boolean
}

export interface DeviceInfo {
  screenWidth: number
  screenHeight: number
  deviceType: 'mobile' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
  touchCapable: boolean
  pixelRatio: number
}

export interface ResponsiveTourStep extends TourStep {
  // Device-specific content
  mobileTitle?: string
  tabletTitle?: string
  desktopTitle?: string
  mobileDescription?: string
  tabletDescription?: string
  desktopDescription?: string
  
  // Device-specific positioning
  mobilePosition?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto'
  tabletPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto'
  desktopPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto'
  
  // Device-specific selectors
  mobileElement?: string | HTMLElement
  tabletElement?: string | HTMLElement
  desktopElement?: string | HTMLElement
  
  // Device-specific visibility
  showOnMobile?: boolean
  showOnTablet?: boolean
  showOnDesktop?: boolean
  
  // Touch-specific options
  touchInstructions?: string
  swipeDirection?: 'left' | 'right' | 'up' | 'down'
  tapTarget?: boolean
}

export class ResponsiveTourAdapter {
  private config: ResponsiveTourConfig
  private deviceInfo: DeviceInfo

  constructor(config: Partial<ResponsiveTourConfig> = {}) {
    this.config = {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      },
      adaptiveContent: true,
      adaptiveLayout: true,
      adaptiveControls: true,
      mobileFirstApproach: true,
      ...config
    }
    
    this.deviceInfo = this.getDeviceInfo()
    this.setupResponsiveListeners()
  }

  private getDeviceInfo(): DeviceInfo {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (screenWidth < this.config.breakpoints.mobile) {
      deviceType = 'mobile'
    } else if (screenWidth < this.config.breakpoints.tablet) {
      deviceType = 'tablet'
    }

    return {
      screenWidth,
      screenHeight,
      deviceType,
      orientation: screenWidth > screenHeight ? 'landscape' : 'portrait',
      touchCapable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1
    }
  }

  private setupResponsiveListeners() {
    const updateDeviceInfo = () => {
      this.deviceInfo = this.getDeviceInfo()
    }

    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }

  // Adapt tour steps for current device
  adaptTourSteps(steps: ResponsiveTourStep[]): ResponsiveTourStep[] {
    return steps
      .filter(step => this.shouldShowStepOnDevice(step))
      .map(step => this.adaptStepForDevice(step))
  }

  private shouldShowStepOnDevice(step: ResponsiveTourStep): boolean {
    const { deviceType } = this.deviceInfo
    
    switch (deviceType) {
      case 'mobile':
        return step.showOnMobile !== false
      case 'tablet':
        return step.showOnTablet !== false
      case 'desktop':
        return step.showOnDesktop !== false
      default:
        return true
    }
  }

  private adaptStepForDevice(step: ResponsiveTourStep): ResponsiveTourStep {
    const { deviceType } = this.deviceInfo
    const adaptedStep = { ...step }

    if (this.config.adaptiveContent) {
      // Adapt title
      if (deviceType === 'mobile' && step.mobileTitle) {
        adaptedStep.title = step.mobileTitle
      } else if (deviceType === 'tablet' && step.tabletTitle) {
        adaptedStep.title = step.tabletTitle
      } else if (deviceType === 'desktop' && step.desktopTitle) {
        adaptedStep.title = step.desktopTitle
      }

      // Adapt description
      if (deviceType === 'mobile' && step.mobileDescription) {
        adaptedStep.description = step.mobileDescription
      } else if (deviceType === 'tablet' && step.tabletDescription) {
        adaptedStep.description = step.tabletDescription
      } else if (deviceType === 'desktop' && step.desktopDescription) {
        adaptedStep.description = step.desktopDescription
      }

      // Add touch instructions for mobile
      if (deviceType === 'mobile' && this.deviceInfo.touchCapable && step.touchInstructions) {
        adaptedStep.description = `${adaptedStep.description}\n\n${step.touchInstructions}`
      }
    }

    // Adapt positioning
    if (deviceType === 'mobile' && step.mobilePosition) {
      adaptedStep.position = step.mobilePosition
    } else if (deviceType === 'tablet' && step.tabletPosition) {
      adaptedStep.position = step.tabletPosition
    } else if (deviceType === 'desktop' && step.desktopPosition) {
      adaptedStep.position = step.desktopPosition
    }

    // Adapt element selector
    if (deviceType === 'mobile' && step.mobileElement) {
      adaptedStep.element = step.mobileElement
    } else if (deviceType === 'tablet' && step.tabletElement) {
      adaptedStep.element = step.tabletElement
    } else if (deviceType === 'desktop' && step.desktopElement) {
      adaptedStep.element = step.desktopElement
    }

    return adaptedStep
  }

  // Get optimal layout for current device
  getOptimalLayout(): 'overlay' | 'bottom-sheet' | 'fullscreen' | 'sidebar' {
    const { deviceType, orientation, screenHeight } = this.deviceInfo

    if (deviceType === 'mobile') {
      if (orientation === 'landscape' || screenHeight < 600) {
        return 'bottom-sheet'
      }
      return 'overlay'
    }

    if (deviceType === 'tablet') {
      if (orientation === 'portrait') {
        return 'overlay'
      }
      return 'sidebar'
    }

    return 'sidebar'
  }

  // Get optimal control configuration
  getOptimalControls(): {
    variant: 'default' | 'compact' | 'minimal' | 'floating'
    position: 'top' | 'bottom' | 'floating' | 'inline'
    showProgress: boolean
    showStepCounter: boolean
    enableSwipeGestures: boolean
    enableTapToAdvance: boolean
  } {
    const { deviceType, touchCapable } = this.deviceInfo

    if (deviceType === 'mobile') {
      return {
        variant: 'compact',
        position: 'bottom',
        showProgress: true,
        showStepCounter: true,
        enableSwipeGestures: touchCapable,
        enableTapToAdvance: touchCapable
      }
    }

    if (deviceType === 'tablet') {
      return {
        variant: 'default',
        position: 'floating',
        showProgress: true,
        showStepCounter: true,
        enableSwipeGestures: touchCapable,
        enableTapToAdvance: false
      }
    }

    return {
      variant: 'default',
      position: 'floating',
      showProgress: true,
      showStepCounter: true,
      enableSwipeGestures: false,
      enableTapToAdvance: false
    }
  }

  // Get content adaptation recommendations
  getContentAdaptations(): {
    maxTitleLength: number
    maxDescriptionLength: number
    preferBulletPoints: boolean
    includeVisualCues: boolean
    simplifyLanguage: boolean
  } {
    const { deviceType, screenWidth } = this.deviceInfo

    if (deviceType === 'mobile') {
      return {
        maxTitleLength: screenWidth < 360 ? 30 : 40,
        maxDescriptionLength: screenWidth < 360 ? 100 : 150,
        preferBulletPoints: true,
        includeVisualCues: true,
        simplifyLanguage: true
      }
    }

    if (deviceType === 'tablet') {
      return {
        maxTitleLength: 60,
        maxDescriptionLength: 200,
        preferBulletPoints: false,
        includeVisualCues: true,
        simplifyLanguage: false
      }
    }

    return {
      maxTitleLength: 80,
      maxDescriptionLength: 300,
      preferBulletPoints: false,
      includeVisualCues: false,
      simplifyLanguage: false
    }
  }

  // Check if element is accessible on current device
  isElementAccessible(element: string | HTMLElement): boolean {
    const el = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element

    if (!el) return false

    const rect = el.getBoundingClientRect()
    const { screenWidth, screenHeight, deviceType } = this.deviceInfo

    // Check if element is visible
    if (rect.width === 0 || rect.height === 0) return false

    // Check if element is within viewport
    if (rect.left < 0 || rect.top < 0 || 
        rect.right > screenWidth || rect.bottom > screenHeight) {
      return false
    }

    // Check minimum touch target size for mobile
    if (deviceType === 'mobile' && this.deviceInfo.touchCapable) {
      const minTouchSize = 44 // 44px minimum touch target
      if (rect.width < minTouchSize || rect.height < minTouchSize) {
        return false
      }
    }

    return true
  }

  // Get current device info
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo }
  }

  // Update configuration
  updateConfig(newConfig: Partial<ResponsiveTourConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
}

// React hook for responsive tour adaptation
export function useResponsiveTourAdapter(config?: Partial<ResponsiveTourConfig>) {
  const adapterRef = React.useRef<ResponsiveTourAdapter | null>(null)
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo | null>(null)

  React.useEffect(() => {
    adapterRef.current = new ResponsiveTourAdapter(config)
    setDeviceInfo(adapterRef.current.getDeviceInfo())

    const updateDeviceInfo = () => {
      if (adapterRef.current) {
        setDeviceInfo(adapterRef.current.getDeviceInfo())
      }
    }

    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  const adaptTourSteps = React.useCallback((steps: ResponsiveTourStep[]) => {
    return adapterRef.current?.adaptTourSteps(steps) || steps
  }, [])

  const getOptimalLayout = React.useCallback(() => {
    return adapterRef.current?.getOptimalLayout() || 'overlay'
  }, [deviceInfo])

  const getOptimalControls = React.useCallback(() => {
    return adapterRef.current?.getOptimalControls() || {
      variant: 'default' as const,
      position: 'floating' as const,
      showProgress: true,
      showStepCounter: true,
      enableSwipeGestures: false,
      enableTapToAdvance: false
    }
  }, [deviceInfo])

  const isElementAccessible = React.useCallback((element: string | HTMLElement) => {
    return adapterRef.current?.isElementAccessible(element) || false
  }, [])

  return {
    deviceInfo,
    adaptTourSteps,
    getOptimalLayout,
    getOptimalControls,
    isElementAccessible,
    adapter: adapterRef.current
  }
}

// Utility functions for responsive tour behavior
export const ResponsiveTourUtils = {
  // Create responsive tour step
  createResponsiveStep(
    baseStep: TourStep,
    responsiveOptions: Partial<ResponsiveTourStep>
  ): ResponsiveTourStep {
    return {
      ...baseStep,
      ...responsiveOptions
    }
  },

  // Generate mobile-optimized content
  optimizeContentForMobile(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content

    // Find the last complete sentence within the limit
    const truncated = content.substring(0, maxLength)
    const lastSentence = truncated.lastIndexOf('.')
    
    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1)
    }

    // Fallback to word boundary
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  },

  // Check if device supports specific features
  getDeviceCapabilities(): {
    supportsTouch: boolean
    supportsHover: boolean
    supportsKeyboard: boolean
    supportsHaptics: boolean
    supportsOrientation: boolean
  } {
    return {
      supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      supportsHover: window.matchMedia('(hover: hover)').matches,
      supportsKeyboard: !('ontouchstart' in window),
      supportsHaptics: 'vibrate' in navigator,
      supportsOrientation: 'orientation' in window || 'onorientationchange' in window
    }
  },

  // Get safe area insets for modern mobile devices
  getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0')
    }
  }
}