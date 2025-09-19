'use client'

import { useState, useRef } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { Trash2, Edit, Share, Archive, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: 'destructive' | 'primary' | 'secondary' | 'success' | 'warning'
  onAction: () => void
}

interface SwipeActionsProps {
  children: React.ReactNode
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  threshold?: number
  className?: string
}

const actionColors = {
  destructive: 'bg-error-500 text-white',
  primary: 'bg-info-500 text-white',
  secondary: 'bg-gray-500 text-white',
  success: 'bg-success-500 text-white',
  warning: 'bg-warning-500 text-white'
}

export default function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className
}: SwipeActionsProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null)
  const x = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Transform values for action visibility
  const leftActionOpacity = useTransform(x, [0, threshold], [0, 1])
  const rightActionOpacity = useTransform(x, [-threshold, 0], [1, 0])

  const handlePanEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info
    const swipeThreshold = threshold
    const velocityThreshold = 500

    if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      // Swipe right - reveal left actions
      if (leftActions.length > 0) {
        setIsRevealed('left')
        x.set(leftActions.length * 80)
      } else {
        x.set(0)
      }
    } else if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      // Swipe left - reveal right actions
      if (rightActions.length > 0) {
        setIsRevealed('right')
        x.set(-rightActions.length * 80)
      } else {
        x.set(0)
      }
    } else {
      // Return to center
      setIsRevealed(null)
      x.set(0)
    }
  }

  const handleActionClick = (action: SwipeAction) => {
    action.onAction()
    // Reset position after action
    setIsRevealed(null)
    x.set(0)
  }

  const resetPosition = () => {
    setIsRevealed(null)
    x.set(0)
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex items-center"
          style={{ opacity: leftActionOpacity }}
        >
          {leftActions.map((action, index) => (
            <motion.button
              key={action.id}
              className={cn(
                "h-full w-20 flex flex-col items-center justify-center gap-1",
                actionColors[action.color]
              )}
              onClick={() => handleActionClick(action)}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-center"
          style={{ opacity: rightActionOpacity }}
        >
          {rightActions.map((action, index) => (
            <motion.button
              key={action.id}
              className={cn(
                "h-full w-20 flex flex-col items-center justify-center gap-1",
                actionColors[action.color]
              )}
              onClick={() => handleActionClick(action)}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        drag="x"
        dragConstraints={{ 
          left: rightActions.length > 0 ? -rightActions.length * 80 : 0,
          right: leftActions.length > 0 ? leftActions.length * 80 : 0
        }}
        dragElastic={0.1}
        onPanEnd={handlePanEnd}
        style={{ x }}
        className="relative z-10 bg-background"
        onClick={isRevealed ? resetPosition : undefined}
      >
        {children}
      </motion.div>
    </div>
  )
}

// Predefined common actions
export const commonSwipeActions = {
  edit: {
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    color: 'primary' as const,
  },
  delete: {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    color: 'destructive' as const,
  },
  share: {
    id: 'share',
    label: 'Share',
    icon: Share,
    color: 'secondary' as const,
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    color: 'warning' as const,
  },
  favorite: {
    id: 'favorite',
    label: 'Like',
    icon: Heart,
    color: 'success' as const,
  }
}