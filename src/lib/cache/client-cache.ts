/**
 * Client-specific caching system with TTL and invalidation
 * Implements caching for client data, permissions, and session data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface ClientCacheConfig {
  defaultTTL: number
  maxEntries: number
  cleanupInterval: number
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>()
  private config: ClientCacheConfig
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<ClientCacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxEntries: 1000,
      cleanupInterval: 60 * 1000, // 1 minute cleanup
      ...config
    }

    this.startCleanupTimer()
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    }

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest()
    }

    this.cache.set(key, entry)
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    
    return count
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let expired = 0
    let valid = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        valid++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.getHitRate()
    }
  }

  private hitRate = { hits: 0, misses: 0 }

  private getHitRate(): number {
    const total = this.hitRate.hits + this.hitRate.misses
    return total > 0 ? this.hitRate.hits / total : 0
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Remove oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

// Global cache instances
export const clientDataCache = new ClientCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutes for client data
  maxEntries: 500
})

export const permissionCache = new ClientCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes for permissions
  maxEntries: 200
})

export const sessionCache = new ClientCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes for session data
  maxEntries: 100
})

// Cache key generators
export const CacheKeys = {
  clientData: (clientId: string) => `client:${clientId}`,
  clientList: (userId: string) => `clients:${userId}`,
  permissions: (userId: string, clientId: string) => `permissions:${userId}:${clientId}`,
  userPermissions: (userId: string) => `user-permissions:${userId}`,
  clientSession: (userId: string, clientId: string) => `session:${userId}:${clientId}`,
  recentClients: (userId: string) => `recent:${userId}`,
  clientMetrics: (clientId: string) => `metrics:${clientId}`,
  adminMetrics: (userId: string) => `admin-metrics:${userId}`
}

// Utility functions for common caching patterns
export const CacheUtils = {
  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T>(
    cache: ClientCache,
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = cache.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    cache.set(key, data, ttl)
    return data
  },

  /**
   * Invalidate client-related caches
   */
  invalidateClientCaches(clientId: string): void {
    clientDataCache.invalidatePattern(`client:${clientId}`)
    permissionCache.invalidatePattern(`:${clientId}`)
    sessionCache.invalidatePattern(`:${clientId}`)
  },

  /**
   * Invalidate user-related caches
   */
  invalidateUserCaches(userId: string): void {
    clientDataCache.invalidatePattern(`clients:${userId}`)
    permissionCache.invalidatePattern(`${userId}:`)
    sessionCache.invalidatePattern(`${userId}:`)
  },

  /**
   * Get cache statistics for monitoring
   */
  getAllStats() {
    return {
      clientData: clientDataCache.getStats(),
      permissions: permissionCache.getStats(),
      session: sessionCache.getStats()
    }
  }
}

export { ClientCache }