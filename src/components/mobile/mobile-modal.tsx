'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { useSwipeGestures } from '@/hooks/use-swipe-gestures'

interface MobileModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  showHandle?: boolean
  swipeToClose?: boolean
  className?: string
}

export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showHandle = true,
  swipeToClose = true,
  className
}: MobileModalProps) {
  const isMobile = useMobile()

  // Swipe gestures for closing
  const swipeGestures = useSwipeGestures({
    onSwipeDown: swipeToClose ? onClose : undefined,
    threshold: 100
  })

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'max-h-[50vh]',
    md: 'max-h-[75vh]',
    lg: 'max-h-[90vh]',
    full: 'h-full'
  }

  if (!isMobile) {
    // Desktop modal fallback
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-xl shadow-xl"
            >
              {title && (
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {children}
              </div>
              
              {footer && (
                <div className="p-4 border-t border-border">
                  {footer}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={size !== 'full' ? onClose : undefined}
          />
          
          {/* Mobile Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background border-t border-border",
              "rounded-t-xl shadow-xl",
              sizeClasses[size],
              size === 'full' && "top-0 rounded-none",
              className
            )}
            {...(swipeToClose ? swipeGestures : {})}
          >
            {/* Swipe Handle */}
            {showHandle && size !== 'full' && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="swipe-indicator" />
              </div>
            )}
            
            {/* Header */}
            {title && (
              <div className={cn(
                "mobile-modal-header",
                !showHandle && size !== 'full' && "pt-4"
              )}>
                <h2 className="text-lg font-semibold">{title}</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="touch-target"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
            
            {/* Content */}
            <div className={cn(
              "mobile-modal-content",
              !title && !showHandle && "pt-4",
              !footer && "pb-safe-bottom"
            )}>
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="mobile-modal-footer">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Preset configurations
export const mobileModalPresets = {
  bottomSheet: {
    size: 'md' as const,
    showHandle: true,
    swipeToClose: true
  },
  fullScreen: {
    size: 'full' as const,
    showHandle: false,
    swipeToClose: false
  },
  compact: {
    size: 'sm' as const,
    showHandle: true,
    swipeToClose: true
  }
}