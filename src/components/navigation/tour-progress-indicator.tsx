'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTour } from '@/components/onboarding/tour-provider'
import { getTourProgressData } from '@/lib/tour/navigation-integration'

interface TourProgressIndicatorProps {
  className?: string
  compact?: boolean
  showControls?: boolean
  position?: 'top' | 'bottom' | 'inline'
}

export default function TourProgressIndicator({
  className,
  compact = false,
  showControls = true,
  position = 'top'
}: TourProgressIndicatorProps) {
  const { 
    currentTour, 
    currentStep, 
    totalSteps, 
    isActive,
    nextStep,
    previousStep,
    skipTour
  } = useTour()

  if (!isActive || !currentTour) return null

  const progressData = getTourProgressData(currentStep, totalSteps)
  const canGoPrevious = currentStep > 0
  const canGoNext = currentStep < totalSteps - 1

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: position === 'top' ? -20 : position === 'bottom' ? 20 : 0,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: position === 'top' ? -20 : position === 'bottom' ? 20 : 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  }

  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "flex items-center space-x-2 px-3 py-2",
            "bg-primary/10 border border-primary/20 rounded-lg",
            "text-sm",
            className
          )}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Badge variant="secondary" className="text-xs">
              Tour
            </Badge>
            <span className="text-muted-foreground truncate">
              {progressData.currentStep}/{progressData.totalSteps}
            </span>
            <div className="w-12">
              <Progress 
                value={progressData.progress} 
                className="h-1"
              />
            </div>
          </div>
          
          {showControls && (
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "bg-card border border-border rounded-lg shadow-sm",
          "p-4 space-y-3",
          position === 'top' && "border-b-0 rounded-b-none",
          position === 'bottom' && "border-t-0 rounded-t-none",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="text-xs">
              Tour Activo
            </Badge>
            <h4 className="text-sm font-medium text-foreground">
              {progressData.tourName}
            </h4>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTour}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {progressData.stepTitle}
            </span>
            <span className="text-muted-foreground">
              {progressData.currentStep} de {progressData.totalSteps}
            </span>
          </div>
          
          <Progress 
            value={progressData.progress} 
            className="h-2"
          />
          
          {progressData.estimatedTimeRemaining > 0 && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                ~{progressData.estimatedTimeRemaining} min restantes
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={!canGoPrevious}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Anterior</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="flex items-center space-x-1 text-muted-foreground"
              >
                <SkipForward className="h-3 w-3" />
                <span>Saltar</span>
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={nextStep}
                disabled={!canGoNext}
                className="flex items-center space-x-1"
              >
                <span>{canGoNext ? 'Siguiente' : 'Finalizar'}</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Floating tour progress indicator for mobile
 */
export function FloatingTourProgress({ 
  className 
}: { 
  className?: string 
}) {
  const { isActive } = useTour()

  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50",
        "md:hidden", // Only show on mobile
        className
      )}
    >
      <TourProgressIndicator 
        compact 
        showControls={false}
        className="bg-background/95 backdrop-blur-lg shadow-lg"
      />
    </motion.div>
  )
}

/**
 * Tour progress breadcrumb component
 */
export function TourProgressBreadcrumb({ 
  className 
}: { 
  className?: string 
}) {
  const { currentTour, currentStep, totalSteps, isActive } = useTour()

  if (!isActive || !currentTour) return null

  const progressData = getTourProgressData(currentStep, totalSteps)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-center space-x-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Badge variant="outline" className="text-xs">
        Tour
      </Badge>
      <ChevronRight className="h-3 w-3" />
      <span className="truncate">
        {progressData.stepTitle}
      </span>
      <span className="text-xs">
        ({progressData.currentStep}/{progressData.totalSteps})
      </span>
    </motion.div>
  )
}