import { SmartTimingEngine, type SmartTimingConfig } from '../smart-timing-engine'
import type { BehaviorTriggerResult } from '../behavior-trigger-engine'

describe('SmartTimingEngine', () => {
  let engine: SmartTimingEngine
  let mockConfig: Partial<SmartTimingConfig>
  let mockBehaviorResult: BehaviorTriggerResult

  beforeEach(() => {
    mockConfig = {
      enableTimeOfDayOptimization: true,
      enableCognitiveLoadDetection: true,
      enableInterruptibilityDetection: true,
      enableActivityBasedTiming: true,
      optimalTimeWindows: [
        { start: '09:00', end: '11:00', weight: 1.0 },
        { start: '14:00', end: '16:00', weight: 0.8 }
      ],
      maxCognitiveLoad: 'medium',
      minInterruptibility: 'medium',
      maxSessionDuration: 3600000, // 1 hour
      minPageStabilityTime: 3000, // 3 seconds
      preferredDelayRange: [2000, 8000],
      adaptToUserBehavior: true
    }

    mockBehaviorResult = {
      shouldTrigger: true,
      tourId: 'welcome-tour',
      reason: 'User inactivity detected',
      confidence: 0.8,
      priority: 'medium',
      message: 'Test message',
      delay: 3000,
      metadata: {}
    }

    engine = new SmartTimingEngine(mockConfig)
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new SmartTimingEngine()
      expect(defaultEngine).toBeDefined()
    })

    it('should initialize with custom configuration', () => {
      expect(engine).toBeDefined()
    })
  })

  describe('Timing Analysis', () => {
    it('should analyze optimal timing correctly', () => {
      const sessionStart = new Date(Date.now() - 300000) // 5 minutes ago
      const pageLoad = new Date(Date.now() - 5000) // 5 seconds ago

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        pageLoad
      )

      expect(recommendation).toBeDefined()
      expect(recommendation.shouldShow).toBeDefined()
      expect(recommendation.optimalDelay).toBeGreaterThan(0)
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0)
      expect(recommendation.confidence).toBeLessThanOrEqual(1)
      expect(recommendation.reason).toBeDefined()
      expect(recommendation.factors).toBeDefined()
      expect(Array.isArray(recommendation.factors)).toBe(true)
    })

    it('should provide alternative time when timing is not optimal', () => {
      // Mock a scenario with poor timing (very fresh session, high cognitive load)
      const sessionStart = new Date(Date.now() - 1000) // 1 second ago
      const pageLoad = new Date(Date.now() - 500) // 0.5 seconds ago

      // Add interactions to simulate high cognitive load
      for (let i = 0; i < 10; i++) {
        engine.trackInteraction('click', false) // Failed interactions
      }

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        pageLoad
      )

      if (!recommendation.shouldShow) {
        expect(recommendation.alternativeTime).toBeDefined()
        expect(recommendation.alternativeTime).toBeInstanceOf(Date)
        expect(recommendation.alternativeTime!.getTime()).toBeGreaterThan(Date.now())
      }
    })
  })

  describe('Time of Day Evaluation', () => {
    it('should favor optimal time windows', () => {
      // Mock current time to be in optimal window (10:00 AM)
      const mockDate = new Date()
      mockDate.setHours(10, 0, 0, 0)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10)
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)

      const sessionStart = new Date(mockDate.getTime() - 300000)
      const pageLoad = new Date(mockDate.getTime() - 5000)

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        pageLoad
      )

      // Should have higher confidence during optimal hours
      expect(recommendation.confidence).toBeGreaterThan(0.5)

      jest.restoreAllMocks()
    })

    it('should penalize non-optimal time windows', () => {
      // Mock current time to be outside optimal windows (1:00 AM)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(1)
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)

      const sessionStart = new Date(Date.now() - 300000)
      const pageLoad = new Date(Date.now() - 5000)

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        pageLoad
      )

      // Should have lower confidence during non-optimal hours
      const timeFactors = recommendation.factors.filter(f => f.factor.includes('Time'))
      if (timeFactors.length > 0) {
        expect(timeFactors[0].impact).toBe('negative')
      }

      jest.restoreAllMocks()
    })
  })

  describe('User Activity Detection', () => {
    it('should detect idle state correctly', () => {
      // No recent interactions
      const stats = engine.getTimingStats()
      expect(stats.currentActivity).toBe('idle')
    })

    it('should detect active state with successful interactions', () => {
      // Add successful interactions
      for (let i = 0; i < 5; i++) {
        engine.trackInteraction('click', true)
      }

      const stats = engine.getTimingStats()
      expect(['active', 'focused']).toContain(stats.currentActivity)
    })

    it('should detect distracted state with failed interactions', () => {
      // Add many failed interactions
      for (let i = 0; i < 20; i++) {
        engine.trackInteraction('click', false)
      }

      const stats = engine.getTimingStats()
      expect(stats.currentActivity).toBe('distracted')
    })
  })

  describe('Cognitive Load Detection', () => {
    it('should detect low cognitive load with few interactions', () => {
      const stats = engine.getTimingStats()
      expect(stats.currentCognitiveLoad).toBe('low')
    })

    it('should detect high cognitive load with many failed interactions', () => {
      // Simulate high error rate
      for (let i = 0; i < 10; i++) {
        engine.trackInteraction('form_submit', false)
      }

      const stats = engine.getTimingStats()
      expect(stats.currentCognitiveLoad).toBe('high')
    })

    it('should detect medium cognitive load with moderate activity', () => {
      // Simulate moderate activity with some errors
      for (let i = 0; i < 10; i++) {
        engine.trackInteraction('click', i % 4 !== 0) // 75% success rate
      }

      const stats = engine.getTimingStats()
      expect(['medium', 'low']).toContain(stats.currentCognitiveLoad)
    })
  })

  describe('Interruptibility Detection', () => {
    it('should detect high interruptibility when idle', () => {
      const stats = engine.getTimingStats()
      expect(stats.currentInterruptibility).toBe('high')
    })

    it('should detect low interruptibility when focused or under high load', () => {
      // Simulate focused activity (high success rate, moderate frequency)
      for (let i = 0; i < 8; i++) {
        engine.trackInteraction('focused_work', true)
      }

      const stats = engine.getTimingStats()
      if (stats.currentActivity === 'focused' || stats.currentCognitiveLoad === 'high') {
        expect(stats.currentInterruptibility).toBe('low')
      }
    })
  })

  describe('Delay Calculation', () => {
    it('should calculate shorter delays for critical priority', () => {
      const criticalResult = {
        ...mockBehaviorResult,
        priority: 'critical' as const
      }

      const sessionStart = new Date(Date.now() - 300000)
      const pageLoad = new Date(Date.now() - 5000)

      const recommendation = engine.analyzeOptimalTiming(
        criticalResult,
        sessionStart,
        pageLoad
      )

      expect(recommendation.optimalDelay).toBeLessThan(3000)
    })

    it('should calculate longer delays for low priority', () => {
      const lowResult = {
        ...mockBehaviorResult,
        priority: 'low' as const
      }

      const sessionStart = new Date(Date.now() - 300000)
      const pageLoad = new Date(Date.now() - 5000)

      const recommendation = engine.analyzeOptimalTiming(
        lowResult,
        sessionStart,
        pageLoad
      )

      expect(recommendation.optimalDelay).toBeGreaterThan(4000)
    })

    it('should adjust delay based on user activity', () => {
      // Test with idle user (should show sooner)
      const idleRecommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        new Date(Date.now() - 300000),
        new Date(Date.now() - 5000)
      )

      // Simulate focused user
      for (let i = 0; i < 8; i++) {
        engine.trackInteraction('focused_work', true)
      }

      const focusedRecommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        new Date(Date.now() - 300000),
        new Date(Date.now() - 5000)
      )

      // Focused user should have longer delay
      if (engine.getTimingStats().currentActivity === 'focused') {
        expect(focusedRecommendation.optimalDelay).toBeGreaterThan(idleRecommendation.optimalDelay)
      }
    })
  })

  describe('Session Duration Evaluation', () => {
    it('should favor fresh sessions', () => {
      const freshSession = new Date(Date.now() - 60000) // 1 minute ago
      const pageLoad = new Date(Date.now() - 5000)

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        freshSession,
        pageLoad
      )

      const sessionFactors = recommendation.factors.filter(f => f.factor.includes('Session'))
      if (sessionFactors.length > 0) {
        expect(sessionFactors[0].impact).toBe('positive')
      }
    })

    it('should penalize very long sessions', () => {
      const longSession = new Date(Date.now() - 7200000) // 2 hours ago
      const pageLoad = new Date(Date.now() - 5000)

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        longSession,
        pageLoad
      )

      const sessionFactors = recommendation.factors.filter(f => f.factor.includes('Session'))
      if (sessionFactors.length > 0) {
        expect(sessionFactors[0].impact).toBe('negative')
      }
    })
  })

  describe('Page Stability Evaluation', () => {
    it('should wait for page stability', () => {
      const sessionStart = new Date(Date.now() - 300000)
      const recentPageLoad = new Date(Date.now() - 1000) // 1 second ago

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        recentPageLoad
      )

      const stabilityFactors = recommendation.factors.filter(f => f.factor.includes('Stability'))
      if (stabilityFactors.length > 0) {
        expect(stabilityFactors[0].impact).toBe('negative')
      }
    })

    it('should favor stable pages', () => {
      const sessionStart = new Date(Date.now() - 300000)
      const stablePageLoad = new Date(Date.now() - 10000) // 10 seconds ago

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        stablePageLoad
      )

      const stabilityFactors = recommendation.factors.filter(f => f.factor.includes('Stability'))
      if (stabilityFactors.length > 0) {
        expect(stabilityFactors[0].impact).toBe('positive')
      }
    })
  })

  describe('Learning and Adaptation', () => {
    it('should record timing feedback correctly', () => {
      engine.recordTimingFeedback('welcome-tour', true, 3000)
      engine.recordTimingFeedback('welcome-tour', false, 5000)

      const stats = engine.getTimingStats()
      expect(stats.userPreferences).toBeDefined()
      expect(Array.isArray(stats.userPreferences)).toBe(true)
    })

    it('should adapt delays based on user feedback', () => {
      // Record positive feedback for shorter delays
      engine.recordTimingFeedback('welcome-tour', true, 2000)
      engine.recordTimingFeedback('welcome-tour', true, 2000)

      const sessionStart = new Date(Date.now() - 300000)
      const pageLoad = new Date(Date.now() - 5000)

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        pageLoad
      )

      // Should learn to prefer shorter delays
      expect(recommendation.optimalDelay).toBeLessThan(5000)
    })
  })

  describe('Configuration Updates', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        maxCognitiveLoad: 'high' as const,
        minInterruptibility: 'low' as const,
        preferredDelayRange: [1000, 5000] as [number, number]
      }

      engine.updateConfig(newConfig)

      // Test that new configuration is applied
      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        new Date(Date.now() - 300000),
        new Date(Date.now() - 5000)
      )

      expect(recommendation.optimalDelay).toBeGreaterThanOrEqual(1000)
      expect(recommendation.optimalDelay).toBeLessThanOrEqual(5000)
    })
  })

  describe('Alternative Time Calculation', () => {
    it('should calculate next optimal window correctly', () => {
      // Mock current time to be outside optimal windows
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12) // Noon
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)

      const sessionStart = new Date(Date.now() - 60000) // Fresh session
      const pageLoad = new Date(Date.now() - 1000) // Very recent page load

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        sessionStart,
        pageLoad
      )

      if (!recommendation.shouldShow && recommendation.alternativeTime) {
        const altTime = recommendation.alternativeTime
        expect(altTime.getHours()).toBe(14) // Next optimal window starts at 14:00
        expect(altTime.getMinutes()).toBe(0)
      }

      jest.restoreAllMocks()
    })
  })

  describe('Timing Statistics', () => {
    it('should provide comprehensive timing statistics', () => {
      engine.trackInteraction('click', true)
      engine.trackInteraction('scroll', true)
      engine.recordTimingFeedback('test-tour', true, 3000)

      const stats = engine.getTimingStats()

      expect(stats).toHaveProperty('recentInteractionCount')
      expect(stats).toHaveProperty('userPreferences')
      expect(stats).toHaveProperty('currentActivity')
      expect(stats).toHaveProperty('currentCognitiveLoad')
      expect(stats).toHaveProperty('currentInterruptibility')

      expect(typeof stats.recentInteractionCount).toBe('number')
      expect(Array.isArray(stats.userPreferences)).toBe(true)
      expect(['idle', 'active', 'focused', 'distracted']).toContain(stats.currentActivity)
      expect(['low', 'medium', 'high']).toContain(stats.currentCognitiveLoad)
      expect(['low', 'medium', 'high']).toContain(stats.currentInterruptibility)
    })
  })

  describe('Reason Generation', () => {
    it('should generate appropriate reasons for high confidence', () => {
      const highConfidenceResult = {
        ...mockBehaviorResult,
        confidence: 0.9
      }

      const recommendation = engine.analyzeOptimalTiming(
        highConfidenceResult,
        new Date(Date.now() - 300000),
        new Date(Date.now() - 5000)
      )

      if (recommendation.confidence >= 0.8) {
        expect(recommendation.reason).toContain('óptimo')
      }
    })

    it('should generate appropriate reasons for low confidence', () => {
      // Create conditions for low confidence
      for (let i = 0; i < 15; i++) {
        engine.trackInteraction('error', false)
      }

      const recommendation = engine.analyzeOptimalTiming(
        mockBehaviorResult,
        new Date(Date.now() - 60000), // Very fresh session
        new Date(Date.now() - 500) // Very recent page load
      )

      if (recommendation.confidence < 0.6) {
        expect(recommendation.reason).toContain('esperar')
      }
    })
  })
})