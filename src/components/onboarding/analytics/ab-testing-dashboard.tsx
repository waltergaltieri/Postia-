'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  FlaskConical, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Square
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { cn } from '@/lib/utils'

interface ABTestVariant {
  id: string
  name: string
  description: string
  config: Record<string, any>
  trafficAllocation: number // Percentage of traffic
  isControl: boolean
}

interface ABTestResults {
  variantId: string
  participants: number
  completionRate: number
  averageTime: number
  helpRequestRate: number
  dropoffRate: number
  conversionRate: number
  confidenceLevel: number
  isStatisticallySignificant: boolean
}

interface ABTest {
  id: string
  name: string
  description: string
  tourId: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  startDate: Date
  endDate?: Date
  variants: ABTestVariant[]
  results: ABTestResults[]
  hypothesis: string
  successMetric: 'completion_rate' | 'time_to_complete' | 'help_requests' | 'dropoff_rate'
  minimumSampleSize: number
  confidenceLevel: number
}

interface ABTestingDashboardProps {
  className?: string
  tourId?: string
}

// Mock data for demonstration
const mockABTests: ABTest[] = [
  {
    id: 'test-1',
    name: 'Welcome Tour - Paso a Paso vs. Resumen',
    description: 'Comparar tour detallado paso a paso vs. resumen rápido',
    tourId: 'welcome-tour',
    status: 'running',
    startDate: new Date('2024-01-15'),
    variants: [
      {
        id: 'control',
        name: 'Control - Tour Detallado',
        description: 'Tour original con 8 pasos detallados',
        config: { stepCount: 8, detailLevel: 'high' },
        trafficAllocation: 50,
        isControl: true
      },
      {
        id: 'variant-a',
        name: 'Variante A - Tour Rápido',
        description: 'Tour condensado con 4 pasos principales',
        config: { stepCount: 4, detailLevel: 'low' },
        trafficAllocation: 50,
        isControl: false
      }
    ],
    results: [
      {
        variantId: 'control',
        participants: 245,
        completionRate: 68.2,
        averageTime: 180000,
        helpRequestRate: 15.3,
        dropoffRate: 31.8,
        conversionRate: 68.2,
        confidenceLevel: 95,
        isStatisticallySignificant: true
      },
      {
        variantId: 'variant-a',
        participants: 238,
        completionRate: 82.4,
        averageTime: 95000,
        helpRequestRate: 8.7,
        dropoffRate: 17.6,
        conversionRate: 82.4,
        confidenceLevel: 95,
        isStatisticallySignificant: true
      }
    ],
    hypothesis: 'Un tour más corto aumentará la tasa de completación',
    successMetric: 'completion_rate',
    minimumSampleSize: 200,
    confidenceLevel: 95
  },
  {
    id: 'test-2',
    name: 'Content Generation - Ayuda Contextual',
    description: 'Probar diferentes niveles de ayuda contextual',
    tourId: 'content-generation-tour',
    status: 'completed',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-14'),
    variants: [
      {
        id: 'control',
        name: 'Control - Ayuda Básica',
        description: 'Tooltips básicos sin ayuda contextual',
        config: { helpLevel: 'basic' },
        trafficAllocation: 33,
        isControl: true
      },
      {
        id: 'variant-b',
        name: 'Variante B - Ayuda Moderada',
        description: 'Tooltips con ejemplos y sugerencias',
        config: { helpLevel: 'moderate' },
        trafficAllocation: 33,
        isControl: false
      },
      {
        id: 'variant-c',
        name: 'Variante C - Ayuda Completa',
        description: 'Ayuda contextual completa con videos',
        config: { helpLevel: 'comprehensive' },
        trafficAllocation: 34,
        isControl: false
      }
    ],
    results: [
      {
        variantId: 'control',
        participants: 156,
        completionRate: 72.4,
        averageTime: 240000,
        helpRequestRate: 28.2,
        dropoffRate: 27.6,
        conversionRate: 72.4,
        confidenceLevel: 95,
        isStatisticallySignificant: true
      },
      {
        variantId: 'variant-b',
        participants: 162,
        completionRate: 85.8,
        averageTime: 210000,
        helpRequestRate: 12.3,
        dropoffRate: 14.2,
        conversionRate: 85.8,
        confidenceLevel: 95,
        isStatisticallySignificant: true
      },
      {
        variantId: 'variant-c',
        participants: 158,
        completionRate: 78.5,
        averageTime: 280000,
        helpRequestRate: 8.9,
        dropoffRate: 21.5,
        conversionRate: 78.5,
        confidenceLevel: 95,
        isStatisticallySignificant: true
      }
    ],
    hypothesis: 'Más ayuda contextual mejorará la experiencia del usuario',
    successMetric: 'completion_rate',
    minimumSampleSize: 150,
    confidenceLevel: 95
  }
]

const StatusBadge: React.FC<{ status: ABTest['status'] }> = ({ status }) => {
  const variants = {
    draft: { variant: 'secondary' as const, icon: Square, text: 'Borrador' },
    running: { variant: 'default' as const, icon: Play, text: 'Ejecutándose' },
    paused: { variant: 'outline' as const, icon: Pause, text: 'Pausado' },
    completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completado' }
  }
  
  const config = variants[status]
  const Icon = config.icon
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  )
}

const VariantResultCard: React.FC<{ 
  variant: ABTestVariant
  result: ABTestResults
  isWinner?: boolean
  successMetric: ABTest['successMetric']
}> = ({ variant, result, isWinner, successMetric }) => {
  const getMetricValue = () => {
    switch (successMetric) {
      case 'completion_rate': return `${result.completionRate.toFixed(1)}%`
      case 'time_to_complete': return `${Math.round(result.averageTime / 1000)}s`
      case 'help_requests': return `${result.helpRequestRate.toFixed(1)}%`
      case 'dropoff_rate': return `${result.dropoffRate.toFixed(1)}%`
      default: return `${result.completionRate.toFixed(1)}%`
    }
  }

  const getMetricTrend = (value: number, isLowerBetter = false) => {
    // This would compare against control or previous values
    // For demo, using arbitrary logic
    if (isLowerBetter) {
      return value < 20 ? 'up' : value > 40 ? 'down' : 'neutral'
    } else {
      return value > 70 ? 'up' : value < 50 ? 'down' : 'neutral'
    }
  }

  return (
    <Card className={cn(
      'relative',
      isWinner && 'ring-2 ring-green-500 bg-success-50/50',
      variant.isControl && 'border-info-200'
    )}>
      {isWinner && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-success-600 text-white">
            <Target className="h-3 w-3 mr-1" />
            Ganador
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{variant.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {variant.description}
            </p>
          </div>
          {variant.isControl && (
            <Badge variant="outline">Control</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{getMetricValue()}</div>
            <div className="text-sm text-muted-foreground">Métrica principal</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{result.participants}</div>
            <div className="text-sm text-muted-foreground">Participantes</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completación</span>
            <span className="font-medium">{result.completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={result.completionRate} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span>Tiempo promedio</span>
            <span className="font-medium">{Math.round(result.averageTime / 1000)}s</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Solicitudes de ayuda</span>
            <span className="font-medium">{result.helpRequestRate.toFixed(1)}%</span>
          </div>
        </div>
        
        {result.isStatisticallySignificant ? (
          <div className="flex items-center gap-2 text-success-700 text-sm">
            <CheckCircle className="h-4 w-4" />
            Estadísticamente significativo ({result.confidenceLevel}%)
          </div>
        ) : (
          <div className="flex items-center gap-2 text-warning-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            Necesita más datos para significancia
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const ABTestCard: React.FC<{ test: ABTest }> = ({ test }) => {
  const winningVariant = React.useMemo(() => {
    if (test.results.length < 2) return null
    
    const sortedResults = [...test.results].sort((a, b) => {
      switch (test.successMetric) {
        case 'completion_rate':
        case 'conversionRate':
          return b.completionRate - a.completionRate
        case 'time_to_complete':
          return a.averageTime - b.averageTime
        case 'help_requests':
        case 'dropoff_rate':
          return a.helpRequestRate - b.helpRequestRate
        default:
          return b.completionRate - a.completionRate
      }
    })
    
    return sortedResults[0]?.variantId
  }, [test.results, test.successMetric])

  const totalParticipants = test.results.reduce((sum, r) => sum + r.participants, 0)
  const progressPercentage = Math.min((totalParticipants / test.minimumSampleSize) * 100, 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{test.name}</CardTitle>
              <StatusBadge status={test.status} />
            </div>
            <p className="text-sm text-muted-foreground">{test.description}</p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Hipótesis:</strong> {test.hypothesis}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Progreso: {totalParticipants} / {test.minimumSampleSize} participantes</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {test.variants.map(variant => {
            const result = test.results.find(r => r.variantId === variant.id)
            if (!result) return null
            
            return (
              <VariantResultCard
                key={variant.id}
                variant={variant}
                result={result}
                isWinner={variant.id === winningVariant}
                successMetric={test.successMetric}
              />
            )
          })}
        </div>
        
        {test.status === 'completed' && winningVariant && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Resultado:</strong> La variante "{test.variants.find(v => v.id === winningVariant)?.name}" 
              mostró el mejor rendimiento en {test.successMetric.replace('_', ' ')}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export const ABTestingDashboard: React.FC<ABTestingDashboardProps> = ({
  className,
  tourId
}) => {
  const [tests, setTests] = React.useState<ABTest[]>(mockABTests)
  const [selectedTest, setSelectedTest] = React.useState<string | null>(null)

  const filteredTests = tourId 
    ? tests.filter(test => test.tourId === tourId)
    : tests

  const runningTests = filteredTests.filter(test => test.status === 'running')
  const completedTests = filteredTests.filter(test => test.status === 'completed')

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Testing Dashboard</h2>
          <p className="text-muted-foreground">
            Experimenta y optimiza la experiencia de tours
          </p>
        </div>
        <Button>
          <FlaskConical className="h-4 w-4 mr-2" /> <span>Nuevo Test A/B</span></Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-info-600" />
              <div>
                <div className="text-2xl font-bold">{filteredTests.length}</div>
                <div className="text-xs text-muted-foreground">Tests totales</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-success-600" />
              <div>
                <div className="text-2xl font-bold">{runningTests.length}</div>
                <div className="text-xs text-muted-foreground">Ejecutándose</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <div>
                <div className="text-2xl font-bold">{completedTests.length}</div>
                <div className="text-xs text-muted-foreground">Completados</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredTests.reduce((sum, test) => 
                    sum + test.results.reduce((s, r) => s + r.participants, 0), 0
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Participantes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="running" className="space-y-4">
        <TabsList>
          <TabsTrigger value="running">
            Tests Activos ({runningTests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completados ({completedTests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({filteredTests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="running" className="space-y-4">
          {runningTests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  No hay tests A/B ejecutándose
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Crea un nuevo test para comenzar a optimizar tus tours.
                </p>
              </CardContent>
            </Card>
          ) : (
            runningTests.map(test => (
              <ABTestCard key={test.id} test={test} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTests.map(test => (
            <ABTestCard key={test.id} test={test} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredTests.map(test => (
            <ABTestCard key={test.id} test={test} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}