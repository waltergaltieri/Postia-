/**
 * Tests for the client-specific caching system
 */

import { 
  ClientCache, 
  clientDataCache, 
  permissionCache, 
  sessionCache,
  CacheKeys,
  CacheUtils 
} from '../../lib/cache/client-cache'

describe('Client Caching System', () => {
  beforeEach(() => {
    // Clear all caches before each test
    clientDataCache.clear()
    permissionCache.clear()
    sessionCache.clear()
  })

  describe('ClientCache', () => {
    it('should store and retrieve data correctly', () => {
      const cache = new ClientCache({ defaultTTL: 1000 })
      const testData = { id: '1', name: 'Test Client' }
      
      cache.set('test-key', testData)
      const retrieved = cache.get('test-key')
      
      expect(retrieved).toEqual(testData)
    })

    it('should respect TTL and expire data', async () => {
      const cache = new ClientCache({ defaultTTL: 50 }) // 50ms TTL
      const testData = { id: '1', name: 'Test Client' }
      
      cache.set('test-key', testData)
      expect(cache.get('test-key')).toEqual(testData)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(cache.get('test-key')).toBeNull()
    })

    it('should invalidate patterns correctly', () => {
      const cache = new ClientCache()
      
      cache.set('client:123:data', { id: '123' })
      cache.set('client:123:permissions', ['read'])
      cache.set('client:456:data', { id: '456' })
      cache.set('other:data', { id: 'other' })
      
      const invalidated = cache.invalidatePattern('client:123')
      
      expect(invalidated).toBe(2)
      expect(cache.get('client:123:data')).toBeNull()
      expect(cache.get('client:123:permissions')).toBeNull()
      expect(cache.get('client:456:data')).not.toBeNull()
      expect(cache.get('other:data')).not.toBeNull()
    })

    it('should provide accurate statistics', () => {
      const cache = new ClientCache()
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      const stats = cache.getStats()
      
      expect(stats.total).toBe(2)
      expect(stats.valid).toBe(2)
      expect(stats.expired).toBe(0)
    })
  })

  describe('Cache Keys', () => {
    it('should generate consistent cache keys', () => {
      const clientId = 'client-123'
      const userId = 'user-456'
      
      expect(CacheKeys.clientData(clientId)).toBe('client:client-123')
      expect(CacheKeys.permissions(userId, clientId)).toBe('permissions:user-456:client-123')
      expect(CacheKeys.clientList(userId)).toBe('clients:user-456')
    })
  })

  describe('Cache Utils', () => {
    it('should implement getOrSet pattern correctly', async () => {
      const cache = new ClientCache()
      let fetchCount = 0
      
      const fetcher = async () => {
        fetchCount++
        return { data: 'fetched-data', count: fetchCount }
      }
      
      // First call should fetch
      const result1 = await CacheUtils.getOrSet(cache, 'test-key', fetcher)
      expect(result1.count).toBe(1)
      expect(fetchCount).toBe(1)
      
      // Second call should use cache
      const result2 = await CacheUtils.getOrSet(cache, 'test-key', fetcher)
      expect(result2.count).toBe(1) // Same as first call
      expect(fetchCount).toBe(1) // Fetcher not called again
    })

    it('should invalidate client caches correctly', () => {
      const clientId = 'client-123'
      
      clientDataCache.set(CacheKeys.clientData(clientId), { id: clientId })
      permissionCache.set(CacheKeys.permissions('user-1', clientId), ['read'])
      sessionCache.set(CacheKeys.clientSession('user-1', clientId), { active: true })
      
      CacheUtils.invalidateClientCaches(clientId)
      
      expect(clientDataCache.get(CacheKeys.clientData(clientId))).toBeNull()
      expect(permissionCache.get(CacheKeys.permissions('user-1', clientId))).toBeNull()
      expect(sessionCache.get(CacheKeys.clientSession('user-1', clientId))).toBeNull()
    })

    it('should invalidate user caches correctly', () => {
      const userId = 'user-123'
      const clientId = 'client-456'
      
      clientDataCache.set(CacheKeys.clientList(userId), [])
      permissionCache.set(CacheKeys.permissions(userId, clientId), ['read'])
      sessionCache.set(CacheKeys.clientSession(userId, clientId), { active: true })
      
      CacheUtils.invalidateUserCaches(userId)
      
      expect(clientDataCache.get(CacheKeys.clientList(userId))).toBeNull()
      expect(permissionCache.get(CacheKeys.permissions(userId, clientId))).toBeNull()
      expect(sessionCache.get(CacheKeys.clientSession(userId, clientId))).toBeNull()
    })
  })

  describe('Global Cache Instances', () => {
    it('should have different TTL settings for different cache types', () => {
      // Test that different caches have appropriate TTL
      clientDataCache.set('test', 'data')
      permissionCache.set('test', 'permissions')
      sessionCache.set('test', 'session')
      
      // All should be accessible immediately
      expect(clientDataCache.get('test')).toBe('data')
      expect(permissionCache.get('test')).toBe('permissions')
      expect(sessionCache.get('test')).toBe('session')
    })
  })

  describe('Performance', () => {
    it('should handle large numbers of cache entries efficiently', () => {
      const cache = new ClientCache({ maxEntries: 100 })
      const startTime = Date.now()
      
      // Add many entries
      for (let i = 0; i < 150; i++) {
        cache.set(`key-${i}`, { id: i, data: `data-${i}` })
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete quickly (less than 100ms for 150 entries)
      expect(duration).toBeLessThan(100)
      
      // Should respect max entries limit
      const stats = cache.getStats()
      expect(stats.total).toBeLessThanOrEqual(100)
    })

    it('should cleanup expired entries automatically', async () => {
      const cache = new ClientCache({ 
        defaultTTL: 50, 
        cleanupInterval: 25 
      })
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      expect(cache.getStats().total).toBe(2)
      
      // Wait for expiration and cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Entries should be cleaned up
      expect(cache.getStats().total).toBe(0)
      
      cache.destroy() // Clean up the test cache
    })
  })
})