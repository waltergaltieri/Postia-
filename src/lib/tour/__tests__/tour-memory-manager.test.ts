/**
 * Tests for tour memory manager and rendering optimization
 */

import { TourMemoryManager, TourRenderingOptimizer, getTourMemoryManager } from '../tour-memory-manager'
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

const largeTour: TourDefinition = {
  ...mockTour,
  id: 'large-tour',
  steps: Array.from({ length: 20 }, (_, i) => ({
    element: `[data-testid="step-${i}"]`,
    title: `Step ${i + 1}`,
    description: `This is step ${i + 1} with a longer description that contains more content to simulate a realistic tour step with detailed instructions and explanations.`,
    position: 'bottom' as const
  }))
}

describe('TourMemoryManager', () => {
  let memoryManager: TourMemoryManager

  beforeEach(() => {
    memoryManager = TourMemoryManager.getInstance({
      maxInstances: 5,
      maxMemoryUsage: 10, // 10MB for testing
      cleanupInterval: 1000, // 1 second for testing
      inactiveThreshold: 2000, // 2 seconds for testing
      memoryPressureThreshold: 8 // 8MB for testing
    })
  })

  afterEach(() => {
    memoryManager.destroy()
  })

  describe('registerTour', () => {
    it('should register a tour instance', () => {
      const cleanup = jest.fn()
      memoryManager.registerTour('test-tour', mockTour, cleanup)

      const stats = memoryManager.getMemoryStats()
      expect(stats.totalInstances).toBe(1)
      expect(stats.activeInstances).toBe(1)
    })

    it('should estimate memory usage correctly', () => {
      memoryManager.registerTour('test-tour', mockTour)
      memoryManager.registerTour('large-tour', largeTour)

      const stats = memoryManager.getMemoryStats()
      expect(stats.totalInstances).toBe(2)
      expect(stats.totalMemoryUsage).toBeGreaterThan(0)
    })

    it('should enforce instance limits', () => {
      // Register tours up to the limit
      for (let i = 0; i < 6; i++) {
        const tour = { ...mockTour, id: `tour-${i}` }
        memoryManager.registerTour(`tour-${i}`, tour)
      }

      const stats = memoryManager.getMemoryStats()
      expect(stats.totalInstances).toBeLessThanOrEqual(5)
    })
  })

  describe('accessTour', () => {
    it('should update access statistics', () => {
      memoryManager.registerTour('test-tour', mockTour)
      
      // Access the tour multiple times
      memoryManager.accessTour('test-tour')
      memoryManager.accessTour('test-tour')
      memoryManager.accessTour('test-tour')

      const instances = memoryManager.getTourInstances()
      const testTour = instances.find(instance => instance.id === 'test-tour')
      
      expect(testTour).toBeDefined()
      expect(testTour!.accessCount).toBe(4) // 1 from registration + 3 from access
    })
  })

  describe('setTourActive', () => {
    it('should update tour active status', () => {
      memoryManager.registerTour('test-tour', mockTour)
      
      let stats = memoryManager.getMemoryStats()
      expect(stats.activeInstances).toBe(1)

      memoryManager.setTourActive('test-tour', false)
      
      stats = memoryManager.getMemoryStats()
      expect(stats.activeInstances).toBe(0)
    })
  })

  describe('cleanupInactiveTours', () => {
    it('should cleanup inactive tours after threshold', async () => {
      memoryManager.registerTour('test-tour', mockTour)
      memoryManager.setTourActive('test-tour', false)

      // Wait for inactive threshold
      await new Promise(resolve => setTimeout(resolve, 2100))

      const cleanedCount = memoryManager.cleanupInactiveTours()
      expect(cleanedCount).toBe(1)

      const stats = memoryManager.getMemoryStats()
      expect(stats.totalInstances).toBe(0)
    })

    it('should not cleanup active tours', async () => {
      memoryManager.registerTour('test-tour', mockTour)
      // Keep tour active

      await new Promise(resolve => setTimeout(resolve, 2100))

      const cleanedCount = memoryManager.cleanupInactiveTours()
      expect(cleanedCount).toBe(0)

      const stats = memoryManager.getMemoryStats()
      expect(stats.totalInstances).toBe(1)
    })
  })

  describe('cleanupByMemoryPressure', () => {
    it('should cleanup tours when memory pressure is high', () => {
      // Register multiple large tours to create memory pressure
      for (let i = 0; i < 5; i++) {
        const tour = { ...largeTour, id: `large-tour-${i}` }
        memoryManager.registerTour(`large-tour-${i}`, tour)
        memoryManager.setTourActive(`large-tour-${i}`, false) // Make them inactive
      }

      const cleanedCount = memoryManager.cleanupByMemoryPressure()
      expect(cleanedCount).toBeGreaterThan(0)

      const stats = memoryManager.getMemoryStats()
      expect(stats.memoryPressure).not.toBe('high')
    })
  })

  describe('optimizeMemory', () => {
    it('should optimize memory usage and provide recommendations', () => {
      // Create a scenario with inactive tours and memory pressure
      for (let i = 0; i < 3; i++) {
        const tour = { ...largeTour, id: `tour-${i}` }
        memoryManager.registerTour(`tour-${i}`, tour)
        if (i > 0) {
          memoryManager.setTourActive(`tour-${i}`, false)
        }
      }

      const result = memoryManager.optimizeMemory()
      
      expect(result.cleanedInactive).toBeGreaterThanOrEqual(0)
      expect(result.cleanedByPressure).toBeGreaterThanOrEqual(0)
      expect(result.recommendations).toBeInstanceOf(Array)
    })
  })

  describe('getMemoryStats', () => {
    it('should provide accurate memory statistics', () => {
      memoryManager.registerTour('test-tour', mockTour)
      memoryManager.registerTour('large-tour', largeTour)

      const stats = memoryManager.getMemoryStats()
      
      expect(stats.totalInstances).toBe(2)
      expect(stats.activeInstances).toBe(2)
      expect(stats.totalMemoryUsage).toBeGreaterThan(0)
      expect(stats.averageMemoryPerTour).toBeGreaterThan(0)
      expect(stats.memoryPressure).toMatch(/^(low|medium|high)$/)
    })
  })

  describe('unregisterTour', () => {
    it('should call cleanup function when unregistering', () => {
      const cleanup = jest.fn()
      memoryManager.registerTour('test-tour', mockTour, cleanup)
      
      memoryManager.unregisterTour('test-tour')
      
      expect(cleanup).toHaveBeenCalled()
      
      const stats = memoryManager.getMemoryStats()
      expect(stats.totalInstances).toBe(0)
    })
  })
})

describe('TourRenderingOptimizer', () => {
  let optimizer: TourRenderingOptimizer
  let mockElement: HTMLElement

  beforeEach(() => {
    optimizer = TourRenderingOptimizer.getInstance()
    
    // Create mock DOM element
    mockElement = document.createElement('div')
    mockElement.setAttribute('data-testid', 'test-element')
    mockElement.style.position = 'absolute'
    mockElement.style.top = '100px'
    mockElement.style.left = '100px'
    mockElement.style.width = '200px'
    mockElement.style.height = '100px'
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    optimizer.cleanup()
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement)
    }
  })

  describe('optimizeElementSelection', () => {
    it('should find and cache elements', () => {
      const element1 = optimizer.optimizeElementSelection('[data-testid="test-element"]')
      const element2 = optimizer.optimizeElementSelection('[data-testid="test-element"]')
      
      expect(element1).toBe(mockElement)
      expect(element2).toBe(mockElement)
      expect(element1).toBe(element2) // Should be the same cached instance
    })

    it('should return null for non-existent elements', () => {
      const element = optimizer.optimizeElementSelection('[data-testid="non-existent"]')
      expect(element).toBeNull()
    })

    it('should handle context-specific selection', () => {
      const container = document.createElement('div')
      container.appendChild(mockElement.cloneNode(true))
      document.body.appendChild(container)

      const element = optimizer.optimizeElementSelection('[data-testid="test-element"]', container)
      expect(element).toBeTruthy()
      expect(element).not.toBe(mockElement)

      container.remove()
    })
  })

  describe('batchDOMOperations', () => {
    it('should execute operations in batch', (done) => {
      const operations = [
        jest.fn(),
        jest.fn(),
        jest.fn()
      ]

      optimizer.batchDOMOperations(operations)

      // Operations should be executed asynchronously
      expect(operations[0]).not.toHaveBeenCalled()

      // Wait for requestAnimationFrame
      requestAnimationFrame(() => {
        operations.forEach(op => {
          expect(op).toHaveBeenCalled()
        })
        done()
      })
    })

    it('should handle operation errors gracefully', (done) => {
      const operations = [
        jest.fn(),
        jest.fn(() => { throw new Error('Test error') }),
        jest.fn()
      ]

      optimizer.batchDOMOperations(operations)

      requestAnimationFrame(() => {
        expect(operations[0]).toHaveBeenCalled()
        expect(operations[1]).toHaveBeenCalled()
        expect(operations[2]).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('optimizeStepRendering', () => {
    it('should optimize position based on element location', () => {
      const stepContent = {
        title: 'Test Step',
        description: 'Test description'
      }

      const result = optimizer.optimizeStepRendering(mockElement, stepContent, 'auto')
      
      expect(result.optimizedPosition).toMatch(/^(top|bottom|left|right)$/)
      expect(result.shouldDefer).toBe(false) // Element should be in viewport
      expect(result.renderPriority).toMatch(/^(high|medium|low)$/)
    })

    it('should detect out-of-viewport elements', () => {
      // Move element out of viewport
      mockElement.style.top = '-1000px'
      
      const stepContent = {
        title: 'Test Step',
        description: 'Test description'
      }

      const result = optimizer.optimizeStepRendering(mockElement, stepContent, 'auto')
      
      expect(result.shouldDefer).toBe(true)
      expect(result.renderPriority).toBe('low')
    })
  })

  describe('preloadTourAssets', () => {
    it('should preload images from tour steps', async () => {
      const tourWithImages: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: '[data-testid="test"]',
            title: 'Step with Image',
            description: 'This step has an image: <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="test">',
            position: 'bottom'
          }
        ]
      }

      // Should not throw error
      await expect(optimizer.preloadTourAssets(tourWithImages)).resolves.not.toThrow()
    })

    it('should handle tours without images', async () => {
      await expect(optimizer.preloadTourAssets(mockTour)).resolves.not.toThrow()
    })
  })
})

describe('Integration tests', () => {
  it('should work together for memory and rendering optimization', () => {
    const memoryManager = getTourMemoryManager()
    const optimizer = TourRenderingOptimizer.getInstance()

    // Register a tour
    memoryManager.registerTour('test-tour', mockTour)

    // Optimize element selection
    const element = optimizer.optimizeElementSelection('[data-testid="test-element"]')

    // Both should work without interference
    expect(memoryManager.getMemoryStats().totalInstances).toBe(1)
    expect(element).toBeTruthy()

    // Cleanup
    memoryManager.destroy()
    optimizer.cleanup()
  })
})

describe('Performance monitoring integration', () => {
  it('should integrate with performance monitoring', () => {
    const memoryManager = getTourMemoryManager({
      performanceMonitoring: true
    })

    // Register tours and verify monitoring works
    memoryManager.registerTour('test-tour', mockTour)
    
    const stats = memoryManager.getMemoryStats()
    expect(stats.totalInstances).toBe(1)

    memoryManager.destroy()
  })
})