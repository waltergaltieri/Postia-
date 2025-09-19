'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TestTube, 
  TrendingUp, 
  Users, 
  Eye, 
  BarChart3,
  CheckCircle,
  XCircle,
  Shuffle,
  Target,
  Star
} from 'lucide-react'

interface ABTestVariant {
  id: string
  name: string
  description: string
  component: ReactNode
  weight?: number // For traffic allocation (0-1)
}

interface ABTestResult {
  variantId: string
  conversions: number
  views: number
  conversionRate: number
  aestheticRating: number
  userSatisfaction: number
  bounceRate: number
}

interface ABTestConfig {
  id: string
  name: string
  description: string
  variants: ABTestVariant[]
  targetMetric: 'conversion' | 'aesthetic' | 'satisfaction' | 'engagement'
  duration: number // in days
  minSampleSize: number
  confidenceLevel: number // 0.95 for 95%
}

interface ABTestingProps {
  testConfig: ABTestConfig
  onTestComplete?: (results: ABTestResult[]) => void
  className?: string
}

// Simulated A/B test data (in real implementation, this would come from analytics)
const generateMockResults = (variants: ABTestVariant[]): ABTestResult[] => {
  return variants.map(variant => ({
    variantId: variant.id,
    conversions: Math.floor(Math.random() * 100) + 50,
    views: Math.floor(Math.random() * 500) + 200,
    conversionRate: Math.random() * 0.3 + 0.1, // 10-40%
    aestheticRating: Math.random() * 2 + 3, // 3-5 stars
    userSatisfaction: Math.random() * 2 + 3, // 3-5 stars
    bounceRate: Math.random() * 0.4 + 0.1 // 10-50%
  }))
}

export function ABTesting({ testConfig, onTestComplete, className }: ABTestingProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<ABTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  // Simulate test running
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1
          if (newProgress >= 100) {
            setIsRunning(false)
            const results = generateMockResults(testConfig.variants)
            setTestResults(results)
            if (onTestComplete) {
              onTestComplete(results)
            }
            return 100
          }
          return newProgress
        })
      }, 100) // Complete in 10 seconds for demo

      return () => clearInterval(interval)
    }
  }, [isRunning, testConfig.variants, onTestComplete])

  const startTest = () => {
    setIsRunning(true)
    setProgress(0)
    setTestResults([])
  }

  const stopTest = () => {
    setIsRunning(false)
    if (testResults.length === 0) {
      const results = generateMockResults(testConfig.variants)
      setTestResults(results)
    }
  }

  const getWinningVariant = (): ABTestResult | null => {
    if (testResults.length === 0) return null
    
    return testResults.reduce((winner, current) => {
      switch (testConfig.targetMetric) {
        case 'conversion':
          return current.conversionRate > winner.conversionRate ? current : winner
        case 'aesthetic':
          return current.aestheticRating > winner.aestheticRating ? current : winner
        case 'satisfaction':
          return current.userSatisfaction > winner.userSatisfaction ? current : winner
        case 'engagement':
          return current.bounceRate < winner.bounceRate ? current : winner
        default:
          return winner
      }
    })
  }

  const getStatisticalSignificance = (result: ABTestResult): number => {
    // Simplified statistical significance calculation
    const sampleSize = result.views
    const effect = result.conversionRate
    
    if (sampleSize < testConfig.minSampleSize) return 0
    
    // Mock calculation - in real implementation, use proper statistical tests
    return Math.min(0.99, (sampleSize * effect) / 100)
  }

  const winningVariant = getWinningVariant()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Test Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-info-600" />
                {testConfig.name}
              </CardTitle>
              <CardDescription>{testConfig.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              {!isRunning && testResults.length === 0 && (
                <Button onClick={startTest}>
                  <Shuffle className="h-4 w-4 mr-2" /> <span>Start A/B Test</span></Button>
              )}
              {isRunning && (
                <Button variant="outline" onClick={stopTest}> <span>Stop Test</span></Button>
              )}
            </div>
          </div>
          
          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Test Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Test Configuration */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Target Metric</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-info-600" />
              <span className="capitalize">{testConfig.targetMetric}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-success-600" />
              <span>{testConfig.variants.length} variants</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span>{testConfig.duration} days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <span>{(testConfig.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variants Preview */}
      <div className="grid gap-6 md:grid-cols-2">
        {testConfig.variants.map((variant) => (
          <motion.div
            key={variant.id}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <Card className={`cursor-pointer transition-all ${
              selectedVariant === variant.id ? 'ring-2 ring-blue-500' : ''
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{variant.name}</CardTitle>
                  {winningVariant?.variantId === variant.id && (
                    <Badge className="bg-success-100 text-success-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Winner
                    </Badge>
                  )}
                </div>
                <CardDescription>{variant.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                  {variant.component || (
                    <div className="text-center text-muted-foreground">
                      <Eye className="h-8 w-8 mx-auto mb-2" />
                      <p>Variant Preview</p>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => <span>setSelectedVariant(
                    selectedVariant === variant.id ? null : variant.id
                  )}
                >
                  {selectedVariant === variant.id ? 'Hide Preview' : 'Preview Variant'}</span></Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Test Results */}
      <AnimatePresence>
        {testResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-success-600" />
                  Test Results
                </CardTitle>
                <CardDescription>
                  Statistical analysis of variant performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {testResults.map((result) => {
                    const variant = testConfig.variants.find(v => v.id === result.variantId)
                    const significance = getStatisticalSignificance(result)
                    const isWinner = winningVariant?.variantId === result.variantId
                    
                    return (
                      <div
                        key={result.variantId}
                        className={`p-4 rounded-lg border ${
                          isWinner ? 'bg-success-50 border-success-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            {variant?.name}
                            {isWinner && (
                              <Badge className="bg-success-100 text-success-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Winner
                              </Badge>
                            )}
                          </h4>
                          <div className="text-sm text-gray-600">
                            {(significance * 100).toFixed(1)}% confidence
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-5">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-info-600">
                              {result.views}
                            </div>
                            <div className="text-sm text-gray-600">Views</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-success-600">
                              {(result.conversionRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Conversion</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-2xl font-bold text-purple-600">
                                {result.aestheticRating.toFixed(1)}
                              </span>
                              <Star className="h-4 w-4 text-warning-600 fill-current" />
                            </div>
                            <div className="text-sm text-gray-600">Aesthetic</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-2xl font-bold text-orange-600">
                                {result.userSatisfaction.toFixed(1)}
                              </span>
                              <Star className="h-4 w-4 text-warning-600 fill-current" />
                            </div>
                            <div className="text-sm text-gray-600">Satisfaction</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-error-600">
                              {(result.bounceRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Bounce Rate</div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Statistical Significance</span>
                            <span>{(significance * 100).toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={significance * 100} 
                            className={significance > 0.95 ? 'bg-success-200' : 'bg-gray-200'}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {winningVariant && (
                  <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg">
                    <h4 className="font-semibold text-success-800 mb-2">
                      Recommendation
                    </h4>
                    <p className="text-success-700">
                      Implement variant "{testConfig.variants.find(v => v.id === winningVariant.variantId)?.name}" 
                      as it shows the best performance for {testConfig.targetMetric} with 
                      {(getStatisticalSignificance(winningVariant) * 100).toFixed(1)}% confidence.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Variant Full Preview */}
      <AnimatePresence>
        {selectedVariant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedVariant(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  {testConfig.variants.find(v => v.id === selectedVariant)?.name}
                </h3>
                <Button variant="outline" onClick={() => <span>setSelectedVariant(null)}>
                  Close</span></Button>
              </div>
              
              <div className="border rounded-lg p-6 bg-gray-50 min-h-[400px]">
                {testConfig.variants.find(v => v.id === selectedVariant)?.component || (
                  <div className="text-center text-muted-foreground flex items-center justify-center h-full">
                    <div>
                      <Eye className="h-8 w-8 mx-auto mb-4" />
                      <p>Full Variant Preview</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Example A/B test configurations for Postia
export const POSTIA_AB_TESTS: ABTestConfig[] = [
  {
    id: 'button-style-test',
    name: 'Primary Button Style Test',
    description: 'Testing different button styles for better conversion and aesthetic appeal',
    targetMetric: 'aesthetic',
    duration: 7,
    minSampleSize: 100,
    confidenceLevel: 0.95,
    variants: [
      {
        id: 'gradient-button',
        name: 'Gradient Button',
        description: 'Premium gradient button with subtle animation',
        component: (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"> <span>Generate Content</span></Button>
        )
      },
      {
        id: 'solid-button',
        name: 'Solid Button',
        description: 'Clean solid color button with hover effects',
        component: (
          <Button className="bg-info-600 hover:bg-info-700"> <span>Generate Content</span></Button>
        )
      }
    ]
  },
  {
    id: 'card-layout-test',
    name: 'Content Card Layout Test',
    description: 'Testing different card layouts for content display',
    targetMetric: 'engagement',
    duration: 14,
    minSampleSize: 200,
    confidenceLevel: 0.95,
    variants: [
      {
        id: 'elevated-card',
        name: 'Elevated Card',
        description: 'Card with shadow and hover elevation',
        component: (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        )
      },
      {
        id: 'flat-card',
        name: 'Flat Card',
        description: 'Minimal flat card with border',
        component: (
          <Card className="border-2 hover:border-info-300 transition-colors">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        )
      }
    ]
  }
]