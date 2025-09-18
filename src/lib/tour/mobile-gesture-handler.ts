import { PanInfo } from 'framer-motion'

export interface GestureConfig {
  swipeThreshold: number
  velocityThreshold: number
  enableHapticFeedback: boolean
  enableSwipeGestures: boolean
  enableTapToAdvance: boolean
  enablePinchToZoom: boolean
}

export interface GestureCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  onPinchStart?: () => void
  onPinchEnd?: () => void
  onPinchZoom?: (scale: number) => void
}

export interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export class MobileGestureHandler {
  private config: GestureConfig
  private callbacks: GestureCallbacks
  private lastTap: TouchPoint | null = null
  private longPressTimer: NodeJS.Timeout | null = null
  private isLongPressing = false
  private initialPinchDistance = 0
  private currentPinchScale = 1

  constructor(config: Partial<GestureConfig> = {}, callbacks: GestureCallbacks = {}) {
    this.config = {
      swipeThreshold: 50,
      velocityThreshold: 500,
      enableHapticFeedback: true,
      enableSwipeGestures: true,
      enableTapToAdvance: true,
      enablePinchToZoom: false,
      ...config
    }
    this.callbacks = callbacks
  }

  // Update configuration
  updateConfig(newConfig: Partial<GestureConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // Update callbacks
  updateCallbacks(newCallbacks: Partial<GestureCallbacks>) {
    this.callbacks = { ...this.callbacks, ...newCallbacks }
  }

  // Haptic feedback
  private triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (!this.config.enableHapticFeedback) return
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
  }

  // Handle pan gestures (swipes)
  handlePan = (event: any, info: PanInfo) => {
    if (!this.config.enableSwipeGestures) return

    const { offset, velocity } = info
    const swipeDistanceX = Math.abs(offset.x)
    const swipeDistanceY = Math.abs(offset.y)
    const swipeVelocityX = Math.abs(velocity.x)
    const swipeVelocityY = Math.abs(velocity.y)

    // Determine primary direction
    const isHorizontal = swipeDistanceX > swipeDistanceY
    const isVertical = swipeDistanceY > swipeDistanceX

    // Check if gesture meets threshold
    const meetsThreshold = (
      (isHorizontal && (swipeDistanceX > this.config.swipeThreshold || swipeVelocityX > this.config.velocityThreshold)) ||
      (isVertical && (swipeDistanceY > this.config.swipeThreshold || swipeVelocityY > this.config.velocityThreshold))
    )

    if (!meetsThreshold) return

    this.triggerHapticFeedback('medium')

    // Handle horizontal swipes
    if (isHorizontal) {
      if (offset.x > 0) {
        // Swipe right
        this.callbacks.onSwipeRight?.()
      } else {
        // Swipe left
        this.callbacks.onSwipeLeft?.()
      }
    }

    // Handle vertical swipes
    if (isVertical) {
      if (offset.y > 0) {
        // Swipe down
        this.callbacks.onSwipeDown?.()
      } else {
        // Swipe up
        this.callbacks.onSwipeUp?.()
      }
    }
  }

  // Handle tap gestures
  handleTap = (event: any) => {
    if (!this.config.enableTapToAdvance) return

    const now = Date.now()
    const tapPoint: TouchPoint = {
      x: event.clientX || event.touches?.[0]?.clientX || 0,
      y: event.clientY || event.touches?.[0]?.clientY || 0,
      timestamp: now
    }

    // Check for double tap
    if (this.lastTap) {
      const timeDiff = now - this.lastTap.timestamp
      const distance = Math.sqrt(
        Math.pow(tapPoint.x - this.lastTap.x, 2) + 
        Math.pow(tapPoint.y - this.lastTap.y, 2)
      )

      // Double tap detected (within 300ms and 50px)
      if (timeDiff < 300 && distance < 50) {
        this.triggerHapticFeedback('medium')
        this.callbacks.onDoubleTap?.()
        this.lastTap = null
        return
      }
    }

    // Single tap
    this.triggerHapticFeedback('light')
    this.callbacks.onTap?.()
    this.lastTap = tapPoint

    // Clear last tap after double tap window
    setTimeout(() => {
      if (this.lastTap === tapPoint) {
        this.lastTap = null
      }
    }, 300)
  }

  // Handle touch start for long press detection
  handleTouchStart = (event: TouchEvent) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }

    this.isLongPressing = false
    this.longPressTimer = setTimeout(() => {
      this.isLongPressing = true
      this.triggerHapticFeedback('heavy')
      this.callbacks.onLongPress?.()
    }, 500) // 500ms for long press
  }

  // Handle touch end to clear long press
  handleTouchEnd = (event: TouchEvent) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    this.isLongPressing = false
  }

  // Handle touch move to cancel long press if moved too much
  handleTouchMove = (event: TouchEvent) => {
    if (this.longPressTimer && !this.isLongPressing) {
      // Cancel long press if finger moved too much
      const touch = event.touches[0]
      // You could add movement threshold logic here
      // For now, we'll keep the long press active during small movements
    }
  }

  // Handle pinch gestures for zoom
  handlePinchStart = (event: TouchEvent) => {
    if (!this.config.enablePinchToZoom || event.touches.length !== 2) return

    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    
    this.initialPinchDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    
    this.currentPinchScale = 1
    this.callbacks.onPinchStart?.()
  }

  handlePinchMove = (event: TouchEvent) => {
    if (!this.config.enablePinchToZoom || event.touches.length !== 2 || this.initialPinchDistance === 0) return

    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    
    this.currentPinchScale = currentDistance / this.initialPinchDistance
    this.callbacks.onPinchZoom?.(this.currentPinchScale)
  }

  handlePinchEnd = (event: TouchEvent) => {
    if (!this.config.enablePinchToZoom) return

    this.initialPinchDistance = 0
    this.currentPinchScale = 1
    this.callbacks.onPinchEnd?.()
  }

  // Attach event listeners to an element
  attachToElement(element: HTMLElement) {
    // Touch events for gestures
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    element.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    element.addEventListener('touchmove', this.handleTouchMove, { passive: false })

    // Pinch gesture events
    element.addEventListener('touchstart', this.handlePinchStart, { passive: false })
    element.addEventListener('touchmove', this.handlePinchMove, { passive: false })
    element.addEventListener('touchend', this.handlePinchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', this.handleTouchStart)
      element.removeEventListener('touchend', this.handleTouchEnd)
      element.removeEventListener('touchmove', this.handleTouchMove)
      element.removeEventListener('touchstart', this.handlePinchStart)
      element.removeEventListener('touchmove', this.handlePinchMove)
      element.removeEventListener('touchend', this.handlePinchEnd)
    }
  }

  // Clean up timers
  cleanup() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }
}

// React hook for using mobile gesture handler
export function useMobileGestureHandler(
  config: Partial<GestureConfig> = {},
  callbacks: GestureCallbacks = {}
) {
  const handlerRef = React.useRef<MobileGestureHandler | null>(null)

  React.useEffect(() => {
    handlerRef.current = new MobileGestureHandler(config, callbacks)

    return () => {
      handlerRef.current?.cleanup()
    }
  }, [])

  // Update config when it changes
  React.useEffect(() => {
    handlerRef.current?.updateConfig(config)
  }, [config])

  // Update callbacks when they change
  React.useEffect(() => {
    handlerRef.current?.updateCallbacks(callbacks)
  }, [callbacks])

  return handlerRef.current
}

// Utility functions for mobile detection and capabilities
export const MobileUtils = {
  // Detect if device is mobile
  isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase()
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
  },

  // Detect if device supports touch
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },

  // Detect if device supports haptic feedback
  supportsHapticFeedback(): boolean {
    return 'vibrate' in navigator
  },

  // Get device orientation
  getOrientation(): 'portrait' | 'landscape' {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  },

  // Get screen size category
  getScreenSize(): 'small' | 'medium' | 'large' {
    const width = window.innerWidth
    if (width < 480) return 'small'
    if (width < 768) return 'medium'
    return 'large'
  },

  // Check if device is in safe area (for notched devices)
  getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0')
    }
  },

  // Prevent default touch behaviors (like pull-to-refresh)
  preventDefaultTouchBehaviors(element: HTMLElement) {
    const preventDefault = (e: Event) => e.preventDefault()
    
    element.addEventListener('touchstart', preventDefault, { passive: false })
    element.addEventListener('touchmove', preventDefault, { passive: false })
    
    return () => {
      element.removeEventListener('touchstart', preventDefault)
      element.removeEventListener('touchmove', preventDefault)
    }
  }
}

// React hook for mobile utilities
export function useMobileUtils() {
  const [isMobile, setIsMobile] = React.useState(false)
  const [isTouch, setIsTouch] = React.useState(false)
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait')
  const [screenSize, setScreenSize] = React.useState<'small' | 'medium' | 'large'>('medium')

  React.useEffect(() => {
    const updateMobileInfo = () => {
      setIsMobile(MobileUtils.isMobileDevice())
      setIsTouch(MobileUtils.isTouchDevice())
      setOrientation(MobileUtils.getOrientation())
      setScreenSize(MobileUtils.getScreenSize())
    }

    updateMobileInfo()
    window.addEventListener('resize', updateMobileInfo)
    window.addEventListener('orientationchange', updateMobileInfo)

    return () => {
      window.removeEventListener('resize', updateMobileInfo)
      window.removeEventListener('orientationchange', updateMobileInfo)
    }
  }, [])

  return {
    isMobile,
    isTouch,
    orientation,
    screenSize,
    supportsHaptic: MobileUtils.supportsHapticFeedback(),
    safeAreaInsets: MobileUtils.getSafeAreaInsets()
  }
}

import * as React from 'react'