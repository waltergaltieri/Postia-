/**
 * Tour environment configuration management
 * Handles environment variables and configuration validation
 */

export interface TourEnvironmentConfig {
  // Core system
  toursEnabled: boolean
  environment: string
  autoStart: boolean
  debugMode: boolean
  
  // Feature flags
  features: {
    welcomeTour: boolean
    contentGenerationTour: boolean
    campaignManagementTour: boolean
    adminFeaturesTour: boolean
    contextualTours: boolean
    intelligentSuggestions: boolean
    tourPersonalization: boolean
    mobileOptimizedTours: boolean
    enhancedAccessibility: boolean
    highContrastTours: boolean
    tourPreloading: boolean
    tourLazyLoading: boolean
  }
  
  // Rollout configuration
  rollout: {
    strategy: 'immediate' | 'gradual' | 'canary' | 'blue_green'
    percentage: number
    duration: number
  }
  
  // Performance configuration
  performance: {
    maxConcurrentTours: number
    tourTimeout: number
    preloadDelay: number
    cacheStrategy: 'memory' | 'localStorage' | 'sessionStorage'
    bundleOptimization: boolean
  }
  
  // Analytics configuration
  analytics: {
    enabled: boolean
    provider: 'internal' | 'google_analytics' | 'mixpanel' | 'amplitude'
    retention: number
    performanceTracking: boolean
  }
  
  // Monitoring configuration
  monitoring: {
    enabled: boolean
    errorTracking: boolean
    performanceMonitoring: boolean
    feedbackCollection: boolean
    thresholds: {
      errorRate: number
      completionRate: number
      duration: number
    }
  }
  
  // External services
  services: {
    googleAnalytics?: string
    mixpanel?: string
    amplitude?: string
    sentry?: string
  }
  
  // A/B testing
  abTesting: {
    enabled: boolean
    variant: 'A' | 'B'
    splitPercentage: number
  }
  
  // Development
  development: {
    debugPanel: boolean
    hotReload: boolean
    mockAnalytics: boolean
    skipConditions: boolean
  }
}

/**
 * Load configuration from environment variables
 */
function loadEnvironmentConfig(): TourEnvironmentConfig {
  const env = process.env
  
  return {
    // Core system
    toursEnabled: env.NEXT_PUBLIC_TOURS_ENABLED === 'true',
    environment: env.NEXT_PUBLIC_TOUR_ENVIRONMENT || env.NODE_ENV || 'development',
    autoStart: env.NEXT_PUBLIC_TOURS_AUTO_START === 'true',
    debugMode: env.NEXT_PUBLIC_TOUR_DEBUG_MODE === 'true',
    
    // Feature flags
    features: {
      welcomeTour: env.NEXT_PUBLIC_WELCOME_TOUR_ENABLED !== 'false',
      contentGenerationTour: env.NEXT_PUBLIC_CONTENT_GENERATION_TOUR_ENABLED !== 'false',
      campaignManagementTour: env.NEXT_PUBLIC_CAMPAIGN_MANAGEMENT_TOUR_ENABLED !== 'false',
      adminFeaturesTour: env.NEXT_PUBLIC_ADMIN_FEATURES_TOUR_ENABLED !== 'false',
      contextualTours: env.NEXT_PUBLIC_CONTEXTUAL_TOURS_ENABLED === 'true',
      intelligentSuggestions: env.NEXT_PUBLIC_INTELLIGENT_SUGGESTIONS_ENABLED === 'true',
      tourPersonalization: env.NEXT_PUBLIC_TOUR_PERSONALIZATION_ENABLED === 'true',
      mobileOptimizedTours: env.NEXT_PUBLIC_MOBILE_OPTIMIZED_TOURS_ENABLED !== 'false',
      enhancedAccessibility: env.NEXT_PUBLIC_ENHANCED_ACCESSIBILITY_ENABLED !== 'false',
      highContrastTours: env.NEXT_PUBLIC_HIGH_CONTRAST_TOURS_ENABLED !== 'false',
      tourPreloading: env.NEXT_PUBLIC_TOUR_PRELOADING_ENABLED !== 'false',
      tourLazyLoading: env.NEXT_PUBLIC_TOUR_LAZY_LOADING_ENABLED !== 'false'
    },
    
    // Rollout configuration
    rollout: {
      strategy: (env.NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY as any) || 'immediate',
      percentage: parseInt(env.NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE || '100'),
      duration: parseInt(env.NEXT_PUBLIC_TOUR_ROLLOUT_DURATION || '24')
    },
    
    // Performance configuration
    performance: {
      maxConcurrentTours: parseInt(env.NEXT_PUBLIC_MAX_CONCURRENT_TOURS || '1'),
      tourTimeout: parseInt(env.NEXT_PUBLIC_TOUR_TIMEOUT || '900000'),
      preloadDelay: parseInt(env.NEXT_PUBLIC_TOUR_PRELOAD_DELAY || '2000'),
      cacheStrategy: (env.NEXT_PUBLIC_TOUR_CACHE_STRATEGY as any) || 'localStorage',
      bundleOptimization: env.NEXT_PUBLIC_TOUR_BUNDLE_OPTIMIZATION !== 'false'
    },
    
    // Analytics configuration
    analytics: {
      enabled: env.NEXT_PUBLIC_TOUR_ANALYTICS_ENABLED !== 'false',
      provider: (env.NEXT_PUBLIC_TOUR_ANALYTICS_PROVIDER as any) || 'internal',
      retention: parseInt(env.NEXT_PUBLIC_TOUR_ANALYTICS_RETENTION || '30'),
      performanceTracking: env.NEXT_PUBLIC_TOUR_PERFORMANCE_TRACKING !== 'false'
    },
    
    // Monitoring configuration
    monitoring: {
      enabled: env.NEXT_PUBLIC_TOUR_MONITORING_ENABLED !== 'false',
      errorTracking: env.NEXT_PUBLIC_TOUR_ERROR_TRACKING !== 'false',
      performanceMonitoring: env.NEXT_PUBLIC_TOUR_PERFORMANCE_MONITORING !== 'false',
      feedbackCollection: env.NEXT_PUBLIC_TOUR_FEEDBACK_COLLECTION === 'true',
      thresholds: {
        errorRate: parseFloat(env.NEXT_PUBLIC_TOUR_ERROR_RATE_THRESHOLD || '0.05'),
        completionRate: parseFloat(env.NEXT_PUBLIC_TOUR_COMPLETION_RATE_THRESHOLD || '0.6'),
        duration: parseInt(env.NEXT_PUBLIC_TOUR_DURATION_THRESHOLD || '300')
      }
    },
    
    // External services
    services: {
      googleAnalytics: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      mixpanel: env.NEXT_PUBLIC_MIXPANEL_TOKEN,
      amplitude: env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
      sentry: env.NEXT_PUBLIC_SENTRY_DSN
    },
    
    // A/B testing
    abTesting: {
      enabled: env.NEXT_PUBLIC_TOUR_AB_TESTING_ENABLED === 'true',
      variant: (env.NEXT_PUBLIC_TOUR_VARIANT as any) || 'A',
      splitPercentage: parseInt(env.NEXT_PUBLIC_TOUR_AB_SPLIT_PERCENTAGE || '50')
    },
    
    // Development
    development: {
      debugPanel: env.NEXT_PUBLIC_TOUR_DEBUG_PANEL === 'true',
      hotReload: env.NEXT_PUBLIC_TOUR_HOT_RELOAD === 'true',
      mockAnalytics: env.NEXT_PUBLIC_TOUR_MOCK_ANALYTICS === 'true',
      skipConditions: env.NEXT_PUBLIC_TOUR_SKIP_CONDITIONS === 'true'
    }
  }
}

/**
 * Validate configuration
 */
function validateConfig(config: TourEnvironmentConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate environment
  const validEnvironments = ['development', 'staging', 'production']
  if (!validEnvironments.includes(config.environment)) {
    errors.push(`Invalid environment: ${config.environment}. Must be one of: ${validEnvironments.join(', ')}`)
  }
  
  // Validate rollout strategy
  const validStrategies = ['immediate', 'gradual', 'canary', 'blue_green']
  if (!validStrategies.includes(config.rollout.strategy)) {
    errors.push(`Invalid rollout strategy: ${config.rollout.strategy}. Must be one of: ${validStrategies.join(', ')}`)
  }
  
  // Validate rollout percentage
  if (config.rollout.percentage < 0 || config.rollout.percentage > 100) {
    errors.push(`Invalid rollout percentage: ${config.rollout.percentage}. Must be between 0 and 100`)
  }
  
  // Validate performance settings
  if (config.performance.maxConcurrentTours < 1) {
    errors.push(`Invalid maxConcurrentTours: ${config.performance.maxConcurrentTours}. Must be at least 1`)
  }
  
  if (config.performance.tourTimeout < 60000) {
    errors.push(`Invalid tourTimeout: ${config.performance.tourTimeout}. Must be at least 60000ms (1 minute)`)
  }
  
  // Validate cache strategy
  const validCacheStrategies = ['memory', 'localStorage', 'sessionStorage']
  if (!validCacheStrategies.includes(config.performance.cacheStrategy)) {
    errors.push(`Invalid cache strategy: ${config.performance.cacheStrategy}. Must be one of: ${validCacheStrategies.join(', ')}`)
  }
  
  // Validate analytics provider
  const validProviders = ['internal', 'google_analytics', 'mixpanel', 'amplitude']
  if (!validProviders.includes(config.analytics.provider)) {
    errors.push(`Invalid analytics provider: ${config.analytics.provider}. Must be one of: ${validProviders.join(', ')}`)
  }
  
  // Validate thresholds
  if (config.monitoring.thresholds.errorRate < 0 || config.monitoring.thresholds.errorRate > 1) {
    errors.push(`Invalid error rate threshold: ${config.monitoring.thresholds.errorRate}. Must be between 0 and 1`)
  }
  
  if (config.monitoring.thresholds.completionRate < 0 || config.monitoring.thresholds.completionRate > 1) {
    errors.push(`Invalid completion rate threshold: ${config.monitoring.thresholds.completionRate}. Must be between 0 and 1`)
  }
  
  // Validate A/B testing
  if (config.abTesting.enabled) {
    if (!['A', 'B'].includes(config.abTesting.variant)) {
      errors.push(`Invalid A/B test variant: ${config.abTesting.variant}. Must be 'A' or 'B'`)
    }
    
    if (config.abTesting.splitPercentage < 0 || config.abTesting.splitPercentage > 100) {
      errors.push(`Invalid A/B test split percentage: ${config.abTesting.splitPercentage}. Must be between 0 and 100`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get environment-specific defaults
 */
function getEnvironmentDefaults(environment: string): Partial<TourEnvironmentConfig> {
  switch (environment) {
    case 'development':
      return {
        debugMode: true,
        rollout: { strategy: 'immediate', percentage: 100, duration: 0 },
        features: {
          contextualTours: true,
          intelligentSuggestions: true,
          tourPersonalization: true
        } as any,
        development: {
          debugPanel: true,
          hotReload: true,
          mockAnalytics: true,
          skipConditions: false
        }
      }
      
    case 'staging':
      return {
        debugMode: true,
        rollout: { strategy: 'gradual', percentage: 50, duration: 24 },
        features: {
          contextualTours: true,
          intelligentSuggestions: false,
          tourPersonalization: false
        } as any,
        development: {
          debugPanel: true,
          hotReload: false,
          mockAnalytics: false,
          skipConditions: false
        }
      }
      
    case 'production':
      return {
        debugMode: false,
        rollout: { strategy: 'canary', percentage: 10, duration: 72 },
        features: {
          contextualTours: false,
          intelligentSuggestions: false,
          tourPersonalization: false
        } as any,
        development: {
          debugPanel: false,
          hotReload: false,
          mockAnalytics: false,
          skipConditions: false
        }
      }
      
    default:
      return {}
  }
}

/**
 * Merge configuration with environment defaults
 */
function mergeWithDefaults(config: TourEnvironmentConfig): TourEnvironmentConfig {
  const defaults = getEnvironmentDefaults(config.environment)
  
  return {
    ...config,
    ...defaults,
    features: {
      ...config.features,
      ...defaults.features
    },
    rollout: {
      ...config.rollout,
      ...defaults.rollout
    },
    development: {
      ...config.development,
      ...defaults.development
    }
  }
}

/**
 * Tour configuration manager
 */
export class TourConfigManager {
  private config: TourEnvironmentConfig
  private isValid: boolean = false
  private validationErrors: string[] = []
  
  constructor() {
    this.config = this.loadConfig()
    this.validateAndMerge()
  }
  
  /**
   * Load configuration from environment
   */
  private loadConfig(): TourEnvironmentConfig {
    return loadEnvironmentConfig()
  }
  
  /**
   * Validate and merge with defaults
   */
  private validateAndMerge(): void {
    // Merge with environment defaults
    this.config = mergeWithDefaults(this.config)
    
    // Validate configuration
    const validation = validateConfig(this.config)
    this.isValid = validation.isValid
    this.validationErrors = validation.errors
    
    if (!this.isValid) {
      console.error('Tour configuration validation failed:', this.validationErrors)
      
      if (this.config.environment === 'production') {
        // In production, disable tours if configuration is invalid
        this.config.toursEnabled = false
      }
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): TourEnvironmentConfig {
    return this.config
  }
  
  /**
   * Check if configuration is valid
   */
  isConfigValid(): boolean {
    return this.isValid
  }
  
  /**
   * Get validation errors
   */
  getValidationErrors(): string[] {
    return this.validationErrors
  }
  
  /**
   * Check if tours are enabled
   */
  areToursEnabled(): boolean {
    return this.config.toursEnabled && this.isValid
  }
  
  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: keyof TourEnvironmentConfig['features']): boolean {
    return this.config.features[feature] && this.areToursEnabled()
  }
  
  /**
   * Get rollout configuration
   */
  getRolloutConfig(): TourEnvironmentConfig['rollout'] {
    return this.config.rollout
  }
  
  /**
   * Get performance configuration
   */
  getPerformanceConfig(): TourEnvironmentConfig['performance'] {
    return this.config.performance
  }
  
  /**
   * Get analytics configuration
   */
  getAnalyticsConfig(): TourEnvironmentConfig['analytics'] {
    return this.config.analytics
  }
  
  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(): TourEnvironmentConfig['monitoring'] {
    return this.config.monitoring
  }
  
  /**
   * Get A/B testing configuration
   */
  getABTestingConfig(): TourEnvironmentConfig['abTesting'] {
    return this.config.abTesting
  }
  
  /**
   * Check if in development mode
   */
  isDevelopment(): boolean {
    return this.config.environment === 'development'
  }
  
  /**
   * Check if in staging mode
   */
  isStaging(): boolean {
    return this.config.environment === 'staging'
  }
  
  /**
   * Check if in production mode
   */
  isProduction(): boolean {
    return this.config.environment === 'production'
  }
  
  /**
   * Get configuration summary for debugging
   */
  getConfigSummary(): {
    environment: string
    toursEnabled: boolean
    debugMode: boolean
    rolloutStrategy: string
    rolloutPercentage: number
    enabledFeatures: string[]
    analyticsProvider: string
    isValid: boolean
    errors: string[]
  } {
    const enabledFeatures = Object.entries(this.config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature)
    
    return {
      environment: this.config.environment,
      toursEnabled: this.config.toursEnabled,
      debugMode: this.config.debugMode,
      rolloutStrategy: this.config.rollout.strategy,
      rolloutPercentage: this.config.rollout.percentage,
      enabledFeatures,
      analyticsProvider: this.config.analytics.provider,
      isValid: this.isValid,
      errors: this.validationErrors
    }
  }
  
  /**
   * Reload configuration (useful for hot reloading in development)
   */
  reloadConfig(): void {
    this.config = this.loadConfig()
    this.validateAndMerge()
  }
}

/**
 * Global configuration manager instance
 */
let globalConfigManager: TourConfigManager | null = null

/**
 * Get the global configuration manager
 */
export function getTourConfig(): TourConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new TourConfigManager()
  }
  
  return globalConfigManager
}

/**
 * Initialize configuration manager
 */
export function initializeTourConfig(): TourConfigManager {
  globalConfigManager = new TourConfigManager()
  return globalConfigManager
}

/**
 * Convenience functions
 */
export function isTourFeatureEnabled(feature: keyof TourEnvironmentConfig['features']): boolean {
  return getTourConfig().isFeatureEnabled(feature)
}

export function areToursEnabled(): boolean {
  return getTourConfig().areToursEnabled()
}

export function getTourEnvironment(): string {
  return getTourConfig().getConfig().environment
}

export function isTourDebugMode(): boolean {
  return getTourConfig().getConfig().debugMode
}