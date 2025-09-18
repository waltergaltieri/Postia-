'use client'

import { BehaviorTriggerEngine, type BehaviorTriggerResult, type BehaviorTriggerConfig } from './behavior-trigger-engine'
import { SmartTimingEngine, type TimingRecommendation, type SmartTimingConfig } from './smart-timing-engine'
import type { TourDefinition } from '@/types/tour'

/**
 * Contextual suggestion with enhanced metadata
 */
export interface ContextualSuggestion {
  id: string
  tourId: string
  reason: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  message: string
  
  // Timing information
  optimalDelay: number
  shouldShowNow: boolean
  alternativeTime?: Date
  
  // Context
  triggerSource: 'behavior' | 'timing' | 'manual' | 'scheduled'
  pageContext: string
  userContext: Record<string, any>
  
  // Metadata
  createdAt: Date
  expiresAt: Date
  maxRetries: number
  currentRetries: number
  
  // Analytics
  behaviorData?: Record<string, any>
  timingFactors?: Array<{
    factor: string
    score: number
    impact: 'positive' | 'negative' | 'neutral'
  }>
}

/**
 * Suggestion queue management
 */
export interface SuggestionQueue {
  pending: ContextualSuggestion[]
  active: ContextualSuggestion | null
  dismissed: ContextualSuggestion[]
  completed: ContextualSuggestion[]
}

/**
 * Configuration for contextual suggestion engine
 */
export interface ContextualSuggestionConfig {
  // Engine configurations
  behaviorConfig: Partial<BehaviorTriggerConfig>
  timingConfig: Partial<SmartTimingConfig>
  
  // Queue management
  maxPendingSuggestions: number
  maxSuggestionsPerSession: number
  suggestionCooldownPeriod: number
  
  // Retry logic
  maxRetries: number
  retryDelayMultiplier: number
  
  // Expiration
  defaultExpirationTime: number // milliseconds
  
  // Filtering
  enableDuplicateFiltering: boolean
  enableContextFiltering: boolean
  enablePriorityFiltering: boolean
  
  // Analytics
  enableAnalytics: boolean
  trackUserInteractions: boolean
}

/**
 * Contextual suggestion engine that combines behavior analysis and smart timing
 * Implements requirements 8.1, 8.2, 8.3 for intelligent tour triggering
 */
export class ContextualSuggestionEngine {
  private config: ContextualSuggestionConfig
  private behaviorEngine: BehaviorTriggerEngine
  private timingEngine: SmartTimingEngine
  private suggestionQueue: SuggestionQueue
  private sessionStartTime: Date
  private pageLoadTime: Date
  private suggestionsShownThisSession = 0
  private lastSuggestionTime: Date | null = null
  
  // Event handlers
  public onSuggestionCreated?: (suggestion: ContextualSuggestion) => void
  public onSuggestionShown?: (suggestion: ContextualSuggestion) => void
  public onSuggestionAccepted?: (suggestion: ContextualSuggestion) => void
  public onSuggestionDismissed?: (suggestion: ContextualSuggestion) => void
  public onSuggestionExpired?: (suggestion: ContextualSuggestion) => void

  constructor(config: Partial<ContextualSuggestionConfig> = {}) {
    this.config = {
      behaviorConfig: {},
      timingConfig: {},
      maxPendingSuggestions: 5,
      maxSuggestionsPerSession: 3,
      suggestionCooldownPeriod: 300000, // 5 minutes
      maxRetries: 2,
      retryDelayMultiplier: 2,
      defaultExpirationTime: 1800000, // 30 minutes
      enableDuplicateFiltering: true,
      enableContextFiltering: true,
      enablePriorityFiltering: true,
      enableAnalytics: true,
      trackUserInteractions: true,
      ...config
    }

    this.sessionStartTime = new Date()
    this.pageLoadTime = new Date()
    
    this.suggestionQueue = {
      pending: [],
      active: null,
      dismissed: [],
      completed: []
    }

    // Initialize engines
    this.behaviorEngine = new BehaviorTriggerEngine(this.config.behaviorConfig)
    this.timingEngine = new SmartTimingEngine(this.config.timingConfig)

    // Setup behavior engine callback
    this.behaviorEngine.onBehaviorTrigger = (result: BehaviorTriggerResult) => {
      this.handleBehaviorTrigger(result)
    }

    // Start periodic analysis
    this.startPeriodicAnalysis()
    
    // Setup page navigation tracking
    this.setupNavigationTracking()
  }

  /**
   * Handle behavior trigger from behavior engine
   */
  private async handleBehaviorTrigger(behaviorResult: BehaviorTriggerResult): Promise<void> {
    // Get timing recommendation
    const timingRecommendation = this.timingEngine.analyzeOptimalTiming(
      behaviorResult,
      this.sessionStartTime,
      this.pageLoadTime
    )

    // Create contextual suggestion
    const suggestion = this.createContextualSuggestion(behaviorResult, timingRecommendation)
    
    // Add to queue if it passes filters
    if (this.shouldAddSuggestion(suggestion)) {
      this.addSuggestionToQueue(suggestion)
    }
  }

  /**
   * Create contextual suggestion from behavior and timing data
   */
  private createContextualSuggestion(
    behaviorResult: BehaviorTriggerResult,
    timingRecommendation: TimingRecommendation
  ): ContextualSuggestion {
    const now = new Date()
    const suggestionId = this.generateSuggestionId()

    return {
      id: suggestionId,
      tourId: behaviorResult.tourId,
      reason: behaviorResult.reason,
      confidence: Math.min(behaviorResult.confidence, timingRecommendation.confidence),
      priority: behaviorResult.priority,
      message: this.enhanceMessage(behaviorResult.message, timingRecommendation),
      
      // Timing information
      optimalDelay: timingRecommendation.optimalDelay,
      shouldShowNow: timingRecommendation.shouldShow,
      alternativeTime: timingRecommendation.alternativeTime,
      
      // Context
      triggerSource: 'behavior',
      pageContext: window.location.pathname,
      userContext: this.getUserContext(),
      
      // Metadata
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.defaultExpirationTime),
      maxRetries: this.config.maxRetries,
      currentRetries: 0,
      
      // Analytics
      behaviorData: behaviorResult.metadata,
      timingFactors: timingRecommendation.factors
    }
  }

  /**
   * Check if suggestion should be added to queue
   */
  private shouldAddSuggestion(suggestion: ContextualSuggestion): boolean {
    // Check session limits
    if (this.suggestionsShownThisSession >= this.config.maxSuggestionsPerSession) {
      return false
    }

    // Check cooldown period
    if (this.lastSuggestionTime && 
        Date.now() - this.lastSuggestionTime.getTime() < this.config.suggestionCooldownPeriod) {
      return false
    }

    // Check queue capacity
    if (this.suggestionQueue.pending.length >= this.config.maxPendingSuggestions) {
      return false
    }

    // Check for duplicates
    if (this.config.enableDuplicateFiltering && this.isDuplicateSuggestion(suggestion)) {
      return false
    }

    // Check context filters
    if (this.config.enableContextFiltering && !this.passesContextFilter(suggestion)) {
      return false
    }

    return true
  }

  /**
   * Add suggestion to queue with proper prioritization
   */
  private addSuggestionToQueue(suggestion: ContextualSuggestion): void {
    // Insert suggestion in priority order
    const insertIndex = this.findInsertionIndex(suggestion)
    this.suggestionQueue.pending.splice(insertIndex, 0, suggestion)

    // Trigger callback
    this.onSuggestionCreated?.(suggestion)

    // Schedule showing if timing is optimal
    if (suggestion.shouldShowNow) {
      setTimeout(() => {
        this.showNextSuggestion()
      }, suggestion.optimalDelay)
    } else if (suggestion.alternativeTime) {
      // Schedule for alternative time
      const delay = suggestion.alternativeTime.getTime() - Date.now()
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Within 24 hours
        setTimeout(() => {
          this.retrySuggestion(suggestion.id)
        }, delay)
      }
    }

    // Log analytics
    if (this.config.enableAnalytics) {
      this.logSuggestionEvent('suggestion_created', suggestion)
    }
  }

  /**
   * Show next suggestion from queue
   */
  public showNextSuggestion(): boolean {
    // Check if there's already an active suggestion
    if (this.suggestionQueue.active) {
      return false
    }

    // Find next valid suggestion
    const nextSuggestion = this.findNextValidSuggestion()
    if (!nextSuggestion) {
      return false
    }

    // Remove from pending and set as active
    this.suggestionQueue.pending = this.suggestionQueue.pending.filter(s => s.id !== nextSuggestion.id)
    this.suggestionQueue.active = nextSuggestion

    // Update session tracking
    this.suggestionsShownThisSession++
    this.lastSuggestionTime = new Date()

    // Trigger callback
    this.onSuggestionShown?.(nextSuggestion)

    // Log analytics
    if (this.config.enableAnalytics) {
      this.logSuggestionEvent('suggestion_shown', nextSuggestion)
    }

    // Track timing feedback for learning
    this.timingEngine.trackInteraction('suggestion_shown', true)

    return true
  }

  /**
   * Accept current suggestion
   */
  public acceptSuggestion(suggestionId?: string): boolean {
    const suggestion = suggestionId 
      ? this.findSuggestionById(suggestionId)
      : this.suggestionQueue.active

    if (!suggestion) {
      return false
    }

    // Move to completed
    this.suggestionQueue.completed.push(suggestion)
    if (this.suggestionQueue.active?.id === suggestion.id) {
      this.suggestionQueue.active = null
    }

    // Record timing feedback
    this.timingEngine.recordTimingFeedback(suggestion.tourId, true, suggestion.optimalDelay)

    // Trigger callback
    this.onSuggestionAccepted?.(suggestion)

    // Log analytics
    if (this.config.enableAnalytics) {
      this.logSuggestionEvent('suggestion_accepted', suggestion)
    }

    return true
  }

  /**
   * Dismiss current suggestion
   */
  public dismissSuggestion(suggestionId?: string, reason?: string): boolean {
    const suggestion = suggestionId 
      ? this.findSuggestionById(suggestionId)
      : this.suggestionQueue.active

    if (!suggestion) {
      return false
    }

    // Move to dismissed
    this.suggestionQueue.dismissed.push({
      ...suggestion,
      userContext: { ...suggestion.userContext, dismissReason: reason }
    })
    
    if (this.suggestionQueue.active?.id === suggestion.id) {
      this.suggestionQueue.active = null
    }

    // Record timing feedback
    this.timingEngine.recordTimingFeedback(suggestion.tourId, false, suggestion.optimalDelay)

    // Trigger callback
    this.onSuggestionDismissed?.(suggestion)

    // Log analytics
    if (this.config.enableAnalytics) {
      this.logSuggestionEvent('suggestion_dismissed', suggestion, { reason })
    }

    return true
  }

  /**
   * Retry a suggestion (for alternative timing)
   */
  public retrySuggestion(suggestionId: string): boolean {
    const suggestion = this.findSuggestionById(suggestionId)
    if (!suggestion || suggestion.currentRetries >= suggestion.maxRetries) {
      return false
    }

    // Update retry count
    suggestion.currentRetries++
    
    // Re-analyze timing
    const behaviorResult: BehaviorTriggerResult = {
      shouldTrigger: true,
      tourId: suggestion.tourId,
      reason: suggestion.reason,
      confidence: suggestion.confidence,
      priority: suggestion.priority,
      message: suggestion.message,
      delay: suggestion.optimalDelay,
      metadata: suggestion.behaviorData || {}
    }

    const timingRecommendation = this.timingEngine.analyzeOptimalTiming(
      behaviorResult,
      this.sessionStartTime,
      this.pageLoadTime
    )

    // Update suggestion with new timing
    suggestion.optimalDelay = timingRecommendation.optimalDelay * (this.config.retryDelayMultiplier ** suggestion.currentRetries)
    suggestion.shouldShowNow = timingRecommendation.shouldShow
    suggestion.alternativeTime = timingRecommendation.alternativeTime
    suggestion.timingFactors = timingRecommendation.factors

    // Add back to queue if timing is now optimal
    if (timingRecommendation.shouldShow && this.shouldAddSuggestion(suggestion)) {
      this.addSuggestionToQueue(suggestion)
      return true
    }

    return false
  }

  /**
   * Manually trigger a suggestion for a specific tour
   */
  public triggerManualSuggestion(tourId: string, message?: string): boolean {
    const suggestion: ContextualSuggestion = {
      id: this.generateSuggestionId(),
      tourId,
      reason: 'Manual trigger',
      confidence: 1.0,
      priority: 'high',
      message: message || 'Tour disponible',
      
      optimalDelay: 1000,
      shouldShowNow: true,
      
      triggerSource: 'manual',
      pageContext: window.location.pathname,
      userContext: this.getUserContext(),
      
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.defaultExpirationTime),
      maxRetries: 0,
      currentRetries: 0
    }

    if (this.shouldAddSuggestion(suggestion)) {
      this.addSuggestionToQueue(suggestion)
      return true
    }

    return false
  }

  /**
   * Track user actions for behavior analysis
   */
  public trackUserAction(action: string, success: boolean, context?: Record<string, any>): void {
    // Track in behavior engine
    if (!success) {
      this.behaviorEngine.trackError(action, context?.page || window.location.pathname)
    }

    if (context?.feature) {
      this.behaviorEngine.trackFeatureUsage(context.feature)
    }

    // Track in timing engine
    this.timingEngine.trackInteraction(action, success)
  }

  /**
   * Get current suggestion queue status
   */
  public getQueueStatus(): {
    pending: number
    active: boolean
    dismissed: number
    completed: number
    suggestionsThisSession: number
  } {
    return {
      pending: this.suggestionQueue.pending.length,
      active: this.suggestionQueue.active !== null,
      dismissed: this.suggestionQueue.dismissed.length,
      completed: this.suggestionQueue.completed.length,
      suggestionsThisSession: this.suggestionsShownThisSession
    }
  }

  /**
   * Get current active suggestion
   */
  public getActiveSuggestion(): ContextualSuggestion | null {
    return this.suggestionQueue.active
  }

  /**
   * Get pending suggestions
   */
  public getPendingSuggestions(): ContextualSuggestion[] {
    return [...this.suggestionQueue.pending]
  }

  /**
   * Clear expired suggestions
   */
  public clearExpiredSuggestions(): number {
    const now = Date.now()
    let clearedCount = 0

    // Clear expired pending suggestions
    const validPending = this.suggestionQueue.pending.filter(suggestion => {
      if (suggestion.expiresAt.getTime() < now) {
        this.onSuggestionExpired?.(suggestion)
        clearedCount++
        return false
      }
      return true
    })

    this.suggestionQueue.pending = validPending

    // Clear active suggestion if expired
    if (this.suggestionQueue.active && this.suggestionQueue.active.expiresAt.getTime() < now) {
      this.onSuggestionExpired?.(this.suggestionQueue.active)
      this.suggestionQueue.active = null
      clearedCount++
    }

    return clearedCount
  }

  /**
   * Update page context (call when navigating)
   */
  public updatePageContext(): void {
    this.pageLoadTime = new Date()
    
    // Clear suggestions that are not relevant to new page
    if (this.config.enableContextFiltering) {
      this.clearContextuallyIrrelevantSuggestions()
    }
  }

  /**
   * Get analytics data
   */
  public getAnalyticsData(): Record<string, any> {
    return {
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      suggestionsShownThisSession: this.suggestionsShownThisSession,
      queueStatus: this.getQueueStatus(),
      behaviorData: this.behaviorEngine.getBehaviorData(),
      timingStats: this.timingEngine.getTimingStats(),
      suggestionHistory: {
        completed: this.suggestionQueue.completed.length,
        dismissed: this.suggestionQueue.dismissed.length,
        pending: this.suggestionQueue.pending.length
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.behaviorEngine.destroy()
    
    // Clear any pending timeouts
    this.suggestionQueue.pending.forEach(suggestion => {
      if (suggestion.alternativeTime) {
        // Clear any scheduled retries (would need timeout IDs to properly clear)
      }
    })
  }

  // Private helper methods

  private startPeriodicAnalysis(): void {
    // Analyze behavior every 30 seconds
    setInterval(() => {
      const result = this.behaviorEngine.analyzeBehavior()
      if (result) {
        this.handleBehaviorTrigger(result)
      }
      
      // Clear expired suggestions
      this.clearExpiredSuggestions()
    }, 30000)
  }

  private setupNavigationTracking(): void {
    // Track page navigation
    let currentPath = window.location.pathname
    
    const checkNavigation = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        this.updatePageContext()
      }
    }

    // Check for navigation changes
    setInterval(checkNavigation, 1000)
    
    // Listen for popstate events
    window.addEventListener('popstate', () => {
      this.updatePageContext()
    })
  }

  private isDuplicateSuggestion(suggestion: ContextualSuggestion): boolean {
    return this.suggestionQueue.pending.some(existing => 
      existing.tourId === suggestion.tourId && 
      existing.pageContext === suggestion.pageContext
    )
  }

  private passesContextFilter(suggestion: ContextualSuggestion): boolean {
    // Check if suggestion is relevant to current page
    const currentPath = window.location.pathname
    return suggestion.pageContext === currentPath
  }

  private findInsertionIndex(suggestion: ContextualSuggestion): number {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const suggestionPriority = priorityOrder[suggestion.priority]

    for (let i = 0; i < this.suggestionQueue.pending.length; i++) {
      const existingPriority = priorityOrder[this.suggestionQueue.pending[i].priority]
      if (suggestionPriority > existingPriority) {
        return i
      }
    }

    return this.suggestionQueue.pending.length
  }

  private findNextValidSuggestion(): ContextualSuggestion | null {
    const now = Date.now()
    
    return this.suggestionQueue.pending.find(suggestion => 
      suggestion.expiresAt.getTime() > now &&
      (suggestion.shouldShowNow || suggestion.currentRetries > 0)
    ) || null
  }

  private findSuggestionById(id: string): ContextualSuggestion | null {
    return this.suggestionQueue.pending.find(s => s.id === id) ||
           (this.suggestionQueue.active?.id === id ? this.suggestionQueue.active : null) ||
           this.suggestionQueue.dismissed.find(s => s.id === id) ||
           this.suggestionQueue.completed.find(s => s.id === id) ||
           null
  }

  private clearContextuallyIrrelevantSuggestions(): void {
    const currentPath = window.location.pathname
    
    this.suggestionQueue.pending = this.suggestionQueue.pending.filter(suggestion => {
      if (suggestion.pageContext !== currentPath) {
        this.onSuggestionExpired?.(suggestion)
        return false
      }
      return true
    })

    if (this.suggestionQueue.active && this.suggestionQueue.active.pageContext !== currentPath) {
      this.onSuggestionExpired?.(this.suggestionQueue.active)
      this.suggestionQueue.active = null
    }
  }

  private enhanceMessage(originalMessage: string, timingRecommendation: TimingRecommendation): string {
    if (!timingRecommendation.shouldShow && timingRecommendation.alternativeTime) {
      return `${originalMessage} (Te lo recordaré en un mejor momento)`
    }
    return originalMessage
  }

  private getUserContext(): Record<string, any> {
    return {
      currentPath: window.location.pathname,
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      pageLoadTime: Date.now() - this.pageLoadTime.getTime(),
      timestamp: new Date().toISOString()
    }
  }

  private generateSuggestionId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private logSuggestionEvent(eventType: string, suggestion: ContextualSuggestion, metadata?: Record<string, any>): void {
    if (!this.config.enableAnalytics) return

    const event = {
      type: eventType,
      suggestionId: suggestion.id,
      tourId: suggestion.tourId,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        confidence: suggestion.confidence,
        priority: suggestion.priority,
        triggerSource: suggestion.triggerSource,
        pageContext: suggestion.pageContext
      }
    }

    // This would integrate with your analytics system
    console.log('Tour suggestion event:', event)
  }
}