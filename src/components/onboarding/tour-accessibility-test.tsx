'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Play,
  FileText
} from 'lucide-react'
import { 
  checkTourWCAGCompliance, 
  generateAccessibilityReport,
  type WCAGComplianceResult,
  type WCAGIssue
} from '@/lib/accessibility'

interface TourAccessibilityTestProps {
  tourElement?: HTMLElement | null
  onTestComplete?: (result: WCAGComplianceResult) => void
}

/**
 * Component for testing and displaying tour accessibility compliance
 */
export function TourAccessibilityTest({ 
  tourElement, 
  onTestComplete 
}: TourAccessibilityTestProps) {
  const [result, setResult] = useState<WCAGComplianceResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Auto-test when tour element is provided
  useEffect(() => {
    if (tourElement) {
      runAccessibilityTest()
    }
  }, [tourElement])

  const runAccessibilityTest = async () => {
    if (!tourElement) return

    setIsLoading(true)
    
    try {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const testResult = checkTourWCAGCompliance(tourElement, {
        checkContrast: true,
        checkKeyboard: true,
        checkAria: true,
        checkMotion: true,
        checkFocus: true
      })
      
      setResult(testResult)
      onTestComplete?.(testResult)
    } catch (error) {
      console.error('Accessibility test failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getComplianceBadgeVariant = (level: string) => {
    switch (level) {
      case 'AAA': return 'default'
      case 'AA': return 'secondary'
      default: return 'destructive'
    }
  }

  const getSeverityIcon = (severity: WCAGIssue['severity']) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'info': return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityColor = (severity: WCAGIssue['severity']) => {
    switch (severity) {
      case 'error': return 'text-destructive'
      case 'warning': return 'text-warning'
      case 'info': return 'text-muted-foreground'
    }
  }

  const generateReport = () => {
    if (!result) return ''
    return generateAccessibilityReport(result)
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Accessibility Compliance Test
          </CardTitle>
          <div className="flex items-center gap-2">
            {result && (
              <Badge variant={getComplianceBadgeVariant(result.level)}>
                WCAG {result.level}
              </Badge>
            )}
            <Button
              onClick={runAccessibilityTest}
              disabled={!tourElement || isLoading}
              size="sm"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Testing...' : 'Run Test'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!tourElement && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No tour element provided. Start a tour to run accessibility tests.
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <>
            {/* Overall Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.score}/100</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.level}</div>
                    <div className="text-sm text-muted-foreground">Compliance Level</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.issues.length}</div>
                    <div className="text-sm text-muted-foreground">Issues Found</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Issues Breakdown */}
            {result.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Issues Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.issues.map((issue, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${getSeverityColor(issue.severity)}`}>
                              {issue.description}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {issue.type}
                            </Badge>
                            {issue.element && (
                              <Badge variant="secondary" className="text-xs">
                                {issue.element}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <strong>Fix:</strong> {issue.fix}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Report Generation */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowReport(!showReport)}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                {showReport ? 'Hide' : 'Show'} Detailed Report
              </Button>
              
              <Button
                onClick={() => {
                  const report = generateReport()
                  navigator.clipboard.writeText(report)
                }}
                variant="outline"
                size="sm"
              >
                Copy Report
              </Button>
            </div>

            {/* Detailed Report */}
            {showReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto whitespace-pre-wrap">
                    {generateReport()}
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Testing Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accessibility Testing Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">What We Test:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Color contrast ratios (WCAG AA/AAA)</li>
                  <li>• Keyboard navigation support</li>
                  <li>• ARIA attributes and labels</li>
                  <li>• Focus management</li>
                  <li>• Motion and animation preferences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Compliance Levels:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>AAA:</strong> Highest accessibility standard</li>
                  <li>• <strong>AA:</strong> Standard compliance level</li>
                  <li>• <strong>Fail:</strong> Does not meet minimum standards</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

/**
 * Hook for running accessibility tests
 */
export function useAccessibilityTest() {
  const [result, setResult] = useState<WCAGComplianceResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = useCallback(async (element: HTMLElement) => {
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      const testResult = checkTourWCAGCompliance(element)
      setResult(testResult)
      return testResult
    } catch (error) {
      console.error('Accessibility test failed:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    result,
    isLoading,
    runTest
  }
}