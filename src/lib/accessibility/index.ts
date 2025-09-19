// Export all accessibility utilities
export * from './color-contrast'
export * from './keyboard-navigation'
export * from './focus-trap'
export * from './screen-reader'
export * from './reduced-motion'
export * from './high-contrast'
export * from './tour-accessibility'
export * from './wcag-compliance'

// Export new error handling and type safety utilities
export * from './ssr-utils'

// Export types (excluding duplicates)
export type {
  AccessibilityLevel,
  AnnouncementPriority,
  MotionPreference,
  ContrastPreference,
  ColorScheme,
  AccessibilityError,
  SafeExecutionResult,
  ReducedMotionHookReturn,
  HighContrastHookReturn,
  FocusTrapHookReturn,
  ScreenReaderAnnouncement,
  ScreenReaderState,
  ColorContrastResult,
  ColorPalette,
  ColorAccessibilityAudit,
  ColorAccessibilityIssue,
  MotionSafeVariants,
  MotionSafeTransition,
  AnimationConfig,
  HighContrastColors,
  HighContrastTheme,
  SafeFunction,
  AccessibilityHook,
  SSRSafeHook,
  AccessibilityEvent,
  AccessibilityKeyboardEvent,
  FocusEvent,
  AnnouncementEvent,
  AccessibilityConfig,
  AccessibilityContextValue,
  ValidationRule,
  ValidationResult,
  AccessibilityTestResult,
  AccessibilityTestOptions,
  AccessibilityMetrics
} from './types'

// Export error utilities
export * from './error-utils'

// Note: AccessibilityErrorBoundary is available in './error-boundary.tsx' for JSX usage

// Re-export main hooks (the * export above should handle this, but being explicit for clarity)
// The main exports are already handled by export * from './reduced-motion' etc.