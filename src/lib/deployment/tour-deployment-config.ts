/**
 * Tour deployment configuration and management system
 */

import { TOUR_FEATURE_FLAGS, FeatureFlagContext, initializeFeatureFlags } from '@/lib/feature-flags/feature-flags'

export interface DeploymentEnvironment {
  name: string
  description: string
  url?: string
  features: {
    tours: TourDeploymentConfig
    analytics: AnalyticsConfig
    monitoring: MonitoringConfig
  }
}

export interface TourDeploymentConfig {
  enabled: boolean
  autoStart: boolean
  preloadTours: string[]
  lazyLoadTours: string[]
  rolloutStrategy: RolloutStrategy
  performanceConfig: PerformanceConfig
  accessibilityConfig: AccessibilityConfig
}

export interface RolloutStrategy {
  type: 'immediate' | 'gradual' | 'canary' | 'blue_green'
  percentage?: number
  duration?: number // in hours
  criteria?: RolloutCriteria[]
}

export interface RolloutCriteria {
  type: 'user_role' | 'client_tier' | 'geographic' | 'device_type'
  values: string[]
  percentage: number
}

export interface PerformanceConfig {
  maxConcurrentTours: number
  tourTimeout: number // in milliseconds
  preloadDelay: number // in milliseconds
  cacheStrategy: 'memory' | 'localStorage' | 'sessionStorage'
  bundleOptimization: boolean
}

export interface AccessibilityConfig {
  enhancedFeatures: boolean
  highContrastSupport: boolean
  screenReaderOptimized: boolean
  keyboardNavigationEnhanced: boolean
  reducedMotionSupport: boolean
}

export interface AnalyticsConfig {
  enabled: boolean
  provider: 'internal' | 'google_analytics' | 'mixpanel' | 'amplitude'
  trackingEvents: string[]
  retentionDays: number
}

export interface MonitoringConfig {
  enabled: boolean
  errorTracking: boolean
  performanceMonitoring: boolean
  userFeedbackCollection: boolean
  alertThresholds: {
    errorRate: number
    completionRate: number
    averageDuration: number
  }
}

/**
 * Environment-specific deployment configurations
 */
export const DEPLOYMENT_ENVIRONMENTS: Record<string, DeploymentEnvironment> = {
  development: {
    name: 'Development',
    description: 'Local development environment',
    url: 'http://localhost:3000',
    features: {
      tours: {
        enabled: true,
        autoStart: true,
        preloadTours: [
          'welcome-tour',
          'content-generation-tour',
          'campaign-management-tour'
        ],
        lazyLoadTours: [
          'admin-features-tour',
          'advanced-settings-tour'
        ],
        rolloutStrategy: {
          type: 'immediate'
        },
        performanceConfig: {
          maxConcurrentTours: 3,
          tourTimeout: 30 * 60 * 1000, // 30 minutes
          preloadDelay: 1000,
          cacheStrategy: 'memory',
          bundleOptimization: false
        },
        accessibilityConfig: {
          enhancedFeatures: true,
          highContrastSupport: true,
          screenReaderOptimized: true,
          keyboardNavigationEnhanced: true,
          reducedMotionSupport: true
        }
      },
      analytics: {
        enabled: true,
        provider: 'internal',
        trackingEvents: [
          'tour_started',
          'tour_completed',
          'tour_skipped',
          'step_viewed',
          'help_requested'
        ],
        retentionDays: 30
      },
      monitoring: {
        enabled: true,
        errorTracking: true,
        performanceMonitoring: true,
        userFeedbackCollection: true,
        alertThresholds: {
          errorRate: 0.1, // 10%
          completionRate: 0.5, // 50%
          averageDuration: 300 // 5 minutes
        }
      }
    }
  },

  staging: {
    name: 'Staging',
    description: 'Pre-production testing environment',
    url: 'https://staging.postia.com',
    features: {
      tours: {
        enabled: true,
        autoStart: true,
        preloadTours: [
          'welcome-tour',
          'content-generation-tour'
        ],
        lazyLoadTours: [
          'campaign-management-tour',
          'admin-features-tour',
          'advanced-settings-tour'
        ],
        rolloutStrategy: {
          type: 'gradual',
          percentage: 50,
          duration: 24, // 24 hours
          criteria: [
            {
              type: 'user_role',
              values: ['admin', 'beta_tester'],
              percentage: 100
            },
            {
              type: 'client_tier',
              values: ['premium', 'enterprise'],
              percentage: 75
            }
          ]
        },
        performanceConfig: {
          maxConcurrentTours: 2,
          tourTimeout: 20 * 60 * 1000, // 20 minutes
          preloadDelay: 2000,
          cacheStrategy: 'localStorage',
          bundleOptimization: true
        },
        accessibilityConfig: {
          enhancedFeatures: true,
          highContrastSupport: true,
          screenReaderOptimized: true,
          keyboardNavigationEnhanced: true,
          reducedMotionSupport: true
        }
      },
      analytics: {
        enabled: true,
        provider: 'internal',
        trackingEvents: [
          'tour_started',
          'tour_completed',
          'tour_skipped',
          'step_viewed',
          'step_completed',
          'help_requested',
          'error_occurred'
        ],
        retentionDays: 90
      },
      monitoring: {
        enabled: true,
        errorTracking: true,
        performanceMonitoring: true,
        userFeedbackCollection: true,
        alertThresholds: {
          errorRate: 0.05, // 5%
          completionRate: 0.6, // 60%
          averageDuration: 240 // 4 minutes
        }
      }
    }
  },

  production: {
    name: 'Production',
    description: 'Live production environment',
    url: 'https://app.postia.com',
    features: {
      tours: {
        enabled: true,
        autoStart: true,
        preloadTours: [
          'welcome-tour'
        ],
        lazyLoadTours: [
          'content-generation-tour',
          'campaign-management-tour',
          'admin-features-tour',
          'advanced-settings-tour',
          'help-tours'
        ],
        rolloutStrategy: {
          type: 'canary',
          percentage: 10,
          duration: 72, // 72 hours
          criteria: [
            {
              type: 'user_role',
              values: ['admin'],
              percentage: 100
            },
            {
              type: 'client_tier',
              values: ['enterprise'],
              percentage: 50
            },
            {
              type: 'geographic',
              values: ['US', 'CA'],
              percentage: 25
            }
          ]
        },
        performanceConfig: {
          maxConcurrentTours: 1,
          tourTimeout: 15 * 60 * 1000, // 15 minutes
          preloadDelay: 3000,
          cacheStrategy: 'localStorage',
          bundleOptimization: true
        },
        accessibilityConfig: {
          enhancedFeatures: true,
          highContrastSupport: true,
          screenReaderOptimized: true,
          keyboardNavigationEnhanced: true,
          reducedMotionSupport: true
        }
      },
      analytics: {
        enabled: true,
        provider: 'google_analytics',
        trackingEvents: [
          'tour_started',
          'tour_completed',
          'tour_skipped',
          'step_viewed',
          'step_completed',
          'help_requested',
          'error_occurred',
          'performance_metric'
        ],
        retentionDays: 365
      },
      monitoring: {
        enabled: true,
        errorTracking: true,
        performanceMonitoring: true,
        userFeedbackCollection: false, // Disabled in production for performance
        alertThresholds: {
          errorRate: 0.02, // 2%
          completionRate: 0.7, // 70%
          averageDuration: 180 // 3 minutes
        }
      }
    }
  }
}

/**
 * Deployment configuration manager
 */
export class TourDeploymentManager {
  private environment: string
  private config: DeploymentEnvironment
  
  constructor(environment?: string) {
    this.environment = environment || process.env.NODE_ENV || 'development'
    this.config = DEPLOYMENT_ENVIRONMENTS[this.environment] || DEPLOYMENT_ENVIRONMENTS.development
  }
  
  /**
   * Get current deployment configuration
   */
  getConfig(): DeploymentEnvironment {
    return this.config
  }
  
  /**
   * Get tour-specific configuration
   */
  getTourConfig(): TourDeploymentConfig {
    return this.config.features.tours
  }
  
  /**
   * Check if tours are enabled in current environment
   */
  areToursEnabled(): boolean {
    return this.config.features.tours.enabled
  }
  
  /**
   * Get list of tours to preload
   */
  getPreloadTours(): string[] {
    return this.config.features.tours.preloadTours
  }
  
  /**
   * Get list of tours to lazy load
   */
  getLazyLoadTours(): string[] {
    return this.config.features.tours.lazyLoadTours
  }
  
  /**
   * Check if user should receive tours based on rollout strategy
   */
  shouldShowTours(context: FeatureFlagContext): boolean {
    if (!this.areToursEnabled()) {
      return false
    }
    
    const rollout = this.config.features.tours.rolloutStrategy
    
    switch (rollout.type) {
      case 'immediate':
        return true
        
      case 'gradual':
        return this.evaluateGradualRollout(rollout, context)
        
      case 'canary':
        return this.evaluateCanaryRollout(rollout, context)
        
      case 'blue_green':
        return this.evaluateBlueGreenRollout(rollout, context)
        
      default:
        return true
    }
  }
  
  /**
   * Evaluate gradual rollout strategy
   */
  private evaluateGradualRollout(rollout: RolloutStrategy, context: FeatureFlagContext): boolean {
    // Check criteria first
    if (rollout.criteria) {
      for (const criterion of rollout.criteria) {
        if (this.matchesCriterion(criterion, context)) {
          return this.isInPercentage(context.userId || 'anonymous', criterion.percentage)
        }
      }
    }
    
    // Default percentage rollout
    return this.isInPercentage(context.userId || 'anonymous', rollout.percentage || 100)
  }
  
  /**
   * Evaluate canary rollout strategy
   */
  private evaluateCanaryRollout(rollout: RolloutStrategy, context: FeatureFlagContext): boolean {
    // Canary rollout prioritizes specific criteria
    if (rollout.criteria) {
      for (const criterion of rollout.criteria) {
        if (this.matchesCriterion(criterion, context)) {
          return this.isInPercentage(context.userId || 'anonymous', criterion.percentage)
        }
      }
    }
    
    // Small percentage for general population
    return this.isInPercentage(context.userId || 'anonymous', rollout.percentage || 5)
  }
  
  /**
   * Evaluate blue-green rollout strategy
   */
  private evaluateBlueGreenRollout(rollout: RolloutStrategy, context: FeatureFlagContext): boolean {
    // Blue-green is typically all-or-nothing based on deployment
    // For tours, we can use it as a feature toggle
    return rollout.percentage === 100
  }
  
  /**
   * Check if context matches rollout criterion
   */
  private matchesCriterion(criterion: RolloutCriteria, context: FeatureFlagContext): boolean {
    switch (criterion.type) {
      case 'user_role':
        return criterion.values.includes(context.userRole || '')
        
      case 'client_tier':
        // This would need to be passed in context or fetched
        return false // Placeholder
        
      case 'geographic':
        // This would need geolocation data
        return false // Placeholder
        
      case 'device_type':
        // This would need device detection
        return false // Placeholder
        
      default:
        return false
    }
  }
  
  /**
   * Check if user is in percentage rollout
   */
  private isInPercentage(userId: string, percentage: number): boolean {
    if (percentage >= 100) return true
    if (percentage <= 0) return false
    
    const hash = this.simpleHash(userId)
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
      hash = hash & hash
    }
    return Math.abs(hash)
  }
  
  /**
   * Get analytics configuration
   */
  getAnalyticsConfig(): AnalyticsConfig {
    return this.config.features.analytics
  }
  
  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(): MonitoringConfig {
    return this.config.features.monitoring
  }
  
  /**
   * Initialize feature flags based on deployment config
   */
  initializeFeatureFlags(context: FeatureFlagContext) {
    const featureFlags = initializeFeatureFlags(context)
    
    // Override feature flags based on deployment config
    const tourConfig = this.getTourConfig()
    
    if (!tourConfig.enabled) {
      featureFlags.updateFlag(TOUR_FEATURE_FLAGS.TOURS_ENABLED, { enabled: false })
    }
    
    if (!tourConfig.autoStart) {
      featureFlags.updateFlag(TOUR_FEATURE_FLAGS.TOURS_AUTO_START, { enabled: false })
    }
    
    // Set rollout percentages based on deployment strategy
    const rolloutPercentage = this.getRolloutPercentage(context)
    
    Object.values(TOUR_FEATURE_FLAGS).forEach(flagKey => {
      if (flagKey !== TOUR_FEATURE_FLAGS.TOURS_ENABLED) {
        featureFlags.updateFlag(flagKey, { rolloutPercentage })
      }
    })
    
    return featureFlags
  }
  
  /**
   * Get effective rollout percentage for user
   */
  private getRolloutPercentage(context: FeatureFlagContext): number {
    const rollout = this.config.features.tours.rolloutStrategy
    
    if (rollout.criteria) {
      for (const criterion of rollout.criteria) {
        if (this.matchesCriterion(criterion, context)) {
          return criterion.percentage
        }
      }
    }
    
    return rollout.percentage || 100
  }
  
  /**
   * Validate deployment configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Validate tour configuration
    const tourConfig = this.config.features.tours
    
    if (tourConfig.performanceConfig.maxConcurrentTours < 1) {
      errors.push('maxConcurrentTours must be at least 1')
    }
    
    if (tourConfig.performanceConfig.tourTimeout < 60000) {
      errors.push('tourTimeout must be at least 60 seconds')
    }
    
    // Validate rollout strategy
    const rollout = tourConfig.rolloutStrategy
    
    if (rollout.percentage !== undefined && (rollout.percentage < 0 || rollout.percentage > 100)) {
      errors.push('rollout percentage must be between 0 and 100')
    }
    
    // Validate analytics configuration
    const analyticsConfig = this.config.features.analytics
    
    if (analyticsConfig.retentionDays < 1) {
      errors.push('analytics retention days must be at least 1')
    }
    
    // Validate monitoring thresholds
    const monitoring = this.config.features.monitoring
    
    if (monitoring.alertThresholds.errorRate < 0 || monitoring.alertThresholds.errorRate > 1) {
      errors.push('error rate threshold must be between 0 and 1')
    }
    
    if (monitoring.alertThresholds.completionRate < 0 || monitoring.alertThresholds.completionRate > 1) {
      errors.push('completion rate threshold must be between 0 and 1')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Get deployment status
   */
  getDeploymentStatus(): {
    environment: string
    toursEnabled: boolean
    rolloutStrategy: string
    rolloutPercentage?: number
    preloadedTours: number
    lazyLoadedTours: number
  } {
    const tourConfig = this.config.features.tours
    
    return {
      environment: this.environment,
      toursEnabled: tourConfig.enabled,
      rolloutStrategy: tourConfig.rolloutStrategy.type,
      rolloutPercentage: tourConfig.rolloutStrategy.percentage,
      preloadedTours: tourConfig.preloadTours.length,
      lazyLoadedTours: tourConfig.lazyLoadTours.length
    }
  }
}

/**
 * Global deployment manager instance
 */
let globalDeploymentManager: TourDeploymentManager | null = null

/**
 * Get the global deployment manager
 */
export function getDeploymentManager(): TourDeploymentManager {
  if (!globalDeploymentManager) {
    globalDeploymentManager = new TourDeploymentManager()
  }
  
  return globalDeploymentManager
}

/**
 * Initialize deployment configuration
 */
export function initializeDeployment(environment?: string): TourDeploymentManager {
  globalDeploymentManager = new TourDeploymentManager(environment)
  return globalDeploymentManager
}

/**
 * Convenience function to check if tours should be shown
 */
export function shouldShowTours(context: FeatureFlagContext): boolean {
  return getDeploymentManager().shouldShowTours(context)
}