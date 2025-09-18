'use client'

import * as React from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, SkipForward, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useReducedMotion, announceToScreenReader, useKeyboardNavigation } from '@/lib/accessibility'

interface MobileTourPopoverProps {
  title: string
  description: string
  currentStep: number
  totalSteps: number
  position?: 'top' | 'bottom' | 'center' | 'auto'
  showProgress?: boolean
  showButtons?: boolean
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onClose?: () => void
  onSwipeNext?: () => void
  onSwipePrevious?: () => void
  className?: string
  isVisible?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  // Mobile-specific props
  enableSwipeGestures?: boolean
  swipeThreshold?: number
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
}

const mobilePopoverVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const fullscreenVariants = {
  normal: {
    scale: 1,
    borderRadius: '12px',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  fullscreen: {
    scale: 1.05,
    borderRadius: '0px',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const progressVariants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
}

export const MobileTourPopover = React.forwardRef<HTMLDivElement, MobileTourPopoverProps>(
  ({
    title,
    description,
    currentStep,
    totalSteps,
    position = 'bottom',
    showProgress = true,
    showButtons = true,
    onNext,
    onPrevious,
    onSkip,
    onClose,
    onSwipeNext,
    onSwipePrevious,
    className,
    isVisible = true,
    isFullscreen = false,
    onToggleFullscreen,
    enableSwipeGestures = true,
    swipeThreshold = 50,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100
    const isFirstStep = currentStep === 1
    const isLastStep = currentStep === totalSteps

    // Generate unique IDs for accessibility
    const titleId = React.useId()
    const descriptionId = React.useId()
    const progressId = React.useId()

    // Swipe gesture handling
    const handlePan = React.useCallback((event: any, info: PanInfo) => {
      if (!enableSwipeGestures) return

      const { offset, velocity } = info
      const swipeDistance = Math.abs(offset.x)
      const swipeVelocity = Math.abs(velocity.x)

      // Determine if it's a valid swipe
      if (swipeDistance > swipeThreshold || swipeVelocity > 500) {
        if (offset.x > 0 && !isFirstStep) {
          // Swipe right - previous step
          onSwipePrevious?.() || onPrevious?.()
          announceToScreenReader('Deslizado hacia el paso anterior', 'assertive')
        } else if (offset.x < 0 && !isLastStep) {
          // Swipe left - next step
          onSwipeNext?.() || onNext?.()
          announceToScreenReader('Deslizado hacia el siguiente paso', 'assertive')
        }
      }
    }, [enableSwipeGestures, swipeThreshold, isFirstStep, isLastStep, onSwipeNext, onSwipePrevious, onNext, onPrevious])

    // Announce step changes to screen readers
    React.useEffect(() => {
      if (isVisible) {
        announceToScreenReader(
          `Paso ${currentStep} de ${totalSteps}: ${title}`,
          'polite'
        )
      }
    }, [currentStep, totalSteps, title, isVisible])

    // Keyboard navigation
    const handleKeyDown = useKeyboardNavigation({
      onEscape: onClose,
      onArrowLeft: !isFirstStep ? onPrevious : undefined,
      onArrowRight: !isLastStep ? onNext : undefined,
      onEnter: !isLastStep ? onNext : onClose
    })

    // Button click handlers with announcements
    const handleNext = React.useCallback(() => {
      if (onNext) {
        onNext()
        if (!isLastStep) {
          announceToScreenReader('Avanzando al siguiente paso', 'assertive')
        }
      }
    }, [onNext, isLastStep])

    const handlePrevious = React.useCallback(() => {
      if (onPrevious) {
        onPrevious()
        announceToScreenReader('Regresando al paso anterior', 'assertive')
      }
    }, [onPrevious])

    const handleSkip = React.useCallback(() => {
      if (onSkip) {
        onSkip()
        announceToScreenReader('Tour omitido', 'assertive')
      }
    }, [onSkip])

    const handleClose = React.useCallback(() => {
      if (onClose) {
        onClose()
        announceToScreenReader('Tour cerrado', 'assertive')
      }
    }, [onClose])

    const handleToggleFullscreen = React.useCallback(() => {
      if (onToggleFullscreen) {
        onToggleFullscreen()
        announceToScreenReader(
          isFullscreen ? 'Modo normal activado' : 'Modo pantalla completa activado',
          'assertive'
        )
      }
    }, [onToggleFullscreen, isFullscreen])

    // Position-specific styles
    const getPositionStyles = () => {
      if (isFullscreen) {
        return 'fixed inset-4 z-50'
      }

      switch (position) {
        case 'top':
          return 'fixed top-20 left-4 right-4 z-50'
        case 'center':
          return 'fixed top-1/2 left-4 right-4 transform -translate-y-1/2 z-50'
        case 'bottom':
        default:
          return 'fixed bottom-20 left-4 right-4 z-50'
      }
    }

    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(
              'mobile-tour-popover',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
              getPositionStyles(),
              className
            )}
            variants={prefersReducedMotion ? undefined : mobilePopoverVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            exit={prefersReducedMotion ? 'visible' : 'exit'}
            onKeyDown={handleKeyDown}
            onPan={enableSwipeGestures ? handlePan : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || `Tour móvil paso ${currentStep} de ${totalSteps}`}
            aria-describedby={ariaDescribedBy || descriptionId}
            tabIndex={-1}
            {...props}
          >
            <motion.div
              variants={prefersReducedMotion ? undefined : fullscreenVariants}
              animate={isFullscreen ? 'fullscreen' : 'normal'}
            >
              <Card 
                variant="elevated" 
                className={cn(
                  'shadow-elevation-4 border-primary-200/50 overflow-hidden',
                  isFullscreen && 'h-full flex flex-col'
                )}
                animate={!prefersReducedMotion}
              >
                <CardHeader className={cn(
                  'pb-3',
                  isFullscreen && 'flex-shrink-0'
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle 
                        id={titleId}
                        className={cn(
                          'font-semibold text-foreground pr-2',
                          isFullscreen ? 'text-xl' : 'text-lg'
                        )}
                      >
                        {title}
                      </CardTitle>
                      {showProgress && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span>Paso {currentStep} de {totalSteps}</span>
                            <span>{Math.round(progress)}% completado</span>
                          </div>
                          <div 
                            className="h-2 bg-muted rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={currentStep}
                            aria-valuemin={1}
                            aria-valuemax={totalSteps}
                            aria-labelledby={progressId}
                          >
                            <motion.div
                              className="h-full bg-gradient-primary rounded-full"
                              variants={prefersReducedMotion ? undefined : progressVariants}
                              initial={prefersReducedMotion ? { width: `${progress}%` } : 'hidden'}
                              animate="visible"
                              custom={progress}
                            />
                          </div>
                          <span id={progressId} className="sr-only">
                            Progreso del tour: {currentStep} de {totalSteps} pasos completados
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {onToggleFullscreen && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleToggleFullscreen}
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {onClose && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleClose}
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Cerrar tour"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className={cn(
                  'pt-0',
                  isFullscreen && 'flex-1 flex flex-col'
                )}>
                  <div className={cn(
                    isFullscreen && 'flex-1 flex items-center'
                  )}>
                    <p 
                      id={descriptionId}
                      className={cn(
                        'text-muted-foreground leading-relaxed mb-6',
                        isFullscreen ? 'text-base' : 'text-sm'
                      )}
                    >
                      {description}
                    </p>
                  </div>

                  {showButtons && (
                    <div className={cn(
                      'flex flex-col gap-3',
                      isFullscreen && 'flex-shrink-0'
                    )}>
                      {/* Primary action buttons */}
                      <div className="flex items-center gap-3">
                        {!isFirstStep && onPrevious && (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handlePrevious}
                            className="flex-1 flex items-center justify-center gap-2 h-12 text-base"
                            aria-label="Paso anterior"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                        )}
                        
                        {!isLastStep && onNext && (
                          <Button
                            variant="default"
                            size="lg"
                            onClick={handleNext}
                            className="flex-1 flex items-center justify-center gap-2 h-12 text-base"
                            aria-label="Siguiente paso"
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}

                        {isLastStep && onClose && (
                          <Button
                            variant="default"
                            size="lg"
                            onClick={handleClose}
                            className="flex-1 h-12 text-base"
                            aria-label="Finalizar tour"
                          >
                            Finalizar
                          </Button>
                        )}
                      </div>

                      {/* Secondary actions */}
                      <div className="flex items-center justify-between">
                        {enableSwipeGestures && (
                          <p className="text-xs text-muted-foreground">
                            Desliza para navegar
                          </p>
                        )}
                        
                        {onSkip && !isLastStep && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSkip}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground ml-auto"
                            aria-label="Omitir tour"
                          >
                            <SkipForward className="h-3.5 w-3.5" />
                            Omitir
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Screen reader only live region for announcements */}
            <div 
              aria-live="polite" 
              aria-atomic="true" 
              className="sr-only"
              id={`mobile-tour-announcements-${titleId}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

MobileTourPopover.displayName = 'MobileTourPopover'