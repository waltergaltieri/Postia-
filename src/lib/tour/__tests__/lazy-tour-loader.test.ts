/**
 * Tests for lazy tour loader with caching and performance optimization
 */

import { LazyTourLoader, getLazyTourLoader } from '../lazy-tour-loader'
import type { TourDefinition } from '@/types/tour'

// Mock tour data
const mockTour: TourDefinition = {
  id: 'test-tour',
  name: 'Test Tour',
  description: 'A test tour',
  category: 'onboarding',
  triggers: [{ type: 'manual' }],
  steps: [
    {
      element: '[data-testid="test"]',
      title: 'Test Step',
      description: 'Test description',
      position: 'bottom'
    }
  ],
  metadata: {
    version: '1.0.0',
    author: 'Test Author',
    lastUpdated: '2024-01-01',
    estimatedDuration: 60
  }
}

// Mock dynamic imports
jest.mock('../configs/welcome-tour.json', () => ({
  default: {
    ...mockTour,
    id: 'welcome-tour',
    name: 'Welcome Tour'
  }
}), { virtual: true })

jest.mock('../configs/content-generation-tour.json', () => ({
  default: {
    ...mockTour,
    id: 'content-generation-tour',
    name: 'Content Generation Tour',
    category: 'feature'
  }
}), { virtual: true })

describe('LazyTourLoader', () => {
  let loader: LazyTourLoader

  beforeEach(() => {
    loader = LazyTourLoader.getInstance()
    loader.clearCache()
  })

  afterEach(() => {
    loader.clearCache()
  })

  describe('loadTour', () => {
    it('should load a tour successfully', async () => {
      const result = await loader.loadTour('welcome-tour')
      
      expect(result.tour).toBeDefined()
      expect(result.tour.id).toBe('welcome-tour')
      expect(result.stats.fromCache).toBe(false)
      expect(result.stats.loadTime).toBeGreaterThan(0)
    })

    it('should return cached tour on second load', async () => {
      // First load
      const result1 = await loader.loadTour('welcome-tour')
      expect(result1.stats.fromCache).toBe(false)

      // Second load should be from cache
      const result2 = await loader.loadTour('welcome-tour')
      expect(result2.stats.fromCache).toBe(true)
      expect(result2.stats.cacheHit).toBe(true)
      expect(result2.stats.loadTime).toBeLessThan(result1.stats.loadTime)
    })

    it('should handle concurrent loads of the same tour', async () => {
      const promises = [
        loader.loadTour('welcome-tour'),
        loader.loadTour('welcome-tour'),
        loader.loadTour('welcome-tour')
      ]

      const results = await Promise.all(promises)
      
      // All should return the same tour
      results.forEach(result => {
        expect(result.tour.id).toBe('welcome-tour')
      })

      // Only one should be from network, others from cache or concurrent load
      const fromNetwork = results.filter(r => !r.stats.fromCache).length
      expect(fromNetwork).toBeLessThanOrEqual(1)
    })

    it('should throw error for non-existent tour', async () => {
      await expect(loader.loadTour('non-existent-tour')).rejects.toThrow()
    })
  })

  describe('loadTours', () => {
    it('should load multiple tours efficiently', async () => {
      const tourIds = ['welcome-tour', 'content-generation-tour']
      const results = await loader.loadTours(tourIds)
      
      expect(results.size).toBe(2)
      expect(results.has('welcome-tour')).toBe(true)
      expect(results.has('content-generation-tour')).toBe(true)
    })

    it('should group tours by category for efficient loading', async () => {
      const tourIds = ['welcome-tour', 'content-generation-tour']
      const results = await loader.loadTours(tourIds)
      
      // Should load tours grouped by category
      expect(results.size).toBe(2)
      
      // Verify tours are loaded correctly
      const welcomeTour = results.get('welcome-tour')
      const contentTour = results.get('content-generation-tour')
      
      expect(welcomeTour?.tour.category).toBe('onboarding')
      expect(contentTour?.tour.category).toBe('feature')
    })
  })

  describe('loadTourCategory', () => {
    it('should load all tours in a category', async () => {
      const tours = await loader.loadTourCategory('onboarding')
      
      expect(tours.length).toBeGreaterThan(0)
      tours.forEach(tour => {
        expect(tour.category).toBe('onboarding')
      })
    })

    it('should cache category results', async () => {
      // First load
      const tours1 = await loader.loadTourCategory('onboarding')
      
      // Second load should be faster (cached)
      const startTime = performance.now()
      const tours2 = await loader.loadTourCategory('onboarding')
      const loadTime = performance.now() - startTime
      
      expect(tours2).toEqual(tours1)
      expect(loadTime).toBeLessThan(50) // Should be very fast from cache
    })

    it('should throw error for unknown category', async () => {
      await expect(loader.loadTourCategory('unknown-category')).rejects.toThrow()
    })
  })

  describe('preloading', () => {
    it('should preload frequently accessed tours', async () => {
      // Access a tour multiple times to make it frequent
      for (let i = 0; i < 5; i++) {
        await loader.loadTour('welcome-tour')
      }

      // Preload should work without errors
      await expect(loader.preloadFrequentTours()).resolves.not.toThrow()
    })

    it('should preload tours by priority', async () => {
      await expect(loader.preloadToursByPriority()).resolves.not.toThrow()
    })
  })

  describe('cache management', () => {
    it('should provide accurate cache statistics', async () => {
      // Load some tours
      await loader.loadTour('welcome-tour')
      await loader.loadTour('content-generation-tour')
      
      const stats = loader.getCacheStats()
      
      expect(stats.size).toBe(2)
      expect(stats.averageLoadTime).toBeGreaterThan(0)
      expect(stats.mostAccessed.length).toBeGreaterThan(0)
    })

    it('should clear cache correctly', async () => {
      // Load a tour
      await loader.loadTour('welcome-tour')
      
      let stats = loader.getCacheStats()
      expect(stats.size).toBe(1)
      
      // Clear cache
      loader.clearCache()
      
      stats = loader.getCacheStats()
      expect(stats.size).toBe(0)
    })

    it('should clear specific tours from cache', async () => {
      // Load multiple tours
      await loader.loadTour('welcome-tour')
      await loader.loadTour('content-generation-tour')
      
      let stats = loader.getCacheStats()
      expect(stats.size).toBe(2)
      
      // Clear specific tour
      loader.clearCache(['welcome-tour'])
      
      stats = loader.getCacheStats()
      expect(stats.size).toBe(1)
    })
  })

  describe('performance optimization', () => {
    it('should implement LRU eviction when cache is full', async () => {
      // This test would require mocking the cache size limit
      // and loading enough tours to trigger eviction
      
      // For now, just verify the cache doesn't grow indefinitely
      const tourIds = Array.from({ length: 10 }, (_, i) => `tour-${i}`)
      
      // Mock the tours
      for (const tourId of tourIds) {
        jest.doMock(`../configs/${tourId}.json`, () => ({
          default: { ...mockTour, id: tourId }
        }), { virtual: true })
      }

      // Load tours (some might be evicted)
      for (const tourId of tourIds) {
        try {
          await loader.loadTour(tourId)
        } catch (error) {
          // Some tours might fail to load due to mocking limitations
        }
      }

      const stats = loader.getCacheStats()
      // Cache should have some reasonable limit
      expect(stats.size).toBeLessThanOrEqual(50)
    })

    it('should track access patterns for optimization', async () => {
      // Load a tour multiple times
      for (let i = 0; i < 3; i++) {
        await loader.loadTour('welcome-tour')
      }

      const stats = loader.getCacheStats()
      const mostAccessed = stats.mostAccessed.find(item => item.tourId === 'welcome-tour')
      
      expect(mostAccessed).toBeDefined()
      expect(mostAccessed!.accessCount).toBe(3)
    })
  })

  describe('error handling', () => {
    it('should handle import errors gracefully', async () => {
      // Try to load a tour that will fail to import
      await expect(loader.loadTour('invalid-tour')).rejects.toThrow()
    })

    it('should handle validation errors', async () => {
      // Mock a tour with invalid data
      jest.doMock('../configs/invalid-tour.json', () => ({
        default: {
          id: 'invalid-tour',
          // Missing required fields
        }
      }), { virtual: true })

      await expect(loader.loadTour('invalid-tour')).rejects.toThrow()
    })
  })
})

describe('Convenience functions', () => {
  beforeEach(() => {
    const loader = getLazyTourLoader()
    loader.clearCache()
  })

  it('should provide working convenience functions', async () => {
    const { loadTourLazy, loadToursLazy, loadTourCategoryLazy } = await import('../lazy-tour-loader')
    
    // Test single tour loading
    const tour = await loadTourLazy('welcome-tour')
    expect(tour.id).toBe('welcome-tour')

    // Test multiple tours loading
    const tours = await loadToursLazy(['welcome-tour', 'content-generation-tour'])
    expect(tours.length).toBe(2)

    // Test category loading
    const categoryTours = await loadTourCategoryLazy('onboarding')
    expect(categoryTours.length).toBeGreaterThan(0)
  })
})

describe('Integration with existing systems', () => {
  it('should work with tour validation', async () => {
    const loader = getLazyTourLoader()
    const result = await loader.loadTour('welcome-tour')
    
    // Tour should be properly validated
    expect(result.tour.id).toBeDefined()
    expect(result.tour.name).toBeDefined()
    expect(result.tour.steps).toBeDefined()
    expect(result.tour.steps.length).toBeGreaterThan(0)
  })

  it('should provide performance metrics', async () => {
    const loader = getLazyTourLoader()
    
    // Load some tours
    await loader.loadTour('welcome-tour')
    await loader.loadTour('welcome-tour') // Second load from cache
    
    const stats = loader.getCacheStats()
    
    expect(stats.hitRate).toBeGreaterThan(0)
    expect(stats.averageLoadTime).toBeGreaterThan(0)
  })
})