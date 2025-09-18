/**
 * Tests for Tour Analytics Engine
 */

import { TourAnalyticsEngine, TourMetrics } from '../tour-analytics'
import { TourEvent, TourAnalytics } from '@/types/tour'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch
global.fetch = jest.fn()

describe('TourAnalyticsEngine', () => {
  let analytics: TourAnalyticsEngine

  beforeEach(() => {
    analytics = new TourAnalyticsEngine({
      enableTracking: true,
      enableRealTime: false,
      batchSize: 5,
      flushInterval: 1000,
      storageKey: 'test_analytics'
    })
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    analytics.destroy()
  })

  describe('Event Tracking', () => {
    it('should track tour events correctly', () => {
      const event = {
        type: 'tour_started' as const,
        metadata: {
          tourId: 'welcome-tour',
          userId: 'user123',
          sessionId: 'session123'
        }
      }

      analytics.trackEvent(event)

      const exportedData = analytics.exportAnalytics()
      expect(exportedData.events).toHaveLength(1)
      expect(exportedData.events[0].type).toBe('tour_started')
      expect(exportedData.events[0].metadata?.tourId).toBe('welcome-tour')
    })

    it('should not track events when tracking is disabled', () => {
      const disabledAnalytics = new TourAnalyticsEngine({
        enableTracking: false
      })

      disabledAnalytics.trackEvent({
        type: 'tour_started',
        metadata: { tourId: 'test', userId: 'user1' }
      })

      const exportedData = disabledAnalytics.exportAnalytics()
      expect(exportedData.events).toHaveLength(0)

      disabledAnalytics.destroy()
    })

    it('should add timestamps to events', () => {
      const beforeTime = new Date()
      
      analytics.trackEvent({
        type: 'step_viewed',
        stepIndex: 0,
        metadata: { tourId: 'test', userId: 'user1' }
      })

      const afterTime = new Date()
      const exportedData = analytics.exportAnalytics()
      const event = exportedData.events[0]
      
      expect(event.timestamp).toBeInstanceOf(Date)
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })
  })

  describe('Tour Tracking', () => {
    it('should start tour tracking correctly', () => {
      analytics.startTourTracking('welcome-tour', 'user123')

      const tourAnalytics = analytics.getTourAnalytics('welcome-tour', 'user123')
      expect(tourAnalytics).toBeDefined()
      expect(tourAnalytics?.tourId).toBe('welcome-tour')
      expect(tourAnalytics?.userId).toBe('user123')

      const exportedData = analytics.exportAnalytics()
      expect(exportedData.events).toHaveLength(1)
      expect(exportedData.events[0].type).toBe('tour_started')
    })

    it('should track step interactions', () => {
      analytics.startTourTracking('welcome-tour', 'user123')
      analytics.trackStepViewed('welcome-tour', 'user123', 0)
      analytics.trackStepCompleted('welcome-tour', 'user123', 0, 5000)

      const exportedData = analytics.exportAnalytics()
      expect(exportedData.events).toHaveLength(3) // start + viewed + completed
      
      const stepViewedEvent = exportedData.events.find(e => e.type === 'step_viewed')
      expect(stepViewedEvent?.stepIndex).toBe(0)
      
      const stepCompletedEvent = exportedData.events.find(e => e.type === 'step_completed')
      expect(stepCompletedEvent?.stepIndex).toBe(0)
      expect(stepCompletedEvent?.metadata?.duration).toBe(5000)
    })

    it('should track tour completion', () => {
      analytics.startTourTracking('welcome-tour', 'user123')
      analytics.trackTourCompleted('welcome-tour', 'user123', 30000)

      const tourAnalytics = analytics.getTourAnalytics('welcome-tour', 'user123')
      expect(tourAnalytics?.metrics.totalDuration).toBe(30000)
      expect(tourAnalytics?.metrics.completionRate).toBe(100)

      const exportedData = analytics.exportAnalytics()
      const completionEvent = exportedData.events.find(e => e.type === 'tour_completed')
      expect(completionEvent?.metadata?.totalDuration).toBe(30000)
    })

    it('should track tour skipping', () => {
      analytics.startTourTracking('welcome-tour', 'user123')
      analytics.trackTourSkipped('welcome-tour', 'user123', 2, 'too_long')

      const tourAnalytics = analytics.getTourAnalytics('welcome-tour', 'user123')
      expect(tourAnalytics?.metrics.dropoffStep).toBe(2)

      const exportedData = analytics.exportAnalytics()
      const skipEvent = exportedData.events.find(e => e.type === 'tour_skipped')
      expect(skipEvent?.stepIndex).toBe(2)
      expect(skipEvent?.metadata?.reason).toBe('too_long')
    })

    it('should track help requests', () => {
      analytics.startTourTracking('welcome-tour', 'user123')
      analytics.trackHelpRequested('welcome-tour', 'user123', 1, 'clarification')

      const exportedData = analytics.exportAnalytics()
      const helpEvent = exportedData.events.find(e => e.type === 'help_requested')
      expect(helpEvent?.stepIndex).toBe(1)
      expect(helpEvent?.metadata?.helpType).toBe('clarification')
    })
  })

  describe('Metrics Calculation', () => {
    beforeEach(() => {
      // Set up test data
      analytics.startTourTracking('welcome-tour', 'user1')
      analytics.trackStepViewed('welcome-tour', 'user1', 0)
      analytics.trackStepCompleted('welcome-tour', 'user1', 0, 3000)
      analytics.trackStepViewed('welcome-tour', 'user1', 1)
      analytics.trackStepCompleted('welcome-tour', 'user1', 1, 4000)
      analytics.trackTourCompleted('welcome-tour', 'user1', 7000)

      analytics.startTourTracking('welcome-tour', 'user2')
      analytics.trackStepViewed('welcome-tour', 'user2', 0)
      analytics.trackTourSkipped('welcome-tour', 'user2', 0, 'not_interested')

      analytics.startTourTracking('welcome-tour', 'user3')
      analytics.trackStepViewed('welcome-tour', 'user3', 0)
      analytics.trackHelpRequested('welcome-tour', 'user3', 0, 'clarification')
      analytics.trackStepCompleted('welcome-tour', 'user3', 0, 8000)
      analytics.trackTourCompleted('welcome-tour', 'user3', 8000)
    })

    it('should calculate tour metrics correctly', () => {
      const metrics = analytics.calculateTourMetrics('welcome-tour')

      expect(metrics.startRate).toBeGreaterThan(0)
      expect(metrics.completionRate).toBeCloseTo(66.67, 1) // 2 out of 3 completed
      expect(metrics.helpRequests).toBe(1)
      expect(metrics.skipRate).toBeCloseTo(33.33, 1) // 1 out of 3 skipped
      expect(metrics.dropoffPoints).toEqual([0])
      expect(metrics.averageDuration).toBe(7500) // (7000 + 8000) / 2
    })

    it('should calculate step metrics correctly', () => {
      const metrics = analytics.calculateTourMetrics('welcome-tour')
      
      expect(metrics.stepMetrics).toHaveLength(2) // Steps 0 and 1
      
      const step0Metrics = metrics.stepMetrics.find(s => s.stepIndex === 0)
      expect(step0Metrics?.viewCount).toBe(3) // All 3 users viewed step 0
      expect(step0Metrics?.completionCount).toBe(2) // 2 users completed step 0
      expect(step0Metrics?.dropoffCount).toBe(1) // 1 user dropped off at step 0
      expect(step0Metrics?.helpRequestCount).toBe(1) // 1 help request at step 0

      const step1Metrics = metrics.stepMetrics.find(s => s.stepIndex === 1)
      expect(step1Metrics?.viewCount).toBe(1) // Only user1 reached step 1
      expect(step1Metrics?.completionCount).toBe(1)
    })

    it('should handle empty analytics gracefully', () => {
      const emptyAnalytics = new TourAnalyticsEngine()
      const metrics = emptyAnalytics.calculateTourMetrics('nonexistent-tour')

      expect(metrics.startRate).toBe(0)
      expect(metrics.completionRate).toBe(0)
      expect(metrics.helpRequests).toBe(0)
      expect(metrics.skipRate).toBe(0)
      expect(metrics.dropoffPoints).toEqual([])
      expect(metrics.averageDuration).toBe(0)
      expect(metrics.stepMetrics).toEqual([])

      emptyAnalytics.destroy()
    })
  })

  describe('Data Management', () => {
    it('should export analytics data correctly', () => {
      analytics.startTourTracking('test-tour', 'user1')
      
      const exportedData = analytics.exportAnalytics()
      
      expect(exportedData.events).toBeInstanceOf(Array)
      expect(exportedData.analytics).toBeInstanceOf(Array)
      expect(exportedData.sessionId).toBeDefined()
      expect(exportedData.exportedAt).toBeInstanceOf(Date)
    })

    it('should clear analytics data', () => {
      analytics.startTourTracking('test-tour', 'user1')
      analytics.trackStepViewed('test-tour', 'user1', 0)
      
      expect(analytics.exportAnalytics().events.length).toBeGreaterThan(0)
      
      analytics.clearAnalytics()
      
      expect(analytics.exportAnalytics().events).toHaveLength(0)
      expect(analytics.exportAnalytics().analytics).toHaveLength(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_analytics')
    })

    it('should flush events when batch size is reached', () => {
      // Track 5 events (batch size)
      for (let i = 0; i < 5; i++) {
        analytics.trackEvent({
          type: 'step_viewed',
          stepIndex: i,
          metadata: { tourId: 'test', userId: 'user1' }
        })
      }

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('Storage Integration', () => {
    it('should store analytics to localStorage', () => {
      analytics.trackEvent({
        type: 'tour_started',
        metadata: { tourId: 'test', userId: 'user1' }
      })

      analytics.flush()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test_analytics',
        expect.stringContaining('"events"')
      )
    })

    it('should load analytics from localStorage', () => {
      const storedData = {
        events: [{
          type: 'tour_started',
          timestamp: new Date().toISOString(),
          metadata: { tourId: 'stored-tour', userId: 'stored-user' }
        }],
        analytics: [],
        sessionId: 'stored-session'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData))

      const newAnalytics = new TourAnalyticsEngine({
        storageKey: 'test_analytics'
      })

      const exportedData = newAnalytics.exportAnalytics()
      expect(exportedData.events).toHaveLength(1)
      expect(exportedData.events[0].metadata?.tourId).toBe('stored-tour')

      newAnalytics.destroy()
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => {
        const newAnalytics = new TourAnalyticsEngine()
        newAnalytics.destroy()
      }).not.toThrow()
    })
  })

  describe('API Integration', () => {
    it('should send analytics to API endpoint', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const apiAnalytics = new TourAnalyticsEngine({
        apiEndpoint: 'https://api.example.com/analytics',
        batchSize: 1
      })

      apiAnalytics.trackEvent({
        type: 'tour_started',
        metadata: { tourId: 'test', userId: 'user1' }
      })

      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"events"')
        })
      )

      apiAnalytics.destroy()
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValue(new Error('Network error'))

      const apiAnalytics = new TourAnalyticsEngine({
        apiEndpoint: 'https://api.example.com/analytics',
        batchSize: 1
      })

      // Should not throw
      expect(() => {
        apiAnalytics.trackEvent({
          type: 'tour_started',
          metadata: { tourId: 'test', userId: 'user1' }
        })
      }).not.toThrow()

      apiAnalytics.destroy()
    })
  })

  describe('Real-time Events', () => {
    it('should emit real-time events when enabled', () => {
      const realtimeAnalytics = new TourAnalyticsEngine({
        enableRealTime: true
      })

      const eventListener = jest.fn()
      window.addEventListener('tour-analytics-event', eventListener)

      realtimeAnalytics.trackEvent({
        type: 'step_viewed',
        stepIndex: 0,
        metadata: { tourId: 'test', userId: 'user1' }
      })

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: 'step_viewed',
            stepIndex: 0
          })
        })
      )

      window.removeEventListener('tour-analytics-event', eventListener)
      realtimeAnalytics.destroy()
    })
  })
})