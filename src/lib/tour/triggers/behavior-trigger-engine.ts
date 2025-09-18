'use client'

import type { TourDefinition, TourTrigger } from '@/types/tour'

/**
 * User behavior patterns that can trigger tours
 */
export interface BehaviorPattern {
  id: string
  name: string
  description: string
  conditions: BehaviorCondition[]
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  cooldownPeriod: number // milliseconds
  maxTriggersPerSession: number
}

/**
 * Individual behavior condition
 */
export interface BehaviorCondition {
  type: 'inactivity' | 'repeated_action' | 'error_pattern' | 'navigation_confusion' | 'feature_struggle' | 'time_threshold'
  threshold: number
  timeWindow: number // milliseconds
  weight: number // 0-1, importance of this condition
}

/**
 * User activity tracking data
 */
export interface UserBehaviorData {
  sessionId: string
  userId: string
  startTime: Date
  lastActivity: Date
  
  // Page and navigation tracking
  pageViews: Map<string, number>
  timeOnPages: Map<string, number>
  navigationPath: string[]
  backButtonUsage: number
  
  // Interaction tracking
  clickEvents: Array<{ element: string, timestamp: Date, success: boolean }>
  scrollEvents: Array<{ page: string, depth: number, timestamp: Date }>
  formInteractions: Array<{ form: string, field: string, errors: number, timestamp: Date }>
  
  // Error and confusion indicators
  errorEvents: Array<{ type: string, context: string, timestamp: Date }>
  helpRequests: Array<{ context: string, timestamp: Date }>
  searchQueries: Array<{ query: string, results: number, timestamp: Date }>
  
  // Feature usage
  featureUsage: Map<string, { firstUse: Date, lastUse: Date, usageCount: number }>
  abandonedActions: Array<{ action: string, step: string, timestamp: Date }>
  
  // Inactivity periods
  inactivityPeriods: Array<{ start: Date, end: Date, duration: number }>
  
  // Performance indicators
  pageLoadTimes: Map<string, number[]>
  interactionDelays: number[]
}

/**
 * Behavior trigger result
 */
export interface BehaviorTriggerResult {
  shouldTrigger: boolean
  tourId: string
  reason: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  message: string
  delay: number
  metadata: Record<string, any>
}

/**
 * Configuration for behavior trigger engine
 */
export interface BehaviorTriggerConfig {
  enableInactivityDetection: boolean
  enableErrorPatternDetection: boolean
  enableNavigationConfusionDetection: boolean
  enableFeatureStruggleDetection: boolean
  enableSmartTiming: boolean
  
  // Thresholds
  inactivityThreshold: number // milliseconds
  errorThreshold: number
  confusionThreshold: number
  struggleThreshold: number
  
  // Timing
  minTimeBetweenSuggestions: number // milliseconds
  maxSuggestionsPerSession: number
  
  // Sensitivity
  triggerSensitivity: 'low' | 'medium' | 'high'
}

/**
 * Behavior-based tour trigger engine
 * Implements requirements 8.1, 8.2, 8.3 for intelligent tour triggering
 */
export class BehaviorTriggerEngine {
  private config: BehaviorTriggerConfig
  private behaviorData: UserBehaviorData
  private patterns: Map<string, BehaviorPattern>
  private lastTriggerTime: Date | null = null
  private triggersThisSession = 0
  private activeListeners: (() => void)[] = []

  constructor(config: Partial<BehaviorTriggerConfig> = {}) {
    this.config = {
      enableInactivityDetection: true,
      enableErrorPatternDetection: true,
      enableNavigationConfusionDetection: true,
      enableFeatureStruggleDetection: true,
      enableSmartTiming: true,
      inactivityThreshold: 30000, // 30 seconds
      errorThreshold: 3,
      confusionThreshold: 5,
      struggleThreshold: 3,
      minTimeBetweenSuggestions: 300000, // 5 minutes
      maxSuggestionsPerSession: 3,
      triggerSensitivity: 'medium',
      ...config
    }

    this.behaviorData = this.initializeBehaviorData()
    this.patterns = this.initializeBehaviorPatterns()
    this.setupEventListeners()
  }

  /**
   * Initialize behavior tracking data
   */
  private initializeBehaviorData(): UserBehaviorData {
    return {
      sessionId: this.generateSessionId(),
      userId: this.getCurrentUserId(),
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: new Map(),
      timeOnPages: new Map(),
      navigationPath: [window.location.pathname],
      backButtonUsage: 0,
      clickEvents: [],
      scrollEvents: [],
      formInteractions: [],
      errorEvents: [],
      helpRequests: [],
      searchQueries: [],
      featureUsage: new Map(),
      abandonedActions: [],
      inactivityPeriods: [],
      pageLoadTimes: new Map(),
      interactionDelays: []
    }
  }

  /**
   * Initialize predefined behavior patterns
   */
  private initializeBehaviorPatterns(): Map<string, BehaviorPattern> {
    const patterns = new Map<string, BehaviorPattern>()

    // Inactivity pattern
    patterns.set('inactivity', {
      id: 'inactivity',
      name: 'User Inactivity',
      description: 'User has been inactive for an extended period',
      conditions: [{
        type: 'inactivity',
        threshold: this.config.inactivityThreshold,
        timeWindow: 60000,
        weight: 1.0
      }],
      confidence: 0.7,
      priority: 'medium',
      cooldownPeriod: 600000, // 10 minutes
      maxTriggersPerSession: 2
    })

    // Error pattern
    patterns.set('error_pattern', {
      id: 'error_pattern',
      name: 'Repeated Errors',
      description: 'User is experiencing repeated errors in the same context',
      conditions: [{
        type: 'error_pattern',
        threshold: this.config.errorThreshold,
        timeWindow: 300000, // 5 minutes
        weight: 1.0
      }],
      confidence: 0.9,
      priority: 'high',
      cooldownPeriod: 300000, // 5 minutes
      maxTriggersPerSession: 3
    })

    // Navigation confusion
    patterns.set('navigation_confusion', {
      id: 'navigation_confusion',
      name: 'Navigation Confusion',
      description: 'User shows signs of navigation confusion',
      conditions: [
        {
          type: 'repeated_action',
          threshold: 5,
          timeWindow: 120000, // 2 minutes
          weight: 0.6
        },
        {
          type: 'navigation_confusion',
          threshold: this.config.confusionThreshold,
          timeWindow: 300000, // 5 minutes
          weight: 0.8
        }
      ],
      confidence: 0.8,
      priority: 'high',
      cooldownPeriod: 900000, // 15 minutes
      maxTriggersPerSession: 2
    })

    // Feature struggle
    patterns.set('feature_struggle', {
      id: 'feature_struggle',
      name: 'Feature Usage Struggle',
      description: 'User is struggling with a specific feature',
      conditions: [
        {
          type: 'feature_struggle',
          threshold: this.config.struggleThreshold,
          timeWindow: 600000, // 10 minutes
          weight: 0.7
        },
        {
          type: 'time_threshold',
          threshold: 180000, // 3 minutes on same feature
          timeWindow: 300000,
          weight: 0.5
        }
      ],
      confidence: 0.75,
      priority: 'medium',
      cooldownPeriod: 1200000, // 20 minutes
      maxTriggersPerSession: 2
    })

    return patterns
  }

  /**
   * Setup event listeners for behavior tracking
   */
  private setupEventListeners(): void {
    // Track user activity
    const activityEvents = ['click', 'keydown', 'scroll', 'mousemove']
    activityEvents.forEach(event => {
      const listener = () => this.trackActivity()
      document.addEventListener(event, listener, { passive: true })
      this.activeListeners.push(() => document.removeEventListener(event, listener))
    })

    // Track clicks with success/failure detection
    const clickListener = (event: MouseEvent) => {
      this.trackClick(event)
    }
    document.addEventListener('click', clickListener)
    this.activeListeners.push(() => document.removeEventListener('click', clickListener))

    // Track scroll behavior
    const scrollListener = () => {
      this.trackScroll()
    }
    window.addEventListener('scroll', scrollListener, { passive: true })
    this.activeListeners.push(() => window.removeEventListener('scroll', scrollListener))

    // Track navigation changes
    const navigationListener = () => {
      this.trackNavigation()
    }
    window.addEventListener('popstate', navigationListener)
    this.activeListeners.push(() => window.removeEventListener('popstate', navigationListener))

    // Track form interactions
    const formListener = (event: Event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        this.trackFormInteraction(event.target)
      }
    }
    document.addEventListener('input', formListener)
    this.activeListeners.push(() => document.removeEventListener('input', formListener))

    // Track errors
    const errorListener = (event: ErrorEvent) => {
      this.trackError('javascript_error', event.message)
    }
    window.addEventListener('error', errorListener)
    this.activeListeners.push(() => window.removeEventListener('error', errorListener))
  }

  /**
   * Track general user activity
   */
  private trackActivity(): void {
    this.behaviorData.lastActivity = new Date()
  }

  /**
   * Track click events with context
   */
  private trackClick(event: MouseEvent): void {
    const target = event.target as HTMLElement
    const element = this.getElementSelector(target)
    
    // Determine if click was successful (basic heuristic)
    const success = !target.classList.contains('error') && 
                   !target.closest('.error') &&
                   !target.hasAttribute('aria-invalid')

    this.behaviorData.clickEvents.push({
      element,
      timestamp: new Date(),
      success
    })

    // Track interaction delay
    const timeSinceLastActivity = Date.now() - this.behaviorData.lastActivity.getTime()
    if (timeSinceLastActivity > 1000) { // Only track if there was a pause
      this.behaviorData.interactionDelays.push(timeSinceLastActivity)
    }

    this.trackActivity()
  }

  /**
   * Track scroll behavior
   */
  private trackScroll(): void {
    const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight
    const currentPage = window.location.pathname

    this.behaviorData.scrollEvents.push({
      page: currentPage,
      depth: scrollDepth,
      timestamp: new Date()
    })

    this.trackActivity()
  }

  /**
   * Track navigation changes
   */
  private trackNavigation(): void {
    const currentPath = window.location.pathname
    const previousPath = this.behaviorData.navigationPath[this.behaviorData.navigationPath.length - 1]

    if (currentPath !== previousPath) {
      this.behaviorData.navigationPath.push(currentPath)
      
      // Track page view
      const pageViews = this.behaviorData.pageViews.get(currentPath) || 0
      this.behaviorData.pageViews.set(currentPath, pageViews + 1)

      // Check for back button usage
      if (this.behaviorData.navigationPath.length > 2) {
        const twoStepsBack = this.behaviorData.navigationPath[this.behaviorData.navigationPath.length - 3]
        if (currentPath === twoStepsBack) {
          this.behaviorData.backButtonUsage++
        }
      }
    }

    this.trackActivity()
  }

  /**
   * Track form interactions
   */
  private trackFormInteraction(element: HTMLInputElement | HTMLTextAreaElement): void {
    const form = element.closest('form')
    const formName = form?.getAttribute('name') || form?.id || 'unknown'
    const fieldName = element.name || element.id || 'unknown'
    
    const hasErrors = element.hasAttribute('aria-invalid') || 
                     element.classList.contains('error') ||
                     element.closest('.error') !== null

    this.behaviorData.formInteractions.push({
      form: formName,
      field: fieldName,
      errors: hasErrors ? 1 : 0,
      timestamp: new Date()
    })

    this.trackActivity()
  }

  /**
   * Track errors with context
   */
  public trackError(type: string, context: string): void {
    this.behaviorData.errorEvents.push({
      type,
      context,
      timestamp: new Date()
    })

    // Immediately check for error patterns
    this.checkErrorPattern()
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(featureName: string): void {
    const existing = this.behaviorData.featureUsage.get(featureName)
    const now = new Date()

    if (existing) {
      existing.lastUse = now
      existing.usageCount++
    } else {
      this.behaviorData.featureUsage.set(featureName, {
        firstUse: now,
        lastUse: now,
        usageCount: 1
      })
    }

    this.trackActivity()
  }

  /**
   * Track abandoned actions
   */
  public trackAbandonedAction(action: string, step: string): void {
    this.behaviorData.abandonedActions.push({
      action,
      step,
      timestamp: new Date()
    })
  }

  /**
   * Track help requests
   */
  public trackHelpRequest(context: string): void {
    this.behaviorData.helpRequests.push({
      context,
      timestamp: new Date()
    })
  }

  /**
   * Analyze current behavior and determine if a tour should be triggered
   */
  public analyzeBehavior(): BehaviorTriggerResult | null {
    // Check cooldown period
    if (this.lastTriggerTime && 
        Date.now() - this.lastTriggerTime.getTime() < this.config.minTimeBetweenSuggestions) {
      return null
    }

    // Check session limit
    if (this.triggersThisSession >= this.config.maxSuggestionsPerSession) {
      return null
    }

    // Analyze each pattern
    for (const [patternId, pattern] of this.patterns) {
      const result = this.evaluatePattern(pattern)
      if (result && result.shouldTrigger) {
        this.lastTriggerTime = new Date()
        this.triggersThisSession++
        return result
      }
    }

    return null
  }

  /**
   * Evaluate a specific behavior pattern
   */
  private evaluatePattern(pattern: BehaviorPattern): BehaviorTriggerResult | null {
    let totalScore = 0
    let maxScore = 0

    for (const condition of pattern.conditions) {
      const conditionScore = this.evaluateCondition(condition)
      totalScore += conditionScore * condition.weight
      maxScore += condition.weight
    }

    const confidence = maxScore > 0 ? totalScore / maxScore : 0

    // Apply sensitivity adjustment
    const sensitivityMultiplier = this.getSensitivityMultiplier()
    const adjustedConfidence = confidence * sensitivityMultiplier

    if (adjustedConfidence >= pattern.confidence) {
      return this.createTriggerResult(pattern, adjustedConfidence)
    }

    return null
  }

  /**
   * Evaluate a specific condition
   */
  private evaluateCondition(condition: BehaviorCondition): number {
    const now = Date.now()
    const windowStart = now - condition.timeWindow

    switch (condition.type) {
      case 'inactivity':
        return this.evaluateInactivity(condition, windowStart)
      
      case 'error_pattern':
        return this.evaluateErrorPattern(condition, windowStart)
      
      case 'navigation_confusion':
        return this.evaluateNavigationConfusion(condition, windowStart)
      
      case 'feature_struggle':
        return this.evaluateFeatureStruggle(condition, windowStart)
      
      case 'repeated_action':
        return this.evaluateRepeatedAction(condition, windowStart)
      
      case 'time_threshold':
        return this.evaluateTimeThreshold(condition, windowStart)
      
      default:
        return 0
    }
  }

  /**
   * Evaluate inactivity condition
   */
  private evaluateInactivity(condition: BehaviorCondition, windowStart: number): number {
    const timeSinceLastActivity = Date.now() - this.behaviorData.lastActivity.getTime()
    return timeSinceLastActivity >= condition.threshold ? 1 : 0
  }

  /**
   * Evaluate error pattern condition
   */
  private evaluateErrorPattern(condition: BehaviorCondition, windowStart: number): number {
    const recentErrors = this.behaviorData.errorEvents.filter(
      error => error.timestamp.getTime() >= windowStart
    )

    // Group errors by context
    const errorsByContext = new Map<string, number>()
    recentErrors.forEach(error => {
      const count = errorsByContext.get(error.context) || 0
      errorsByContext.set(error.context, count + 1)
    })

    // Check if any context exceeds threshold
    for (const count of errorsByContext.values()) {
      if (count >= condition.threshold) {
        return 1
      }
    }

    return 0
  }

  /**
   * Evaluate navigation confusion condition
   */
  private evaluateNavigationConfusion(condition: BehaviorCondition, windowStart: number): number {
    const recentNavigation = this.behaviorData.navigationPath.filter((_, index) => {
      const timestamp = this.behaviorData.startTime.getTime() + (index * 1000) // Approximate
      return timestamp >= windowStart
    })

    // Look for patterns indicating confusion
    let confusionScore = 0

    // Back and forth navigation
    for (let i = 2; i < recentNavigation.length; i++) {
      if (recentNavigation[i] === recentNavigation[i - 2]) {
        confusionScore++
      }
    }

    // Excessive back button usage
    confusionScore += this.behaviorData.backButtonUsage

    return confusionScore >= condition.threshold ? 1 : 0
  }

  /**
   * Evaluate feature struggle condition
   */
  private evaluateFeatureStruggle(condition: BehaviorCondition, windowStart: number): number {
    const currentPage = window.location.pathname
    const recentErrors = this.behaviorData.errorEvents.filter(
      error => error.timestamp.getTime() >= windowStart && 
               error.context.includes(currentPage)
    )

    const recentAbandoned = this.behaviorData.abandonedActions.filter(
      action => action.timestamp.getTime() >= windowStart
    )

    const struggleScore = recentErrors.length + recentAbandoned.length

    return struggleScore >= condition.threshold ? 1 : 0
  }

  /**
   * Evaluate repeated action condition
   */
  private evaluateRepeatedAction(condition: BehaviorCondition, windowStart: number): number {
    const recentClicks = this.behaviorData.clickEvents.filter(
      click => click.timestamp.getTime() >= windowStart
    )

    // Group clicks by element
    const clicksByElement = new Map<string, number>()
    recentClicks.forEach(click => {
      const count = clicksByElement.get(click.element) || 0
      clicksByElement.set(click.element, count + 1)
    })

    // Check for excessive clicks on same element
    for (const count of clicksByElement.values()) {
      if (count >= condition.threshold) {
        return 1
      }
    }

    return 0
  }

  /**
   * Evaluate time threshold condition
   */
  private evaluateTimeThreshold(condition: BehaviorCondition, windowStart: number): number {
    const currentPage = window.location.pathname
    const timeOnCurrentPage = Date.now() - this.behaviorData.startTime.getTime()
    
    return timeOnCurrentPage >= condition.threshold ? 1 : 0
  }

  /**
   * Get sensitivity multiplier based on configuration
   */
  private getSensitivityMultiplier(): number {
    switch (this.config.triggerSensitivity) {
      case 'low': return 0.7
      case 'medium': return 1.0
      case 'high': return 1.3
      default: return 1.0
    }
  }

  /**
   * Create trigger result for a pattern
   */
  private createTriggerResult(pattern: BehaviorPattern, confidence: number): BehaviorTriggerResult {
    const tourId = this.selectTourForPattern(pattern)
    const message = this.generateMessageForPattern(pattern)
    const delay = this.calculateOptimalDelay(pattern)

    return {
      shouldTrigger: true,
      tourId,
      reason: pattern.description,
      confidence,
      priority: pattern.priority,
      message,
      delay,
      metadata: {
        patternId: pattern.id,
        sessionId: this.behaviorData.sessionId,
        triggerTime: new Date(),
        userActivity: this.getBehaviorSummary()
      }
    }
  }

  /**
   * Select appropriate tour for a behavior pattern
   */
  private selectTourForPattern(pattern: BehaviorPattern): string {
    const currentPage = window.location.pathname

    // Map patterns and pages to appropriate tours
    const tourMapping: Record<string, Record<string, string>> = {
      'inactivity': {
        '/dashboard': 'welcome-tour',
        '/content': 'content-generation-tour',
        '/campaigns': 'campaign-management-tour',
        'default': 'welcome-tour'
      },
      'error_pattern': {
        '/content': 'content-generation-tour',
        '/campaigns': 'campaign-management-tour',
        'default': 'welcome-tour'
      },
      'navigation_confusion': {
        'default': 'welcome-tour'
      },
      'feature_struggle': {
        '/content': 'content-generation-tour',
        '/campaigns': 'campaign-management-tour',
        'default': 'welcome-tour'
      }
    }

    const pageMapping = tourMapping[pattern.id] || tourMapping['inactivity']
    return pageMapping[currentPage] || pageMapping['default']
  }

  /**
   * Generate contextual message for pattern
   */
  private generateMessageForPattern(pattern: BehaviorPattern): string {
    const messages: Record<string, string[]> = {
      'inactivity': [
        '¿Necesitas ayuda navegando esta sección?',
        'Te puedo mostrar un tour rápido de las funcionalidades principales.',
        '¿Te gustaría que te guíe por esta página?'
      ],
      'error_pattern': [
        'Parece que tienes dificultades con esta función.',
        '¿Te gustaría ver un tutorial paso a paso?',
        'Puedo ayudarte a resolver este problema con un tour guiado.'
      ],
      'navigation_confusion': [
        'Veo que estás navegando entre varias páginas.',
        '¿Te ayudo a encontrar lo que buscas?',
        'Un tour rápido puede ayudarte a orientarte mejor.'
      ],
      'feature_struggle': [
        'Esta función puede ser compleja al principio.',
        '¿Te muestro cómo usarla de manera más eficiente?',
        'Un tutorial puede ahorrarte tiempo y esfuerzo.'
      ]
    }

    const patternMessages = messages[pattern.id] || messages['inactivity']
    return patternMessages[Math.floor(Math.random() * patternMessages.length)]
  }

  /**
   * Calculate optimal delay for showing suggestion
   */
  private calculateOptimalDelay(pattern: BehaviorPattern): number {
    // Base delay on pattern priority and user activity
    const baseDelay = {
      'critical': 1000,
      'high': 2000,
      'medium': 3000,
      'low': 5000
    }[pattern.priority]

    // Adjust based on recent activity
    const timeSinceLastActivity = Date.now() - this.behaviorData.lastActivity.getTime()
    const activityMultiplier = timeSinceLastActivity > 10000 ? 0.5 : 1.0

    return Math.floor(baseDelay * activityMultiplier)
  }

  /**
   * Get behavior summary for analytics
   */
  private getBehaviorSummary(): Record<string, any> {
    return {
      sessionDuration: Date.now() - this.behaviorData.startTime.getTime(),
      pageViews: Array.from(this.behaviorData.pageViews.entries()),
      totalClicks: this.behaviorData.clickEvents.length,
      totalErrors: this.behaviorData.errorEvents.length,
      backButtonUsage: this.behaviorData.backButtonUsage,
      featuresUsed: Array.from(this.behaviorData.featureUsage.keys()),
      helpRequests: this.behaviorData.helpRequests.length
    }
  }

  /**
   * Check for immediate error patterns
   */
  private checkErrorPattern(): void {
    const recentErrors = this.behaviorData.errorEvents.filter(
      error => Date.now() - error.timestamp.getTime() < 60000 // Last minute
    )

    if (recentErrors.length >= this.config.errorThreshold) {
      // Trigger immediate analysis
      setTimeout(() => {
        const result = this.analyzeBehavior()
        if (result) {
          this.onBehaviorTrigger?.(result)
        }
      }, 1000)
    }
  }

  /**
   * Callback for when behavior triggers a tour suggestion
   */
  public onBehaviorTrigger?: (result: BehaviorTriggerResult) => void

  /**
   * Get element selector for tracking
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`
    if (element.className) return `.${element.className.split(' ')[0]}`
    return element.tagName.toLowerCase()
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current user ID (placeholder - would integrate with auth system)
   */
  private getCurrentUserId(): string {
    return 'current-user' // Would be replaced with actual user ID
  }

  /**
   * Cleanup event listeners
   */
  public destroy(): void {
    this.activeListeners.forEach(cleanup => cleanup())
    this.activeListeners = []
  }

  /**
   * Get current behavior data (for debugging/analytics)
   */
  public getBehaviorData(): UserBehaviorData {
    return { ...this.behaviorData }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<BehaviorTriggerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}