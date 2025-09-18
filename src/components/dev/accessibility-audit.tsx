"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { auditAccessibility, checkColorPaletteAccessibility } from "@/lib/accessibility"

interface AccessibilityAuditProps {
  targetSelector?: string
  showOnlyInDev?: boolean
  className?: string
}

export function AccessibilityAudit({ 
  targetSelector = "body", 
  showOnlyInDev = true,
  className 
}: AccessibilityAuditProps) {
  const [auditResults, setAuditResults] = React.useState<{
    issues: Array<{
      type: string
      severity: 'error' | 'warning'
      message: string
      element: HTMLElement
    }>
    score: number
  } | null>(null)
  
  const [colorAudit, setColorAudit] = React.useState<{
    compliant: boolean
    issues: string[]
    suggestions: string[]
  } | null>(null)
  
  const [isVisible, setIsVisible] = React.useState(false)

  // Only show in development mode if specified
  if (showOnlyInDev && process.env.NODE_ENV !== 'development') {
    return null
  }

  const runAudit = React.useCallback(() => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement
    if (!targetElement) return

    // Run accessibility audit
    const results = auditAccessibility(targetElement)
    setAuditResults(results)

    // Run color palette audit
    const colors = {
      primary: getComputedStyle(document.documentElement).getPropertyValue('--primary-500').trim(),
      secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim(),
      background: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
      foreground: getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim(),
      muted: getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim(),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    }

    // Convert CSS variables to hex colors (simplified)
    const colorResults = checkColorPaletteAccessibility({
      primary: '#3b82f6', // Default primary color
      secondary: '#6b7280',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#6b7280',
      accent: '#f3f4f6'
    })
    
    setColorAudit(colorResults)
  }, [targetSelector])

  React.useEffect(() => {
    // Run initial audit
    runAudit()

    // Re-run audit when DOM changes
    const observer = new MutationObserver(() => {
      runAudit()
    })

    const targetElement = document.querySelector(targetSelector)
    if (targetElement) {
      observer.observe(targetElement, {
        childList: true,
        subtree: true,
        attributes: true
      })
    }

    return () => observer.disconnect()
  }, [runAudit, targetSelector])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success-600"
    if (score >= 70) return "text-warning-600"
    return "text-error-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "success" as const
    if (score >= 70) return "warning" as const
    return "destructive" as const
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Info className="w-4 h-4 mr-2" />
          A11y Audit
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden",
      className
    )}>
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Accessibility Audit</h3>
            {auditResults && (
              <Badge variant={getScoreBadgeVariant(auditResults.score)}>
                {auditResults.score}/100
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-80 overflow-y-auto scrollbar-thin">
          {/* Overall Score */}
          {auditResults && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <span className={cn("text-sm font-bold", getScoreColor(auditResults.score))}>
                  {auditResults.score}/100
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    auditResults.score >= 90 && "bg-success-500",
                    auditResults.score >= 70 && auditResults.score < 90 && "bg-warning-500",
                    auditResults.score < 70 && "bg-error-500"
                  )}
                  style={{ width: `${auditResults.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Issues */}
          {auditResults && auditResults.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Issues Found ({auditResults.issues.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {auditResults.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 rounded-md text-xs",
                      issue.severity === 'error' 
                        ? "bg-error-50 text-error-800 border border-error-200"
                        : "bg-warning-50 text-warning-800 border border-warning-200"
                    )}
                  >
                    <div className="font-medium capitalize">
                      {issue.type.replace('-', ' ')}
                    </div>
                    <div className="text-xs opacity-80">
                      {issue.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color Audit */}
          {colorAudit && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                {colorAudit.compliant ? (
                  <CheckCircle className="w-4 h-4 text-success-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning-600" />
                )}
                Color Contrast
              </h4>
              
              {colorAudit.issues.length > 0 && (
                <div className="space-y-1">
                  {colorAudit.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="p-2 bg-warning-50 text-warning-800 border border-warning-200 rounded-md text-xs"
                    >
                      {issue}
                    </div>
                  ))}
                </div>
              )}

              {colorAudit.suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium">Suggestions:</div>
                  {colorAudit.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2 bg-info-50 text-info-800 border border-info-200 rounded-md text-xs"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runAudit}
              className="text-xs"
            >
              Re-run Audit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (auditResults) {
                  console.log('Accessibility Audit Results:', auditResults)
                  console.log('Color Audit Results:', colorAudit)
                }
              }}
              className="text-xs"
            >
              Log Results
            </Button>
          </div>

          {/* Accessibility Tips */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Tips</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• Use semantic HTML elements</div>
              <div>• Provide alt text for images</div>
              <div>• Ensure sufficient color contrast</div>
              <div>• Make interactive elements keyboard accessible</div>
              <div>• Use ARIA labels when needed</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Hook for accessibility monitoring
export function useAccessibilityMonitor(enabled: boolean = true) {
  const [violations, setViolations] = React.useState<number>(0)
  const [score, setScore] = React.useState<number>(100)

  React.useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return

    const checkAccessibility = () => {
      const results = auditAccessibility(document.body)
      setViolations(results.issues.length)
      setScore(results.score)
    }

    // Initial check
    checkAccessibility()

    // Check on DOM changes
    const observer = new MutationObserver(checkAccessibility)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    })

    return () => observer.disconnect()
  }, [enabled])

  return { violations, score }
}