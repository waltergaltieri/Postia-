/**
 * Lazy loading system for tour configurations with code splitting and caching
 * Implements dynamic imports and performance optimizations for tour management
 */

import type { TourDefinition } from '@/types/tour'
import { validateTourDefinition } from './tour-config'

interface TourCacheEntry {
  tour: TourDefinition
  timestamp: number
  accessCount: number
  lastAccessed: number
}

interface TourLoadStats {
  loadTime: number
  fromCache: boolean
  cacheHit: boolean
  bundleSize?: number
}

interface TourCategory {
  id: string
  name: string
  tours: string[]
  priority: number
  preloadThreshold: number
}

/**
 * Lazy tour configuration loader with advanced caching and code splitting
 */
export class LazyTourLoader {
  private static instance: LazyTourLoader
  private tourCache = new Map<string, TourCacheEntry>()
  private loadingPromises = new Map<string, Promise<TourDefinition>>()
  private categoryCache = new Map<string, TourDefinition[]>()
  private loadStats = new Map<string, TourLoadStats[]>()
  
  // Cache configuration
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly MAX_CACHE_SIZE = 50
  private readonly PRELOAD_THRESHOLD = 3 // Access count threshold for preloading
  
  // Tour categories for code splitting
  private readonly tourCategories: Map<string, TourCategory> = new Map([
    ['onboarding', {
      id: 'onboarding',
      name: 'Onboarding Tours',
      tours: ['welcome-tour', 'welcome-tour-admin', 'welcome-tour-editor', 'welcome-tour-mobile'],
      priority: 1,
      preloadThreshold: 1
    }],
    ['content', {
      id: 'content',
      name: 'Content Generation Tours',
      tours: ['content-generation-tour', 'content-optimization-tour', 'content-generation-quick'],
      priority: 2,
      preloadThreshold: 2
    }],
    ['campaign', {
      id: 'campaign',
      name: 'Campaign Management Tours',
      tours: ['campaign-management-tour', 'campaign-calendar-tour', 'client-switching-tour'],
      priority: 3,
      preloadThreshold: 2
    }],
    ['help', {
      id: 'help',
      name: 'Help and Support Tours',
      tours: [],
      priority: 4,
      preloadThreshold: 5
    }]
  ])

  private constructor() {
    this.setupCacheCleanup()
  }

  static getInstance(): LazyTourLoader {
    if (!LazyTourLoader.instance) {
      LazyTourLoader.instance = new LazyTourLoader()
    }
    return LazyTourLoader.instance
  }

  /**
   * Load a single tour with lazy loading and caching
   */
  async loadTour(tourId: string): Promise<{ tour: TourDefinition; stats: TourLoadStats }> {
    const startTime = performance.now()

    // Check cache first
    const cached = this.getCachedTour(tourId)
    if (cached) {
      this.updateAccessStats(tourId)
      return {
        tour: cached,
        stats: {
          loadTime: performance.now() - startTime,
          fromCache: true,
          cacheHit: true
        }
      }
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(tourId)
    if (existingPromise) {
      const tour = await existingPromise
      return {
        tour,
        stats: {
          loadTime: performance.now() - startTime,
          fromCache: false,
          cacheHit: false
        }
      }
    }

    // Start loading
    const loadPromise = this.performLazyLoad(tourId)
    this.loadingPromises.set(tourId, loadPromise)

    try {
      const tour = await loadPromise
      const loadTime = performance.now() - startTime
      
      // Cache the result
      this.setCachedTour(tourId, tour)
      
      // Record stats
      this.recordLoadStats(tourId, {
        loadTime,
        fromCache: false,
        cacheHit: false
      })

      // Check if we should preload related tours
      this.considerPreloading(tourId)

      return {
        tour,
        stats: {
          loadTime,
          fromCache: false,
          cacheHit: false
        }
      }
    } finally {
      this.loadingPromises.delete(tourId)
    }
  }

  /**
   * Load multiple tours in parallel with intelligent batching
   */
  async loadTours(tourIds: string[]): Promise<Map<string, { tour: TourDefinition; stats: TourLoadStats }>> {
    const results = new Map<string, { tour: TourDefinition; stats: TourLoadStats }>()
    
    // Group tours by category for efficient loading
    const toursByCategory = this.groupToursByCategory(tourIds)
    
    // Load each category in parallel
    const categoryPromises = Array.from(toursByCategory.entries()).map(async ([category, tours]) => {
      const categoryResults = await Promise.allSettled(
        tours.map(tourId => this.loadTour(tourId))
      )
      
      categoryResults.forEach((result, index) => {
        const tourId = tours[index]
        if (result.status === 'fulfilled') {
          results.set(tourId, result.value)
        } else {
          console.warn(`Failed to load tour ${tourId}:`, result.reason)
        }
      })
    })

    await Promise.all(categoryPromises)
    return results
  }

  /**
   * Load tours by category with code splitting
   */
  async loadTourCategory(categoryId: string): Promise<TourDefinition[]> {
    // Check category cache
    const cached = this.categoryCache.get(categoryId)
    if (cached) {
      return cached
    }

    const category = this.tourCategories.get(categoryId)
    if (!category) {
      throw new Error(`Unknown tour category: ${categoryId}`)
    }

    // Load all tours in the category
    const tourResults = await this.loadTours(category.tours)
    const tours = Array.from(tourResults.values()).map(result => result.tour)
    
    // Cache the category
    this.categoryCache.set(categoryId, tours)
    
    return tours
  }

  /**
   * Preload frequently accessed tours
   */
  async preloadFrequentTours(): Promise<void> {
    const frequentTours = this.getFrequentlyAccessedTours()
    
    if (frequentTours.length > 0) {
      console.log(`Preloading ${frequentTours.length} frequently accessed tours`)
      await this.loadTours(frequentTours)
    }
  }

  /**
   * Preload tours by category based on priority
   */
  async preloadToursByPriority(): Promise<void> {
    const sortedCategories = Array.from(this.tourCategories.values())
      .sort((a, b) => a.priority - b.priority)

    for (const category of sortedCategories) {
      if (category.priority <= 2) { // Only preload high priority categories
        try {
          await this.loadTourCategory(category.id)
          console.log(`Preloaded category: ${category.name}`)
        } catch (error) {
          console.warn(`Failed to preload category ${category.id}:`, error)
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    averageLoadTime: number
    mostAccessed: Array<{ tourId: string; accessCount: number }>
  } {
    const totalLoads = Array.from(this.loadStats.values()).reduce((sum, stats) => sum + stats.length, 0)
    const cacheHits = Array.from(this.loadStats.values()).reduce(
      (sum, stats) => sum + stats.filter(s => s.cacheHit).length, 0
    )
    
    const allLoadTimes = Array.from(this.loadStats.values()).flat().map(s => s.loadTime)
    const averageLoadTime = allLoadTimes.length > 0 
      ? allLoadTimes.reduce((sum, time) => sum + time, 0) / allLoadTimes.length 
      : 0

    const mostAccessed = Array.from(this.tourCache.entries())
      .map(([tourId, entry]) => ({ tourId, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)

    return {
      size: this.tourCache.size,
      hitRate: totalLoads > 0 ? cacheHits / totalLoads : 0,
      averageLoadTime,
      mostAccessed
    }
  }

  /**
   * Clear cache with optional selective clearing
   */
  clearCache(tourIds?: string[]): void {
    if (tourIds) {
      tourIds.forEach(id => {
        this.tourCache.delete(id)
        this.loadStats.delete(id)
      })
    } else {
      this.tourCache.clear()
      this.categoryCache.clear()
      this.loadStats.clear()
    }
  }

  /**
   * Perform the actual lazy loading with dynamic imports
   */
  private async performLazyLoad(tourId: string): Promise<TourDefinition> {
    try {
      // Dynamic import based on tour ID
      const configModule = await this.dynamicImportTour(tourId)
      const configData = configModule.default || configModule
      
      // Validate the configuration
      const tour = validateTourDefinition(configData)
      
      // Ensure tour ID matches
      if (tour.id !== tourId) {
        throw new Error(`Tour ID mismatch: expected ${tourId}, got ${tour.id}`)
      }
      
      return tour
    } catch (error) {
      throw new Error(`Failed to load tour ${tourId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Dynamic import with code splitting
   */
  private async dynamicImportTour(tourId: string): Promise<any> {
    // Map tour IDs to their import paths for code splitting
    const importMap: Record<string, () => Promise<any>> = {
      // Onboarding tours - Bundle 1
      'welcome-tour': () => import('./configs/welcome-tour.json'),
      'welcome-tour-admin': () => import('./configs/welcome-tour-admin.json'),
      'welcome-tour-editor': () => import('./configs/welcome-tour-editor.json'),
      'welcome-tour-mobile': () => import('./configs/welcome-tour-mobile.json'),
      
      // Content generation tours - Bundle 2
      'content-generation-tour': () => import('./configs/content-generation-tour.json'),
      'content-optimization-tour': () => import('./configs/content-optimization-tour.json'),
      'content-generation-quick': () => import('./configs/content-generation-quick.json'),
      
      // Campaign management tours - Bundle 3
      'campaign-management-tour': () => import('./configs/campaign-management-tour.json'),
      'campaign-calendar-tour': () => import('./configs/campaign-calendar-tour.json'),
      'client-switching-tour': () => import('./configs/client-switching-tour.json'),
      
      // Responsive tours
      'responsive-welcome-tour': () => import('./configs/responsive-welcome-tour.json'),
    }

    const importFn = importMap[tourId]
    if (!importFn) {
      throw new Error(`No import configuration found for tour: ${tourId}`)
    }

    return await importFn()
  }

  /**
   * Cache management
   */
  private getCachedTour(tourId: string): TourDefinition | null {
    const entry = this.tourCache.get(tourId)
    if (!entry) return null

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.tourCache.delete(tourId)
      return null
    }

    return entry.tour
  }

  private setCachedTour(tourId: string, tour: TourDefinition): void {
    // Implement LRU eviction if cache is full
    if (this.tourCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed()
    }

    this.tourCache.set(tourId, {
      tour,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    })
  }

  private updateAccessStats(tourId: string): void {
    const entry = this.tourCache.get(tourId)
    if (entry) {
      entry.accessCount++
      entry.lastAccessed = Date.now()
    }
  }

  private evictLeastRecentlyUsed(): void {
    let oldestEntry: [string, TourCacheEntry] | null = null
    
    for (const [tourId, entry] of this.tourCache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry[1].lastAccessed) {
        oldestEntry = [tourId, entry]
      }
    }

    if (oldestEntry) {
      this.tourCache.delete(oldestEntry[0])
    }
  }

  /**
   * Statistics and analytics
   */
  private recordLoadStats(tourId: string, stats: TourLoadStats): void {
    const existing = this.loadStats.get(tourId) || []
    existing.push(stats)
    
    // Keep only last 10 load stats per tour
    if (existing.length > 10) {
      existing.splice(0, existing.length - 10)
    }
    
    this.loadStats.set(tourId, existing)
  }

  private getFrequentlyAccessedTours(): string[] {
    return Array.from(this.tourCache.entries())
      .filter(([, entry]) => entry.accessCount >= this.PRELOAD_THRESHOLD)
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .map(([tourId]) => tourId)
      .slice(0, 10)
  }

  private groupToursByCategory(tourIds: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>()
    
    for (const tourId of tourIds) {
      let categoryId = 'unknown'
      
      // Find which category this tour belongs to
      for (const [catId, category] of this.tourCategories.entries()) {
        if (category.tours.includes(tourId)) {
          categoryId = catId
          break
        }
      }
      
      const existing = groups.get(categoryId) || []
      existing.push(tourId)
      groups.set(categoryId, existing)
    }
    
    return groups
  }

  private considerPreloading(tourId: string): void {
    const entry = this.tourCache.get(tourId)
    if (!entry) return

    // Find the category of this tour
    let category: TourCategory | undefined
    for (const cat of this.tourCategories.values()) {
      if (cat.tours.includes(tourId)) {
        category = cat
        break
      }
    }

    if (category && entry.accessCount >= category.preloadThreshold) {
      // Preload other tours in the same category
      const toPreload = category.tours.filter(id => id !== tourId && !this.tourCache.has(id))
      if (toPreload.length > 0) {
        this.loadTours(toPreload.slice(0, 3)).catch(error => {
          console.warn('Failed to preload related tours:', error)
        })
      }
    }
  }

  /**
   * Setup automatic cache cleanup
   */
  private setupCacheCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [tourId, entry] of this.tourCache.entries()) {
        if (now - entry.timestamp > this.CACHE_TTL) {
          this.tourCache.delete(tourId)
        }
      }
    }, 5 * 60 * 1000)
  }
}

/**
 * Convenience functions for lazy tour loading
 */
export function getLazyTourLoader(): LazyTourLoader {
  return LazyTourLoader.getInstance()
}

export async function loadTourLazy(tourId: string): Promise<TourDefinition> {
  const loader = getLazyTourLoader()
  const result = await loader.loadTour(tourId)
  return result.tour
}

export async function loadToursLazy(tourIds: string[]): Promise<TourDefinition[]> {
  const loader = getLazyTourLoader()
  const results = await loader.loadTours(tourIds)
  return Array.from(results.values()).map(result => result.tour)
}

export async function loadTourCategoryLazy(categoryId: string): Promise<TourDefinition[]> {
  const loader = getLazyTourLoader()
  return loader.loadTourCategory(categoryId)
}

export async function preloadFrequentTours(): Promise<void> {
  const loader = getLazyTourLoader()
  return loader.preloadFrequentTours()
}

export function getTourCacheStats() {
  const loader = getLazyTourLoader()
  return loader.getCacheStats()
}