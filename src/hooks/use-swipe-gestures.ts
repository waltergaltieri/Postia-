'use client'

import { useRef, useCallback } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  preventDefaultTouchmoveEvent?: boolean
}

interface TouchPosition {
  x: number
  y: number
}

export function useSwipeGestures(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false
  } = options

  const touchStartPos = useRef<TouchPosition | null>(null)
  const touchEndPos = useRef<TouchPosition | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault()
    }
  }, [preventDefaultTouchmoveEvent])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return

    const touch = e.changedTouches[0]
    touchEndPos.current = {
      x: touch.clientX,
      y: touch.clientY
    }

    const deltaX = touchEndPos.current.x - touchStartPos.current.x
    const deltaY = touchEndPos.current.y - touchStartPos.current.y

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Determine if this is a horizontal or vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }
    }

    // Reset positions
    touchStartPos.current = null
    touchEndPos.current = null
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}

/**
 * Hook for common swipe actions in the app
 */
export function useCommonSwipeActions() {
  const swipeActions = {
    // Swipe right to go back
    goBack: () => {
      if (window.history.length > 1) {
        window.history.back()
      }
    },
    
    // Swipe left to open menu (could be implemented)
    openMenu: () => {
      // This would trigger menu opening
      console.log('Open menu gesture')
    },
    
    // Swipe up to refresh
    refresh: () => {
      window.location.reload()
    },
    
    // Swipe down to close modal/drawer
    closeOverlay: () => {
      // This would close any open overlays
      console.log('Close overlay gesture')
    }
  }

  return swipeActions
}