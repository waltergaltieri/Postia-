'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  HelpCircle,
  SkipForward,
  Target,
  AlertTriangle
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

import { TourMetrics, TourAnalyticsEngine, useTourAnalytics } from '@/lib/tour/tour-analytics'
import { CompletionAnalyzer, CompletionAnalysis } from '@/lib/tour/analytics/completion-analyzer'
import { BehaviorAnalyzer, BehaviorAnalysis } from '@/lib/tour/analytics/behavior-analyzer'
import { cn } from '@/lib/utils'

interface TourMetricsDashboardProps {
  tourId?: string
  className?: string
  showRealTimeUpdates?: boolean
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  className?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  description,
  className
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-success-600'
      case 'down': return 'text-error-600'
      default: return 'text-muted-foreground'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />
      case 'down': return <TrendingDown className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={cn('flex items-center text-xs', getTrendColor())}>
            {getTrendIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface StepMetricsChartProps {
  stepMetrics: Array<{
    stepIndex: number
    viewCount: number
    completionCount: number
    dropoffCount: number
    helpRequestCount: number
  }>
}

const StepMetricsChart: React.FC<StepMetricsChartProps> = ({ stepMetrics }) => {
  const maxViews = Math.max(...stepMetrics.map(s => s.viewCount), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Métricas por Paso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stepMetrics.map((step) => {
            const completionRate = step.viewCount > 0 
              ? (step.completionCount / step.viewCount) * 100 
              : 0
            const dropoffRate = step.viewCount > 0 
              ? (step.dropoffCount / step.viewCount) * 100 
              : 0

            return (
              <div key={step.stepIndex} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Paso {step.stepIndex + 1}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{step.viewCount} vistas</span>
                    <span>{step.completionCount} completados</span>
                    {step.helpRequestCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {step.helpRequestCount} ayudas
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Completación</span>
                    <span>{completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                  
                  {dropoffRate > 0 && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-error-600">Abandono</span>
                        <span className="text-error-600">{dropoffRate.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={dropoffRate} 
                        className="h-1" 
                        // @ts-ignore - Custom color for dropoff
                        style={{ '--progress-background': 'rgb(239 68 68)' }}
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface CompletionAnalysisCardProps {
  analysis: CompletionAnalysis
}

const CompletionAnalysisCard: React.FC<CompletionAnalysisCardProps> = ({ analysis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Análisis de Completación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-success-600">
              {analysis.overallCompletionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Tasa de completación general
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-info-600">
              {Math.round(analysis.timeToComplete.averageCompletionTime / 1000)}s
            </div>
            <div className="text-sm text-muted-foreground">
              Tiempo promedio
            </div>
          </div>
        </div>

        {analysis.dropoffAnalysis.criticalDropoffPoints.length > 0 && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-center gap-2 text-error-800 font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              Puntos críticos de abandono
            </div>
            <div className="text-sm text-error-700 mt-1">
              Pasos: {analysis.dropoffAnalysis.criticalDropoffPoints.map(p => p + 1).join(', ')}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Completación por dispositivo</h4>
          {Array.from(analysis.completionByDevice.entries()).map(([device, rate]) => (
            <div key={device} className="flex items-center justify-between">
              <span className="text-sm capitalize">{device}</span>
              <div className="flex items-center gap-2">
                <Progress value={rate} className="w-20 h-2" />
                <span className="text-sm font-medium">{rate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface BehaviorAnalysisCardProps {
  analysis: BehaviorAnalysis
}

const BehaviorAnalysisCard: React.FC<BehaviorAnalysisCardProps> = ({ analysis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Análisis de Comportamiento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">
              {analysis.engagementMetrics.averageTimePerStep / 1000}s
            </div>
            <div className="text-sm text-muted-foreground">
              Tiempo promedio por paso
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {analysis.helpSeekingBehavior.helpRequestRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Tasa de solicitud de ayuda
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Segmentos de usuarios</h4>
          {analysis.userSegments.map((segment) => (
            <div key={segment.segmentName} className="p-2 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{segment.segmentName}</span>
                <Badge variant="secondary">{segment.userCount} usuarios</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {segment.completionRate.toFixed(1)}% completación
              </div>
              <div className="text-xs text-muted-foreground">
                {segment.characteristics.join(', ')}
              </div>
            </div>
          ))}
        </div>

        {analysis.engagementMetrics.rushingIndicators.fastClickRate > 30 && (
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center gap-2 text-warning-800 font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              Comportamiento apresurado detectado
            </div>
            <div className="text-sm text-warning-700 mt-1">
              {analysis.engagementMetrics.rushingIndicators.fastClickRate.toFixed(1)}% de clics rápidos
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const TourMetricsDashboard: React.FC<TourMetricsDashboardProps> = ({
  tourId,
  className,
  showRealTimeUpdates = false
}) => {
  const analytics = useTourAnalytics()
  const [metrics, setMetrics] = React.useState<TourMetrics | null>(null)
  const [completionAnalysis, setCompletionAnalysis] = React.useState<CompletionAnalysis | null>(null)
  const [behaviorAnalysis, setBehaviorAnalysis] = React.useState<BehaviorAnalysis | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Load analytics data
  React.useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true)
      
      try {
        if (tourId) {
          // Load metrics for specific tour
          const tourMetrics = analytics.calculateTourMetrics(tourId)
          setMetrics(tourMetrics)
        }

        // Load all analytics for comprehensive analysis
        const allAnalytics = analytics.exportAnalytics().analytics
        
        if (allAnalytics.length > 0) {
          const completion = CompletionAnalyzer.analyzeCompletion(allAnalytics)
          const behavior = BehaviorAnalyzer.analyzeBehavior(allAnalytics)
          
          setCompletionAnalysis(completion)
          setBehaviorAnalysis(behavior)
        }
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [tourId, analytics])

  // Real-time updates
  React.useEffect(() => {
    if (!showRealTimeUpdates) return

    const handleRealTimeEvent = () => {
      // Reload analytics when new events come in
      if (tourId) {
        const tourMetrics = analytics.calculateTourMetrics(tourId)
        setMetrics(tourMetrics)
      }
    }

    window.addEventListener('tour-analytics-event', handleRealTimeEvent)
    return () => window.removeEventListener('tour-analytics-event', handleRealTimeEvent)
  }, [tourId, analytics, showRealTimeUpdates])

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics && !completionAnalysis && !behaviorAnalysis) {
    return (
      <div className={cn('text-center py-12', className)}>
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No hay datos de analytics disponibles
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Los datos aparecerán aquí una vez que los usuarios comiencen a usar los tours.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Tasa de Completación"
            value={`${metrics.completionRate.toFixed(1)}%`}
            icon={Target}
            trend={metrics.completionRate > 70 ? 'up' : metrics.completionRate < 50 ? 'down' : 'neutral'}
            description="Porcentaje de tours completados"
          />
          
          <MetricCard
            title="Tiempo Promedio"
            value={`${Math.round(metrics.averageDuration / 1000)}s`}
            icon={Clock}
            description="Tiempo promedio de completación"
          />
          
          <MetricCard
            title="Solicitudes de Ayuda"
            value={metrics.helpRequests}
            icon={HelpCircle}
            description="Total de solicitudes de ayuda"
          />
          
          <MetricCard
            title="Tasa de Abandono"
            value={`${metrics.skipRate.toFixed(1)}%`}
            icon={SkipForward}
            trend={metrics.skipRate < 20 ? 'up' : metrics.skipRate > 40 ? 'down' : 'neutral'}
            description="Porcentaje de tours abandonados"
          />
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="completion">Completación</TabsTrigger>
          <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
          {metrics && <TabsTrigger value="steps">Por Pasos</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completionAnalysis && (
              <CompletionAnalysisCard analysis={completionAnalysis} />
            )}
            {behaviorAnalysis && (
              <BehaviorAnalysisCard analysis={behaviorAnalysis} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completion" className="space-y-4">
          {completionAnalysis && (
            <CompletionAnalysisCard analysis={completionAnalysis} />
          )}
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          {behaviorAnalysis && (
            <BehaviorAnalysisCard analysis={behaviorAnalysis} />
          )}
        </TabsContent>

        {metrics && (
          <TabsContent value="steps" className="space-y-4">
            <StepMetricsChart stepMetrics={metrics.stepMetrics} />
          </TabsContent>
        )}
      </Tabs>

      {/* Recommendations */}
      {completionAnalysis && behaviorAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CompletionAnalyzer.generateRecommendations(completionAnalysis).map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-info-50 border border-info-200 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-info-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-info-800">{rec}</span>
                </div>
              ))}
              {BehaviorAnalyzer.generateBehaviorRecommendations(behaviorAnalysis).map((rec, index) => (
                <div key={`behavior-${index}`} className="flex items-start gap-2 p-2 bg-success-50 border border-success-200 rounded-lg">
                  <Users className="h-4 w-4 text-success-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-success-800">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}