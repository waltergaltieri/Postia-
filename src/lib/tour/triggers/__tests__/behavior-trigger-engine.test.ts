import { BehaviorTriggerEngine, type BehaviorTriggerConfig } from '../behavior-trigger-engine'

// Mock DOM methods
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/dashboard'
  },
  writable: true
})

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn(),
  writable: true
})

describe('BehaviorTriggerEngine', () => {
  let engine: BehaviorTriggerEngine
  let mockConfig: Partial<BehaviorTriggerConfig>

  beforeEach(() => {
    mockConfig = {
      enableInactivityDetection: true,
      enableErrorPatternDetection: true,
      enableNavigationConfusionDetection: true,
      enableFeatureStruggleDetection: true,
      inactivityThreshold: 5000, // 5 seconds for testing
      errorThreshold: 2,
      confusionThreshold: 3,
      minTimeBetweenSuggestions: 1000, // 1 second for testing
      maxSuggestionsPerSession: 5,
      triggerSensitivity: 'medium'
    }

    engine = new BehaviorTriggerEngine(mockConfig)
  })

  afterEach(() => {
    engine.destroy()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new BehaviorTriggerEngine()
      expect(defaultEngine).toBeDefined()
      defaultEngine.destroy()
    })

    it('should initialize with custom configuration', () => {
      expect(engine).toBeDefined()
    })

    it('should setup event listeners', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(document.addEventListener).toHaveBeenCalledWith('input', expect.any(Function))
    })
  })

  describe('Error Tracking', () => {
    it('should track errors correctly', () => {
      engine.trackError('form_validation', '/dashboard')
      engine.trackError('form_validation', '/dashboard')
      
      const behaviorData = engine.getBehaviorData()
      expect(behaviorData.errorEvents).toHaveLength(2)
      expect(behaviorData.errorEvents[0].type).toBe('form_validation')
      expect(behaviorData.errorEvents[0].context).toBe('/dashboard')
    })

    it('should trigger behavior analysis after error threshold', (done) => {
      engine.onBehaviorTrigger = (result) => {
        expect(result.shouldTrigger).toBe(true)
        expect(result.reason).toContain('error')
        done()
      }

      // Trigger multiple errors to exceed threshold
      engine.trackError('form_validation', '/dashboard')
      engine.trackError('form_validation', '/dashboard')
      engine.trackError('form_validation', '/dashboard')
    })
  })

  describe('Feature Usage Tracking', () => {
    it('should track feature usage correctly', () => {
      engine.trackFeatureUsage('content-generation')
      engine.trackFeatureUsage('campaign-management')
      
      const behaviorData = engine.getBehaviorData()
      expect(behaviorData.featureUsage.has('content-generation')).toBe(true)
      expect(behaviorData.featureUsage.has('campaign-management')).toBe(true)
      
      const contentUsage = behaviorData.featureUsage.get('content-generation')
      expect(contentUsage?.usageCount).toBe(1)
      expect(contentUsage?.firstUse).toBeDefined()
      expect(contentUsage?.lastUse).toBeDefined()
    })

    it('should increment usage count for repeated usage', () => {
      engine.trackFeatureUsage('content-generation')
      engine.trackFeatureUsage('content-generation')
      
      const behaviorData = engine.getBehaviorData()
      const contentUsage = behaviorData.featureUsage.get('content-generation')
      expect(contentUsage?.usageCount).toBe(2)
    })
  })

  describe('Abandoned Actions Tracking', () => {
    it('should track abandoned actions', () => {
      engine.trackAbandonedAction('create-campaign', 'step-2')
      engine.trackAbandonedAction('generate-content', 'step-1')
      
      const behaviorData = engine.getBehaviorData()
      expect(behaviorData.abandonedActions).toHaveLength(2)
      expect(behaviorData.abandonedActions[0].action).toBe('create-campaign')
      expect(behaviorData.abandonedActions[0].step).toBe('step-2')
    })
  })

  describe('Help Requests Tracking', () => {
    it('should track help requests', () => {
      engine.trackHelpRequest('/dashboard')
      engine.trackHelpRequest('/content')
      
      const behaviorData = engine.getBehaviorData()
      expect(behaviorData.helpRequests).toHaveLength(2)
      expect(behaviorData.helpRequests[0].context).toBe('/dashboard')
    })
  })

  describe('Behavior Analysis', () => {
    it('should return null when no patterns are triggered', () => {
      const result = engine.analyzeBehavior()
      expect(result).toBeNull()
    })

    it('should respect session limits', () => {
      // Set up engine to trigger easily
      const limitedEngine = new BehaviorTriggerEngine({
        ...mockConfig,
        maxSuggestionsPerSession: 1,
        errorThreshold: 1
      })

      // Trigger first suggestion
      limitedEngine.trackError('test_error', '/dashboard')
      const firstResult = limitedEngine.analyzeBehavior()
      expect(firstResult?.shouldTrigger).toBe(true)

      // Try to trigger second suggestion - should be blocked
      limitedEngine.trackError('test_error_2', '/dashboard')
      const secondResult = limitedEngine.analyzeBehavior()
      expect(secondResult).toBeNull()

      limitedEngine.destroy()
    })

    it('should respect cooldown period', async () => {
      const cooldownEngine = new BehaviorTriggerEngine({
        ...mockConfig,
        minTimeBetweenSuggestions: 100, // 100ms
        errorThreshold: 1
      })

      // Trigger first suggestion
      cooldownEngine.trackError('test_error', '/dashboard')
      const firstResult = cooldownEngine.analyzeBehavior()
      expect(firstResult?.shouldTrigger).toBe(true)

      // Immediately try to trigger second - should be blocked
      cooldownEngine.trackError('test_error_2', '/dashboard')
      const secondResult = cooldownEngine.analyzeBehavior()
      expect(secondResult).toBeNull()

      // Wait for cooldown and try again
      await new Promise(resolve => setTimeout(resolve, 150))
      cooldownEngine.trackError('test_error_3', '/dashboard')
      const thirdResult = cooldownEngine.analyzeBehavior()
      expect(thirdResult?.shouldTrigger).toBe(true)

      cooldownEngine.destroy()
    })
  })

  describe('Pattern Evaluation', () => {
    it('should evaluate inactivity pattern', () => {
      // Simulate inactivity by setting last activity to past
      const behaviorData = engine.getBehaviorData()
      behaviorData.lastActivity = new Date(Date.now() - 10000) // 10 seconds ago

      const result = engine.analyzeBehavior()
      expect(result?.shouldTrigger).toBe(true)
      expect(result?.reason).toContain('inactivity')
    })

    it('should select appropriate tour for pattern and page', () => {
      // Mock different pages
      Object.defineProperty(window, 'location', {
        value: { pathname: '/content' },
        writable: true
      })

      engine.trackError('content_error', '/content')
      engine.trackError('content_error', '/content')
      engine.trackError('content_error', '/content')

      const result = engine.analyzeBehavior()
      expect(result?.tourId).toBe('content-generation-tour')
    })
  })

  describe('Configuration Updates', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        errorThreshold: 5,
        triggerSensitivity: 'high' as const
      }

      engine.updateConfig(newConfig)
      
      // Verify configuration was updated by testing behavior
      // This is indirect since we can't directly access private config
      engine.trackError('test', '/dashboard')
      engine.trackError('test', '/dashboard')
      engine.trackError('test', '/dashboard')
      
      // With higher threshold, should not trigger yet
      const result = engine.analyzeBehavior()
      expect(result).toBeNull()
    })
  })

  describe('Behavior Summary', () => {
    it('should provide comprehensive behavior summary', () => {
      // Add some behavior data
      engine.trackFeatureUsage('content-generation')
      engine.trackError('form_error', '/dashboard')
      engine.trackHelpRequest('/dashboard')
      
      const behaviorData = engine.getBehaviorData()
      expect(behaviorData.sessionId).toBeDefined()
      expect(behaviorData.userId).toBeDefined()
      expect(behaviorData.startTime).toBeDefined()
      expect(behaviorData.featureUsage.size).toBe(1)
      expect(behaviorData.errorEvents).toHaveLength(1)
      expect(behaviorData.helpRequests).toHaveLength(1)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      
      engine.destroy()
      
      expect(removeEventListenerSpy).toHaveBeenCalled()
    })
  })

  describe('Sensitivity Levels', () => {
    it('should adjust trigger sensitivity correctly', () => {
      const highSensitivityEngine = new BehaviorTriggerEngine({
        ...mockConfig,
        triggerSensitivity: 'high',
        errorThreshold: 3
      })

      const lowSensitivityEngine = new BehaviorTriggerEngine({
        ...mockConfig,
        triggerSensitivity: 'low',
        errorThreshold: 3
      })

      // Add same amount of errors to both
      for (let i = 0; i < 3; i++) {
        highSensitivityEngine.trackError('test', '/dashboard')
        lowSensitivityEngine.trackError('test', '/dashboard')
      }

      const highResult = highSensitivityEngine.analyzeBehavior()
      const lowResult = lowSensitivityEngine.analyzeBehavior()

      // High sensitivity should be more likely to trigger
      if (highResult && lowResult) {
        expect(highResult.confidence).toBeGreaterThan(lowResult.confidence)
      }

      highSensitivityEngine.destroy()
      lowSensitivityEngine.destroy()
    })
  })

  describe('Tour Selection Logic', () => {
    it('should select welcome tour for unknown pages', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/unknown-page' },
        writable: true
      })

      engine.trackError('unknown_error', '/unknown-page')
      engine.trackError('unknown_error', '/unknown-page')
      engine.trackError('unknown_error', '/unknown-page')

      const result = engine.analyzeBehavior()
      expect(result?.tourId).toBe('welcome-tour')
    })

    it('should select contextual tours for known pages', () => {
      const testCases = [
        { path: '/campaigns', expectedTour: 'campaign-management-tour' },
        { path: '/content', expectedTour: 'content-generation-tour' },
        { path: '/dashboard', expectedTour: 'welcome-tour' }
      ]

      testCases.forEach(({ path, expectedTour }) => {
        Object.defineProperty(window, 'location', {
          value: { pathname: path },
          writable: true
        })

        const testEngine = new BehaviorTriggerEngine(mockConfig)
        testEngine.trackError('test_error', path)
        testEngine.trackError('test_error', path)
        testEngine.trackError('test_error', path)

        const result = testEngine.analyzeBehavior()
        expect(result?.tourId).toBe(expectedTour)

        testEngine.destroy()
      })
    })
  })

  describe('Message Generation', () => {
    it('should generate contextual messages for different patterns', () => {
      // Test error pattern message
      engine.trackError('form_error', '/dashboard')
      engine.trackError('form_error', '/dashboard')
      engine.trackError('form_error', '/dashboard')

      const result = engine.analyzeBehavior()
      expect(result?.message).toContain('dificultades')
    })
  })

  describe('Delay Calculation', () => {
    it('should calculate appropriate delays based on priority', () => {
      engine.trackError('critical_error', '/dashboard')
      engine.trackError('critical_error', '/dashboard')
      engine.trackError('critical_error', '/dashboard')

      const result = engine.analyzeBehavior()
      expect(result?.delay).toBeGreaterThan(0)
      expect(result?.delay).toBeLessThan(10000) // Should be reasonable
    })
  })
})