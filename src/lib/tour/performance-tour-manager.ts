/**
 * Performance-optimized tour manager that integrates lazy loading, caching, and bundle management
 * Main entry point for all performance-optimized tour operations
 */

import type { TourDefinition } from '@/types/tour'
import { getLazyTourLoader } from './lazy-tour-loader'
import { getTourBundleManager, type LoadContext } from './tour-bundle-manager'
import { getTourCacheStrategy } from './tour-cache-strategy'

interface PerformanceConfig {
  enableLazyLoading: boolean
  enableBundleManagement: boolean
  enableAdvancedCaching: boolean
  preloadStrategy: 'aggressive' | 'conservative' | 'adaptive'
  performanceMonitoring: boolean
}

interface LoadResult {
  tour: TourDefinition
  loadTime: number
  source: 'cache' | 'bundle' | 'lazy' | 'network'
  bundleInfo?: {
    bundleId: string
    bundleSize: number
    toursInBundle: number
  }
}

interface PerformanceMetrics {
  totalLoads: number
  averageLoadTime: number
  cacheHitRate: number
  bundleEfficiency: number
  memoryUsage: number
  networkRequests: number
}

/**
 * High-performance tour manager with intelligent loading strategies
 */
export class PerformanceTourManager {
  private static instance: PerformanceTourManager
  private config: PerformanceConfig
  private metrics: PerformanceMetrics = {
    totalLoads: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    bundleEfficiency: 0,
    memoryUsage: 0,
    networkRequests: 0
  }
  private loadHistory: Array<{ tourId: string; loadTime: number; source: string; timestamp: Date }> = []

  private constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableLazyLoading: true,
      enableBundleManagement: true,
      enableAdvancedCaching: true,
      preloadStrategy: 'adaptive',
      performanceMonitoring: true,
      ...config
    }

    this.initializePerformanceMonitoring()
  }

  static getInstance(config?: Partial<PerformanceConfig>): PerformanceTourManager {
    if (!PerformanceTourManager.instance) {
      PerformanceTourManager.instance = new PerformanceTourManager(config)
    }
    return PerformanceTourManager.instance
  }

  /**
   * Load a single tour with optimal performance strategy
   */
  async loadTour(tourId: string, context?: LoadContext): Promise<LoadResult> {
    const startTime = performance.now()
    let source: LoadResult['source'] = 'network'
    let bundleInfo: LoadResult['bundleInfo'] | undefined

    try {
      // Strategy 1: Try cache first if enabled
      if (this.config.enableAdvancedCaching) {
        const cache = getTourCacheStrategy()
        const cached = await cache.get(tourId)
        
        if (cached) {
          const loadTime = performance.now() - startTime
          this.recordLoad(tourId, loadTime, 'cache')
          
          return {
            tour: cached,
            loadTime,
            source: 'cache'
          }
        }
      }

      // Strategy 2: Try bundle loading if enabled
      if (this.config.enableBundleManagement && context) {
        const bundleManager = getTourBundleManager()
        const recommendations = bundleManager.getBundleRecommendations(context)
        
        // Check if tour is in any recommended bundle
        for (const bundleId of [...recommendations.immediate, ...recommendations.deferred]) {
          try {
            const bundleTours = await bundleManager.loadBundle(bundleId, context)
            const tour = bundleTours.find(t => t.id === tourId)
            
            if (tour) {
              const loadTime = performance.now() - startTime
              source = 'bundle'
              bundleInfo = {
                bundleId,
                bundleSize: this.estimateBundleSize(bundleTours),
                toursInBundle: bundleTours.length
              }

              // Cache the tour for future use
              if (this.config.enableAdvancedCaching) {
                const cache = getTourCacheStrategy()
                await cache.set(tourId, tour, 'high')
              }

              this.recordLoad(tourId, loadTime, 'bundle')
              
              return {
                tour,
                loadTime,
                source,
                bundleInfo
              }
            }
          } catch (error) {
            console.warn(`Failed to load bundle ${bundleId}:`, error)
          }
        }
      }

      // Strategy 3: Fall back to lazy loading
      if (this.config.enableLazyLoading) {
        const lazyLoader = getLazyTourLoader()
        const result = await lazyLoader.loadTour(tourId)
        
        const loadTime = performance.now() - startTime
        source = 'lazy'

        // Cache the tour
        if (this.config.enableAdvancedCaching) {
          const cache = getTourCacheStrategy()
          await cache.set(tourId, result.tour, 'medium')
        }

        this.recordLoad(tourId, loadTime, 'lazy')
        
        return {
          tour: result.tour,
          loadTime,
          source
        }
      }

      throw new Error('All loading strategies disabled or failed')
      
    } catch (error) {
      const loadTime = performance.now() - startTime
      this.recordLoad(tourId, loadTime, 'error')
      throw new Error(`Failed to load tour ${tourId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load multiple tours with intelligent batching and optimization
   */
  async loadTours(tourIds: string[], context?: LoadContext): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>()
    
    // Group tours for optimal loading
    const { cached, bundled, individual } = await this.categorizeTours(tourIds, context)
    
    // Load cached tours first (fastest)
    if (cached.length > 0 && this.config.enableAdvancedCaching) {
      const cacheResults = await this.loadCachedTours(cached)
      cacheResults.forEach((result, tourId) => results.set(tourId, result))
    }

    // Load bundled tours (efficient)
    if (bundled.size > 0 && this.config.enableBundleManagement && context) {
      const bundleResults = await this.loadBundledTours(bundled, context)
      bundleResults.forEach((result, tourId) => results.set(tourId, result))
    }

    // Load individual tours (fallback)
    if (individual.length > 0) {
      const individualResults = await this.loadIndividualTours(individual, context)
      individualResults.forEach((result, tourId) => results.set(tourId, result))
    }

    return results
  }

  /**
   * Initialize tours for a user context with optimal preloading
   */
  async initializeForContext(context: LoadContext): Promise<{
    preloaded: TourDefinition[]
    recommendations: string[]
    estimatedSavings: number
  }> {
    const startTime = performance.now()
    const preloaded: TourDefinition[] = []
    let recommendations: string[] = []

    try {
      // Get loading recommendations
      if (this.config.enableBundleManagement) {
        const bundleManager = getTourBundleManager()
        const bundleRecommendations = bundleManager.getBundleRecommendations(context)
        recommendations = [...bundleRecommendations.immediate, ...bundleRecommendations.deferred]

        // Preload critical bundles
        const criticalTours = await bundleManager.loadBundlesForContext(context)
        preloaded.push(...criticalTours)
      }

      // Apply preload strategy
      await this.applyPreloadStrategy(context, preloaded)

      const loadTime = performance.now() - startTime
      const estimatedSavings = this.calculateEstimatedSavings(preloaded.length, loadTime)

      return {
        preloaded,
        recommendations,
        estimatedSavings
      }
    } catch (error) {
      console.warn('Failed to initialize tours for context:', error)
      return {
        preloaded: [],
        recommendations: [],
        estimatedSavings: 0
      }
    }
  }

  /**
   * Optimize performance based on usage patterns
   */
  async optimizePerformance(): Promise<{
    cacheOptimized: boolean
    bundlesOptimized: boolean
    strategyAdjusted: boolean
    performanceGain: number
  }> {
    const beforeMetrics = { ...this.metrics }
    let cacheOptimized = false
    let bundlesOptimized = false
    let strategyAdjusted = false

    try {
      // Optimize cache
      if (this.config.enableAdvancedCaching) {
        const cache = getTourCacheStrategy()
        await cache.optimize()
        cacheOptimized = true
      }

      // Optimize bundles
      if (this.config.enableBundleManagement) {
        const bundleManager = getTourBundleManager()
        await bundleManager.optimizeBundleLoading()
        bundlesOptimized = true
      }

      // Adjust strategy based on performance
      strategyAdjusted = this.adjustStrategy()

      // Calculate performance gain
      await this.updateMetrics()
      const performanceGain = this.calculatePerformanceGain(beforeMetrics, this.metrics)

      return {
        cacheOptimized,
        bundlesOptimized,
        strategyAdjusted,
        performanceGain
      }
    } catch (error) {
      console.warn('Failed to optimize performance:', error)
      return {
        cacheOptimized: false,
        bundlesOptimized: false,
        strategyAdjusted: false,
        performanceGain: 0
      }
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics & {
    recentLoads: Array<{ tourId: string; loadTime: number; source: string }>
    recommendations: string[]
  }> {
    await this.updateMetrics()
    
    const recentLoads = this.loadHistory
      .slice(-10)
      .map(({ tourId, loadTime, source }) => ({ tourId, loadTime, source }))

    const recommendations = this.generatePerformanceRecommendations()

    return {
      ...this.metrics,
      recentLoads,
      recommendations
    }
  }

  /**
   * Clear all caches and reset performance state
   */
  async clearPerformanceCache(): Promise<void> {
    if (this.config.enableAdvancedCaching) {
      const cache = getTourCacheStrategy()
      cache.invalidate('all')
    }

    if (this.config.enableBundleManagement) {
      const bundleManager = getTourBundleManager()
      bundleManager.clearBundleCache()
    }

    if (this.config.enableLazyLoading) {
      const lazyLoader = getLazyTourLoader()
      lazyLoader.clearCache()
    }

    this.loadHistory = []
    this.metrics = {
      totalLoads: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      bundleEfficiency: 0,
      memoryUsage: 0,
      networkRequests: 0
    }
  }

  /**
   * Private helper methods
   */
  private async categorizeTours(tourIds: string[], context?: LoadContext): Promise<{
    cached: string[]
    bundled: Map<string, string[]>
    individual: string[]
  }> {
    const cached: string[] = []
    const bundled = new Map<string, string[]>()
    const individual: string[] = []

    // Check cache first
    if (this.config.enableAdvancedCaching) {
      const cache = getTourCacheStrategy()
      for (const tourId of tourIds) {
        const cachedTour = await cache.get(tourId)
        if (cachedTour) {
          cached.push(tourId)
        }
      }
    }

    // Check bundles for remaining tours
    const remaining = tourIds.filter(id => !cached.includes(id))
    
    if (this.config.enableBundleManagement && context && remaining.length > 0) {
      const bundleManager = getTourBundleManager()
      const recommendations = bundleManager.getBundleRecommendations(context)
      
      // This is a simplified categorization - in a real implementation,
      // you'd need to check which tours are actually in which bundles
      for (const tourId of remaining) {
        // For now, assume tours can be bundled if there are recommendations
        if (recommendations.immediate.length > 0 || recommendations.deferred.length > 0) {
          const bundleId = recommendations.immediate[0] || recommendations.deferred[0]
          const bundleTours = bundled.get(bundleId) || []
          bundleTours.push(tourId)
          bundled.set(bundleId, bundleTours)
        } else {
          individual.push(tourId)
        }
      }
    } else {
      individual.push(...remaining)
    }

    return { cached, bundled, individual }
  }

  private async loadCachedTours(tourIds: string[]): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>()
    const cache = getTourCacheStrategy()

    for (const tourId of tourIds) {
      const startTime = performance.now()
      const tour = await cache.get(tourId)
      
      if (tour) {
        const loadTime = performance.now() - startTime
        this.recordLoad(tourId, loadTime, 'cache')
        
        results.set(tourId, {
          tour,
          loadTime,
          source: 'cache'
        })
      }
    }

    return results
  }

  private async loadBundledTours(bundled: Map<string, string[]>, context: LoadContext): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>()
    const bundleManager = getTourBundleManager()

    for (const [bundleId, tourIds] of bundled.entries()) {
      try {
        const startTime = performance.now()
        const bundleTours = await bundleManager.loadBundle(bundleId, context)
        const loadTime = performance.now() - startTime

        const bundleInfo = {
          bundleId,
          bundleSize: this.estimateBundleSize(bundleTours),
          toursInBundle: bundleTours.length
        }

        for (const tourId of tourIds) {
          const tour = bundleTours.find(t => t.id === tourId)
          if (tour) {
            this.recordLoad(tourId, loadTime / bundleTours.length, 'bundle')
            
            results.set(tourId, {
              tour,
              loadTime: loadTime / bundleTours.length,
              source: 'bundle',
              bundleInfo
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to load bundle ${bundleId}:`, error)
      }
    }

    return results
  }

  private async loadIndividualTours(tourIds: string[], context?: LoadContext): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>()
    
    const loadPromises = tourIds.map(async (tourId) => {
      try {
        const result = await this.loadTour(tourId, context)
        return [tourId, result] as [string, LoadResult]
      } catch (error) {
        console.warn(`Failed to load individual tour ${tourId}:`, error)
        return null
      }
    })

    const loadResults = await Promise.all(loadPromises)
    
    for (const result of loadResults) {
      if (result) {
        results.set(result[0], result[1])
      }
    }

    return results
  }

  private async applyPreloadStrategy(context: LoadContext, preloaded: TourDefinition[]): Promise<void> {
    switch (this.config.preloadStrategy) {
      case 'aggressive':
        await this.aggressivePreload(context)
        break
      case 'conservative':
        await this.conservativePreload(context)
        break
      case 'adaptive':
        await this.adaptivePreload(context, preloaded)
        break
    }
  }

  private async aggressivePreload(context: LoadContext): Promise<void> {
    // Preload all high-priority bundles
    if (this.config.enableBundleManagement) {
      const bundleManager = getTourBundleManager()
      await bundleManager.preloadCriticalBundles(context)
    }

    // Preload frequently accessed tours
    if (this.config.enableLazyLoading) {
      const lazyLoader = getLazyTourLoader()
      await lazyLoader.preloadFrequentTours()
    }
  }

  private async conservativePreload(context: LoadContext): Promise<void> {
    // Only preload critical onboarding tours
    if (this.config.enableBundleManagement) {
      const bundleManager = getTourBundleManager()
      const recommendations = bundleManager.getBundleRecommendations(context)
      
      if (recommendations.immediate.length > 0) {
        await bundleManager.loadBundle(recommendations.immediate[0], context)
      }
    }
  }

  private async adaptivePreload(context: LoadContext, preloaded: TourDefinition[]): Promise<void> {
    // Adapt based on current performance metrics
    if (this.metrics.cacheHitRate > 0.8) {
      // High cache hit rate - can be more aggressive
      await this.aggressivePreload(context)
    } else if (this.metrics.averageLoadTime > 1000) {
      // Slow loading - be conservative
      await this.conservativePreload(context)
    } else {
      // Balanced approach
      if (preloaded.length < 5) {
        await this.conservativePreload(context)
      }
    }
  }

  private recordLoad(tourId: string, loadTime: number, source: string): void {
    this.loadHistory.push({
      tourId,
      loadTime,
      source,
      timestamp: new Date()
    })

    // Keep only last 100 loads
    if (this.loadHistory.length > 100) {
      this.loadHistory = this.loadHistory.slice(-100)
    }

    this.metrics.totalLoads++
    this.metrics.averageLoadTime = 
      ((this.metrics.averageLoadTime * (this.metrics.totalLoads - 1)) + loadTime) / this.metrics.totalLoads
  }

  private async updateMetrics(): Promise<void> {
    // Update cache hit rate
    if (this.config.enableAdvancedCaching) {
      const cache = getTourCacheStrategy()
      const cacheStats = cache.getStats()
      this.metrics.cacheHitRate = cacheStats.hitRate
    }

    // Update bundle efficiency
    if (this.config.enableBundleManagement) {
      const bundleManager = getTourBundleManager()
      const bundleStats = bundleManager.getBundleStats()
      this.metrics.bundleEfficiency = bundleStats.loadedBundles / bundleStats.totalBundles
    }

    // Estimate memory usage
    this.metrics.memoryUsage = this.estimateMemoryUsage()

    // Count network requests (simplified)
    this.metrics.networkRequests = this.loadHistory.filter(load => 
      load.source === 'lazy' || load.source === 'network'
    ).length
  }

  private estimateBundleSize(tours: TourDefinition[]): number {
    return tours.reduce((size, tour) => {
      return size + JSON.stringify(tour).length
    }, 0)
  }

  private estimateMemoryUsage(): number {
    // Simplified memory usage estimation
    return this.loadHistory.length * 100 // 100 bytes per load record
  }

  private calculateEstimatedSavings(preloadedCount: number, loadTime: number): number {
    // Estimate time savings from preloading
    const averageLoadTime = this.metrics.averageLoadTime || 500
    return preloadedCount * averageLoadTime - loadTime
  }

  private calculatePerformanceGain(before: PerformanceMetrics, after: PerformanceMetrics): number {
    const loadTimeImprovement = (before.averageLoadTime - after.averageLoadTime) / before.averageLoadTime
    const cacheImprovement = after.cacheHitRate - before.cacheHitRate
    
    return (loadTimeImprovement + cacheImprovement) * 100 // Percentage improvement
  }

  private adjustStrategy(): boolean {
    // Adjust strategy based on performance metrics
    if (this.metrics.cacheHitRate < 0.5 && this.config.preloadStrategy !== 'aggressive') {
      this.config.preloadStrategy = 'aggressive'
      return true
    }
    
    if (this.metrics.averageLoadTime > 2000 && this.config.preloadStrategy !== 'conservative') {
      this.config.preloadStrategy = 'conservative'
      return true
    }

    return false
  }

  private generatePerformanceRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.metrics.cacheHitRate < 0.6) {
      recommendations.push('Consider increasing cache size or TTL')
    }

    if (this.metrics.averageLoadTime > 1000) {
      recommendations.push('Enable more aggressive preloading')
    }

    if (this.metrics.bundleEfficiency < 0.5) {
      recommendations.push('Optimize bundle configuration')
    }

    if (this.metrics.networkRequests > this.metrics.totalLoads * 0.3) {
      recommendations.push('Improve caching strategy')
    }

    return recommendations
  }

  private initializePerformanceMonitoring(): void {
    if (!this.config.performanceMonitoring) return

    // Monitor performance every minute
    setInterval(async () => {
      await this.updateMetrics()
      
      // Log performance warnings
      if (this.metrics.averageLoadTime > 2000) {
        console.warn('Tour loading performance degraded:', this.metrics)
      }
    }, 60000)
  }
}

/**
 * Convenience functions
 */
export function getPerformanceTourManager(config?: Partial<PerformanceConfig>): PerformanceTourManager {
  return PerformanceTourManager.getInstance(config)
}

export async function loadTourOptimized(tourId: string, context?: LoadContext): Promise<TourDefinition> {
  const manager = getPerformanceTourManager()
  const result = await manager.loadTour(tourId, context)
  return result.tour
}

export async function initializeToursForUser(context: LoadContext): Promise<TourDefinition[]> {
  const manager = getPerformanceTourManager()
  const result = await manager.initializeForContext(context)
  return result.preloaded
}

export async function optimizeTourPerformance(): Promise<void> {
  const manager = getPerformanceTourManager()
  await manager.optimizePerformance()
}

export async function getTourPerformanceMetrics(): Promise<PerformanceMetrics> {
  const manager = getPerformanceTourManager()
  const metrics = await manager.getPerformanceMetrics()
  return metrics
}