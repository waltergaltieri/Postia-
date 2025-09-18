'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TouchFeedbackProps {
  children: React.ReactNode
  onTap?: () => void
  onLongPress?: () => void
  longPressDuration?: number
  hapticFeedback?: boolean
  rippleEffect?: boolean
  scaleEffect?: boolean
  className?: string
  disabled?: boolean
}

export default function TouchFeedback({
  children,
  onTap,
  onLongPress,
  longPressDuration = 500,
  hapticFeedback = true,
  rippleEffect = true,
  scaleEffect = true,
  className,
  disabled = false
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)
  const rippleCounter = useRef(0)

  const triggerHapticFeedback = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10) // Short vibration
    }
  }, [hapticFeedback])

  const createRipple = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!rippleEffect || !elementRef.current) return

    const rect = elementRef.current.getBoundingClientRect()
    const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left
    const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top

    const rippleId = rippleCounter.current++
    setRipples(prev => [...prev, { id: rippleId, x, y }])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== rippleId))
    }, 600)
  }, [rippleEffect])

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return

    setIsPressed(true)
    createRipple(event)
    triggerHapticFeedback()

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress()
        triggerHapticFeedback()
      }, longPressDuration)
    }
  }, [disabled, createRipple, triggerHapticFeedback, onLongPress, longPressDuration])

  const handleTouchEnd = useCallback(() => {
    if (disabled) return

    setIsPressed(false)

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (onTap) {
      onTap()
    }
  }, [disabled, onTap])

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false)

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Mouse events for desktop compatibility
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return
    
    setIsPressed(true)
    createRipple(event)

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress()
      }, longPressDuration)
    }
  }, [disabled, createRipple, onLongPress, longPressDuration])

  const handleMouseUp = useCallback(() => {
    if (disabled) return

    setIsPressed(false)

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (onTap) {
      onTap()
    }
  }, [disabled, onTap])

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false)

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  return (
    <motion.div
      ref={elementRef}
      className={cn(
        "relative overflow-hidden select-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      animate={{
        scale: scaleEffect && isPressed ? 0.95 : 1
      }}
      transition={{
        duration: 0.1,
        ease: "easeOut"
      }}
    >
      {children}

      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
          initial={{
            width: 0,
            height: 0,
            opacity: 0.5,
            x: '-50%',
            y: '-50%'
          }}
          animate={{
            width: 200,
            height: 200,
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
        >
          <div className="w-full h-full bg-current rounded-full opacity-20" />
        </motion.div>
      ))}

      {/* Press State Overlay */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 bg-current opacity-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        />
      )}
    </motion.div>
  )
}

// Preset configurations for common use cases
export const touchPresets = {
  button: {
    hapticFeedback: true,
    rippleEffect: true,
    scaleEffect: true,
  },
  card: {
    hapticFeedback: false,
    rippleEffect: true,
    scaleEffect: false,
  },
  listItem: {
    hapticFeedback: false,
    rippleEffect: false,
    scaleEffect: true,
  },
  icon: {
    hapticFeedback: true,
    rippleEffect: true,
    scaleEffect: true,
  }
}