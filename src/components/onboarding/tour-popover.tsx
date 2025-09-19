'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useReducedMotion, announceToScreenReader, useKeyboardNavigation } from '@/lib/accessibility'

interface TourPopoverProps {
  title: string
  description: string
  currentStep: number
  totalSteps: number
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  showProgress?: boolean
  showButtons?: boolean
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onClose?: () => void
  className?: string
  isVisible?: boolean
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
}

const popoverVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }
}

const progressVariants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  })
}

export const TourPopover = React.forwardRef<HTMLDivElement, TourPopoverProps>(
  ({
    title,
    description,
    currentStep,
    totalSteps,
    position = 'auto',
    showProgress = true,
    showButtons = true,
    onNext,
    onPrevious,
    onSkip,
    onClose,
    className,
    isVisible = true,
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
    const keyboardHandler = useKeyboardNavigation({
      onEscape: onClose,
      onArrowLeft: !isFirstStep ? onPrevious : undefined,
      onArrowRight: !isLastStep ? onNext : undefined,
      onEnter: !isLastStep ? onNext : onClose
    })

    // Wrapper to convert React.KeyboardEvent to KeyboardEvent
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      // Convert React event to native event for the keyboard handler
      const nativeEvent = e.nativeEvent
      keyboardHandler(nativeEvent)
    }, [keyboardHandler])

    // Handle button clicks with announcements
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

    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(
              'tour-popover relative z-50 max-w-sm',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
              className
            )}
            variants={prefersReducedMotion ? undefined : popoverVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            exit={prefersReducedMotion ? 'visible' : 'exit'}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || `Tour paso ${currentStep} de ${totalSteps}`}
            aria-describedby={ariaDescribedBy || descriptionId}
            tabIndex={-1}
            {...props}
          >
            <Card
              variant="elevated"
              className="shadow-elevation-3 border-primary-200/50"
              animate={!prefersReducedMotion}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle
                      id={titleId}
                      className="text-lg font-semibold text-foreground pr-2"
                    >
                      {title}
                    </CardTitle>
                    {showProgress && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Paso {currentStep} de {totalSteps}</span>
                          <span>{Math.round(progress)}% completado</span>
                        </div>
                        <div
                          className="h-1.5 bg-muted rounded-full overflow-hidden"
                          role="progressbar"
                          {...({
                            'aria-valuenow': String(currentStep),
                            'aria-valuemin': '1',
                            'aria-valuemax': String(totalSteps),
                            'aria-valuetext': `Paso ${currentStep} de ${totalSteps}`,
                            'aria-labelledby': progressId
                          } as any)}
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
              </CardHeader>

              <CardContent className="pt-0">
                <p
                  id={descriptionId}
                  className="text-sm text-muted-foreground leading-relaxed mb-4"
                >
                  {description}
                </p>

                {showButtons && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!isFirstStep && onPrevious && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevious}
                          className="flex items-center gap-1.5"
                          aria-label="Paso anterior"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Anterior
                        </Button>
                      )}

                      {!isLastStep && onNext && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleNext}
                          className="flex items-center gap-1.5"
                          aria-label="Siguiente paso"
                        >
                          Siguiente
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {isLastStep && onClose && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleClose}
                          aria-label="Finalizar tour"
                        >
                          Finalizar
                        </Button>
                      )}
                    </div>

                    {onSkip && !isLastStep && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSkip}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        aria-label="Omitir tour"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                        Omitir
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Screen reader only live region for announcements */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
              id={`tour-announcements-${titleId}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

TourPopover.displayName = 'TourPopover'