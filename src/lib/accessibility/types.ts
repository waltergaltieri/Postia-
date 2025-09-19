'use client'

/**
 * Comprehensive TypeScript types for accessibility features
 */

// Base types
export type AccessibilityLevel = 'AA' | 'AAA'
export type AnnouncementPriority = 'polite' | 'assertive'
export type MotionPreference = 'no-preference' | 'reduce'
export type ContrastPreference = 'no-preference' | 'high'
export type ColorScheme = 'light' | 'dark' | 'auto'

// Error handling types
export interface AccessibilityError extends Error {
  code: string
  severity: 'low' | 'medium' | 'high'
  recoverable: boolean
  context?: Record<string, any>
}

export interface SafeExecutionResult<T> {
  success: boolean
  data?: T
  error?: AccessibilityError
}

// Hook return types
export interface ReducedMotionHookReturn {
  prefersReducedMotion: boolean
  isLoading: boolean
  error: AccessibilityError | null
}

export interface HighContrastHookReturn {
  prefersHighContrast: boolean
  isLoading: boolean
  error: AccessibilityError | null
}

export interface FocusTrapHookReturn {
  containerRef: React.RefObject<HTMLElement>
  isActive: boolean
  error: AccessibilityError | null
}

// Screen reader types
export interface ScreenReaderAnnouncement {
  message: string
  priority: AnnouncementPriority
  timestamp: number
  id: string
}

export interface ScreenReaderState {
  isActive: boolean
  announcements: ScreenReaderAnnouncement[]
  isProcessing: boolean
}

// Keyboard navigation types
export interface KeyboardNavigationHandlers {
  onArrowUp?: () => void | Promise<void>
  onArrowDown?: () => void | Promise<void>
  onArrowLeft?: () => void | Promise<void>
  onArrowRight?: () => void | Promise<void>
  onEnter?: () => void | Promise<void>
  onSpace?: () => void | Promise<void>
  onEscape?: () => void | Promise<void>
  onTab?: () => void | Promise<void>
  onShiftTab?: () => void | Promise<void>
  onHome?: () => void | Promise<void>
  onEnd?: () => void | Promise<void>
  onPageUp?: () => void | Promise<void>
  onPageDown?: () => void | Promise<void>
}

export interface KeyboardNavigationOptions {
  handlers: KeyboardNavigationHandlers
  preventDefault?: boolean
  stopPropagation?: boolean
  enabled?: boolean
  debounceMs?: number
}

export interface KeyboardNavigationState {
  isEnabled: boolean
  activeHandlers: Set<keyof KeyboardNavigationHandlers>
  lastKeyPressed: string | null
  lastKeyTime: number
}

// Focus management types
export interface FocusableElement {
  element: HTMLElement
  tabIndex: number
  isVisible: boolean
  isEnabled: boolean
}

export interface FocusTrapOptions {
  enabled?: boolean
  autoFocus?: boolean
  restoreFocus?: boolean
  allowOutsideClick?: boolean
  onEscape?: () => void
  onActivate?: () => void
  onDeactivate?: () => void
}

export interface FocusTrapState {
  isActive: boolean
  previouslyFocusedElement: HTMLElement | null
  focusableElements: FocusableElement[]
  currentFocusIndex: number
}

// Color contrast types
export interface ColorContrastResult {
  ratio: number
  meetsAA: boolean
  meetsAAA: boolean
  level: 'fail' | 'AA' | 'AAA'
  recommendation?: string
}

export interface ColorPalette {
  primary: string
  secondary: string
  background: string
  foreground: string
  muted: string
  accent: string
  error: string
  warning: string
  success: string
  info: string
}

export interface ColorAccessibilityAudit {
  compliant: boolean
  issues: ColorAccessibilityIssue[]
  suggestions: string[]
  overallScore: number
}

export interface ColorAccessibilityIssue {
  type: 'contrast' | 'color-blindness' | 'brightness'
  severity: 'error' | 'warning' | 'info'
  colors: {
    foreground: string
    background: string
  }
  currentRatio: number
  requiredRatio: number
  description: string
  fix: string
}

// WCAG compliance types
export interface WCAGComplianceResult {
  level: AccessibilityLevel | 'fail'
  score: number
  issues: WCAGIssue[]
  recommendations: string[]
  timestamp: number
}

export interface WCAGIssue {
  id: string
  type: 'contrast' | 'focus' | 'keyboard' | 'aria' | 'motion' | 'structure'
  severity: 'error' | 'warning' | 'info'
  element?: string
  selector?: string
  description: string
  fix: string
  wcagReference: string
  automated: boolean
}

export interface WCAGAuditOptions {
  checkContrast?: boolean
  checkKeyboard?: boolean
  checkAria?: boolean
  checkMotion?: boolean
  checkFocus?: boolean
  checkStructure?: boolean
  level?: AccessibilityLevel
}

// Tour accessibility types
export interface TourAccessibilityOptions {
  enableFocusTrap?: boolean
  enableKeyboardNavigation?: boolean
  enableScreenReaderSupport?: boolean
  enableHighContrastMode?: boolean
  autoAnnounceSteps?: boolean
  restoreFocusOnExit?: boolean
  respectMotionPreferences?: boolean
}

export interface TourAccessibilityState {
  isActive: boolean
  currentStep: number
  totalSteps: number
  focusedElement: HTMLElement | null
  announcementQueue: ScreenReaderAnnouncement[]
  keyboardShortcutsEnabled: boolean
}

export interface TourStepAccessibility {
  ariaLabel: string
  ariaDescription: string
  announceOnFocus?: string
  keyboardShortcuts: string[]
  focusTarget?: HTMLElement
  customAttributes?: Record<string, string>
}

// Animation and motion types
export interface MotionSafeVariants {
  hidden: Record<string, any>
  visible: Record<string, any>
}

export interface MotionSafeTransition {
  duration: number
  ease: string | number[]
  delay?: number
}

export interface AnimationConfig {
  duration: number
  transition: string
  animate: boolean
  initial: boolean
  exit: boolean
}

// High contrast types
export interface HighContrastColors {
  background: string
  foreground: string
  border: string
  accent: string
  focus: string
  error: string
  success: string
  warning: string
}

export interface HighContrastTheme {
  light: HighContrastColors
  dark: HighContrastColors
}

// Utility types
export type SafeFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => SafeExecutionResult<ReturnType<T>>

export type AccessibilityHook<T> = () => T & {
  error: AccessibilityError | null
  isLoading: boolean
}

export type SSRSafeHook<T> = () => T & {
  isSSR: boolean
  isHydrated: boolean
}

// Event types
export interface AccessibilityEvent {
  type: string
  timestamp: number
  data?: Record<string, any>
}

export interface AccessibilityKeyboardEvent extends AccessibilityEvent {
  type: 'keyboard'
  key: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
}

export interface FocusEvent extends AccessibilityEvent {
  type: 'focus'
  target: HTMLElement
  relatedTarget: HTMLElement | null
}

export interface AnnouncementEvent extends AccessibilityEvent {
  type: 'announcement'
  message: string
  priority: AnnouncementPriority
}

// Configuration types
export interface AccessibilityConfig {
  enableReducedMotion: boolean
  enableHighContrast: boolean
  enableKeyboardNavigation: boolean
  enableScreenReaderSupport: boolean
  enableFocusManagement: boolean
  enableColorContrastChecking: boolean
  wcagLevel: AccessibilityLevel
  announceErrors: boolean
  autoRecovery: boolean
  debugMode: boolean
}

// Provider types
export interface AccessibilityContextValue {
  config: AccessibilityConfig
  state: {
    prefersReducedMotion: boolean
    prefersHighContrast: boolean
    isScreenReaderActive: boolean
    currentFocus: HTMLElement | null
  }
  actions: {
    updateConfig: (config: Partial<AccessibilityConfig>) => void
    announce: (message: string, priority?: AnnouncementPriority) => void
    focusElement: (element: HTMLElement) => void
    reportError: (error: AccessibilityError) => void
  }
}

// Validation types
export interface ValidationRule<T> {
  name: string
  validate: (value: T) => boolean
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    rule: string
    message: string
    severity: 'error' | 'warning'
  }>
}

// Testing types
export interface AccessibilityTestResult {
  passed: boolean
  score: number
  issues: WCAGIssue[]
  coverage: {
    total: number
    tested: number
    percentage: number
  }
  performance: {
    executionTime: number
    memoryUsage?: number
  }
}

export interface AccessibilityTestOptions {
  includeWarnings?: boolean
  includeInfo?: boolean
  timeout?: number
  retries?: number
  skipRules?: string[]
}

// Metrics types
export interface AccessibilityMetrics {
  contrastRatios: number[]
  focusableElementsCount: number
  keyboardNavigationPaths: number
  screenReaderAnnouncements: number
  errorCount: number
  warningCount: number
  complianceScore: number
  performanceMetrics: {
    averageResponseTime: number
    memoryUsage: number
    cpuUsage: number
  }
}

// Export utility type guards
export function isAccessibilityError(error: any): error is AccessibilityError {
  return error instanceof Error && 
         'code' in error && 
         'severity' in error && 
         'recoverable' in error
}

export function isWCAGIssue(issue: any): issue is WCAGIssue {
  return typeof issue === 'object' &&
         'id' in issue &&
         'type' in issue &&
         'severity' in issue &&
         'description' in issue &&
         'fix' in issue
}

export function isColorContrastResult(result: any): result is ColorContrastResult {
  return typeof result === 'object' &&
         'ratio' in result &&
         'meetsAA' in result &&
         'meetsAAA' in result &&
         'level' in result
}

// Type predicates for runtime type checking
export const AccessibilityTypeGuards = {
  isAccessibilityError,
  isWCAGIssue,
  isColorContrastResult,
  
  isValidAnnouncementPriority(value: any): value is AnnouncementPriority {
    return value === 'polite' || value === 'assertive'
  },
  
  isValidAccessibilityLevel(value: any): value is AccessibilityLevel {
    return value === 'AA' || value === 'AAA'
  },
  
  isValidColorScheme(value: any): value is ColorScheme {
    return value === 'light' || value === 'dark' || value === 'auto'
  },
  
  isHTMLElement(value: any): value is HTMLElement {
    return value instanceof HTMLElement
  },
  
  isFocusableElement(element: HTMLElement): boolean {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ]
    
    return focusableSelectors.some(selector => element.matches(selector)) &&
           !element.hasAttribute('disabled') &&
           element.getAttribute('aria-disabled') !== 'true'
  }
}