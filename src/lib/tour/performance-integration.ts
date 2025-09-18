/**
 * Performance integration layer that coordinates all optimization systems
 * Provides a unified interface for tour performance management
 */

import type { TourDefinition } from '@/types/tour'
import { getPerformanceTourManager, type LoadContext } from './performance-tour-manager'
import { getTourMemoryManager } from './tour-memory-manager'
import { getTourPerformanceMonitor } from './tour-performance-monitor'
import { getTourOptimizationEngine } from './tour-optimization-strategies'
import { getLazyTourLoader } from './lazy-tour-loader'
import { getTourBundleManager } from './tour-bundle-manager'
import { getTourCacheStrategy } from './tour-cache-strategy'

interface PerformanceIntegrationConfig {
  enableLazyLoading: boolean
  enableBundleManagement: boolean
  enableAdvancedCaching: boolean
  enableMemoryManagement: boolean
  enablePerformanceMonitoring: boolean
  enableOptimization: boolean
  autoOptimize: boolean
  monitoringInterval: number
}

interface SystemHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor'
  components: {
    lazyLoading: 'healthy' | 'warning' | 'error'
    bundleManagement: 'healthy' | 'warning' | 'error'
    caching: 'healthy' | 'warning' | 'error'
    memoryManagement: 'healthy' | 'warning' | 'error'
    performanceMonitoring: 'healthy' | 'warning' | 'error'
  }
  metrics: {
    averageLoadTime: number
    cacheHitRate: number
    memoryUsage: number
    errorRate: number
  }
  recommendations: string[]
}

/**
 * Unified performance management system for tours
 */
export class TourPerformanceIntegration {
  private static instance: TourPerformanceIntegration
  private config: PerformanceIntegrationConfig
  private healthCheckInterval?: NodeJS.Timeout
  private isInitialized = false

  private constructor(config?: Partial<PerformanceIntegrationConfig>) {
    this.config = {
      enableLazyLoading: true,
      enableBundleManagement: true,
      enableAdvancedCaching: true,
      enableMemoryManagement: true,
      enablePerformanceMonitoring: true,
      enableOptimization: true,
      autoOptimize: true,
      monitoringInterval: 60000, // 1 minute
      ...config
    }
  }

  static getInstance(config?: Partial<PerformanceIntegrationConfig>): TourPerformanceIntegration {
    if (!TourPerformanceIntegration.instance) {
      TourPerformanceIntegration.instance = new TourPerformanceIntegration(config)
    }
    return TourPerformanceIntegration.instance
  }

  /**
   * Initialize the performance integration system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('Initializing Tour Performance Integration System...')

    try {
      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        const monitor = getTourPerformanceMonitor()
        monitor.startMonitoring()
      }

      // Initialize memory management
      if (this.config.enableMemoryManagement) {
        const memoryManager = getTourMemoryManager()
        // Memory manager is automatically initialized
      }

      // Preload critical tours if bundle management is enabled
      if (this.config.enableBundleManagement) {
        const bundleManager = getTourBundleManager()
        await bundleManager.preloadCriticalBundles()
      }

      // Start health monitoring
      this.startHealthMonitoring()

      this.isInitialized = true
      console.log('Tour Performance Integration System initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Tour Performance Integration System:', error)
      throw error
    }
  }

  /**
   * Load a tour with full performance optimization
   */
  async loadTourOptimized(tourId: string, context?: LoadContext): Promise<{
    tour: TourDefinition
    loadTime: number
    optimizations: string[]
    cacheHit: boolean
  }> {
    const startTime = performance.now()
    let optimizations: string[] = []
    let cacheHit = false

    try {
      // Use the performance tour manager for optimal loading
      const performanceManager = getPerformanceTourManager()
      const result = await performanceManager.loadTour(tourId, context)
      
      cacheHit = result.source === 'cache'
      
      // Apply optimizations if enabled
      if (this.config.enableOptimization) {
        const optimizer = getTourOptimizationEngine()
        const optimizedResult = await optimizer.getOptimizedTour(result.tour)
        
        optimizations = optimizedResult.optimizations
        
        // Register with memory manager
        if (this.config.enableMemoryManagement) {
          const memoryManager = getTourMemoryManager()
          memoryManager.registerTour(tourId, optimizedResult.tour)
        }

        const loadTime = performance.now() - startTime

        return {
          tour: optimizedResult.tour,
          loadTime,
          optimizations,
          cacheHit
        }
      }

      const loadTime = performance.now() - startTime

      return {
        tour: result.tour,
        loadTime,
        optimizations,
        cacheHit
      }
    } catch (error) {
      // Record error for monitoring
      if (this.config.enablePerformanceMonitoring) {
        const monitor = getTourPerformanceMonitor()
        monitor.recordTourError(tourId, error as Error)
      }
      throw error
    }
  }

  /**
   * Initialize tours for a user context with full optimization
   */
  async initializeToursForUser(context: LoadContext): Promise<{
    preloadedTours: TourDefinition[]
    optimizedTours: number
    estimatedSavings: number
    recommendations: string[]
  }> {
    const startTime = performance.now()

    try {
      // Use performance manager to initialize tours
      const performanceManager = getPerformanceTourManager()
      const result = await performanceManager.initializeForContext(context)

      let optimizedTours = 0
      const recommendations: string[] = []

      // Optimize preloaded tours if enabled
      if (this.config.enableOptimization && result.preloaded.length > 0) {
        const optimizer = getTourOptimizationEngine()
        const optimizationResults = await optimizer.batchOptimizeTours(result.preloaded)
        optimizedTours = optimizationResults.size

        // Collect recommendations
        for (const optimizedResult of optimizationResults.values()) {
          if (optimizedResult.performanceGain > 20) {
            recommendations.push(`Tour ${optimizedResult.tour.id} optimized with ${optimizedResult.performanceGain.toFixed(1)}% performance gain`)
          }
        }
      }

      const totalTime = performance.now() - startTime

      return {
        preloadedTours: result.preloaded,
        optimizedTours,
        estimatedSavings: result.estimatedSavings,
        recommendations: [...result.recommendations, ...recommendations]
      }
    } catch (error) {
      console.error('Failed to initialize tours for user:', error)
      throw error
    }
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const componentHealth = await this.checkComponentHealth()
    const metrics = await this.collectSystemMetrics()
    const overall = this.calculateOverallHealth(componentHealth, metrics)
    const recommendations = this.generateHealthRecommendations(componentHealth, metrics)

    return {
      overall,
      components: componentHealth,
      metrics,
      recommendations
    }
  }

  /**
   * Optimize the entire system performance
   */
  async optimizeSystem(): Promise<{
    optimizationsApplied: string[]
    performanceGain: number
    memoryFreed: number
    cacheOptimized: boolean
  }> {
    const optimizationsApplied: string[] = []
    let performanceGain = 0
    let memoryFreed = 0
    let cacheOptimized = false

    try {
      // Optimize performance manager
      if (this.config.enableLazyLoading || this.config.enableBundleManagement) {
        const performanceManager = getPerformanceTourManager()
        const result = await performanceManager.optimizePerformance()
        
        if (result.performanceGain > 0) {
          optimizationsApplied.push('Performance Manager Optimization')
          performanceGain += result.performanceGain
        }
      }

      // Optimize memory usage
      if (this.config.enableMemoryManagement) {
        const memoryManager = getTourMemoryManager()
        const memoryResult = memoryManager.optimizeMemory()
        
        if (memoryResult.memoryFreed > 0) {
          optimizationsApplied.push('Memory Optimization')
          memoryFreed = memoryResult.memoryFreed
        }
      }

      // Optimize cache
      if (this.config.enableAdvancedCaching) {
        const cache = getTourCacheStrategy()
        await cache.optimize()
        optimizationsApplied.push('Cache Optimization')
        cacheOptimized = true
      }

      // Optimize bundle loading
      if (this.config.enableBundleManagement) {
        const bundleManager = getTourBundleManager()
        await bundleManager.optimizeBundleLoading()
        optimizationsApplied.push('Bundle Optimization')
      }

      console.log('System optimization completed:', {
        optimizationsApplied,
        performanceGain,
        memoryFreed,
        cacheOptimized
      })

      return {
        optimizationsApplied,
        performanceGain,
        memoryFreed,
        cacheOptimized
      }
    } catch (error) {
      console.error('System optimization failed:', error)
      throw error
    }
  }

  /**
   * Clear all performance caches and reset system
   */
  async clearAllCaches(): Promise<void> {
    try {
      if (this.config.enableAdvancedCaching) {
        const cache = getTourCacheStrategy()
        cache.invalidate('all')
      }

      if (this.config.enableLazyLoading) {
        const lazyLoader = getLazyTourLoader()
        lazyLoader.clearCache()
      }

      if (this.config.enableBundleManagement) {
        const bundleManager = getTourBundleManager()
        bundleManager.clearBundleCache()
      }

      if (this.config.enableOptimization) {
        const optimizer = getTourOptimizationEngine()
        optimizer.clearCache()
      }

      console.log('All performance caches cleared')
    } catch (error) {
      console.error('Failed to clear caches:', error)
      throw error
    }
  }

  /**
   * Get performance analytics and insights
   */
  async getPerformanceAnalytics(): Promise<{
    loadingPerformance: {
      averageLoadTime: number
      cacheHitRate: number
      bundleEfficiency: number
    }
    memoryPerformance: {
      currentUsage: number
      peakUsage: number
      cleanupEfficiency: number
    }
    optimizationImpact: {
      toursOptimized: number
      averageGain: number
      totalSavings: number
    }
    recommendations: string[]
  }> {
    const analytics = {
      loadingPerformance: {
        averageLoadTime: 0,
        cacheHitRate: 0,
        bundleEfficiency: 0
      },
      memoryPerformance: {
        currentUsage: 0,
        peakUsage: 0,
        cleanupEfficiency: 0
      },
      optimizationImpact: {
        toursOptimized: 0,
        averageGain: 0,
        totalSavings: 0
      },
      recommendations: [] as string[]
    }

    try {
      // Get performance monitoring data
      if (this.config.enablePerformanceMonitoring) {
        const monitor = getTourPerformanceMonitor()
        const summary = await monitor.getPerformanceSummary()
        
        analytics.loadingPerformance.averageLoadTime = summary.averageStepRenderTime
        analytics.recommendations.push(...summary.recommendations)
      }

      // Get cache performance
      if (this.config.enableAdvancedCaching) {
        const cache = getTourCacheStrategy()
        const cacheStats = cache.getStats()
        analytics.loadingPerformance.cacheHitRate = cacheStats.hitRate
      }

      // Get bundle performance
      if (this.config.enableBundleManagement) {
        const bundleManager = getTourBundleManager()
        const bundleStats = bundleManager.getBundleStats()
        analytics.loadingPerformance.bundleEfficiency = bundleStats.loadedBundles / bundleStats.totalBundles
      }

      // Get memory performance
      if (this.config.enableMemoryManagement) {
        const memoryManager = getTourMemoryManager()
        const memoryStats = memoryManager.getMemoryStats()
        analytics.memoryPerformance.currentUsage = memoryStats.totalMemoryUsage
      }

      return analytics
    } catch (error) {
      console.error('Failed to get performance analytics:', error)
      throw error
    }
  }

  /**
   * Shutdown the performance integration system
   */
  async shutdown(): Promise<void> {
    try {
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = undefined
      }

      // Stop performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        const monitor = getTourPerformanceMonitor()
        monitor.stopMonitoring()
      }

      // Cleanup memory manager
      if (this.config.enableMemoryManagement) {
        const memoryManager = getTourMemoryManager()
        memoryManager.destroy()
      }

      this.isInitialized = false
      console.log('Tour Performance Integration System shutdown completed')
    } catch (error) {
      console.error('Error during system shutdown:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */
  private async checkComponentHealth(): Promise<SystemHealth['components']> {
    const health: SystemHealth['components'] = {
      lazyLoading: 'healthy',
      bundleManagement: 'healthy',
      caching: 'healthy',
      memoryManagement: 'healthy',
      performanceMonitoring: 'healthy'
    }

    try {
      // Check lazy loading health
      if (this.config.enableLazyLoading) {
        const lazyLoader = getLazyTourLoader()
        const stats = lazyLoader.getCacheStats()
        if (stats.hitRate < 0.5) {
          health.lazyLoading = 'warning'
        }
      }

      // Check cache health
      if (this.config.enableAdvancedCaching) {
        const cache = getTourCacheStrategy()
        const cacheStats = cache.getStats()
        if (cacheStats.hitRate < 0.6) {
          health.caching = 'warning'
        }
      }

      // Check memory health
      if (this.config.enableMemoryManagement) {
        const memoryManager = getTourMemoryManager()
        const memoryStats = memoryManager.getMemoryStats()
        if (memoryStats.memoryPressure === 'high') {
          health.memoryManagement = 'error'
        } else if (memoryStats.memoryPressure === 'medium') {
          health.memoryManagement = 'warning'
        }
      }

      // Check performance monitoring health
      if (this.config.enablePerformanceMonitoring) {
        const monitor = getTourPerformanceMonitor()
        const summary = await monitor.getPerformanceSummary()
        if (summary.errorRate > 0.1) {
          health.performanceMonitoring = 'error'
        } else if (summary.averageStepRenderTime > 1000) {
          health.performanceMonitoring = 'warning'
        }
      }
    } catch (error) {
      console.warn('Error checking component health:', error)
    }

    return health
  }

  private async collectSystemMetrics(): Promise<SystemHealth['metrics']> {
    const metrics: SystemHealth['metrics'] = {
      averageLoadTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      errorRate: 0
    }

    try {
      if (this.config.enablePerformanceMonitoring) {
        const monitor = getTourPerformanceMonitor()
        const summary = await monitor.getPerformanceSummary()
        metrics.averageLoadTime = summary.averageStepRenderTime
        metrics.errorRate = summary.errorRate
      }

      if (this.config.enableAdvancedCaching) {
        const cache = getTourCacheStrategy()
        const cacheStats = cache.getStats()
        metrics.cacheHitRate = cacheStats.hitRate
      }

      if (this.config.enableMemoryManagement) {
        const memoryManager = getTourMemoryManager()
        const memoryStats = memoryManager.getMemoryStats()
        metrics.memoryUsage = memoryStats.totalMemoryUsage
      }
    } catch (error) {
      console.warn('Error collecting system metrics:', error)
    }

    return metrics
  }

  private calculateOverallHealth(
    components: SystemHealth['components'],
    metrics: SystemHealth['metrics']
  ): SystemHealth['overall'] {
    const componentValues = Object.values(components)
    const errorCount = componentValues.filter(status => status === 'error').length
    const warningCount = componentValues.filter(status => status === 'warning').length

    // Check critical metrics
    const criticalIssues = 
      metrics.errorRate > 0.1 || 
      metrics.averageLoadTime > 2000 ||
      metrics.memoryUsage > 100

    if (errorCount > 0 || criticalIssues) {
      return 'poor'
    } else if (warningCount > 2) {
      return 'fair'
    } else if (warningCount > 0) {
      return 'good'
    } else {
      return 'excellent'
    }
  }

  private generateHealthRecommendations(
    components: SystemHealth['components'],
    metrics: SystemHealth['metrics']
  ): string[] {
    const recommendations: string[] = []

    if (components.caching === 'warning') {
      recommendations.push('Improve cache hit rate by optimizing cache strategy')
    }

    if (components.memoryManagement === 'error') {
      recommendations.push('Critical: High memory usage detected - enable aggressive cleanup')
    }

    if (metrics.averageLoadTime > 1000) {
      recommendations.push('Optimize tour loading performance - consider lazy loading')
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push('Reduce tour error rate through better validation')
    }

    if (this.config.autoOptimize) {
      recommendations.push('Auto-optimization is enabled - system will self-optimize')
    }

    return recommendations
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth()
        
        if (health.overall === 'poor') {
          console.warn('Tour Performance System Health: POOR', health)
          
          if (this.config.autoOptimize) {
            console.log('Auto-optimization triggered due to poor health')
            await this.optimizeSystem()
          }
        } else if (health.overall === 'fair') {
          console.warn('Tour Performance System Health: FAIR', health.recommendations)
        }
      } catch (error) {
        console.error('Health monitoring error:', error)
      }
    }, this.config.monitoringInterval)
  }
}

/**
 * Convenience functions
 */
export function getTourPerformanceIntegration(config?: Partial<PerformanceIntegrationConfig>): TourPerformanceIntegration {
  return TourPerformanceIntegration.getInstance(config)
}

export async function initializeTourPerformance(config?: Partial<PerformanceIntegrationConfig>): Promise<void> {
  const integration = getTourPerformanceIntegration(config)
  await integration.initialize()
}

export async function loadTourWithFullOptimization(tourId: string, context?: LoadContext): Promise<TourDefinition> {
  const integration = getTourPerformanceIntegration()
  const result = await integration.loadTourOptimized(tourId, context)
  return result.tour
}

export async function optimizeTourSystem(): Promise<void> {
  const integration = getTourPerformanceIntegration()
  await integration.optimizeSystem()
}

export async function getTourSystemHealth(): Promise<SystemHealth> {
  const integration = getTourPerformanceIntegration()
  return integration.getSystemHealth()
}