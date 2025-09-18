/**
 * Feature flags system for gradual tour rollout and A/B testing
 */

export interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  rolloutPercentage?: number
  conditions?: FeatureFlagCondition[]
  metadata?: {
    createdAt: string
    updatedAt: string
    createdBy: string
    environment: string
  }
}

export interface FeatureFlagCondition {
  type: 'user_role' | 'user_id' | 'client_id' | 'environment' | 'date_range' | 'custom'
  operator: 'equals' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than'
  value: any
}

export interface FeatureFlagContext {
  userId?: string
  userRole?: string
  clientId?: string
  environment: string
  userAgent?: string
  timestamp: number
}

/**
 * Tour-specific feature flags
 */
export const TOUR_FEATURE_FLAGS = {
  // Core tour system
  TOURS_ENABLED: 'tours_enabled',
  TOURS_AUTO_START: 'tours_auto_start',
  TOURS_ANALYTICS: 'tours_analytics',
  
  // Specific tour types
  WELCOME_TOUR: 'welcome_tour',
  CONTENT_GENERATION_TOUR: 'content_generation_tour',
  CAMPAIGN_MANAGEMENT_TOUR: 'campaign_management_tour',
  ADMIN_FEATURES_TOUR: 'admin_features_tour',
  
  // Advanced features
  CONTEXTUAL_TOURS: 'contextual_tours',
  INTELLIGENT_SUGGESTIONS: 'intelligent_suggestions',
  TOUR_PERSONALIZATION: 'tour_personalization',
  MOBILE_OPTIMIZED_TOURS: 'mobile_optimized_tours',
  
  // A/B testing
  TOUR_VARIANT_A: 'tour_variant_a',
  TOUR_VARIANT_B: 'tour_variant_b',
  
  // Performance features
  TOUR_PRELOADING: 'tour_preloading',
  TOUR_LAZY_LOADING: 'tour_lazy_loading',
  
  // Accessibility
  ENHANCED_ACCESSIBILITY: 'enhanced_accessibility',
  HIGH_CONTRAST_TOURS: 'high_contrast_tours',
  
  // Debug and development
  TOUR_DEBUG_MODE: 'tour_debug_mode',
  TOUR_PERFORMANCE_MONITORING: 'tour_performance_monitoring'
} as const

/**
 * Default feature flag configurations by environment
 */
export const DEFAULT_FEATURE_FLAGS: Record<string, Partial<FeatureFlag>> = {
  // Core system flags
  [TOUR_FEATURE_FLAGS.TOURS_ENABLED]: {
    name: 'Tours System',
    description: 'Enable the entire tour system',
    enabled: true
  },
  
  [TOUR_FEATURE_FLAGS.TOURS_AUTO_START]: {
    name: 'Auto-start Tours',
    description: 'Automatically start tours for new users',
    enabled: true,
    rolloutPercentage: 100
  },
  
  [TOUR_FEATURE_FLAGS.TOURS_ANALYTICS]: {
    name: 'Tour Analytics',
    description: 'Track tour interactions and performance',
    enabled: true
  },
  
  // Individual tours
  [TOUR_FEATURE_FLAGS.WELCOME_TOUR]: {
    name: 'Welcome Tour',
    description: 'Onboarding tour for new users',
    enabled: true,
    rolloutPercentage: 100
  },
  
  [TOUR_FEATURE_FLAGS.CONTENT_GENERATION_TOUR]: {
    name: 'Content Generation Tour',
    description: 'Tour for AI content generation features',
    enabled: true,
    rolloutPercentage: 80
  },
  
  [TOUR_FEATURE_FLAGS.CAMPAIGN_MANAGEMENT_TOUR]: {
    name: 'Campaign Management Tour',
    description: 'Tour for campaign management features',
    enabled: true,
    rolloutPercentage: 70
  },
  
  [TOUR_FEATURE_FLAGS.ADMIN_FEATURES_TOUR]: {
    name: 'Admin Features Tour',
    description: 'Tour for administrative features',
    enabled: true,
    conditions: [
      {
        type: 'user_role',
        operator: 'equals',
        value: 'admin'
      }
    ]
  },
  
  // Advanced features
  [TOUR_FEATURE_FLAGS.CONTEXTUAL_TOURS]: {
    name: 'Contextual Tours',
    description: 'Smart, context-aware tour suggestions',
    enabled: false, // Gradual rollout
    rolloutPercentage: 25
  },
  
  [TOUR_FEATURE_FLAGS.INTELLIGENT_SUGGESTIONS]: {
    name: 'Intelligent Tour Suggestions',
    description: 'AI-powered tour recommendations',
    enabled: false,
    rolloutPercentage: 10
  },
  
  [TOUR_FEATURE_FLAGS.TOUR_PERSONALIZATION]: {
    name: 'Tour Personalization',
    description: 'Personalized tour content based on user behavior',
    enabled: false,
    rolloutPercentage: 15
  },
  
  [TOUR_FEATURE_FLAGS.MOBILE_OPTIMIZED_TOURS]: {
    name: 'Mobile Optimized Tours',
    description: 'Enhanced mobile tour experience',
    enabled: true,
    rolloutPercentage: 90
  },
  
  // A/B testing
  [TOUR_FEATURE_FLAGS.TOUR_VARIANT_A]: {
    name: 'Tour Variant A',
    description: 'Original tour design and flow',
    enabled: true,
    rolloutPercentage: 50
  },
  
  [TOUR_FEATURE_FLAGS.TOUR_VARIANT_B]: {
    name: 'Tour Variant B',
    description: 'Alternative tour design and flow',
    enabled: true,
    rolloutPercentage: 50
  },
  
  // Performance
  [TOUR_FEATURE_FLAGS.TOUR_PRELOADING]: {
    name: 'Tour Preloading',
    description: 'Preload critical tours for better performance',
    enabled: true
  },
  
  [TOUR_FEATURE_FLAGS.TOUR_LAZY_LOADING]: {
    name: 'Tour Lazy Loading',
    description: 'Load tours on demand to reduce initial bundle size',
    enabled: true
  },
  
  // Accessibility
  [TOUR_FEATURE_FLAGS.ENHANCED_ACCESSIBILITY]: {
    name: 'Enhanced Accessibility',
    description: 'Advanced accessibility features for tours',
    enabled: true
  },
  
  [TOUR_FEATURE_FLAGS.HIGH_CONTRAST_TOURS]: {
    name: 'High Contrast Tours',
    description: 'High contrast mode support for tours',
    enabled: true
  },
  
  // Debug and development
  [TOUR_FEATURE_FLAGS.TOUR_DEBUG_MODE]: {
    name: 'Tour Debug Mode',
    description: 'Enable debug tools and logging for tours',
    enabled: process.env.NODE_ENV === 'development'
  },
  
  [TOUR_FEATURE_FLAGS.TOUR_PERFORMANCE_MONITORING]: {
    name: 'Tour Performance Monitoring',
    description: 'Monitor tour performance and user interactions',
    enabled: true
  }
}

/**
 * Environment-specific feature flag configurations
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    [TOUR_FEATURE_FLAGS.TOURS_ENABLED]: { enabled: true },
    [TOUR_FEATURE_FLAGS.CONTEXTUAL_TOURS]: { enabled: true, rolloutPercentage: 100 },
    [TOUR_FEATURE_FLAGS.INTELLIGENT_SUGGESTIONS]: { enabled: true, rolloutPercentage: 100 },
    [TOUR_FEATURE_FLAGS.TOUR_DEBUG_MODE]: { enabled: true },
    [TOUR_FEATURE_FLAGS.TOUR_PERFORMANCE_MONITORING]: { enabled: true }
  },
  
  staging: {
    [TOUR_FEATURE_FLAGS.TOURS_ENABLED]: { enabled: true },
    [TOUR_FEATURE_FLAGS.CONTEXTUAL_TOURS]: { enabled: true, rolloutPercentage: 50 },
    [TOUR_FEATURE_FLAGS.INTELLIGENT_SUGGESTIONS]: { enabled: true, rolloutPercentage: 30 },
    [TOUR_FEATURE_FLAGS.TOUR_DEBUG_MODE]: { enabled: true },
    [TOUR_FEATURE_FLAGS.TOUR_PERFORMANCE_MONITORING]: { enabled: true }
  },
  
  production: {
    [TOUR_FEATURE_FLAGS.TOURS_ENABLED]: { enabled: true },
    [TOUR_FEATURE_FLAGS.CONTEXTUAL_TOURS]: { enabled: false, rolloutPercentage: 25 },
    [TOUR_FEATURE_FLAGS.INTELLIGENT_SUGGESTIONS]: { enabled: false, rolloutPercentage: 10 },
    [TOUR_FEATURE_FLAGS.TOUR_DEBUG_MODE]: { enabled: false },
    [TOUR_FEATURE_FLAGS.TOUR_PERFORMANCE_MONITORING]: { enabled: true }
  }
}

/**
 * Feature flag evaluation engine
 */
export class FeatureFlagEngine {
  private flags: Map<string, FeatureFlag> = new Map()
  private context: FeatureFlagContext
  
  constructor(context: FeatureFlagContext) {
    this.context = context
    this.loadFlags()
  }
  
  /**
   * Load feature flags from configuration
   */
  private loadFlags(): void {
    const environment = this.context.environment || 'development'
    const envConfig = ENVIRONMENT_CONFIGS[environment as keyof typeof ENVIRONMENT_CONFIGS] || {}
    
    Object.entries(DEFAULT_FEATURE_FLAGS).forEach(([key, defaultConfig]) => {
      const envOverride = envConfig[key] || {}
      
      const flag: FeatureFlag = {
        key,
        name: defaultConfig.name || key,
        description: defaultConfig.description || '',
        enabled: defaultConfig.enabled || false,
        rolloutPercentage: defaultConfig.rolloutPercentage,
        conditions: defaultConfig.conditions,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          environment
        },
        ...envOverride
      }
      
      this.flags.set(key, flag)
    })
  }
  
  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey)
    if (!flag) {
      console.warn(`Feature flag not found: ${flagKey}`)
      return false
    }
    
    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false
    }
    
    // Check conditions
    if (flag.conditions && !this.evaluateConditions(flag.conditions)) {
      return false
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      return this.isInRollout(flagKey, flag.rolloutPercentage)
    }
    
    return true
  }
  
  /**
   * Evaluate feature flag conditions
   */
  private evaluateConditions(conditions: FeatureFlagCondition[]): boolean {
    return conditions.every(condition => this.evaluateCondition(condition))
  }
  
  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: FeatureFlagCondition): boolean {
    let contextValue: any
    
    switch (condition.type) {
      case 'user_role':
        contextValue = this.context.userRole
        break
      case 'user_id':
        contextValue = this.context.userId
        break
      case 'client_id':
        contextValue = this.context.clientId
        break
      case 'environment':
        contextValue = this.context.environment
        break
      case 'date_range':
        contextValue = this.context.timestamp
        break
      default:
        return true
    }
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value
      case 'not_equals':
        return contextValue !== condition.value
      case 'contains':
        return String(contextValue).includes(String(condition.value))
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue)
      case 'greater_than':
        return Number(contextValue) > Number(condition.value)
      case 'less_than':
        return Number(contextValue) < Number(condition.value)
      default:
        return true
    }
  }
  
  /**
   * Determine if user is in rollout percentage
   */
  private isInRollout(flagKey: string, percentage: number): boolean {
    if (percentage >= 100) return true
    if (percentage <= 0) return false
    
    // Use consistent hashing based on user ID and flag key
    const hashInput = `${this.context.userId || 'anonymous'}-${flagKey}`
    const hash = this.simpleHash(hashInput)
    const userPercentile = hash % 100
    
    return userPercentile < percentage
  }
  
  /**
   * Simple hash function for consistent rollout
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  /**
   * Get all enabled flags
   */
  getEnabledFlags(): string[] {
    return Array.from(this.flags.keys()).filter(key => this.isEnabled(key))
  }
  
  /**
   * Get flag configuration
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey)
  }
  
  /**
   * Update flag configuration (for admin interface)
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    const existingFlag = this.flags.get(flagKey)
    if (!existingFlag) {
      throw new Error(`Feature flag not found: ${flagKey}`)
    }
    
    const updatedFlag: FeatureFlag = {
      ...existingFlag,
      ...updates,
      metadata: {
        ...existingFlag.metadata,
        updatedAt: new Date().toISOString()
      }
    }
    
    this.flags.set(flagKey, updatedFlag)
  }
  
  /**
   * Get feature flags as object for tour condition evaluation
   */
  getFlagsForTourContext(): Record<string, boolean> {
    const flagsObject: Record<string, boolean> = {}
    
    this.flags.forEach((flag, key) => {
      flagsObject[key] = this.isEnabled(key)
    })
    
    return flagsObject
  }
}

/**
 * Global feature flag instance
 */
let globalFeatureFlagEngine: FeatureFlagEngine | null = null

/**
 * Initialize feature flags with context
 */
export function initializeFeatureFlags(context: FeatureFlagContext): FeatureFlagEngine {
  globalFeatureFlagEngine = new FeatureFlagEngine(context)
  return globalFeatureFlagEngine
}

/**
 * Get the global feature flag engine
 */
export function getFeatureFlags(): FeatureFlagEngine {
  if (!globalFeatureFlagEngine) {
    // Initialize with default context if not already initialized
    globalFeatureFlagEngine = new FeatureFlagEngine({
      environment: process.env.NODE_ENV || 'development',
      timestamp: Date.now()
    })
  }
  
  return globalFeatureFlagEngine
}

/**
 * Convenience function to check if a tour feature is enabled
 */
export function isTourFeatureEnabled(flagKey: string): boolean {
  return getFeatureFlags().isEnabled(flagKey)
}

/**
 * React hook for feature flags (to be used in components)
 */
export function useFeatureFlag(flagKey: string): boolean {
  // This would typically use React context or state management
  // For now, return the current flag state
  return getFeatureFlags().isEnabled(flagKey)
}

/**
 * Feature flag middleware for API routes
 */
export function withFeatureFlag(flagKey: string) {
  return function <T extends (...args: any[]) => any>(target: T): T {
    return ((...args: any[]) => {
      if (!isTourFeatureEnabled(flagKey)) {
        throw new Error(`Feature not available: ${flagKey}`)
      }
      return target(...args)
    }) as T
  }
}