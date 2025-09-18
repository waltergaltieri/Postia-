/**
 * TypeScript definitions for the Driver.js onboarding system
 */

export interface TourStep {
  element: string | HTMLElement
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  showButtons?: boolean
  showProgress?: boolean
  onBeforeHighlight?: () => void | Promise<void>
  onHighlight?: () => void
  onDeselect?: () => void
  customComponent?: React.ComponentType<TourStepProps>
  accessibility?: {
    ariaLabel?: string
    ariaDescription?: string
    announceOnFocus?: string
  }
}

export interface TourStepProps {
  step: TourStep
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onClose: () => void
}

export interface TourDefinition {
  id: string
  name: string
  description: string
  category: 'onboarding' | 'feature' | 'contextual' | 'help'
  triggers: TourTrigger[]
  conditions?: TourCondition[]
  steps: TourStep[]
  metadata: {
    version: string
    author: string
    lastUpdated: string
    estimatedDuration: number
  }
}

export interface TourTrigger {
  type: 'manual' | 'auto' | 'conditional' | 'scheduled'
  condition?: string
  delay?: number
  priority?: number
}

export interface TourCondition {
  type: 'user_role' | 'client_selected' | 'page_path' | 'feature_flag' | 'user_property'
  operator: 'equals' | 'contains' | 'not_equals' | 'exists'
  value: any
}

export interface TourConfig {
  steps: TourStep[]
  showProgress?: boolean
  allowClose?: boolean
  allowKeyboardControl?: boolean
  animate?: boolean
  popoverClass?: string
  overlayClass?: string
}

export interface TourOptions {
  autoStart?: boolean
  showProgress?: boolean
  allowClose?: boolean
  onComplete?: () => void
  onSkip?: () => void
}

export interface TourContextValue {
  startTour: (tourId: string, options?: TourOptions) => void
  stopTour: () => void
  nextStep: () => void
  previousStep: () => void
  skipTour: () => void
  currentTour: string | null
  currentStep: number
  totalSteps: number
  isActive: boolean
}

export interface UserTourProgress {
  userId: string
  tourId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  currentStep: number
  completedSteps: number[]
  startedAt?: Date
  completedAt?: Date
  skippedAt?: Date
  lastInteractionAt: Date
  metadata: {
    device: 'desktop' | 'mobile' | 'tablet'
    userAgent: string
    sessionId: string
  }
}

export interface TourAnalytics {
  tourId: string
  userId: string
  sessionId: string
  events: TourEvent[]
  metrics: {
    totalDuration: number
    stepDurations: number[]
    completionRate: number
    dropoffStep?: number
    interactionCount: number
  }
}

export interface TourEvent {
  type: 'tour_started' | 'step_viewed' | 'step_completed' | 'tour_completed' | 'tour_skipped' | 'help_requested'
  timestamp: Date
  stepIndex?: number
  metadata?: Record<string, any>
}

export interface ClientBranding {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  brandName: string
  customCSS?: string
}

export interface ThemedTourConfig {
  baseConfig: TourConfig
  clientBranding?: ClientBranding
  theme: 'light' | 'dark'
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
}

export class TourError extends Error {
  constructor(
    message: string,
    public tourId: string,
    public stepIndex?: number,
    public cause?: Error
  ) {
    super(message)
    this.name = 'TourError'
  }
}

export interface ErrorRecoveryStrategy {
  onElementNotFound: (selector: string) => void
  onStepTimeout: (stepIndex: number) => void
  onNavigationError: (expectedPath: string, actualPath: string) => void
  onPermissionError: (requiredPermission: string) => void
}