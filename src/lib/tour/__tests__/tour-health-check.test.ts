/**
 * Tests for Tour Health Check System
 */

import { TourHealthChecker, HealthCheckConfig } from '../tour-health-check'
import { TourDefinition } from '@/types/tour'

// Mock DOM methods
Object.defineProperty(document, 'querySelector', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    visibility: 'visible',
    display: 'block',
    opacity: '1',
    pointerEvents: 'auto'
  })),
  writable: true
})

Object.defineProperty(performance, 'now', {
  value: jest.fn(() => Date.now()),
  writable: true
})

const mockTour: TourDefinition = {
  id: 'test-tour',
  name: 'Test Tour',
  description: 'A test tour',
  category: 'onboarding',
  triggers: [{ type: 'manual' }],
  steps: [
    {
      element: '#test-element',
      title: 'Test Step',
      description: 'This is a test step',
      position: 'bottom'
    },
    {
      element: '.another-element',
      title: 'Another Step',
      description: 'This is another test step',
      accessibility: {
        ariaLabel: 'Test aria label'
      }
    }
  ],
  metadata: {
    version: '1.0.0',
    author: 'Test Author',
    lastUpdated: '2024-01-01',
    estimatedDuration: 120000
  }
}

describe('TourHealthChecker', () => {
  let healthChecker: TourHealthChecker
  let mockConfig: HealthCheckConfig

  beforeEach(() => {
    mockConfig = {
      checkElementAvailability: true,
      checkAccessibility: true,
      checkPerformance: true,
      checkNavigation: true,
      timeout: 1000,
      retryAttempts: 1
    }

    healthChecker = new TourHealthChecker(mockConfig)

    // Reset mocks
    jest.clearAllMocks()
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'group').mockImplementation()
    jest.spyOn(console, 'groupEnd').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('checkTourHealth', () => {
    test('should return healthy result for valid tour with available elements', async () => {
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      const result = await healthChecker.checkTourHealth(mockTour)

      expect(result.tourId).toBe('test-tour')
      expect(result.isHealthy).toBe(true)
      expect(result.score).toBeGreaterThan(70)
      expect(result.issues).toHaveLength(0)
    })

    test('should detect missing elements', async () => {
      // Mock element not found
      ;(document.querySelector as jest.Mock).mockReturnValue(null)

      const result = await healthChecker.checkTourHealth(mockTour)

      expect(result.isHealthy).toBe(false)
      expect(result.issues.some(issue => 
        issue.category === 'element' && issue.message.includes('Element not found')
      )).toBe(true)
    })

    test('should detect accessibility issues', async () => {
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      // Create tour with accessibility issues
      const tourWithA11yIssues: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: '#test',
            title: 'Very long title that exceeds the recommended length for screen readers and may cause issues',
            description: 'Very long description that exceeds 300 characters and may be difficult for screen readers to process effectively. This description is intentionally long to trigger the accessibility warning in our health check system. It should be shortened for better accessibility compliance.',
            position: 'bottom'
          }
        ]
      }

      const result = await healthChecker.checkTourHealth(tourWithA11yIssues)

      expect(result.warnings.some(warning => 
        warning.type === 'accessibility'
      )).toBe(true)
    })

    test('should detect performance issues', async () => {
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      // Create tour with performance issues
      const tourWithPerfIssues: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: '*[class*="expensive"] > div:nth-child(5)',
            title: 'Test',
            description: 'Test',
            position: 'bottom'
          }
        ]
      }

      const result = await healthChecker.checkTourHealth(tourWithPerfIssues)

      expect(result.warnings.some(warning => 
        warning.type === 'performance'
      )).toBe(true)
    })

    test('should detect usability issues for long tours', async () => {
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      // Create tour with many steps
      const longTour: TourDefinition = {
        ...mockTour,
        steps: Array(25).fill(null).map((_, i) => ({
          element: `#step-${i}`,
          title: `Step ${i}`,
          description: `Description for step ${i}`,
          position: 'bottom' as const
        })),
        metadata: {
          ...mockTour.metadata,
          estimatedDuration: 700000 // > 10 minutes
        }
      }

      const result = await healthChecker.checkTourHealth(longTour)

      expect(result.warnings.some(warning => 
        warning.type === 'usability'
      )).toBe(true)
    })

    test('should handle health check errors gracefully', async () => {
      // Mock querySelector to throw error
      ;(document.querySelector as jest.Mock).mockImplementation(() => {
        throw new Error('DOM error')
      })

      const result = await healthChecker.checkTourHealth(mockTour)

      expect(result.isHealthy).toBe(false)
      expect(result.issues.some(issue => 
        issue.message.includes('Error checking element')
      )).toBe(true)
    })

    test('should cache results', async () => {
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      // First call
      const result1 = await healthChecker.checkTourHealth(mockTour)
      
      // Second call should use cache
      const result2 = await healthChecker.checkTourHealth(mockTour)

      expect(result1.lastChecked).toEqual(result2.lastChecked)
      expect(document.querySelector).toHaveBeenCalledTimes(2) // Only called once due to caching
    })
  })

  describe('checkMultipleTours', () => {
    test('should check multiple tours', async () => {
      const tours = [mockTour, { ...mockTour, id: 'tour-2' }]
      
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      const results = await healthChecker.checkMultipleTours(tours)

      expect(results).toHaveLength(2)
      expect(results[0].tourId).toBe('test-tour')
      expect(results[1].tourId).toBe('tour-2')
    })
  })

  describe('validateForDeployment', () => {
    test('should validate tours for deployment', async () => {
      const tours = [mockTour]
      
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      const result = await healthChecker.validateForDeployment(tours)

      expect(result.canDeploy).toBe(true)
      expect(result.summary.totalTours).toBe(1)
      expect(result.summary.healthyTours).toBe(1)
      expect(result.blockers).toHaveLength(0)
    })

    test('should block deployment for critical issues', async () => {
      const tours = [mockTour]
      
      // Mock element not found to create critical issue
      ;(document.querySelector as jest.Mock).mockReturnValue(null)

      const result = await healthChecker.validateForDeployment(tours)

      expect(result.canDeploy).toBe(false)
      expect(result.blockers.length).toBeGreaterThan(0)
    })
  })

  describe('cache management', () => {
    test('should clear cache', async () => {
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      await healthChecker.checkTourHealth(mockTour)
      
      let stats = healthChecker.getCacheStats()
      expect(stats.size).toBe(1)

      healthChecker.clearCache()
      
      stats = healthChecker.getCacheStats()
      expect(stats.size).toBe(0)
    })

    test('should provide cache statistics', async () => {
      // Mock element found
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      await healthChecker.checkTourHealth(mockTour)
      await healthChecker.checkTourHealth({ ...mockTour, id: 'tour-2' })

      const stats = healthChecker.getCacheStats()
      expect(stats.size).toBe(2)
      expect(stats.oldestEntry).toBeInstanceOf(Date)
    })
  })
})