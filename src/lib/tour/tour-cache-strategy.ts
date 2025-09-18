/**
 * Advanced caching strategies for tour configurations
 * Implements intelligent caching with multiple storage layers and eviction policies
 */

import type { TourDefinition } from '@/types/tour'

interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  size: number
  priority: number
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  averageAccessTime: number
}

interface CacheConfig {
  maxSize: number // Maximum cache size in KB
  maxEntries: number // Maximum number of entries
  ttl: number // Time to live in milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'priority'
  persistToStorage: boolean
  compressionEnabled: boolean
}

/**
 * Multi-layer cache system for tour configurations
 */
export class TourCacheStrategy {
  private static instance: TourCacheStrategy
  private memoryCache = new Map<string, CacheEntry<TourDefinition>>()
  private persistentCache = new Map<string, CacheEntry<TourDefinition>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    averageAccessTime: 0
  }
  private config: CacheConfig

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 5 * 1024, // 5MB
      maxEntries: 100,
      ttl: 30 * 60 * 1000, // 30 minutes
      evictionPolicy: 'lru',
      persistToStorage: true,
      compressionEnabled: true,
      ...config
    }

    this.initializePersistentCache()
    this.setupCacheCleanup()
  }

  static getInstance(config?: Partial<CacheConfig>): TourCacheStrategy {
    if (!TourCacheStrategy.instance) {
      TourCacheStrategy.instance = new TourCacheStrategy(config)
    }
    return TourCacheStrategy.instance
  }

  /**
   * Get tour from cache with intelligent fallback
   */
  async get(tourId: string): Promise<TourDefinition | null> {
    const startTime = performance.now()

    // Try memory cache first
    let entry = this.memoryCache.get(tourId)
    if (entry && this.isEntryValid(entry)) {
      this.updateAccessStats(entry)
      this.stats.hits++
      this.stats.averageAccessTime = this.updateAverageTime(performance.now() - startTime)
      return entry.data
    }

    // Try persistent cache
    entry = this.persistentCache.get(tourId)
    if (entry && this.isEntryValid(entry)) {
      // Promote to memory cache
      this.memoryCache.set(tourId, entry)
      this.updateAccessStats(entry)
      this.stats.hits++
      this.stats.averageAccessTime = this.updateAverageTime(performance.now() - startTime)
      return entry.data
    }

    // Try browser storage if enabled
    if (this.config.persistToStorage) {
      const stored = await this.getFromStorage(tourId)
      if (stored) {
        this.set(tourId, stored, 'medium')
        this.stats.hits++
        this.stats.averageAccessTime = this.updateAverageTime(performance.now() - startTime)
        return stored
      }
    }

    this.stats.misses++
    this.stats.averageAccessTime = this.updateAverageTime(performance.now() - startTime)
    return null
  }

  /**
   * Set tour in cache with priority-based placement
   */
  async set(tourId: string, tour: TourDefinition, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const size = this.calculateSize(tour)
    const priorityValue = this.getPriorityValue(priority)
    
    const entry: CacheEntry<TourDefinition> = {
      data: tour,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      priority: priorityValue
    }

    // Check if we need to make space
    await this.ensureSpace(size)

    // Add to memory cache
    this.memoryCache.set(tourId, entry)
    
    // Add to persistent cache for high priority items
    if (priority === 'high') {
      this.persistentCache.set(tourId, entry)
    }

    // Persist to storage if enabled
    if (this.config.persistToStorage) {
      await this.saveToStorage(tourId, tour)
    }

    this.updateTotalSize()
  }

  /**
   * Preload multiple tours with intelligent prioritization
   */
  async preload(tours: Array<{ id: string; tour: TourDefinition; priority?: 'high' | 'medium' | 'low' }>): Promise<void> {
    // Sort by priority
    const sortedTours = tours.sort((a, b) => {
      const aPriority = this.getPriorityValue(a.priority || 'medium')
      const bPriority = this.getPriorityValue(b.priority || 'medium')
      return bPriority - aPriority
    })

    // Preload in batches to avoid overwhelming the cache
    const batchSize = 5
    for (let i = 0; i < sortedTours.length; i += batchSize) {
      const batch = sortedTours.slice(i, i + batchSize)
      await Promise.all(
        batch.map(({ id, tour, priority }) => this.set(id, tour, priority))
      )
    }
  }

  /**
   * Invalidate cache entries
   */
  invalidate(tourIds: string[] | 'all'): void {
    if (tourIds === 'all') {
      this.memoryCache.clear()
      this.persistentCache.clear()
      this.clearStorage()
      this.stats.totalSize = 0
    } else {
      for (const tourId of tourIds) {
        const entry = this.memoryCache.get(tourId)
        if (entry) {
          this.stats.totalSize -= entry.size
        }
        this.memoryCache.delete(tourId)
        this.persistentCache.delete(tourId)
        this.removeFromStorage(tourId)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    memoryEntries: number
    persistentEntries: number
    hitRate: number
    config: CacheConfig
  } {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    return {
      ...this.stats,
      memoryEntries: this.memoryCache.size,
      persistentEntries: this.persistentCache.size,
      hitRate,
      config: this.config
    }
  }

  /**
   * Optimize cache based on usage patterns
   */
  async optimize(): Promise<void> {
    // Analyze access patterns
    const entries = Array.from(this.memoryCache.entries())
    const accessAnalysis = this.analyzeAccessPatterns(entries)

    // Promote frequently accessed items to persistent cache
    for (const [tourId, entry] of entries) {
      if (entry.accessCount > accessAnalysis.averageAccess * 1.5) {
        this.persistentCache.set(tourId, entry)
      }
    }

    // Demote rarely accessed items from persistent cache
    for (const [tourId, entry] of this.persistentCache.entries()) {
      if (entry.accessCount < accessAnalysis.averageAccess * 0.5) {
        this.persistentCache.delete(tourId)
      }
    }

    // Adjust cache size based on usage
    if (this.stats.hitRate > 0.8 && this.stats.totalSize < this.config.maxSize * 0.7) {
      // High hit rate and low usage - can increase cache size
      this.config.maxSize = Math.min(this.config.maxSize * 1.2, 10 * 1024) // Max 10MB
    } else if (this.stats.hitRate < 0.5) {
      // Low hit rate - might need different eviction policy
      this.adjustEvictionPolicy()
    }
  }

  /**
   * Get cache recommendations
   */
  getRecommendations(): {
    shouldPreload: string[]
    shouldEvict: string[]
    configAdjustments: Partial<CacheConfig>
  } {
    const entries = Array.from(this.memoryCache.entries())
    const analysis = this.analyzeAccessPatterns(entries)

    const shouldPreload = entries
      .filter(([, entry]) => entry.accessCount > analysis.averageAccess)
      .map(([tourId]) => tourId)
      .slice(0, 10)

    const shouldEvict = entries
      .filter(([, entry]) => 
        entry.accessCount < analysis.averageAccess * 0.3 && 
        Date.now() - entry.lastAccessed > this.config.ttl
      )
      .map(([tourId]) => tourId)

    const configAdjustments: Partial<CacheConfig> = {}
    
    if (this.stats.hitRate < 0.6) {
      configAdjustments.ttl = this.config.ttl * 1.5 // Increase TTL
    }
    
    if (this.stats.evictions > this.stats.hits * 0.1) {
      configAdjustments.maxSize = this.config.maxSize * 1.2 // Increase cache size
    }

    return {
      shouldPreload,
      shouldEvict,
      configAdjustments
    }
  }

  /**
   * Private helper methods
   */
  private isEntryValid(entry: CacheEntry<TourDefinition>): boolean {
    return Date.now() - entry.timestamp < this.config.ttl
  }

  private updateAccessStats(entry: CacheEntry<TourDefinition>): void {
    entry.accessCount++
    entry.lastAccessed = Date.now()
  }

  private calculateSize(tour: TourDefinition): number {
    // Rough estimation of tour size in bytes
    const jsonString = JSON.stringify(tour)
    return new Blob([jsonString]).size
  }

  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    const priorities = { high: 3, medium: 2, low: 1 }
    return priorities[priority]
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    while (
      this.memoryCache.size >= this.config.maxEntries ||
      this.stats.totalSize + requiredSize > this.config.maxSize
    ) {
      await this.evictEntry()
    }
  }

  private async evictEntry(): Promise<void> {
    let entryToEvict: [string, CacheEntry<TourDefinition>] | null = null

    switch (this.config.evictionPolicy) {
      case 'lru':
        entryToEvict = this.findLRUEntry()
        break
      case 'lfu':
        entryToEvict = this.findLFUEntry()
        break
      case 'ttl':
        entryToEvict = this.findOldestEntry()
        break
      case 'priority':
        entryToEvict = this.findLowestPriorityEntry()
        break
    }

    if (entryToEvict) {
      const [tourId, entry] = entryToEvict
      this.memoryCache.delete(tourId)
      this.stats.totalSize -= entry.size
      this.stats.evictions++
    }
  }

  private findLRUEntry(): [string, CacheEntry<TourDefinition>] | null {
    let oldest: [string, CacheEntry<TourDefinition>] | null = null
    
    for (const entry of this.memoryCache.entries()) {
      if (!oldest || entry[1].lastAccessed < oldest[1].lastAccessed) {
        oldest = entry
      }
    }
    
    return oldest
  }

  private findLFUEntry(): [string, CacheEntry<TourDefinition>] | null {
    let leastUsed: [string, CacheEntry<TourDefinition>] | null = null
    
    for (const entry of this.memoryCache.entries()) {
      if (!leastUsed || entry[1].accessCount < leastUsed[1].accessCount) {
        leastUsed = entry
      }
    }
    
    return leastUsed
  }

  private findOldestEntry(): [string, CacheEntry<TourDefinition>] | null {
    let oldest: [string, CacheEntry<TourDefinition>] | null = null
    
    for (const entry of this.memoryCache.entries()) {
      if (!oldest || entry[1].timestamp < oldest[1].timestamp) {
        oldest = entry
      }
    }
    
    return oldest
  }

  private findLowestPriorityEntry(): [string, CacheEntry<TourDefinition>] | null {
    let lowestPriority: [string, CacheEntry<TourDefinition>] | null = null
    
    for (const entry of this.memoryCache.entries()) {
      if (!lowestPriority || entry[1].priority < lowestPriority[1].priority) {
        lowestPriority = entry
      }
    }
    
    return lowestPriority
  }

  private updateTotalSize(): void {
    this.stats.totalSize = Array.from(this.memoryCache.values())
      .reduce((total, entry) => total + entry.size, 0)
  }

  private updateAverageTime(newTime: number): number {
    const totalRequests = this.stats.hits + this.stats.misses
    return ((this.stats.averageAccessTime * (totalRequests - 1)) + newTime) / totalRequests
  }

  private analyzeAccessPatterns(entries: Array<[string, CacheEntry<TourDefinition>]>) {
    const accessCounts = entries.map(([, entry]) => entry.accessCount)
    const averageAccess = accessCounts.reduce((sum, count) => sum + count, 0) / accessCounts.length
    const maxAccess = Math.max(...accessCounts)
    const minAccess = Math.min(...accessCounts)

    return { averageAccess, maxAccess, minAccess }
  }

  private adjustEvictionPolicy(): void {
    // Switch to LFU if LRU isn't working well
    if (this.config.evictionPolicy === 'lru' && this.stats.hitRate < 0.5) {
      this.config.evictionPolicy = 'lfu'
    }
    // Switch to priority-based if access patterns are unclear
    else if (this.stats.hitRate < 0.4) {
      this.config.evictionPolicy = 'priority'
    }
  }

  /**
   * Storage persistence methods
   */
  private initializePersistentCache(): void {
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tour-cache-persistent')
        if (stored) {
          const data = JSON.parse(stored)
          for (const [tourId, entryData] of Object.entries(data)) {
            this.persistentCache.set(tourId, entryData as CacheEntry<TourDefinition>)
          }
        }
      } catch (error) {
        console.warn('Failed to initialize persistent cache:', error)
      }
    }
  }

  private async saveToStorage(tourId: string, tour: TourDefinition): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const key = `tour-cache-${tourId}`
      const data = this.config.compressionEnabled 
        ? await this.compressData(tour)
        : JSON.stringify(tour)
      
      localStorage.setItem(key, data)
    } catch (error) {
      console.warn(`Failed to save tour ${tourId} to storage:`, error)
    }
  }

  private async getFromStorage(tourId: string): Promise<TourDefinition | null> {
    if (typeof window === 'undefined') return null

    try {
      const key = `tour-cache-${tourId}`
      const data = localStorage.getItem(key)
      
      if (!data) return null

      return this.config.compressionEnabled 
        ? await this.decompressData(data)
        : JSON.parse(data)
    } catch (error) {
      console.warn(`Failed to get tour ${tourId} from storage:`, error)
      return null
    }
  }

  private removeFromStorage(tourId: string): void {
    if (typeof window === 'undefined') return

    try {
      const key = `tour-cache-${tourId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove tour ${tourId} from storage:`, error)
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('tour-cache-'))
      keys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear tour cache from storage:', error)
    }
  }

  private async compressData(data: any): Promise<string> {
    // Simple compression using JSON stringify with reduced whitespace
    // In a real implementation, you might use a compression library
    return JSON.stringify(data)
  }

  private async decompressData(data: string): Promise<any> {
    // Simple decompression
    return JSON.parse(data)
  }

  private setupCacheCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now()
      
      for (const [tourId, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp > this.config.ttl) {
          this.memoryCache.delete(tourId)
          this.stats.totalSize -= entry.size
        }
      }

      for (const [tourId, entry] of this.persistentCache.entries()) {
        if (now - entry.timestamp > this.config.ttl * 2) { // Longer TTL for persistent cache
          this.persistentCache.delete(tourId)
        }
      }
    }, 5 * 60 * 1000)
  }
}

/**
 * Convenience functions
 */
export function getTourCacheStrategy(config?: Partial<CacheConfig>): TourCacheStrategy {
  return TourCacheStrategy.getInstance(config)
}

export async function getCachedTour(tourId: string): Promise<TourDefinition | null> {
  const cache = getTourCacheStrategy()
  return cache.get(tourId)
}

export async function setCachedTour(
  tourId: string, 
  tour: TourDefinition, 
  priority?: 'high' | 'medium' | 'low'
): Promise<void> {
  const cache = getTourCacheStrategy()
  return cache.set(tourId, tour, priority)
}

export async function preloadTours(
  tours: Array<{ id: string; tour: TourDefinition; priority?: 'high' | 'medium' | 'low' }>
): Promise<void> {
  const cache = getTourCacheStrategy()
  return cache.preload(tours)
}

export function getCacheStats() {
  const cache = getTourCacheStrategy()
  return cache.getStats()
}

export function optimizeCache(): Promise<void> {
  const cache = getTourCacheStrategy()
  return cache.optimize()
}