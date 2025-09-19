'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Users, 
  Eye, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Clock,
  Zap
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import { TourEvent } from '@/types/tour'
import { useTourAnalytics } from '@/lib/tour/tour-analytics'
import { cn } from '@/lib/utils'

interface RealTimeAnalyticsProps {
  className?: string
  maxEvents?: number
  showLiveMetrics?: boolean
}

interface LiveEvent {
  id: string
  event: TourEvent
  timestamp: Date
}

interface LiveMetrics {
  activeUsers: number
  eventsPerMinute: number
  completionRate: number
  helpRequestRate: number
}

const EventIcon: React.FC<{ eventType: TourEvent['type'] }> = ({ eventType }) => {
  const iconProps = { className: "h-4 w-4" }
  
  switch (eventType) {
    case 'tour_started':
      return <Zap {...iconProps} className="h-4 w-4 text-success-600" />
    case 'step_viewed':
      return <Eye {...iconProps} className="h-4 w-4 text-info-600" />
    case 'step_completed':
      return <CheckCircle {...iconProps} className="h-4 w-4 text-success-600" />
    case 'tour_completed':
      return <CheckCircle {...iconProps} className="h-4 w-4 text-success-600" />
    case 'tour_skipped':
      return <XCircle {...iconProps} className="h-4 w-4 text-error-600" />
    case 'help_requested':
      return <HelpCircle {...iconProps} className="h-4 w-4 text-orange-600" />
    default:
      return <Activity className="h-4 w-4" {...iconProps} />
  }
}

const EventTypeLabel: React.FC<{ eventType: TourEvent['type'] }> = ({ eventType }) => {
  const labels = {
    'tour_started': 'Tour iniciado',
    'step_viewed': 'Paso visto',
    'step_completed': 'Paso completado',
    'tour_completed': 'Tour completado',
    'tour_skipped': 'Tour omitido',
    'help_requested': 'Ayuda solicitada'
  }
  
  return <span>{labels[eventType] || eventType}</span>
}

const EventBadgeVariant: React.FC<{ eventType: TourEvent['type'] }> = ({ eventType }) => {
  const variants = {
    'tour_started': 'default',
    'step_viewed': 'secondary',
    'step_completed': 'default',
    'tour_completed': 'default',
    'tour_skipped': 'destructive',
    'help_requested': 'outline'
  } as const
  
  return (
    <Badge variant={variants[eventType] || 'secondary'} className="text-xs">
      <EventTypeLabel eventType={eventType} />
    </Badge>
  )
}

const LiveEventItem: React.FC<{ 
  liveEvent: LiveEvent
  index: number 
}> = ({ liveEvent, index }) => {
  const { event } = liveEvent
  const tourId = event.metadata?.tourId || 'Unknown'
  const userId = event.metadata?.userId || 'Anonymous'
  const stepIndex = event.stepIndex
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 border-b border-border/50 last:border-b-0"
    >
      <EventIcon eventType={event.type} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <EventBadgeVariant eventType={event.type} />
          {stepIndex !== undefined && (
            <Badge variant="outline" className="text-xs">
              Paso {stepIndex + 1}
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{tourId}</span>
          {' • '}
          <span>{userId.substring(0, 8)}...</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {liveEvent.timestamp.toLocaleTimeString()}
      </div>
    </motion.div>
  )
}

const LiveMetricsCard: React.FC<{ metrics: LiveMetrics }> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-info-600" />
            <div>
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
              <div className="text-xs text-muted-foreground">Usuarios activos</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-success-600" />
            <div>
              <div className="text-2xl font-bold">{metrics.eventsPerMinute}</div>
              <div className="text-xs text-muted-foreground">Eventos/min</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success-600" />
            <div>
              <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Completación</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">{metrics.helpRequestRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Solicitudes ayuda</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({
  className,
  maxEvents = 50,
  showLiveMetrics = true
}) => {
  const analytics = useTourAnalytics()
  const [liveEvents, setLiveEvents] = React.useState<LiveEvent[]>([])
  const [liveMetrics, setLiveMetrics] = React.useState<LiveMetrics>({
    activeUsers: 0,
    eventsPerMinute: 0,
    completionRate: 0,
    helpRequestRate: 0
  })
  const [isConnected, setIsConnected] = React.useState(false)

  // Track events per minute for live metrics
  const eventsPerMinuteRef = React.useRef<Date[]>([])

  // Handle real-time events
  React.useEffect(() => {
    const handleRealTimeEvent = (event: CustomEvent) => {
      const tourEvent = event.detail as TourEvent
      
      const liveEvent: LiveEvent = {
        id: `${Date.now()}-${Math.random()}`,
        event: tourEvent,
        timestamp: new Date()
      }
      
      setLiveEvents(prev => {
        const updated = [liveEvent, ...prev].slice(0, maxEvents)
        return updated
      })
      
      // Update events per minute tracking
      const now = new Date()
      eventsPerMinuteRef.current.push(now)
      
      // Keep only events from the last minute
      eventsPerMinuteRef.current = eventsPerMinuteRef.current.filter(
        eventTime => now.getTime() - eventTime.getTime() < 60000
      )
      
      setIsConnected(true)
    }

    window.addEventListener('tour-analytics-event', handleRealTimeEvent)
    
    return () => {
      window.removeEventListener('tour-analytics-event', handleRealTimeEvent)
    }
  }, [maxEvents])

  // Update live metrics periodically
  React.useEffect(() => {
    const updateMetrics = () => {
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60000)
      const fiveMinutesAgo = new Date(now.getTime() - 300000)
      
      // Get recent events for calculations
      const recentEvents = liveEvents.filter(
        le => le.timestamp >= fiveMinutesAgo
      )
      
      // Calculate active users (users with events in last 5 minutes)
      const activeUserIds = new Set(
        recentEvents
          .map(le => le.event.metadata?.userId)
          .filter(Boolean)
      )
      
      // Calculate completion rate from recent events
      const tourStarts = recentEvents.filter(le => le.event.type === 'tour_started').length
      const tourCompletions = recentEvents.filter(le => le.event.type === 'tour_completed').length
      const completionRate = tourStarts > 0 ? (tourCompletions / tourStarts) * 100 : 0
      
      // Calculate help request rate
      const totalSteps = recentEvents.filter(le => le.event.type === 'step_viewed').length
      const helpRequests = recentEvents.filter(le => le.event.type === 'help_requested').length
      const helpRequestRate = totalSteps > 0 ? (helpRequests / totalSteps) * 100 : 0
      
      setLiveMetrics({
        activeUsers: activeUserIds.size,
        eventsPerMinute: eventsPerMinuteRef.current.length,
        completionRate,
        helpRequestRate
      })
    }

    // Update metrics every 10 seconds
    const interval = setInterval(updateMetrics, 10000)
    updateMetrics() // Initial update
    
    return () => clearInterval(interval)
  }, [liveEvents])

  // Connection status indicator
  React.useEffect(() => {
    if (isConnected) {
      const timeout = setTimeout(() => setIsConnected(false), 30000) // 30 seconds timeout
      return () => clearTimeout(timeout)
    }
  }, [isConnected, liveEvents])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics en Tiempo Real</h2>
        <div className="flex items-center gap-2">
          <div className={cn(
            'h-2 w-2 rounded-full',
            isConnected ? 'bg-success-500' : 'bg-gray-400'
          )} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Live Metrics */}
      {showLiveMetrics && (
        <LiveMetricsCard metrics={liveMetrics} />
      )}

      {/* Live Events Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Eventos en Vivo
            {liveEvents.length > 0 && (
              <Badge variant="secondary">{liveEvents.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {liveEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Esperando eventos en tiempo real...</p>
              <p className="text-sm mt-1">
                Los eventos aparecerán aquí cuando los usuarios interactúen con los tours.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <AnimatePresence mode="popLayout">
                {liveEvents.map((liveEvent, index) => (
                  <LiveEventItem
                    key={liveEvent.id}
                    liveEvent={liveEvent}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Event Summary */}
      {liveEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(
                liveEvents.reduce((acc, le) => {
                  acc[le.event.type] = (acc[le.event.type] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([eventType, count]) => (
                <div key={eventType} className="text-center">
                  <div className="flex justify-center mb-1">
                    <EventIcon eventType={eventType as TourEvent['type']} />
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">
                    <EventTypeLabel eventType={eventType as TourEvent['type']} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}