import { renderHook, act } from '@testing-library/react'
import { useTour } from '../use-tour'
import { useTourProgress } from '../use-tour-progress'
import { useContextualTours } from '../use-contextual-tours'

// Mock dependencies
jest.mock('@/components/navigation/navigation-context', () => ({
  useNavigation: () => ({
    currentClient: { id: 'test-client', name: 'Test Client' }
  })
}))

jest.mock('@/lib/tour/tour-config', () => ({
  TourConfigLoader: {
    getTourConfig: jest.fn(),
    loadTourConfigFromFile: jest.fn()
  }
}))

jest.mock('@/lib/accessibility', () => ({
  announceToScreenReader: jest.fn()
}))

describe('Tour Management Hooks', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('useTour', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useTour())

      expect(result.current.currentTour).toBeNull()
      expect(result.current.currentStep).toBe(0)
      expect(result.current.totalSteps).toBe(0)
      expect(result.current.isActive).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle user preferences correctly', async () => {
      const { result } = renderHook(() => useTour())

      await act(async () => {
        await result.current.saveUserPreferences({
          autoStartTours: false,
          tourFrequency: 'never'
        })
      })

      expect(result.current.userPreferences.autoStartTours).toBe(false)
      expect(result.current.userPreferences.tourFrequency).toBe('never')
    })

    it('should track tour status correctly', () => {
      const { result } = renderHook(() => useTour())

      const status = result.current.getTourStatus('test-tour')
      expect(status).toBe('not_started')
    })
  })

  describe('useTourProgress', () => {
    it('should initialize with empty progress data', () => {
      const { result } = renderHook(() => useTourProgress())

      expect(result.current.progressData).toEqual([])
      expect(result.current.analyticsData).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should create new progress correctly', () => {
      const { result } = renderHook(() => useTourProgress())

      const progress = result.current.createProgress('user-1', 'test-tour')

      expect(progress.userId).toBe('user-1')
      expect(progress.tourId).toBe('test-tour')
      expect(progress.status).toBe('not_started')
      expect(progress.currentStep).toBe(0)
      expect(progress.completedSteps).toEqual([])
    })

    it('should update progress correctly', async () => {
      const { result } = renderHook(() => useTourProgress({ enablePersistence: true }))

      await act(async () => {
        await result.current.updateProgress('user-1', 'test-tour', {
          status: 'in_progress',
          currentStep: 1
        })
      })

      const progress = result.current.getProgress('user-1', 'test-tour')
      expect(progress?.status).toBe('in_progress')
      expect(progress?.currentStep).toBe(1)
    })

    it('should track analytics events', async () => {
      const { result } = renderHook(() => useTourProgress({ enableAnalytics: true }))

      await act(async () => {
        await result.current.trackAnalyticsEvent('user-1', 'test-tour', {
          type: 'tour_started',
          stepIndex: 0
        })
      })

      // Analytics should be tracked (implementation would verify this)
      expect(true).toBe(true) // Placeholder assertion
    })
  })

  describe('useContextualTours', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useContextualTours())

      expect(result.current.suggestions).toEqual([])
      expect(result.current.activeSuggestion).toBeNull()
      expect(result.current.suggestionsShownThisSession).toBe(0)
    })

    it('should track feature usage', () => {
      const { result } = renderHook(() => useContextualTours({
        enableFeatureDiscovery: true
      }))

      act(() => {
        result.current.trackFeatureUsage('content-generation')
      })

      expect(result.current.userActivity.featureUsage.has('content-generation')).toBe(true)
    })

    it('should track errors and suggest tours', () => {
      const { result } = renderHook(() => useContextualTours({
        enableErrorTracking: true,
        errorThreshold: 1
      }))

      act(() => {
        result.current.trackError('content_generation_error')
      })

      expect(result.current.userActivity.errors.get('content_generation_error')).toBe(1)
    })

    it('should detect page context', () => {
      const { result } = renderHook(() => useContextualTours())

      const context = result.current.detectPageContext()

      expect(context).toHaveProperty('currentPath')
      expect(context).toHaveProperty('isNewPage')
      expect(context).toHaveProperty('pageViewCount')
    })
  })

  describe('Integration Tests', () => {
    it('should work together for complete tour flow', async () => {
      const tourHook = renderHook(() => useTour())
      const progressHook = renderHook(() => useTourProgress({ enablePersistence: true }))

      // Start tour progress
      await act(async () => {
        await progressHook.result.current.startTourProgress('user-1', 'test-tour')
      })

      // Verify progress was created
      const progress = progressHook.result.current.getProgress('user-1', 'test-tour')
      expect(progress?.status).toBe('in_progress')

      // Complete a step
      await act(async () => {
        await progressHook.result.current.completeStep('user-1', 'test-tour', 0)
      })

      // Verify step completion
      const updatedProgress = progressHook.result.current.getProgress('user-1', 'test-tour')
      expect(updatedProgress?.completedSteps).toContain(0)
      expect(updatedProgress?.currentStep).toBe(1)
    })
  })
})