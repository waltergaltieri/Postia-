'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipForward, 
  X, 
  Play, 
  Pause,
  RotateCcw,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  useKeyboardNavigation, 
  useReducedMotion, 
  announceToScreenReader,
  useFocusTrap
} from '@/lib/accessibility'

interface TourControlsProps {
  currentStep: number
  totalSteps: number
  isPlaying?: boolean
  canGoNext?: boolean
  canGoPrevious?: boolean
  showProgress?: boolean
  showStepCounter?: boolean
  showPlayPause?: boolean
  showRestart?: boolean
  showHelp?: boolean
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onClose?: () => void
  onPlay?: () => void
  onPause?: () => void
  onRestart?: () => void
  onHelp?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
  position?: 'bottom' | 'top' | 'floating'
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  trapFocus?: boolean
}

const controlsVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }
}

export const TourControls = React.forwardRef<HTMLDivElement, TourControlsProps>(
  ({
    currentStep,
    totalSteps,
    isPlaying = false,
    canGoNext = true,
    canGoPrevious = true,
    showProgress = true,
    showStepCounter = true,
    showPlayPause = false,
    showRestart = false,
    showHelp = false,
    onNext,
    onPrevious,
    onSkip,
    onClose,
    onPlay,
    onPause,
    onRestart,
    onHelp,
    className,
    variant = 'default',
    position = 'bottom',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    trapFocus = false,
    ...props
  }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const focusTrapRef = useFocusTrap(trapFocus)
    const isFirstStep = currentStep === 1
    const isLastStep = currentStep === totalSteps
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

    // Generate unique IDs for accessibility
    const controlsId = React.useId()
    const progressId = React.useId()

    // Combine refs for focus trap
    const combinedRef = React.useCallback((node: HTMLDivElement) => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(node)
        } else {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      }
      if (focusTrapRef && focusTrapRef.current !== node) {
        focusTrapRef.current = node
      }
    }, [ref, focusTrapRef])

    // Enhanced keyboard navigation
    const handleKeyDown = useKeyboardNavigation({
      onArrowLeft: () => {
        if (canGoPrevious && !isFirstStep && onPrevious) {
          onPrevious()
        }
      },
      onArrowRight: () => {
        if (canGoNext && !isLastStep && onNext) {
          onNext()
        }
      },
      onSpace: () => {
        if (showPlayPause) {
          if (isPlaying && onPause) {
            onPause()
          } else if (!isPlaying && onPlay) {
            onPlay()
          }
        }
      },
      onEscape: () => {
        if (onClose) {
          onClose()
        }
      },
      onHome: () => {
        if (onRestart) {
          onRestart()
        }
      },
      onEnd: () => {
        if (onSkip) {
          onSkip()
        }
      }
    })

    // Button click handlers with announcements
    const handleNext = React.useCallback(() => {
      if (onNext && canGoNext && !isLastStep) {
        onNext()
        announceToScreenReader(`Avanzando al paso ${currentStep + 1} de ${totalSteps}`, 'assertive')
      }
    }, [onNext, canGoNext, isLastStep, currentStep, totalSteps])

    const handlePrevious = React.useCallback(() => {
      if (onPrevious && canGoPrevious && !isFirstStep) {
        onPrevious()
        announceToScreenReader(`Regresando al paso ${currentStep - 1} de ${totalSteps}`, 'assertive')
      }
    }, [onPrevious, canGoPrevious, isFirstStep, currentStep, totalSteps])

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

    const handlePlayPause = React.useCallback(() => {
      if (isPlaying && onPause) {
        onPause()
        announceToScreenReader('Tour pausado', 'assertive')
      } else if (!isPlaying && onPlay) {
        onPlay()
        announceToScreenReader('Tour reanudado', 'assertive')
      }
    }, [isPlaying, onPlay, onPause])

    const handleRestart = React.useCallback(() => {
      if (onRestart) {
        onRestart()
        announceToScreenReader('Tour reiniciado', 'assertive')
      }
    }, [onRestart])

    const handleHelp = React.useCallback(() => {
      if (onHelp) {
        onHelp()
        announceToScreenReader('Ayuda del tour abierta', 'assertive')
      }
    }, [onHelp])

    // Variant-specific styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'compact':
          return 'px-3 py-2 gap-2'
        case 'minimal':
          return 'px-2 py-1 gap-1'
        default:
          return 'px-4 py-3 gap-3'
      }
    }

    const getPositionStyles = () => {
      switch (position) {
        case 'top':
          return 'top-4 left-1/2 transform -translate-x-1/2'
        case 'floating':
          return 'bottom-6 right-6'
        default:
          return 'bottom-4 left-1/2 transform -translate-x-1/2'
      }
    }

    return (
      <motion.div
        ref={combinedRef}
        className={cn(
          'tour-controls fixed z-50 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-elevation-3',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
          getVariantStyles(),
          getPositionStyles(),
          className
        )}
        variants={prefersReducedMotion ? undefined : controlsVariants}
        initial={prefersReducedMotion ? 'visible' : 'hidden'}
        animate="visible"
        exit={prefersReducedMotion ? 'visible' : 'exit'}
        onKeyDown={handleKeyDown}
        role="toolbar"
        aria-label={ariaLabel || `Controles del tour - Paso ${currentStep} de ${totalSteps}`}
        aria-describedby={ariaDescribedBy}
        id={controlsId}
        {...props}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left section - Navigation and secondary controls */}
          <div className="flex items-center gap-2">
            {showRestart && onRestart && (
              <Button
                variant="ghost"
                size={variant === 'minimal' ? 'icon-sm' : 'icon'}
                onClick={handleRestart}
                aria-label="Reiniciar tour"
                title="Reiniciar tour (Home)"
              >
                <RotateCcw className={cn(
                  variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                )} />
              </Button>
            )}

            {showPlayPause && (onPlay || onPause) && (
              <Button
                variant="ghost"
                size={variant === 'minimal' ? 'icon-sm' : 'icon'}
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pausar tour' : 'Reproducir tour'}
                title={isPlaying ? 'Pausar tour (Espacio)' : 'Reproducir tour (Espacio)'}
              >
                {isPlaying ? (
                  <Pause className={cn(
                    variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                  )} />
                ) : (
                  <Play className={cn(
                    variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                  )} />
                )}
              </Button>
            )}

            {/* Previous button */}
            {onPrevious && (
              <Button
                variant="outline"
                size={variant === 'minimal' ? 'sm' : 'default'}
                onClick={handlePrevious}
                disabled={!canGoPrevious || isFirstStep}
                className="flex items-center gap-1.5"
                aria-label="Paso anterior"
                title="Paso anterior (Flecha izquierda)"
              >
                <ChevronLeft className={cn(
                  variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                )} />
                {variant !== 'minimal' && 'Anterior'}
              </Button>
            )}
          </div>

          {/* Center section - Progress and step counter */}
          <div className="flex items-center gap-3 mx-4">
            {showStepCounter && (
              <Badge 
                variant="secondary" 
                className={cn(
                  'font-medium',
                  variant === 'minimal' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
                )}
              >
                {currentStep} / {totalSteps}
              </Badge>
            )}

            {showProgress && variant !== 'minimal' && (
              <div className="flex items-center gap-2 min-w-[100px]">
                <div 
                  className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={currentStep}
                  aria-valuemin={1}
                  aria-valuemax={totalSteps}
                  aria-labelledby={progressId}
                >
                  <motion.div
                    className="h-full bg-gradient-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  />
                </div>
                <span 
                  id={progressId}
                  className="text-xs text-muted-foreground font-medium min-w-[3ch]"
                >
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>

          {/* Right section - Primary actions */}
          <div className="flex items-center gap-2">
            {/* Next button */}
            {onNext && !isLastStep && (
              <Button
                variant="default"
                size={variant === 'minimal' ? 'sm' : 'default'}
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex items-center gap-1.5"
                aria-label="Siguiente paso"
                title="Siguiente paso (Flecha derecha)"
              >
                {variant !== 'minimal' && 'Siguiente'}
                <ChevronRight className={cn(
                  variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                )} />
              </Button>
            )}

            {/* Finish button for last step */}
            {isLastStep && onClose && (
              <Button
                variant="default"
                size={variant === 'minimal' ? 'sm' : 'default'}
                onClick={handleClose}
                aria-label="Finalizar tour"
                title="Finalizar tour"
              >
                Finalizar
              </Button>
            )}

            {/* Skip button */}
            {onSkip && !isLastStep && (
              <Button
                variant="ghost"
                size={variant === 'minimal' ? 'icon-sm' : 'icon'}
                onClick={handleSkip}
                aria-label="Omitir tour"
                title="Omitir tour (End)"
              >
                <SkipForward className={cn(
                  variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                )} />
              </Button>
            )}

            {/* Help button */}
            {showHelp && onHelp && (
              <Button
                variant="ghost"
                size={variant === 'minimal' ? 'icon-sm' : 'icon'}
                onClick={handleHelp}
                aria-label="Ayuda del tour"
                title="Ayuda del tour"
              >
                <HelpCircle className={cn(
                  variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                )} />
              </Button>
            )}

            {/* Close button */}
            {onClose && (
              <Button
                variant="ghost"
                size={variant === 'minimal' ? 'icon-sm' : 'icon'}
                onClick={handleClose}
                aria-label="Cerrar tour"
                title="Cerrar tour (Escape)"
              >
                <X className={cn(
                  variant === 'minimal' ? 'h-3 w-3' : 'h-4 w-4'
                )} />
              </Button>
            )}
          </div>
        </div>

        {/* Screen reader announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          Controles del tour disponibles. Use las flechas del teclado para navegar, 
          Escape para cerrar, Espacio para pausar/reanudar, Home para reiniciar, 
          End para omitir.
        </div>
      </motion.div>
    )
  }
)

TourControls.displayName = 'TourControls'

// Hook for managing tour controls state
export function useTourControls() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [totalSteps, setTotalSteps] = React.useState(1)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [canGoNext, setCanGoNext] = React.useState(true)
  const [canGoPrevious, setCanGoPrevious] = React.useState(false)

  const nextStep = React.useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, totalSteps)
      setCanGoPrevious(next > 1)
      setCanGoNext(next < totalSteps)
      return next
    })
  }, [totalSteps])

  const previousStep = React.useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, 1)
      setCanGoPrevious(next > 1)
      setCanGoNext(next < totalSteps)
      return next
    })
  }, [totalSteps])

  const goToStep = React.useCallback((step: number) => {
    const clampedStep = Math.max(1, Math.min(step, totalSteps))
    setCurrentStep(clampedStep)
    setCanGoPrevious(clampedStep > 1)
    setCanGoNext(clampedStep < totalSteps)
  }, [totalSteps])

  const restart = React.useCallback(() => {
    goToStep(1)
  }, [goToStep])

  const finish = React.useCallback(() => {
    goToStep(totalSteps)
  }, [goToStep, totalSteps])

  return {
    currentStep,
    totalSteps,
    isPlaying,
    canGoNext,
    canGoPrevious,
    setTotalSteps,
    setIsPlaying,
    nextStep,
    previousStep,
    goToStep,
    restart,
    finish
  }
}