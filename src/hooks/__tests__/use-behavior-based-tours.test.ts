import { renderHook, act } from '@testing-library/react'
import { useBehaviorBasedTours, useSimpleBehaviorTours, useAdvancedBehaviorTours } from '../use-behavior-based-tours'

// Mock the tour hooks
jest.mock('../use-tour', () => ({
  useTour: () => ({
    startTour: jest.fn().mockResolvedValue(true)
  })
}))

jest.mock('../use-tour-progress', () => ({
  useTourProgress: () => ({
    trackAnalyticsEvent: jest.fn()
  })
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    events: {
      on: jest.fn(),
      off: jest.fn()
    }
  })
}))

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

Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
  writable: true
})

describe('useBehaviorBasedTours', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Hook Functionality', () => {
    it('should initialize correctly with default configuration', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      expect(result.current).toBeDefined()
      expect(result.current.activeSuggestion).toBeNull()
      expect(result.current.pendingSuggestions).toEqual([])
      expect(result.current.queueStatus.pending).toBe(0)
      expect(result.current.queueStatus.active).toBe(false)
    })

    it('should initialize with custom configuration', () => {
      const customConfig = {
        maxSuggestionsPerSession: 5,
        enableAnalytics: false,
        debugMode: true
      }

      const { result } = renderHook(() => useBehaviorBasedTours(customConfig))

      expect(result.current).toBeDefined()
      expect(result.current.debugInfo).toBeDefined()
    })
  })

  describe('Suggestion Management', () => {
    it('should handle manual suggestion triggering', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        const success = result.current.triggerManualSuggestion('welcome-tour', 'Test message')
        expect(typeof success).toBe('boolean')
      })
    })

    it('should handle suggestion dismissal', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        const success = result.current.dismissSuggestion(undefined, 'Not interested')
        expect(typeof success).toBe('boolean')
      })
    })

    it('should handle suggestion acceptance', async () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      await act(async () => {
        const success = await result.current.acceptSuggestion()
        expect(typeof success).toBe('boolean')
      })
    })

    it('should show next suggestion', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        const success = result.current.showNextSuggestion()
        expect(typeof success).toBe('boolean')
      })
    })
  })

  describe('User Action Tracking', () => {
    it('should track user actions correctly', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        result.current.trackUserAction('click', true, { element: 'button' })
        result.current.trackUserAction('form_submit', false, { form: 'login' })
      })

      // Should not throw errors
      expect(result.current).toBeDefined()
    })

    it('should track errors correctly', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        result.current.trackError('validation_error', '/dashboard')
        result.current.trackError('network_error', '/api/data')
      })

      expect(result.current).toBeDefined()
    })

    it('should track feature usage correctly', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        result.current.trackFeatureUsage('content-generation')
        result.current.trackFeatureUsage('campaign-management')
      })

      expect(result.current).toBeDefined()
    })

    it('should track help requests correctly', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        result.current.trackHelpRequest('/dashboard')
        result.current.trackHelpRequest('/content')
      })

      expect(result.current).toBeDefined()
    })
  })

  describe('Analytics', () => {
    it('should provide analytics data', () => {
      const { result } = renderHook(() => useBehaviorBasedTours({ enableAnalytics: true }))

      act(() => {
        const analyticsData = result.current.getAnalyticsData()
        expect(typeof analyticsData).toBe('object')
      })
    })

    it('should handle analytics when disabled', () => {
      const { result } = renderHook(() => useBehaviorBasedTours({ enableAnalytics: false }))

      act(() => {
        const analyticsData = result.current.getAnalyticsData()
        expect(typeof analyticsData).toBe('object')
      })
    })
  })

  describe('Configuration Updates', () => {
    it('should handle configuration updates', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      act(() => {
        result.current.updateConfig({
          maxSuggestionsPerSession: 10,
          enableAnalytics: false
        })
      })

      expect(result.current).toBeDefined()
    })
  })

  describe('Navigation Handling', () => {
    it('should handle page navigation events', () => {
      const { result } = renderHook(() => useBehaviorBasedTours())

      // Simulate navigation
      act(() => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/content' },
          writable: true
        })

        // Trigger popstate event
        const event = new PopStateEvent('popstate')
        window.dispatchEvent(event)
      })

      expect(result.current).toBeDefined()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = renderHook(() => useBehaviorBasedTours())

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Debug Mode', () => {
    it('should provide debug information when enabled', () => {
      const { result } = renderHook(() => useBehaviorBasedTours({ debugMode: true }))

      expect(result.current.debugInfo).toBeDefined()
      expect(result.current.debugInfo?.engineStatus).toBeDefined()
    })

    it('should not provide debug information when disabled', () => {
      const { result } = renderHook(() => useBehaviorBasedTours({ debugMode: false }))

      expect(result.current.debugInfo).toBeUndefined()
    })
  })
})

describe('useSimpleBehaviorTours', () => {
  it('should provide simplified interface', () => {
    const { result } = renderHook(() => useSimpleBehaviorTours())

    expect(result.current).toBeDefined()
    expect(result.current.suggestion).toBeNull()
    expect(typeof result.current.acceptSuggestion).toBe('function')
    expect(typeof result.current.dismissSuggestion).toBe('function')
    expect(typeof result.current.trackUserAction).toBe('function')
    expect(typeof result.current.trackError).toBe('function')
    expect(typeof result.current.trackFeatureUsage).toBe('function')
  })

  it('should handle suggestion interactions', async () => {
    const { result } = renderHook(() => useSimpleBehaviorTours())

    await act(async () => {
      const acceptResult = await result.current.acceptSuggestion()
      expect(typeof acceptResult).toBe('boolean')
    })

    act(() => {
      const dismissResult = result.current.dismissSuggestion()
      expect(typeof dismissResult).toBe('boolean')
    })
  })

  it('should handle tracking methods', () => {
    const { result } = renderHook(() => useSimpleBehaviorTours())

    act(() => {
      result.current.trackUserAction('click', true)
      result.current.trackError('form_error')
      result.current.trackFeatureUsage('content-generation')
    })

    expect(result.current).toBeDefined()
  })
})

describe('useAdvancedBehaviorTours', () => {
  it('should provide advanced configuration', () => {
    const { result } = renderHook(() => useAdvancedBehaviorTours())

    expect(result.current).toBeDefined()
    expect(result.current.queueStatus).toBeDefined()
    expect(result.current.pendingSuggestions).toBeDefined()
    expect(typeof result.current.getAnalyticsData).toBe('function')
  })

  it('should enable debug mode in development', () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const { result } = renderHook(() => useAdvancedBehaviorTours())

    expect(result.current.debugInfo).toBeDefined()

    // Restore environment
    process.env.NODE_ENV = originalEnv
  })

  it('should provide comprehensive tracking', () => {
    const { result } = renderHook(() => useAdvancedBehaviorTours())

    act(() => {
      result.current.trackUserAction('complex_action', true, {
        feature: 'advanced-feature',
        context: 'test'
      })
      
      result.current.trackError('advanced_error', '/complex-page')
      result.current.trackFeatureUsage('advanced-feature')
      result.current.trackHelpRequest('/help-context')
    })

    expect(result.current).toBeDefined()
  })

  it('should handle manual suggestions', () => {
    const { result } = renderHook(() => useAdvancedBehaviorTours())

    act(() => {
      const success = result.current.triggerManualSuggestion(
        'advanced-tour',
        'Advanced tour message'
      )
      expect(typeof success).toBe('boolean')
    })
  })

  it('should provide queue management', () => {
    const { result } = renderHook(() => useAdvancedBehaviorTours())

    expect(result.current.queueStatus).toEqual({
      pending: 0,
      active: false,
      dismissed: 0,
      completed: 0,
      suggestionsThisSession: 0
    })

    expect(Array.isArray(result.current.pendingSuggestions)).toBe(true)
  })

  it('should handle analytics data retrieval', () => {
    const { result } = renderHook(() => useAdvancedBehaviorTours())

    act(() => {
      const analyticsData = result.current.getAnalyticsData()
      expect(typeof analyticsData).toBe('object')
      expect(analyticsData).toBeDefined()
    })
  })

  it('should handle configuration updates', () => {
    const { result } = renderHook(() => useAdvancedBehaviorTours())

    act(() => {
      result.current.updateConfig({
        maxSuggestionsPerSession: 10,
        behaviorConfig: {
          triggerSensitivity: 'low'
        }
      })
    })

    expect(result.current).toBeDefined()
  })
})

describe('Hook Integration', () => {
  it('should work with different configurations simultaneously', () => {
    const { result: simple } = renderHook(() => useSimpleBehaviorTours())
    const { result: advanced } = renderHook(() => useAdvancedBehaviorTours())

    expect(simple.current).toBeDefined()
    expect(advanced.current).toBeDefined()
    
    // Both should be independent
    expect(simple.current.suggestion).toBeNull()
    expect(advanced.current.activeSuggestion).toBeNull()
  })

  it('should handle errors gracefully', () => {
    const { result } = renderHook(() => useBehaviorBasedTours())

    expect(() => {
      act(() => {
        result.current.trackUserAction('', false)
        result.current.trackError('')
        result.current.trackFeatureUsage('')
      })
    }).not.toThrow()
  })

  it('should maintain state consistency', () => {
    const { result, rerender } = renderHook(() => useBehaviorBasedTours())

    const initialState = result.current.queueStatus

    rerender()

    expect(result.current.queueStatus).toEqual(initialState)
  })
})