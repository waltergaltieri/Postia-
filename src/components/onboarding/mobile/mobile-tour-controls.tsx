'use client'

import * as React from 'react'
import { motion, PanInfo } from 'framer-motion'
import {
    ChevronLeft,
    ChevronRight,
    SkipForward,
    X,
    Play,
    Pause,
    RotateCcw,
    HelpCircle,
    Maximize2,
    Minimize2
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

interface MobileTourControlsProps {
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
    onSwipeNext?: () => void
    onSwipePrevious?: () => void
    className?: string
    variant?: 'default' | 'compact' | 'floating' | 'bottom-sheet'
    position?: 'bottom' | 'top' | 'floating'
    isFullscreen?: boolean
    onToggleFullscreen?: () => void
    // Mobile-specific props
    enableSwipeGestures?: boolean
    swipeThreshold?: number
    enableHapticFeedback?: boolean
    // Accessibility props
    'aria-label'?: string
    'aria-describedby'?: string
    trapFocus?: boolean
}

const mobileControlsVariants = {
    hidden: {
        opacity: 0,
        y: 100,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    },
    exit: {
        opacity: 0,
        y: 100,
        scale: 0.95,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    }
}

const bottomSheetVariants = {
    hidden: {
        opacity: 0,
        y: '100%'
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    },
    exit: {
        opacity: 0,
        y: '100%',
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    }
}

const progressVariants = {
    hidden: { width: 0 },
    visible: (progress: number) => ({
        width: `${progress}%`,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    })
}

export const MobileTourControls = React.forwardRef<HTMLDivElement, MobileTourControlsProps>(
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
        onSwipeNext,
        onSwipePrevious,
        className,
        variant = 'default',
        position = 'bottom',
        isFullscreen = false,
        onToggleFullscreen,
        enableSwipeGestures = true,
        swipeThreshold = 50,
        enableHapticFeedback = true,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        trapFocus = false,
        ...props
    }, ref) => {
        const prefersReducedMotion = useReducedMotion()
        const focusTrapRef = React.useRef<HTMLDivElement | null>(null)
        const isFirstStep = currentStep === 1
        const isLastStep = currentStep === totalSteps
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

        // Generate unique IDs for accessibility
        const controlsId = React.useId()
        const progressId = React.useId()

        // Apply focus trap when enabled
        React.useEffect(() => {
            if (trapFocus && focusTrapRef.current) {
                // Simple focus trap implementation
                const element = focusTrapRef.current
                const focusableElements = element.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                const firstElement = focusableElements[0] as HTMLElement
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

                const handleTabKey = (e: KeyboardEvent) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                e.preventDefault()
                                lastElement?.focus()
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                e.preventDefault()
                                firstElement?.focus()
                            }
                        }
                    }
                }

                element.addEventListener('keydown', handleTabKey)
                firstElement?.focus()

                return () => {
                    element.removeEventListener('keydown', handleTabKey)
                }
            }
        }, [trapFocus])

        // Combine refs
        const combinedRef = React.useCallback((node: HTMLDivElement) => {
            if (ref) {
                if (typeof ref === 'function') {
                    ref(node)
                } else {
                    ; (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
                }
            }
            if (focusTrapRef) {
                focusTrapRef.current = node
            }
        }, [ref])

        // Haptic feedback function
        const triggerHapticFeedback = React.useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
            if (!enableHapticFeedback) return

            // Check if device supports haptic feedback
            if ('vibrate' in navigator) {
                const patterns = {
                    light: [10],
                    medium: [20],
                    heavy: [30]
                }
                navigator.vibrate(patterns[type])
            }
        }, [enableHapticFeedback])

        // Swipe gesture handling
        const handlePan = React.useCallback((event: any, info: PanInfo) => {
            if (!enableSwipeGestures) return

            const { offset, velocity } = info
            const swipeDistance = Math.abs(offset.x)
            const swipeVelocity = Math.abs(velocity.x)

            // Determine if it's a valid swipe
            if (swipeDistance > swipeThreshold || swipeVelocity > 500) {
                triggerHapticFeedback('medium')

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
        }, [enableSwipeGestures, swipeThreshold, isFirstStep, isLastStep, onSwipeNext, onSwipePrevious, onNext, onPrevious, triggerHapticFeedback])

        // Enhanced keyboard navigation for mobile
        const keyboardHandler = useKeyboardNavigation({
            onArrowLeft: () => {
                if (canGoPrevious && !isFirstStep && onPrevious) {
                    triggerHapticFeedback('light')
                    onPrevious()
                }
            },
            onArrowRight: () => {
                if (canGoNext && !isLastStep && onNext) {
                    triggerHapticFeedback('light')
                    onNext()
                }
            },
            onSpace: () => {
                if (showPlayPause) {
                    triggerHapticFeedback('medium')
                    if (isPlaying && onPause) {
                        onPause()
                    } else if (!isPlaying && onPlay) {
                        onPlay()
                    }
                }
            },
            onEscape: () => {
                if (onClose) {
                    triggerHapticFeedback('heavy')
                    onClose()
                }
            },
            onHome: () => {
                if (onRestart) {
                    triggerHapticFeedback('medium')
                    onRestart()
                }
            },
            onEnd: () => {
                if (onSkip) {
                    triggerHapticFeedback('heavy')
                    onSkip()
                }
            }
        })

        // Wrapper to convert React.KeyboardEvent to KeyboardEvent
        const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
            // Convert React event to native event for the keyboard handler
            const nativeEvent = e.nativeEvent
            keyboardHandler(nativeEvent)
        }, [keyboardHandler])

        // Button click handlers with haptic feedback and announcements
        const handleNext = React.useCallback(() => {
            if (onNext && canGoNext && !isLastStep) {
                triggerHapticFeedback('light')
                onNext()
                announceToScreenReader(`Avanzando al paso ${currentStep + 1} de ${totalSteps}`, 'assertive')
            }
        }, [onNext, canGoNext, isLastStep, currentStep, totalSteps, triggerHapticFeedback])

        const handlePrevious = React.useCallback(() => {
            if (onPrevious && canGoPrevious && !isFirstStep) {
                triggerHapticFeedback('light')
                onPrevious()
                announceToScreenReader(`Regresando al paso ${currentStep - 1} de ${totalSteps}`, 'assertive')
            }
        }, [onPrevious, canGoPrevious, isFirstStep, currentStep, totalSteps, triggerHapticFeedback])

        const handleSkip = React.useCallback(() => {
            if (onSkip) {
                triggerHapticFeedback('heavy')
                onSkip()
                announceToScreenReader('Tour omitido', 'assertive')
            }
        }, [onSkip, triggerHapticFeedback])

        const handleClose = React.useCallback(() => {
            if (onClose) {
                triggerHapticFeedback('heavy')
                onClose()
                announceToScreenReader('Tour cerrado', 'assertive')
            }
        }, [onClose, triggerHapticFeedback])

        const handlePlayPause = React.useCallback(() => {
            triggerHapticFeedback('medium')
            if (isPlaying && onPause) {
                onPause()
                announceToScreenReader('Tour pausado', 'assertive')
            } else if (!isPlaying && onPlay) {
                onPlay()
                announceToScreenReader('Tour reanudado', 'assertive')
            }
        }, [isPlaying, onPlay, onPause, triggerHapticFeedback])

        const handleRestart = React.useCallback(() => {
            if (onRestart) {
                triggerHapticFeedback('medium')
                onRestart()
                announceToScreenReader('Tour reiniciado', 'assertive')
            }
        }, [onRestart, triggerHapticFeedback])

        const handleHelp = React.useCallback(() => {
            if (onHelp) {
                triggerHapticFeedback('light')
                onHelp()
                announceToScreenReader('Ayuda del tour abierta', 'assertive')
            }
        }, [onHelp, triggerHapticFeedback])

        const handleToggleFullscreen = React.useCallback(() => {
            if (onToggleFullscreen) {
                triggerHapticFeedback('medium')
                onToggleFullscreen()
                announceToScreenReader(
                    isFullscreen ? 'Modo normal activado' : 'Modo pantalla completa activado',
                    'assertive'
                )
            }
        }, [onToggleFullscreen, isFullscreen, triggerHapticFeedback])

        // Variant-specific styles
        const getVariantStyles = () => {
            switch (variant) {
                case 'compact':
                    return 'px-3 py-2 gap-2'
                case 'floating':
                    return 'px-4 py-3 gap-3 rounded-full shadow-elevation-4'
                case 'bottom-sheet':
                    return 'px-4 py-6 gap-4 rounded-t-3xl'
                default:
                    return 'px-4 py-4 gap-3'
            }
        }

        const getPositionStyles = () => {
            if (variant === 'bottom-sheet') {
                return 'fixed bottom-0 left-0 right-0 z-50'
            }

            switch (position) {
                case 'top':
                    return 'fixed top-4 left-4 right-4 z-50'
                case 'floating':
                    return 'fixed bottom-6 right-6 z-50'
                default:
                    return 'fixed bottom-4 left-4 right-4 z-50'
            }
        }

        const getVariantClasses = () => {
            const baseClasses = 'mobile-tour-controls bg-background/95 backdrop-blur-sm border border-border shadow-elevation-3 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'

            switch (variant) {
                case 'floating':
                    return cn(baseClasses, 'rounded-full')
                case 'bottom-sheet':
                    return cn(baseClasses, 'rounded-t-3xl border-b-0')
                default:
                    return cn(baseClasses, 'rounded-2xl')
            }
        }

        const controlsVariants = variant === 'bottom-sheet' ? bottomSheetVariants : mobileControlsVariants

        return (
            <motion.div
                ref={combinedRef}
                className={cn(
                    getVariantClasses(),
                    getVariantStyles(),
                    getPositionStyles(),
                    className
                )}
                variants={prefersReducedMotion ? undefined : controlsVariants}
                initial={prefersReducedMotion ? 'visible' : 'hidden'}
                animate="visible"
                exit={prefersReducedMotion ? 'visible' : 'exit'}
                onKeyDown={handleKeyDown}
                onPan={enableSwipeGestures ? handlePan : undefined}
                role="toolbar"
                aria-label={ariaLabel || `Controles móviles del tour - Paso ${currentStep} de ${totalSteps}`}
                aria-describedby={ariaDescribedBy}
                id={controlsId}
                {...props}
            >
                {/* Progress bar for bottom sheet variant */}
                {variant === 'bottom-sheet' && showProgress && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span>Paso {currentStep} de {totalSteps}</span>
                            <span>{Math.round(progress)}% completado</span>
                        </div>
                        <div
                            className="h-2 bg-muted rounded-full overflow-hidden"
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

                {/* Main controls layout */}
                {variant === 'bottom-sheet' ? (
                    // Bottom sheet layout - vertical stacking
                    <div className="flex flex-col gap-4">
                        {/* Primary navigation buttons */}
                        <div className="flex items-center gap-3">
                            {!isFirstStep && onPrevious && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handlePrevious}
                                    disabled={!canGoPrevious}
                                    className="flex-1 flex items-center justify-center gap-2 h-12 text-base"
                                    aria-label="Paso anterior"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                    Anterior
                                </Button>
                            )}

                            {!isLastStep && onNext && (
                                <Button
                                    variant="default"
                                    size="lg"
                                    onClick={handleNext}
                                    disabled={!canGoNext}
                                    className="flex-1 flex items-center justify-center gap-2 h-12 text-base"
                                    aria-label="Siguiente paso"
                                >
                                    Siguiente
                                    <ChevronRight className="h-5 w-5" />
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

                        {/* Secondary controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {showStepCounter && (
                                    <Badge variant="secondary" className="text-sm px-3 py-1">
                                        {currentStep} / {totalSteps}
                                    </Badge>
                                )}

                                {enableSwipeGestures && (
                                    <span className="text-xs text-muted-foreground">
                                        Desliza para navegar
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {showRestart && onRestart && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleRestart}
                                        aria-label="Reiniciar tour"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                )}

                                {showPlayPause && (onPlay || onPause) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePlayPause}
                                        aria-label={isPlaying ? 'Pausar tour' : 'Reproducir tour'}
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}

                                {onToggleFullscreen && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleToggleFullscreen}
                                        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                                    >
                                        {isFullscreen ? (
                                            <Minimize2 className="h-4 w-4" />
                                        ) : (
                                            <Maximize2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}

                                {showHelp && onHelp && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleHelp}
                                        aria-label="Ayuda del tour"
                                    >
                                        <HelpCircle className="h-4 w-4" />
                                    </Button>
                                )}

                                {onSkip && !isLastStep && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleSkip}
                                        aria-label="Omitir tour"
                                    >
                                        <SkipForward className="h-4 w-4" />
                                    </Button>
                                )}

                                {onClose && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClose}
                                        aria-label="Cerrar tour"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Compact horizontal layout for other variants
                    <div className="flex items-center justify-between w-full">
                        {/* Left section */}
                        <div className="flex items-center gap-2">
                            {showRestart && onRestart && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleRestart}
                                    aria-label="Reiniciar tour"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            )}

                            {showPlayPause && (onPlay || onPause) && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handlePlayPause}
                                    aria-label={isPlaying ? 'Pausar tour' : 'Reproducir tour'}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-4 w-4" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                </Button>
                            )}

                            {onPrevious && !isFirstStep && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevious}
                                    disabled={!canGoPrevious}
                                    className="flex items-center gap-1"
                                    aria-label="Paso anterior"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    {variant !== 'compact' && 'Anterior'}
                                </Button>
                            )}
                        </div>

                        {/* Center section */}
                        <div className="flex items-center gap-2">
                            {showStepCounter && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                    {currentStep} / {totalSteps}
                                </Badge>
                            )}

                            {showProgress && variant !== 'compact' && (
                                <div className="flex items-center gap-1 min-w-[60px]">
                                    <div
                                        className="flex-1 h-1 bg-muted rounded-full overflow-hidden"
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
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{
                                                duration: prefersReducedMotion ? 0 : 0.5,
                                                ease: [0.25, 0.46, 0.45, 0.94]
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium min-w-[2ch]">
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right section */}
                        <div className="flex items-center gap-2">
                            {onNext && !isLastStep && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={!canGoNext}
                                    className="flex items-center gap-1"
                                    aria-label="Siguiente paso"
                                >
                                    {variant !== 'compact' && 'Siguiente'}
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

                            {onToggleFullscreen && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleToggleFullscreen}
                                    aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="h-3.5 w-3.5" />
                                    ) : (
                                        <Maximize2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            )}

                            {onSkip && !isLastStep && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleSkip}
                                    aria-label="Omitir tour"
                                >
                                    <SkipForward className="h-3.5 w-3.5" />
                                </Button>
                            )}

                            {showHelp && onHelp && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleHelp}
                                    aria-label="Ayuda del tour"
                                >
                                    <HelpCircle className="h-3.5 w-3.5" />
                                </Button>
                            )}

                            {onClose && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleClose}
                                    aria-label="Cerrar tour"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Swipe indicator for mobile */}
                {enableSwipeGestures && variant !== 'bottom-sheet' && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
                    </div>
                )}

                {/* Screen reader announcements */}
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                >
                    Controles móviles del tour disponibles.
                    {enableSwipeGestures && 'Deslice horizontalmente para navegar entre pasos. '}
                    Use los botones táctiles o las flechas del teclado para navegar,
                    Escape para cerrar, Espacio para pausar/reanudar.
                </div>
            </motion.div>
        )
    }
)

MobileTourControls.displayName = 'MobileTourControls'

// Hook for managing mobile tour controls state
export function useMobileTourControls() {
    const [currentStep, setCurrentStep] = React.useState(1)
    const [totalSteps, setTotalSteps] = React.useState(1)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [canGoNext, setCanGoNext] = React.useState(true)
    const [canGoPrevious, setCanGoPrevious] = React.useState(false)
    const [isFullscreen, setIsFullscreen] = React.useState(false)

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

    const toggleFullscreen = React.useCallback(() => {
        setIsFullscreen(prev => !prev)
    }, [])

    return {
        currentStep,
        totalSteps,
        isPlaying,
        canGoNext,
        canGoPrevious,
        isFullscreen,
        setTotalSteps,
        setIsPlaying,
        nextStep,
        previousStep,
        goToStep,
        restart,
        finish,
        toggleFullscreen
    }
}