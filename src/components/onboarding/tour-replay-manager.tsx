'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RotateCcw,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTour } from '@/hooks/use-tour'
import { useTourProgress } from '@/hooks/use-tour-progress'
import { getTourRegistry } from '@/lib/tour/tour-registry'
import type { TourDefinition } from '@/types/tour'

interface TourReplayManagerProps {
  className?: string
  onClose?: () => void
}

interface ReplayableTour {
  tourId: string
  tour: TourDefinition
  progress: any
  canReplay: boolean
  lastCompleted?: Date
}

export default function TourReplayManager({ className, onClose }: TourReplayManagerProps) {
  const [replayableTours, setReplayableTours] = useState<ReplayableTour[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTour, setSelectedTour] = useState<string | null>(null)
  const [replayMode, setReplayMode] = useState<'normal' | 'step-by-step' | 'auto'>('normal')

  const { startTour, currentTour, isActive, stopTour } = useTour()
  const { getAllProgress, resetTour, getTourProgress } = useTourProgress()

  // Load replayable tours
  useEffect(() => {
    const loadReplayableTours = async () => {
      setLoading(true)
      try {
        const allProgress = getAllProgress()
        const registry = getTourRegistry()
        const replayable: ReplayableTour[] = []

        for (const [tourId, progress] of Object.entries(allProgress)) {
          // Only include completed or skipped tours for replay
          if (progress.status === 'completed' || progress.status === 'skipped') {
            try {
              const tour = await registry.loadTour(tourId)
              replayable.push({
                tourId,
                tour,
                progress,
                canReplay: true,
                lastCompleted: progress.completedAt ? new Date(progress.completedAt) : undefined
              })
            } catch (error) {
              console.warn(`Failed to load tour ${tourId} for replay:`, error)
            }
          }
        }

        // Sort by last completion date (most recent first)
        replayable.sort((a, b) => {
          const dateA = a.lastCompleted?.getTime() || 0
          const dateB = b.lastCompleted?.getTime() || 0
          return dateB - dateA
        })

        setReplayableTours(replayable)
      } catch (error) {
        console.error('Failed to load replayable tours:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReplayableTours()
  }, [getAllProgress])

  const handleReplayTour = (tourId: string, mode: 'normal' | 'step-by-step' | 'auto' = 'normal') => {
    // Reset tour progress to allow replay
    resetTour(tourId)
    
    // Start the tour with replay options
    const options = {
      autoStart: mode === 'auto',
      showProgress: true,
      allowClose: true,
      onComplete: () => {
        // Restore original progress after replay
        const originalTour = replayableTours.find(t => t.tourId === tourId)
        if (originalTour) {
          // Mark as completed again but keep replay capability
          setTimeout(() => {
            // This would restore the original completion status
          }, 1000)
        }
      }
    }
    
    startTour(tourId, options)
    setSelectedTour(tourId)
    setReplayMode(mode)
  }

  const handleStopReplay = () => {
    stopTour()
    setSelectedTour(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-warning-600" />
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success-100 text-success-800">Completed</Badge>
      case 'skipped':
        return <Badge className="bg-warning-100 text-warning-800">Skipped</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-muted-foreground">Loading replayable tours...</div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tour Replay</h2>
          <p className="text-muted-foreground mt-1">
            Replay completed tours to refresh your knowledge
          </p>
        </div>
        
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Active Replay Controls */}
      <AnimatePresence>
        {isActive && selectedTour && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">Replaying Tour</h3>
                    <p className="text-sm text-muted-foreground">
                      {replayableTours.find(t => t.tourId === selectedTour)?.tour.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {replayMode} mode
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleStopReplay}>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Replay
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replayable Tours List */}
      {replayableTours.length === 0 ? (
        <Card className="p-8 text-center">
          <RotateCcw className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tours to replay</h3>
          <p className="text-muted-foreground">
            Complete some tours first to see them here for replay
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available for Replay</h3>
            <p className="text-sm text-muted-foreground">
              {replayableTours.length} tours completed
            </p>
          </div>

          <div className="grid gap-4">
            {replayableTours.map((item) => (
              <Card key={item.tourId} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    {getStatusIcon(item.progress.status)}
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {item.tour.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.tour.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(item.tour.metadata.estimatedDuration)}</span>
                        </div>
                        {item.lastCompleted && (
                          <div>
                            Completed: {formatDate(item.lastCompleted)}
                          </div>
                        )}
                        <div className="capitalize">
                          Category: {item.tour.category.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(item.progress.status)}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Replay Options */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Choose replay mode:
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplayTour(item.tourId, 'normal')}
                      disabled={isActive}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Normal
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplayTour(item.tourId, 'step-by-step')}
                      disabled={isActive}
                    >
                      <SkipForward className="w-3 h-3 mr-1" />
                      Step-by-Step
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplayTour(item.tourId, 'auto')}
                      disabled={isActive}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Auto
                    </Button>
                  </div>
                </div>

                {/* Progress Bar for Completed Tours */}
                {item.progress.status === 'completed' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Original Progress</span>
                      <span>{item.progress.completedSteps?.length || 0} / {item.tour.steps.length} steps</span>
                    </div>
                    <Progress 
                      value={((item.progress.completedSteps?.length || 0) / item.tour.steps.length) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Replay Tips */}
      <Card className="p-6 bg-muted/20">
        <h3 className="font-medium mb-3 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Replay Modes
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <Play className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Normal:</strong> Standard replay with full control over navigation
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <SkipForward className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Step-by-Step:</strong> Manual progression through each step
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RotateCcw className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Auto:</strong> Automatic progression with timed intervals
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}