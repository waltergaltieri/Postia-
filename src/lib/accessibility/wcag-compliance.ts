'use client'

import { getContrastRatio, meetsWCAGAA, meetsWCAGAAA } from './high-contrast'

export interface WCAGComplianceResult {
  level: 'AA' | 'AAA' | 'fail'
  score: number
  issues: WCAGIssue[]
  recommendations: string[]
}

export interface WCAGIssue {
  type: 'contrast' | 'focus' | 'keyboard' | 'aria' | 'motion'
  severity: 'error' | 'warning' | 'info'
  element?: string
  description: string
  fix: string
}

/**
 * Check WCAG compliance for tour components
 */
export function checkTourWCAGCompliance(
  tourElement: HTMLElement,
  options: {
    checkContrast?: boolean
    checkKeyboard?: boolean
    checkAria?: boolean
    checkMotion?: boolean
    checkFocus?: boolean
  } = {}
): WCAGComplianceResult {
  const {
    checkContrast = true,
    checkKeyboard = true,
    checkAria = true,
    checkMotion = true,
    checkFocus = true
  } = options

  const issues: WCAGIssue[] = []
  let score = 100

  // Check color contrast
  if (checkContrast) {
    const contrastIssues = checkColorContrast(tourElement)
    issues.push(...contrastIssues)
    score -= contrastIssues.length * 10
  }

  // Check keyboard navigation
  if (checkKeyboard) {
    const keyboardIssues = checkKeyboardNavigation(tourElement)
    issues.push(...keyboardIssues)
    score -= keyboardIssues.length * 15
  }

  // Check ARIA attributes
  if (checkAria) {
    const ariaIssues = checkAriaAttributes(tourElement)
    issues.push(...ariaIssues)
    score -= ariaIssues.length * 12
  }

  // Check motion preferences
  if (checkMotion) {
    const motionIssues = checkMotionCompliance(tourElement)
    issues.push(...motionIssues)
    score -= motionIssues.length * 8
  }

  // Check focus management
  if (checkFocus) {
    const focusIssues = checkFocusManagement(tourElement)
    issues.push(...focusIssues)
    score -= focusIssues.length * 10
  }

  // Determine compliance level
  let level: 'AA' | 'AAA' | 'fail' = 'fail'
  if (score >= 90 && !issues.some(i => i.severity === 'error')) {
    level = 'AAA'
  } else if (score >= 75 && !issues.some(i => i.severity === 'error')) {
    level = 'AA'
  }

  const recommendations = generateRecommendations(issues)

  return {
    level,
    score: Math.max(0, score),
    issues,
    recommendations
  }
}

/**
 * Check color contrast compliance
 */
function checkColorContrast(element: HTMLElement): WCAGIssue[] {
  const issues: WCAGIssue[] = []
  
  // Get computed styles
  const styles = window.getComputedStyle(element)
  const backgroundColor = styles.backgroundColor
  const color = styles.color

  // Check if we can extract colors (simplified check)
  if (backgroundColor && color && backgroundColor !== 'rgba(0, 0, 0, 0)') {
    try {
      // This is a simplified check - in production you'd use a proper color library
      const ratio = getContrastRatio(color, backgroundColor)
      
      if (!meetsWCAGAA(color, backgroundColor)) {
        issues.push({
          type: 'contrast',
          severity: 'error',
          element: element.tagName.toLowerCase(),
          description: `Color contrast ratio ${ratio.toFixed(2)}:1 does not meet WCAG AA standard (4.5:1)`,
          fix: 'Increase color contrast between text and background colors'
        })
      } else if (!meetsWCAGAAA(color, backgroundColor)) {
        issues.push({
          type: 'contrast',
          severity: 'warning',
          element: element.tagName.toLowerCase(),
          description: `Color contrast ratio ${ratio.toFixed(2)}:1 meets AA but not AAA standard (7:1)`,
          fix: 'Consider increasing contrast for AAA compliance'
        })
      }
    } catch (error) {
      issues.push({
        type: 'contrast',
        severity: 'info',
        element: element.tagName.toLowerCase(),
        description: 'Could not determine color contrast ratio',
        fix: 'Manually verify color contrast meets WCAG standards'
      })
    }
  }

  return issues
}

/**
 * Check keyboard navigation compliance
 */
function checkKeyboardNavigation(element: HTMLElement): WCAGIssue[] {
  const issues: WCAGIssue[] = []
  
  // Check for focusable elements
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  if (focusableElements.length === 0) {
    issues.push({
      type: 'keyboard',
      severity: 'error',
      description: 'No focusable elements found in tour component',
      fix: 'Add keyboard-accessible controls (buttons, links, or elements with tabindex)'
    })
  }

  // Check for keyboard event handlers
  const hasKeyboardHandlers = element.hasAttribute('onkeydown') || 
                             element.hasAttribute('onkeyup') ||
                             element.hasAttribute('onkeypress')

  if (!hasKeyboardHandlers) {
    issues.push({
      type: 'keyboard',
      severity: 'warning',
      description: 'No keyboard event handlers detected',
      fix: 'Add keyboard navigation support (arrow keys, Enter, Escape, etc.)'
    })
  }

  // Check tabindex usage
  const elementsWithTabindex = element.querySelectorAll('[tabindex]')
  elementsWithTabindex.forEach((el) => {
    const tabindex = el.getAttribute('tabindex')
    if (tabindex && parseInt(tabindex) > 0) {
      issues.push({
        type: 'keyboard',
        severity: 'warning',
        element: el.tagName.toLowerCase(),
        description: `Positive tabindex (${tabindex}) can disrupt natural tab order`,
        fix: 'Use tabindex="0" or remove tabindex to maintain natural tab order'
      })
    }
  })

  return issues
}

/**
 * Check ARIA attributes compliance
 */
function checkAriaAttributes(element: HTMLElement): WCAGIssue[] {
  const issues: WCAGIssue[] = []

  // Check for required ARIA attributes on interactive elements
  const interactiveElements = element.querySelectorAll('button, [role="button"], [role="dialog"]')
  
  interactiveElements.forEach((el) => {
    const tagName = el.tagName.toLowerCase()
    const role = el.getAttribute('role')

    // Check for aria-label or accessible name
    const hasAccessibleName = el.hasAttribute('aria-label') ||
                             el.hasAttribute('aria-labelledby') ||
                             (tagName === 'button' && el.textContent?.trim())

    if (!hasAccessibleName) {
      issues.push({
        type: 'aria',
        severity: 'error',
        element: tagName,
        description: 'Interactive element lacks accessible name',
        fix: 'Add aria-label, aria-labelledby, or visible text content'
      })
    }

    // Check dialog-specific requirements
    if (role === 'dialog') {
      if (!el.hasAttribute('aria-modal')) {
        issues.push({
          type: 'aria',
          severity: 'error',
          element: tagName,
          description: 'Dialog missing aria-modal attribute',
          fix: 'Add aria-modal="true" to dialog elements'
        })
      }

      if (!el.hasAttribute('aria-describedby')) {
        issues.push({
          type: 'aria',
          severity: 'warning',
          element: tagName,
          description: 'Dialog missing aria-describedby attribute',
          fix: 'Add aria-describedby pointing to dialog description'
        })
      }
    }
  })

  // Check for live regions
  const liveRegions = element.querySelectorAll('[aria-live]')
  if (liveRegions.length === 0) {
    issues.push({
      type: 'aria',
      severity: 'info',
      description: 'No live regions found for dynamic content announcements',
      fix: 'Consider adding aria-live regions for status updates'
    })
  }

  return issues
}

/**
 * Check motion and animation compliance
 */
function checkMotionCompliance(element: HTMLElement): WCAGIssue[] {
  const issues: WCAGIssue[] = []

  // Check for CSS animations
  const styles = window.getComputedStyle(element)
  const hasAnimations = styles.animationName !== 'none' || 
                       styles.transitionProperty !== 'none'

  if (hasAnimations) {
    // Check if reduced motion is respected
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      // Check if animations are disabled in reduced motion
      const reducedMotionStyles = window.getComputedStyle(element)
      if (reducedMotionStyles.animationName !== 'none' || 
          reducedMotionStyles.transitionDuration !== '0s') {
        issues.push({
          type: 'motion',
          severity: 'error',
          description: 'Animations not disabled for users who prefer reduced motion',
          fix: 'Add @media (prefers-reduced-motion: reduce) styles to disable animations'
        })
      }
    }
  }

  // Check for auto-playing content
  const autoplayElements = element.querySelectorAll('[autoplay]')
  if (autoplayElements.length > 0) {
    issues.push({
      type: 'motion',
      severity: 'warning',
      description: 'Auto-playing content detected',
      fix: 'Provide controls to pause auto-playing content'
    })
  }

  return issues
}

/**
 * Check focus management compliance
 */
function checkFocusManagement(element: HTMLElement): WCAGIssue[] {
  const issues: WCAGIssue[] = []

  // Check for visible focus indicators
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  focusableElements.forEach((el) => {
    const styles = window.getComputedStyle(el, ':focus')
    const hasVisibleFocus = styles.outline !== 'none' || 
                           styles.boxShadow !== 'none' ||
                           styles.border !== styles.getPropertyValue('border')

    if (!hasVisibleFocus) {
      issues.push({
        type: 'focus',
        severity: 'error',
        element: el.tagName.toLowerCase(),
        description: 'Focusable element lacks visible focus indicator',
        fix: 'Add :focus styles with visible outline, box-shadow, or border'
      })
    }
  })

  // Check for focus trap in modal dialogs
  const dialogs = element.querySelectorAll('[role="dialog"]')
  dialogs.forEach((dialog) => {
    // This is a simplified check - in practice you'd need to test actual focus behavior
    const focusableInDialog = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableInDialog.length === 0) {
      issues.push({
        type: 'focus',
        severity: 'error',
        element: 'dialog',
        description: 'Dialog contains no focusable elements',
        fix: 'Add focusable elements or implement proper focus management'
      })
    }
  })

  return issues
}

/**
 * Generate recommendations based on issues
 */
function generateRecommendations(issues: WCAGIssue[]): string[] {
  const recommendations: string[] = []
  
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length

  if (errorCount > 0) {
    recommendations.push(`Fix ${errorCount} critical accessibility error${errorCount > 1 ? 's' : ''} for WCAG compliance`)
  }

  if (warningCount > 0) {
    recommendations.push(`Address ${warningCount} accessibility warning${warningCount > 1 ? 's' : ''} to improve user experience`)
  }

  // Specific recommendations based on issue types
  const contrastIssues = issues.filter(i => i.type === 'contrast')
  if (contrastIssues.length > 0) {
    recommendations.push('Improve color contrast ratios to meet WCAG standards')
  }

  const keyboardIssues = issues.filter(i => i.type === 'keyboard')
  if (keyboardIssues.length > 0) {
    recommendations.push('Enhance keyboard navigation support with proper event handlers')
  }

  const ariaIssues = issues.filter(i => i.type === 'aria')
  if (ariaIssues.length > 0) {
    recommendations.push('Add comprehensive ARIA attributes for screen reader support')
  }

  const motionIssues = issues.filter(i => i.type === 'motion')
  if (motionIssues.length > 0) {
    recommendations.push('Implement reduced motion preferences for better accessibility')
  }

  const focusIssues = issues.filter(i => i.type === 'focus')
  if (focusIssues.length > 0) {
    recommendations.push('Improve focus management and visible focus indicators')
  }

  if (recommendations.length === 0) {
    recommendations.push('Great job! Your tour component meets accessibility standards')
  }

  return recommendations
}

/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(result: WCAGComplianceResult): string {
  const { level, score, issues, recommendations } = result

  let report = `# Accessibility Compliance Report\n\n`
  report += `**Compliance Level:** ${level}\n`
  report += `**Score:** ${score}/100\n\n`

  if (issues.length > 0) {
    report += `## Issues Found (${issues.length})\n\n`
    
    const errors = issues.filter(i => i.severity === 'error')
    const warnings = issues.filter(i => i.severity === 'warning')
    const info = issues.filter(i => i.severity === 'info')

    if (errors.length > 0) {
      report += `### Errors (${errors.length})\n`
      errors.forEach((issue, index) => {
        report += `${index + 1}. **${issue.description}**\n`
        report += `   - Fix: ${issue.fix}\n`
        if (issue.element) report += `   - Element: ${issue.element}\n`
        report += `\n`
      })
    }

    if (warnings.length > 0) {
      report += `### Warnings (${warnings.length})\n`
      warnings.forEach((issue, index) => {
        report += `${index + 1}. **${issue.description}**\n`
        report += `   - Fix: ${issue.fix}\n`
        if (issue.element) report += `   - Element: ${issue.element}\n`
        report += `\n`
      })
    }

    if (info.length > 0) {
      report += `### Information (${info.length})\n`
      info.forEach((issue, index) => {
        report += `${index + 1}. **${issue.description}**\n`
        report += `   - Fix: ${issue.fix}\n`
        if (issue.element) report += `   - Element: ${issue.element}\n`
        report += `\n`
      })
    }
  }

  if (recommendations.length > 0) {
    report += `## Recommendations\n\n`
    recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`
    })
  }

  return report
}