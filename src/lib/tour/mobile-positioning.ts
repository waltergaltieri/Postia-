export interface MobilePosition {
  x: number
  y: number
  width: number
  height: number
}

export interface ViewportInfo {
  width: number
  height: number
  scrollX: number
  scrollY: number
  safeAreaTop: number
  safeAreaBottom: number
  safeAreaLeft: number
  safeAreaRight: number
}

export interface PositioningOptions {
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto'
  offset?: number
  padding?: number
  avoidEdges?: boolean
  respectSafeArea?: boolean
  minDistanceFromEdge?: number
  maxWidth?: number
  maxHeight?: number
}

export class MobilePositioning {
  private viewport: ViewportInfo

  constructor() {
    this.viewport = this.getViewportInfo()
    this.updateViewportOnResize()
  }

  private getViewportInfo(): ViewportInfo {
    const safeAreaInsets = this.getSafeAreaInsets()
    
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.pageXOffset || document.documentElement.scrollLeft,
      scrollY: window.pageYOffset || document.documentElement.scrollTop,
      safeAreaTop: safeAreaInsets.top,
      safeAreaBottom: safeAreaInsets.bottom,
      safeAreaLeft: safeAreaInsets.left,
      safeAreaRight: safeAreaInsets.right
    }
  }

  private getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0')
    }
  }

  private updateViewportOnResize() {
    const updateViewport = () => {
      this.viewport = this.getViewportInfo()
    }

    window.addEventListener('resize', updateViewport)
    window.addEventListener('scroll', updateViewport, { passive: true })
    window.addEventListener('orientationchange', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('scroll', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }

  // Get element position relative to viewport
  getElementPosition(element: HTMLElement): MobilePosition {
    const rect = element.getBoundingClientRect()
    
    return {
      x: rect.left + this.viewport.scrollX,
      y: rect.top + this.viewport.scrollY,
      width: rect.width,
      height: rect.height
    }
  }

  // Calculate optimal position for popover relative to target element
  calculatePopoverPosition(
    targetElement: HTMLElement,
    popoverWidth: number,
    popoverHeight: number,
    options: PositioningOptions = {}
  ): MobilePosition {
    const {
      preferredPosition = 'auto',
      offset = 8,
      padding = 16,
      avoidEdges = true,
      respectSafeArea = true,
      minDistanceFromEdge = 8,
      maxWidth = this.viewport.width - (padding * 2),
      maxHeight = this.viewport.height - (padding * 2)
    } = options

    const targetPos = this.getElementPosition(targetElement)
    const safeArea = respectSafeArea ? {
      top: this.viewport.safeAreaTop,
      bottom: this.viewport.safeAreaBottom,
      left: this.viewport.safeAreaLeft,
      right: this.viewport.safeAreaRight
    } : { top: 0, bottom: 0, left: 0, right: 0 }

    // Available space in each direction
    const spaceAbove = targetPos.y - safeArea.top - padding
    const spaceBelow = this.viewport.height - (targetPos.y + targetPos.height) - safeArea.bottom - padding
    const spaceLeft = targetPos.x - safeArea.left - padding
    const spaceRight = this.viewport.width - (targetPos.x + targetPos.width) - safeArea.right - padding

    // Constrain popover dimensions
    const constrainedWidth = Math.min(popoverWidth, maxWidth)
    const constrainedHeight = Math.min(popoverHeight, maxHeight)

    let position: MobilePosition = {
      x: 0,
      y: 0,
      width: constrainedWidth,
      height: constrainedHeight
    }

    // Determine best position
    let finalPosition = preferredPosition

    if (preferredPosition === 'auto') {
      // Choose position with most available space
      const spaces = [
        { position: 'bottom', space: spaceBelow },
        { position: 'top', space: spaceAbove },
        { position: 'right', space: spaceRight },
        { position: 'left', space: spaceLeft }
      ]

      spaces.sort((a, b) => b.space - a.space)
      finalPosition = spaces[0].position as 'top' | 'bottom' | 'left' | 'right'

      // Fallback to center if no position has enough space
      if (spaces[0].space < constrainedHeight && (finalPosition === 'top' || finalPosition === 'bottom')) {
        finalPosition = 'center'
      }
      if (spaces[0].space < constrainedWidth && (finalPosition === 'left' || finalPosition === 'right')) {
        finalPosition = 'center'
      }
    }

    // Calculate position based on final position choice
    switch (finalPosition) {
      case 'top':
        position.x = targetPos.x + (targetPos.width / 2) - (constrainedWidth / 2)
        position.y = targetPos.y - constrainedHeight - offset
        break

      case 'bottom':
        position.x = targetPos.x + (targetPos.width / 2) - (constrainedWidth / 2)
        position.y = targetPos.y + targetPos.height + offset
        break

      case 'left':
        position.x = targetPos.x - constrainedWidth - offset
        position.y = targetPos.y + (targetPos.height / 2) - (constrainedHeight / 2)
        break

      case 'right':
        position.x = targetPos.x + targetPos.width + offset
        position.y = targetPos.y + (targetPos.height / 2) - (constrainedHeight / 2)
        break

      case 'center':
      default:
        position.x = (this.viewport.width / 2) - (constrainedWidth / 2)
        position.y = (this.viewport.height / 2) - (constrainedHeight / 2)
        break
    }

    // Adjust position to avoid edges if enabled
    if (avoidEdges) {
      position = this.adjustPositionForEdges(position, {
        minDistanceFromEdge,
        respectSafeArea,
        safeArea
      })
    }

    return position
  }

  // Adjust position to keep popover within viewport bounds
  private adjustPositionForEdges(
    position: MobilePosition,
    options: {
      minDistanceFromEdge: number
      respectSafeArea: boolean
      safeArea: { top: number; bottom: number; left: number; right: number }
    }
  ): MobilePosition {
    const { minDistanceFromEdge, respectSafeArea, safeArea } = options
    const adjusted = { ...position }

    const minX = respectSafeArea ? safeArea.left + minDistanceFromEdge : minDistanceFromEdge
    const maxX = this.viewport.width - (respectSafeArea ? safeArea.right : 0) - position.width - minDistanceFromEdge
    const minY = respectSafeArea ? safeArea.top + minDistanceFromEdge : minDistanceFromEdge
    const maxY = this.viewport.height - (respectSafeArea ? safeArea.bottom : 0) - position.height - minDistanceFromEdge

    // Clamp position within bounds
    adjusted.x = Math.max(minX, Math.min(adjusted.x, maxX))
    adjusted.y = Math.max(minY, Math.min(adjusted.y, maxY))

    return adjusted
  }

  // Calculate position for bottom sheet layout
  calculateBottomSheetPosition(
    height: number,
    options: { respectSafeArea?: boolean; padding?: number } = {}
  ): MobilePosition {
    const { respectSafeArea = true, padding = 0 } = options
    const safeAreaBottom = respectSafeArea ? this.viewport.safeAreaBottom : 0

    return {
      x: 0,
      y: this.viewport.height - height - safeAreaBottom - padding,
      width: this.viewport.width,
      height: height
    }
  }

  // Calculate position for fullscreen layout
  calculateFullscreenPosition(
    options: { respectSafeArea?: boolean; padding?: number } = {}
  ): MobilePosition {
    const { respectSafeArea = true, padding = 0 } = options
    const safeArea = respectSafeArea ? {
      top: this.viewport.safeAreaTop,
      bottom: this.viewport.safeAreaBottom,
      left: this.viewport.safeAreaLeft,
      right: this.viewport.safeAreaRight
    } : { top: 0, bottom: 0, left: 0, right: 0 }

    return {
      x: safeArea.left + padding,
      y: safeArea.top + padding,
      width: this.viewport.width - safeArea.left - safeArea.right - (padding * 2),
      height: this.viewport.height - safeArea.top - safeArea.bottom - (padding * 2)
    }
  }

  // Check if element is visible in viewport
  isElementVisible(element: HTMLElement, threshold: number = 0.5): boolean {
    const rect = element.getBoundingClientRect()
    const elementArea = rect.width * rect.height
    
    if (elementArea === 0) return false

    // Calculate visible area
    const visibleLeft = Math.max(0, rect.left)
    const visibleTop = Math.max(0, rect.top)
    const visibleRight = Math.min(this.viewport.width, rect.right)
    const visibleBottom = Math.min(this.viewport.height, rect.bottom)
    
    const visibleWidth = Math.max(0, visibleRight - visibleLeft)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
    const visibleArea = visibleWidth * visibleHeight
    
    return (visibleArea / elementArea) >= threshold
  }

  // Scroll element into view with mobile-friendly behavior
  scrollElementIntoView(
    element: HTMLElement,
    options: {
      behavior?: 'smooth' | 'instant'
      block?: 'start' | 'center' | 'end' | 'nearest'
      inline?: 'start' | 'center' | 'end' | 'nearest'
      offset?: number
    } = {}
  ): Promise<void> {
    const {
      behavior = 'smooth',
      block = 'center',
      inline = 'nearest',
      offset = 0
    } = options

    return new Promise((resolve) => {
      const rect = element.getBoundingClientRect()
      const targetY = rect.top + this.viewport.scrollY + offset

      // Use native scrollIntoView for better mobile support
      element.scrollIntoView({
        behavior,
        block,
        inline
      })

      // Wait for scroll to complete
      if (behavior === 'smooth') {
        setTimeout(resolve, 500) // Approximate smooth scroll duration
      } else {
        resolve()
      }
    })
  }

  // Get optimal spotlight radius for mobile
  calculateSpotlightRadius(targetElement: HTMLElement): number {
    const rect = targetElement.getBoundingClientRect()
    const diagonal = Math.sqrt(rect.width * rect.width + rect.height * rect.height)
    
    // Base radius on element size and screen size
    const baseRadius = Math.max(diagonal / 2, 20)
    const screenSizeMultiplier = this.viewport.width < 480 ? 1.2 : 1.5
    
    return Math.min(baseRadius * screenSizeMultiplier, this.viewport.width / 4)
  }

  // Check if device is in landscape mode
  isLandscape(): boolean {
    return this.viewport.width > this.viewport.height
  }

  // Get current viewport info
  getViewport(): ViewportInfo {
    return { ...this.viewport }
  }
}

// React hook for mobile positioning
export function useMobilePositioning() {
  const positioningRef = React.useRef<MobilePositioning | null>(null)
  const [viewport, setViewport] = React.useState<ViewportInfo | null>(null)

  React.useEffect(() => {
    positioningRef.current = new MobilePositioning()
    setViewport(positioningRef.current.getViewport())

    const updateViewport = () => {
      if (positioningRef.current) {
        setViewport(positioningRef.current.getViewport())
      }
    }

    window.addEventListener('resize', updateViewport)
    window.addEventListener('scroll', updateViewport, { passive: true })
    window.addEventListener('orientationchange', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('scroll', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  const calculatePopoverPosition = React.useCallback((
    targetElement: HTMLElement,
    popoverWidth: number,
    popoverHeight: number,
    options?: PositioningOptions
  ) => {
    return positioningRef.current?.calculatePopoverPosition(
      targetElement,
      popoverWidth,
      popoverHeight,
      options
    )
  }, [])

  const scrollElementIntoView = React.useCallback((
    element: HTMLElement,
    options?: Parameters<MobilePositioning['scrollElementIntoView']>[1]
  ) => {
    return positioningRef.current?.scrollElementIntoView(element, options)
  }, [])

  const isElementVisible = React.useCallback((
    element: HTMLElement,
    threshold?: number
  ) => {
    return positioningRef.current?.isElementVisible(element, threshold) ?? false
  }, [])

  return {
    viewport,
    calculatePopoverPosition,
    scrollElementIntoView,
    isElementVisible,
    positioning: positioningRef.current
  }
}

// Utility functions for mobile positioning
export const MobilePositioningUtils = {
  // Get optimal layout for current screen
  getOptimalLayout(viewport: ViewportInfo): 'overlay' | 'bottom-sheet' | 'fullscreen' {
    const isSmallScreen = viewport.width < 480
    const isLandscape = viewport.width > viewport.height
    const hasNotch = viewport.safeAreaTop > 20

    if (isSmallScreen || (isLandscape && hasNotch)) {
      return 'bottom-sheet'
    }

    if (viewport.height < 600) {
      return 'fullscreen'
    }

    return 'overlay'
  },

  // Calculate safe positioning bounds
  getSafePositioningBounds(viewport: ViewportInfo, respectSafeArea: boolean = true): {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  } {
    const safeArea = respectSafeArea ? {
      top: viewport.safeAreaTop,
      bottom: viewport.safeAreaBottom,
      left: viewport.safeAreaLeft,
      right: viewport.safeAreaRight
    } : { top: 0, bottom: 0, left: 0, right: 0 }

    return {
      left: safeArea.left,
      top: safeArea.top,
      right: viewport.width - safeArea.right,
      bottom: viewport.height - safeArea.bottom,
      width: viewport.width - safeArea.left - safeArea.right,
      height: viewport.height - safeArea.top - safeArea.bottom
    }
  },

  // Check if position is within safe bounds
  isPositionSafe(
    position: MobilePosition,
    viewport: ViewportInfo,
    respectSafeArea: boolean = true
  ): boolean {
    const bounds = this.getSafePositioningBounds(viewport, respectSafeArea)
    
    return (
      position.x >= bounds.left &&
      position.y >= bounds.top &&
      position.x + position.width <= bounds.right &&
      position.y + position.height <= bounds.bottom
    )
  }
}

import * as React from 'react'