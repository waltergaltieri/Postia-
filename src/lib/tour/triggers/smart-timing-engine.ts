'use client'

import type { BehaviorTriggerResult } from './behavior-trigger-engine'

/**
 * Timing context for smart tour suggestions
 */
export interface TimingContext {
  currentTime: Date
  userTimezone: string
  sessionDuration: number
  pageLoadTime: number
  userActivity: 'active' | 'idle' | 'focused' | 'distracted'
  cognitiveLoad: 'low' | 'medium' | 'high'
  interruptibility: 'high' | 'medium' | 'low'
}

/**
 * Timing rule for tour suggestions
 */
export interface TimingRule {
  id: string
  name: string
  description: string
  conditions: TimingCondition[]
  weight: number
  priority: number
}

/**
 * Individual timing condition
 */
export interface TimingCondition {
  type: 'time_of_day' | 'session_duration' | 'page_load_time' | 'user_activity' | 'cognitive_load' | 'interruptibility'
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'not_equals'
  value: any
  weight: number
}

/**
 * Smart timing recommendation
 */
export interface TimingRecommendation {
  shouldShow: boolean
  optimalDelay: number
  confidence: number
  reason: string
  alternativeTime?: Date
  factors: Array<{
    factor: string
    score: number
    impact: 'positive' | 'negative' | 'neutral'
  }>
}

/**
 * Configuration for smart timing engine
 */
export interface SmartTimingConfig {
  enableTimeOfDayOptimization: boolean
  enableCognitiveLoadDetection: boolean
  enableInterruptibilityDetection: boolean
  enableActivityBasedTiming: boolean
  
  // Optimal time windows
  optimalTimeWindows: Array<{
    start: string // HH:MM format
    end: string   // HH:MM format
    weight: number
  }>
  
  // Thresholds
  maxCognitiveLoad: 'medium' | 'high'
  minInterruptibility: 'medium' | 'high'
  maxSessionDuration: number // milliseconds
  minPageStabilityTime: number // milliseconds
  
  // Timing preferences
  preferredDelayRange: [number, number] // [min, max] in milliseconds
  adaptToUserBehavior: boolean
}

/**
 * Smart timing engine for tour recommendations
 * Implements intelligent timing for tour suggestions based on user context
 */
export class SmartTimingEngine {
  private config: SmartTimingConfig
  private timingRules: Map<string, TimingRule>
  private userTimingPreferences: Map<string, number> = new Map()
  private recentInteractions: Array<{ timestamp: Date, type: string, success: boolean }> = []

  constructor(config: Partial<SmartTimingConfig> = {}) {
    this.config = {
      enableTimeOfDayOptimization: true,
      enableCognitiveLoadDetection: true,
      enableInterruptibilityDetection: true,
      enableActivityBasedTiming: true,
      optimalTimeWindows: [
        { start: '09:00', end: '11:00', weight: 1.0 }, // Morning focus time
        { start: '14:00', end: '16:00', weight: 0.8 }, // Afternoon productive time
        { start: '19:00', end: '21:00', weight: 0.6 }  // Evening learning time
      ],
      maxCognitiveLoad: 'medium',
      minInterruptibility: 'medium',
      maxSessionDuration: 3600000, // 1 hour
      minPageStabilityTime: 3000, // 3 seconds
      preferredDelayRange: [2000, 8000], // 2-8 seconds
      adaptToUserBehavior: true,
      ...config
    }

    this.timingRules = this.initializeTimingRules()
  }

  /**
   * Initialize timing rules
   */
  private initializeTimingRules(): Map<string, TimingRule> {
    const rules = new Map<string, TimingRule>()

    // Optimal time of day rule
    rules.set('time_of_day', {
      id: 'time_of_day',
      name: 'Optimal Time of Day',
      description: 'Show tours during optimal time windows',
      conditions: [{
        type: 'time_of_day',
        operator: 'between',
        value: this.config.optimalTimeWindows,
        weight: 1.0
      }],
      weight: 0.3,
      priority: 2
    })

    // Low cognitive load rule
    rules.set('cognitive_load', {
      id: 'cognitive_load',
      name: 'Low Cognitive Load',
      description: 'Show tours when user cognitive load is manageable',
      conditions: [{
        type: 'cognitive_load',
        operator: 'less_than',
        value: this.config.maxCognitiveLoad,
        weight: 1.0
      }],
      weight: 0.4,
      priority: 1
    })

    // High interruptibility rule
    rules.set('interruptibility', {
      id: 'interruptibility',
      name: 'High Interruptibility',
      description: 'Show tours when user is interruptible',
      conditions: [{
        type: 'interruptibility',
        operator: 'greater_than',
        value: this.config.minInterruptibility,
        weight: 1.0
      }],
      weight: 0.5,
      priority: 1
    })

    // Session freshness rule
    rules.set('session_freshness', {
      id: 'session_freshness',
      name: 'Fresh Session',
      description: 'Prefer showing tours in fresh sessions',
      conditions: [{
        type: 'session_duration',
        operator: 'less_than',
        value: this.config.maxSessionDuration,
        weight: 1.0
      }],
      weight: 0.2,
      priority: 3
    })

    // Page stability rule
    rules.set('page_stability', {
      id: 'page_stability',
      name: 'Page Stability',
      description: 'Wait for page to be stable before showing tours',
      conditions: [{
        type: 'page_load_time',
        operator: 'greater_than',
        value: this.config.minPageStabilityTime,
        weight: 1.0
      }],
      weight: 0.3,
      priority: 1
    })

    // User activity rule
    rules.set('user_activity', {
      id: 'user_activity',
      name: 'Optimal User Activity',
      description: 'Show tours when user is active but not overwhelmed',
      conditions: [{
        type: 'user_activity',
        operator: 'equals',
        value: ['active', 'focused'],
        weight: 1.0
      }],
      weight: 0.4,
      priority: 2
    })

    return rules
  }

  /**
   * Analyze timing context and provide recommendation
   */
  public analyzeOptimalTiming(
    triggerResult: BehaviorTriggerResult,
    sessionStartTime: Date,
    pageLoadTime: Date
  ): TimingRecommendation {
    const context = this.buildTimingContext(sessionStartTime, pageLoadTime)
    const factors: Array<{ factor: string, score: number, impact: 'positive' | 'negative' | 'neutral' }> = []
    
    let totalScore = 0
    let maxScore = 0

    // Evaluate each timing rule
    for (const [ruleId, rule] of this.timingRules) {
      const ruleScore = this.evaluateTimingRule(rule, context)
      const weightedScore = ruleScore * rule.weight
      
      totalScore += weightedScore
      maxScore += rule.weight

      factors.push({
        factor: rule.name,
        score: ruleScore,
        impact: ruleScore > 0.7 ? 'positive' : ruleScore < 0.3 ? 'negative' : 'neutral'
      })
    }

    const confidence = maxScore > 0 ? totalScore / maxScore : 0
    const shouldShow = confidence >= 0.6 // Threshold for showing tours

    // Calculate optimal delay
    const optimalDelay = this.calculateOptimalDelay(context, triggerResult, confidence)

    // Generate recommendation reason
    const reason = this.generateTimingReason(factors, confidence)

    // Calculate alternative time if current timing is not optimal
    const alternativeTime = shouldShow ? undefined : this.calculateAlternativeTime(context, factors)

    return {
      shouldShow,
      optimalDelay,
      confidence,
      reason,
      alternativeTime,
      factors
    }
  }

  /**
   * Build timing context from current state
   */
  private buildTimingContext(sessionStartTime: Date, pageLoadTime: Date): TimingContext {
    const now = new Date()
    const sessionDuration = now.getTime() - sessionStartTime.getTime()
    const pageStability = now.getTime() - pageLoadTime.getTime()

    return {
      currentTime: now,
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionDuration,
      pageLoadTime: pageStability,
      userActivity: this.detectUserActivity(),
      cognitiveLoad: this.detectCognitiveLoad(),
      interruptibility: this.detectInterruptibility()
    }
  }

  /**
   * Evaluate a timing rule against context
   */
  private evaluateTimingRule(rule: TimingRule, context: TimingContext): number {
    let ruleScore = 0
    let maxConditionWeight = 0

    for (const condition of rule.conditions) {
      const conditionScore = this.evaluateTimingCondition(condition, context)
      ruleScore += conditionScore * condition.weight
      maxConditionWeight += condition.weight
    }

    return maxConditionWeight > 0 ? ruleScore / maxConditionWeight : 0
  }

  /**
   * Evaluate individual timing condition
   */
  private evaluateTimingCondition(condition: TimingCondition, context: TimingContext): number {
    switch (condition.type) {
      case 'time_of_day':
        return this.evaluateTimeOfDay(condition, context)
      
      case 'session_duration':
        return this.evaluateSessionDuration(condition, context)
      
      case 'page_load_time':
        return this.evaluatePageLoadTime(condition, context)
      
      case 'user_activity':
        return this.evaluateUserActivity(condition, context)
      
      case 'cognitive_load':
        return this.evaluateCognitiveLoad(condition, context)
      
      case 'interruptibility':
        return this.evaluateInterruptibility(condition, context)
      
      default:
        return 0
    }
  }

  /**
   * Evaluate time of day condition
   */
  private evaluateTimeOfDay(condition: TimingCondition, context: TimingContext): number {
    if (!this.config.enableTimeOfDayOptimization) return 0.5

    const currentHour = context.currentTime.getHours()
    const currentMinute = context.currentTime.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMinute

    const timeWindows = condition.value as Array<{ start: string, end: string, weight: number }>
    
    for (const window of timeWindows) {
      const [startHour, startMinute] = window.start.split(':').map(Number)
      const [endHour, endMinute] = window.end.split(':').map(Number)
      
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute
      
      if (currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes) {
        return window.weight
      }
    }

    return 0.2 // Outside optimal windows
  }

  /**
   * Evaluate session duration condition
   */
  private evaluateSessionDuration(condition: TimingCondition, context: TimingContext): number {
    const sessionHours = context.sessionDuration / (1000 * 60 * 60)
    
    switch (condition.operator) {
      case 'less_than':
        return context.sessionDuration < condition.value ? 1 : Math.max(0, 1 - sessionHours / 2)
      
      case 'greater_than':
        return context.sessionDuration > condition.value ? 1 : 0
      
      case 'between':
        const [min, max] = condition.value
        return context.sessionDuration >= min && context.sessionDuration <= max ? 1 : 0
      
      default:
        return 0.5
    }
  }

  /**
   * Evaluate page load time condition
   */
  private evaluatePageLoadTime(condition: TimingCondition, context: TimingContext): number {
    switch (condition.operator) {
      case 'greater_than':
        return context.pageLoadTime >= condition.value ? 1 : 0
      
      case 'less_than':
        return context.pageLoadTime < condition.value ? 0 : 1
      
      default:
        return 0.5
    }
  }

  /**
   * Evaluate user activity condition
   */
  private evaluateUserActivity(condition: TimingCondition, context: TimingContext): number {
    const acceptableActivities = Array.isArray(condition.value) ? condition.value : [condition.value]
    return acceptableActivities.includes(context.userActivity) ? 1 : 0
  }

  /**
   * Evaluate cognitive load condition
   */
  private evaluateCognitiveLoad(condition: TimingCondition, context: TimingContext): number {
    const loadLevels = { low: 1, medium: 2, high: 3 }
    const currentLoad = loadLevels[context.cognitiveLoad]
    const thresholdLoad = loadLevels[condition.value as keyof typeof loadLevels]

    switch (condition.operator) {
      case 'less_than':
        return currentLoad < thresholdLoad ? 1 : 0
      
      case 'equals':
        return currentLoad === thresholdLoad ? 1 : 0
      
      default:
        return 0.5
    }
  }

  /**
   * Evaluate interruptibility condition
   */
  private evaluateInterruptibility(condition: TimingCondition, context: TimingContext): number {
    const interruptLevels = { low: 1, medium: 2, high: 3 }
    const currentLevel = interruptLevels[context.interruptibility]
    const thresholdLevel = interruptLevels[condition.value as keyof typeof interruptLevels]

    switch (condition.operator) {
      case 'greater_than':
        return currentLevel > thresholdLevel ? 1 : 0
      
      case 'equals':
        return currentLevel === thresholdLevel ? 1 : 0
      
      default:
        return 0.5
    }
  }

  /**
   * Detect current user activity level
   */
  private detectUserActivity(): 'active' | 'idle' | 'focused' | 'distracted' {
    const recentInteractions = this.recentInteractions.filter(
      interaction => Date.now() - interaction.timestamp.getTime() < 30000 // Last 30 seconds
    )

    if (recentInteractions.length === 0) return 'idle'
    
    const interactionRate = recentInteractions.length / 30 // per second
    const successRate = recentInteractions.filter(i => i.success).length / recentInteractions.length

    if (interactionRate > 0.5 && successRate < 0.7) return 'distracted'
    if (interactionRate > 0.2 && successRate > 0.8) return 'focused'
    if (interactionRate > 0.1) return 'active'
    
    return 'idle'
  }

  /**
   * Detect cognitive load level
   */
  private detectCognitiveLoad(): 'low' | 'medium' | 'high' {
    // Analyze recent interaction patterns
    const recentInteractions = this.recentInteractions.filter(
      interaction => Date.now() - interaction.timestamp.getTime() < 60000 // Last minute
    )

    if (recentInteractions.length === 0) return 'low'

    const errorRate = 1 - (recentInteractions.filter(i => i.success).length / recentInteractions.length)
    const interactionFrequency = recentInteractions.length / 60 // per second

    // High error rate or very high interaction frequency suggests high cognitive load
    if (errorRate > 0.3 || interactionFrequency > 1) return 'high'
    if (errorRate > 0.1 || interactionFrequency > 0.5) return 'medium'
    
    return 'low'
  }

  /**
   * Detect interruptibility level
   */
  private detectInterruptibility(): 'low' | 'medium' | 'high' {
    const userActivity = this.detectUserActivity()
    const cognitiveLoad = this.detectCognitiveLoad()

    // Low interruptibility if user is focused or under high cognitive load
    if (userActivity === 'focused' || cognitiveLoad === 'high') return 'low'
    
    // High interruptibility if user is idle or under low cognitive load
    if (userActivity === 'idle' || cognitiveLoad === 'low') return 'high'
    
    return 'medium'
  }

  /**
   * Calculate optimal delay based on context and confidence
   */
  private calculateOptimalDelay(
    context: TimingContext, 
    triggerResult: BehaviorTriggerResult, 
    confidence: number
  ): number {
    const [minDelay, maxDelay] = this.config.preferredDelayRange
    
    // Base delay on trigger priority
    const priorityDelays = {
      'critical': minDelay,
      'high': minDelay * 1.5,
      'medium': minDelay * 2,
      'low': maxDelay
    }
    
    let baseDelay = priorityDelays[triggerResult.priority] || minDelay * 2

    // Adjust based on user activity
    const activityMultipliers = {
      'idle': 0.5,      // Show sooner when idle
      'active': 1.0,    // Normal timing when active
      'focused': 2.0,   // Wait longer when focused
      'distracted': 1.5 // Wait a bit when distracted
    }
    
    baseDelay *= activityMultipliers[context.userActivity]

    // Adjust based on cognitive load
    const loadMultipliers = {
      'low': 0.8,    // Can show sooner with low load
      'medium': 1.0, // Normal timing
      'high': 2.5    // Wait much longer with high load
    }
    
    baseDelay *= loadMultipliers[context.cognitiveLoad]

    // Adjust based on confidence
    baseDelay *= (2 - confidence) // Lower confidence = longer delay

    // Apply user preferences if available
    if (this.config.adaptToUserBehavior) {
      const userPreference = this.getUserTimingPreference(triggerResult.tourId)
      if (userPreference) {
        baseDelay *= userPreference
      }
    }

    // Ensure delay is within acceptable range
    return Math.max(minDelay, Math.min(maxDelay, Math.floor(baseDelay)))
  }

  /**
   * Generate human-readable reason for timing decision
   */
  private generateTimingReason(
    factors: Array<{ factor: string, score: number, impact: 'positive' | 'negative' | 'neutral' }>,
    confidence: number
  ): string {
    const positiveFactors = factors.filter(f => f.impact === 'positive')
    const negativeFactors = factors.filter(f => f.impact === 'negative')

    if (confidence >= 0.8) {
      const topFactor = positiveFactors.sort((a, b) => b.score - a.score)[0]
      return `Momento óptimo: ${topFactor?.factor.toLowerCase() || 'condiciones favorables'}`
    }
    
    if (confidence >= 0.6) {
      return 'Momento adecuado para mostrar el tour'
    }
    
    if (negativeFactors.length > 0) {
      const topNegative = negativeFactors.sort((a, b) => a.score - b.score)[0]
      return `Mejor esperar: ${topNegative.factor.toLowerCase()}`
    }
    
    return 'Condiciones no óptimas para el tour'
  }

  /**
   * Calculate alternative time when current timing is not optimal
   */
  private calculateAlternativeTime(
    context: TimingContext,
    factors: Array<{ factor: string, score: number, impact: 'positive' | 'negative' | 'neutral' }>
  ): Date | undefined {
    const negativeFactors = factors.filter(f => f.impact === 'negative')
    
    if (negativeFactors.length === 0) return undefined

    // Find the next optimal time window
    const now = new Date()
    const nextOptimalWindow = this.config.optimalTimeWindows.find(window => {
      const [hour, minute] = window.start.split(':').map(Number)
      const windowTime = new Date(now)
      windowTime.setHours(hour, minute, 0, 0)
      
      if (windowTime <= now) {
        windowTime.setDate(windowTime.getDate() + 1) // Next day
      }
      
      return windowTime > now
    })

    if (nextOptimalWindow) {
      const [hour, minute] = nextOptimalWindow.start.split(':').map(Number)
      const alternativeTime = new Date(now)
      alternativeTime.setHours(hour, minute, 0, 0)
      
      if (alternativeTime <= now) {
        alternativeTime.setDate(alternativeTime.getDate() + 1)
      }
      
      return alternativeTime
    }

    // Default to next hour if no specific window found
    const nextHour = new Date(now)
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
    return nextHour
  }

  /**
   * Track user interaction for activity detection
   */
  public trackInteraction(type: string, success: boolean): void {
    this.recentInteractions.push({
      timestamp: new Date(),
      type,
      success
    })

    // Keep only recent interactions (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 300000
    this.recentInteractions = this.recentInteractions.filter(
      interaction => interaction.timestamp.getTime() > fiveMinutesAgo
    )
  }

  /**
   * Learn from user timing preferences
   */
  public recordTimingFeedback(tourId: string, wasAccepted: boolean, delay: number): void {
    if (!this.config.adaptToUserBehavior) return

    const currentPreference = this.userTimingPreferences.get(tourId) || 1.0
    
    if (wasAccepted) {
      // User accepted, this timing was good
      this.userTimingPreferences.set(tourId, Math.max(0.5, currentPreference * 0.9))
    } else {
      // User dismissed, this timing was poor
      this.userTimingPreferences.set(tourId, Math.min(2.0, currentPreference * 1.1))
    }
  }

  /**
   * Get user timing preference for a tour
   */
  private getUserTimingPreference(tourId: string): number | null {
    return this.userTimingPreferences.get(tourId) || null
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SmartTimingConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.timingRules = this.initializeTimingRules() // Reinitialize rules with new config
  }

  /**
   * Get timing statistics for analytics
   */
  public getTimingStats(): Record<string, any> {
    return {
      recentInteractionCount: this.recentInteractions.length,
      userPreferences: Array.from(this.userTimingPreferences.entries()),
      currentActivity: this.detectUserActivity(),
      currentCognitiveLoad: this.detectCognitiveLoad(),
      currentInterruptibility: this.detectInterruptibility()
    }
  }
}