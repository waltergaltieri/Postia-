/**
 * Tour bundle manager for code splitting and bundle optimization
 * Manages tour loading strategies and bundle size optimization
 */

import type { TourDefinition } from '@/types/tour'
import { getLazyTourLoader } from './lazy-tour-loader'

interface BundleConfig {
  id: string
  name: string
  tours: string[]
  priority: 'high' | 'medium' | 'low'
  loadStrategy: 'eager' | 'lazy' | 'on-demand'
  maxSize: number // in KB
}

interface BundleStats {
  bundleId: string
  size: number
  loadTime: number
  tours: string[]
  lastLoaded: Date
  loadCount: number
}

interface LoadStrategy {
  name: string
  shouldLoad: (context: LoadContext) => boolean
  priority: number
}

interface LoadContext {
  userRole?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  currentPage?: string
  userActivity?: 'new' | 'returning' | 'active'
  connectionSpeed?: 'slow' | 'fast'
}

/**
 * Tour bundle manager with intelligent loading strategies
 */
export class TourBundleManager {
  private static instance: TourBundleManager
  private bundles = new Map<string, BundleConfig>()
  private bundleStats = new Map<string, BundleStats>()
  private loadStrategies: LoadStrategy[] = []
  private loadedBundles = new Set<string>()

  private constructor() {
    this.initializeBundles()
    this.initializeLoadStrategies()
  }

  static getInstance(): TourBundleManager {
    if (!TourBundleManager.instance) {
      TourBundleManager.instance = new TourBundleManager()
    }
    return TourBundleManager.instance
  }

  /**
   * Initialize predefined tour bundles
   */
  private initializeBundles(): void {
    // Critical onboarding bundle - loaded eagerly
    this.bundles.set('onboarding-critical', {
      id: 'onboarding-critical',
      name: 'Critical Onboarding Tours',
      tours: ['welcome-tour'],
      priority: 'high',
      loadStrategy: 'eager',
      maxSize: 50 // 50KB
    })

    // Role-specific onboarding - loaded lazily based on user role
    this.bundles.set('onboarding-roles', {
      id: 'onboarding-roles',
      name: 'Role-specific Onboarding',
      tours: ['welcome-tour-admin', 'welcome-tour-editor'],
      priority: 'high',
      loadStrategy: 'lazy',
      maxSize: 100
    })

    // Mobile-specific tours
    this.bundles.set('mobile-tours', {
      id: 'mobile-tours',
      name: 'Mobile Optimized Tours',
      tours: ['welcome-tour-mobile', 'responsive-welcome-tour'],
      priority: 'medium',
      loadStrategy: 'lazy',
      maxSize: 75
    })

    // Content generation features
    this.bundles.set('content-features', {
      id: 'content-features',
      name: 'Content Generation Features',
      tours: ['content-generation-tour', 'content-optimization-tour', 'content-generation-quick'],
      priority: 'medium',
      loadStrategy: 'on-demand',
      maxSize: 150
    })

    // Campaign management features
    this.bundles.set('campaign-features', {
      id: 'campaign-features',
      name: 'Campaign Management Features',
      tours: ['campaign-management-tour', 'campaign-calendar-tour', 'client-switching-tour'],
      priority: 'medium',
      loadStrategy: 'on-demand',
      maxSize: 120
    })

    // Help and support tours
    this.bundles.set('help-support', {
      id: 'help-support',
      name: 'Help and Support Tours',
      tours: [], // Will be populated dynamically
      priority: 'low',
      loadStrategy: 'on-demand',
      maxSize: 80
    })
  }

  /**
   * Initialize intelligent loading strategies
   */
  private initializeLoadStrategies(): void {
    // New user strategy - prioritize onboarding
    this.loadStrategies.push({
      name: 'new-user',
      shouldLoad: (context) => context.userActivity === 'new',
      priority: 1
    })

    // Mobile user strategy
    this.loadStrategies.push({
      name: 'mobile-user',
      shouldLoad: (context) => context.deviceType === 'mobile',
      priority: 2
    })

    // Admin user strategy
    this.loadStrategies.push({
      name: 'admin-user',
      shouldLoad: (context) => context.userRole === 'admin',
      priority: 3
    })

    // Slow connection strategy - prioritize critical bundles
    this.loadStrategies.push({
      name: 'slow-connection',
      shouldLoad: (context) => context.connectionSpeed === 'slow',
      priority: 4
    })

    // Page-specific strategy
    this.loadStrategies.push({
      name: 'page-specific',
      shouldLoad: (context) => !!context.currentPage,
      priority: 5
    })
  }

  /**
   * Load bundles based on context and strategies
   */
  async loadBundlesForContext(context: LoadContext): Promise<TourDefinition[]> {
    const bundlesToLoad = this.determineBundlesToLoad(context)
    const loadedTours: TourDefinition[] = []

    // Load bundles in priority order
    const sortedBundles = bundlesToLoad.sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    for (const bundle of sortedBundles) {
      try {
        const tours = await this.loadBundle(bundle.id, context)
        loadedTours.push(...tours)
      } catch (error) {
        console.warn(`Failed to load bundle ${bundle.id}:`, error)
      }
    }

    return loadedTours
  }

  /**
   * Load a specific bundle
   */
  async loadBundle(bundleId: string, context?: LoadContext): Promise<TourDefinition[]> {
    const startTime = performance.now()
    const bundle = this.bundles.get(bundleId)
    
    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`)
    }

    // Check if already loaded
    if (this.loadedBundles.has(bundleId)) {
      const stats = this.bundleStats.get(bundleId)
      if (stats) {
        stats.loadCount++
        return [] // Already loaded, return empty array
      }
    }

    try {
      const loader = getLazyTourLoader()
      const results = await loader.loadTours(bundle.tours)
      const tours = Array.from(results.values()).map(result => result.tour)
      
      const loadTime = performance.now() - startTime
      
      // Record bundle stats
      this.bundleStats.set(bundleId, {
        bundleId,
        size: this.estimateBundleSize(tours),
        loadTime,
        tours: bundle.tours,
        lastLoaded: new Date(),
        loadCount: (this.bundleStats.get(bundleId)?.loadCount || 0) + 1
      })

      this.loadedBundles.add(bundleId)
      
      console.log(`Loaded bundle ${bundleId} with ${tours.length} tours in ${loadTime.toFixed(2)}ms`)
      
      return tours
    } catch (error) {
      throw new Error(`Failed to load bundle ${bundleId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Preload critical bundles
   */
  async preloadCriticalBundles(context?: LoadContext): Promise<void> {
    const criticalBundles = Array.from(this.bundles.values())
      .filter(bundle => bundle.priority === 'high' || bundle.loadStrategy === 'eager')

    const loadPromises = criticalBundles.map(bundle => 
      this.loadBundle(bundle.id, context).catch(error => {
        console.warn(`Failed to preload critical bundle ${bundle.id}:`, error)
      })
    )

    await Promise.all(loadPromises)
  }

  /**
   * Load bundles on demand based on user interaction
   */
  async loadOnDemandBundle(feature: string, context?: LoadContext): Promise<TourDefinition[]> {
    const bundleMap: Record<string, string> = {
      'content-generation': 'content-features',
      'campaign-management': 'campaign-features',
      'help': 'help-support'
    }

    const bundleId = bundleMap[feature]
    if (!bundleId) {
      console.warn(`No bundle found for feature: ${feature}`)
      return []
    }

    return this.loadBundle(bundleId, context)
  }

  /**
   * Get bundle loading recommendations
   */
  getBundleRecommendations(context: LoadContext): {
    immediate: string[]
    deferred: string[]
    onDemand: string[]
  } {
    const immediate: string[] = []
    const deferred: string[] = []
    const onDemand: string[] = []

    for (const bundle of this.bundles.values()) {
      const shouldLoad = this.shouldLoadBundle(bundle, context)
      
      if (bundle.loadStrategy === 'eager' || (shouldLoad && bundle.priority === 'high')) {
        immediate.push(bundle.id)
      } else if (bundle.loadStrategy === 'lazy' && shouldLoad) {
        deferred.push(bundle.id)
      } else {
        onDemand.push(bundle.id)
      }
    }

    return { immediate, deferred, onDemand }
  }

  /**
   * Optimize bundle loading based on performance metrics
   */
  async optimizeBundleLoading(): Promise<void> {
    const stats = Array.from(this.bundleStats.values())
    
    // Identify slow-loading bundles
    const slowBundles = stats.filter(stat => stat.loadTime > 1000) // > 1 second
    
    for (const stat of slowBundles) {
      const bundle = this.bundles.get(stat.bundleId)
      if (bundle && bundle.tours.length > 3) {
        // Split large bundles
        await this.splitBundle(bundle)
      }
    }

    // Identify frequently accessed bundles for preloading
    const frequentBundles = stats
      .filter(stat => stat.loadCount > 5)
      .sort((a, b) => b.loadCount - a.loadCount)
      .slice(0, 3)

    for (const stat of frequentBundles) {
      const bundle = this.bundles.get(stat.bundleId)
      if (bundle && bundle.loadStrategy !== 'eager') {
        console.log(`Promoting bundle ${bundle.id} to eager loading due to frequent access`)
        bundle.loadStrategy = 'eager'
      }
    }
  }

  /**
   * Get bundle statistics
   */
  getBundleStats(): {
    totalBundles: number
    loadedBundles: number
    averageLoadTime: number
    totalSize: number
    bundleDetails: BundleStats[]
  } {
    const stats = Array.from(this.bundleStats.values())
    const totalSize = stats.reduce((sum, stat) => sum + stat.size, 0)
    const averageLoadTime = stats.length > 0 
      ? stats.reduce((sum, stat) => sum + stat.loadTime, 0) / stats.length 
      : 0

    return {
      totalBundles: this.bundles.size,
      loadedBundles: this.loadedBundles.size,
      averageLoadTime,
      totalSize,
      bundleDetails: stats
    }
  }

  /**
   * Clear bundle cache
   */
  clearBundleCache(bundleIds?: string[]): void {
    if (bundleIds) {
      bundleIds.forEach(id => {
        this.loadedBundles.delete(id)
        this.bundleStats.delete(id)
      })
    } else {
      this.loadedBundles.clear()
      this.bundleStats.clear()
    }
  }

  /**
   * Register a custom bundle
   */
  registerBundle(config: BundleConfig): void {
    this.bundles.set(config.id, config)
  }

  /**
   * Private helper methods
   */
  private determineBundlesToLoad(context: LoadContext): BundleConfig[] {
    const bundles: BundleConfig[] = []
    
    for (const bundle of this.bundles.values()) {
      if (this.shouldLoadBundle(bundle, context)) {
        bundles.push(bundle)
      }
    }

    return bundles
  }

  private shouldLoadBundle(bundle: BundleConfig, context: LoadContext): boolean {
    // Always load eager bundles
    if (bundle.loadStrategy === 'eager') {
      return true
    }

    // Check load strategies
    for (const strategy of this.loadStrategies) {
      if (strategy.shouldLoad(context)) {
        // Apply strategy-specific logic
        switch (strategy.name) {
          case 'new-user':
            return bundle.id.includes('onboarding')
          case 'mobile-user':
            return bundle.id.includes('mobile') || bundle.priority === 'high'
          case 'admin-user':
            return bundle.tours.some(tour => tour.includes('admin')) || bundle.priority === 'high'
          case 'slow-connection':
            return bundle.priority === 'high' && bundle.maxSize < 100
          case 'page-specific':
            return this.isRelevantToPage(bundle, context.currentPage || '')
        }
      }
    }

    return false
  }

  private isRelevantToPage(bundle: BundleConfig, currentPage: string): boolean {
    const pageMapping: Record<string, string[]> = {
      '/content': ['content-features'],
      '/campaigns': ['campaign-features'],
      '/dashboard': ['onboarding-critical'],
      '/help': ['help-support']
    }

    const relevantBundles = pageMapping[currentPage] || []
    return relevantBundles.includes(bundle.id)
  }

  private estimateBundleSize(tours: TourDefinition[]): number {
    // Rough estimation: 5KB per tour + 2KB per step
    return tours.reduce((size, tour) => {
      return size + 5 + (tour.steps.length * 2)
    }, 0)
  }

  private async splitBundle(bundle: BundleConfig): Promise<void> {
    if (bundle.tours.length <= 2) return

    const midpoint = Math.ceil(bundle.tours.length / 2)
    const firstHalf = bundle.tours.slice(0, midpoint)
    const secondHalf = bundle.tours.slice(midpoint)

    // Create two smaller bundles
    const bundle1: BundleConfig = {
      ...bundle,
      id: `${bundle.id}-part1`,
      name: `${bundle.name} (Part 1)`,
      tours: firstHalf,
      maxSize: bundle.maxSize / 2
    }

    const bundle2: BundleConfig = {
      ...bundle,
      id: `${bundle.id}-part2`,
      name: `${bundle.name} (Part 2)`,
      tours: secondHalf,
      maxSize: bundle.maxSize / 2
    }

    this.bundles.set(bundle1.id, bundle1)
    this.bundles.set(bundle2.id, bundle2)
    this.bundles.delete(bundle.id)

    console.log(`Split bundle ${bundle.id} into ${bundle1.id} and ${bundle2.id}`)
  }
}

/**
 * Convenience functions
 */
export function getTourBundleManager(): TourBundleManager {
  return TourBundleManager.getInstance()
}

export async function loadBundlesForUser(context: LoadContext): Promise<TourDefinition[]> {
  const manager = getTourBundleManager()
  return manager.loadBundlesForContext(context)
}

export async function preloadCriticalTours(context?: LoadContext): Promise<void> {
  const manager = getTourBundleManager()
  return manager.preloadCriticalBundles(context)
}

export async function loadFeatureTours(feature: string, context?: LoadContext): Promise<TourDefinition[]> {
  const manager = getTourBundleManager()
  return manager.loadOnDemandBundle(feature, context)
}

export function getBundleLoadingRecommendations(context: LoadContext) {
  const manager = getTourBundleManager()
  return manager.getBundleRecommendations(context)
}