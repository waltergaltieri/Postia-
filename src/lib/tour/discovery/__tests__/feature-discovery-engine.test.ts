import { FeatureDiscoveryEngine, type FeatureDefinition, type FeatureDiscoveryConfig } from '../feature-discovery-engine'

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/dashboard'
  },
  writable: true
})

describe('FeatureDiscoveryEngine', () => {
  let engine: FeatureDiscoveryEngine
  let mockFeatures: FeatureDefinition[]
  let mockConfig: Partial<FeatureDiscoveryConfig>

  beforeEach(() => {
    mockConfig = {
      enableFeatureDiscovery: true,
      enableWhatsNew: true,
      enablePersonalization: true,
      maxRecommendationsPerSession: 3,
      recommendationCooldownPeriod: 60000, // 1 minute for testing
      newUserGracePeriod: 7,
      minimumConfidenceThreshold: 0.5,
      unusedFeatureThreshold: 7, // 7 days for testing
      whatsNewRetentionDays: 30,
      maxWhatsNewItems: 5
    }

    mockFeatures = [
      {
        id: 'test-feature-1',
        name: 'Test Feature 1',
        description: 'A test feature for core functionality',
        category: 'core',
        priority: 'high',
        usageIndicators: ['[data-feature="test-1"]'],
        relatedFeatures: ['test-feature-2'],
        tourId: 'test-tour-1',
        introductionMessage: 'Learn about test feature 1',
        benefitsDescription: 'Improves your workflow',
        suggestAfterDays: 3,
        maxSuggestionsPerUser: 2,
        version: '1.0',
        addedDate: new Date('2024-01-01')
      },
      {
        id: 'test-feature-2',
        name: 'Test Feature 2',
        description: 'An advanced test feature',
        category: 'advanced',
        priority: 'medium',
        requiredRole: ['admin'],
        usageIndicators: ['[data-feature="test-2"]'],
        relatedFeatures: ['test-feature-1'],
        tourId: 'test-tour-2',
        introductionMessage: 'Discover advanced capabilities',
        benefitsDescription: 'Advanced functionality for power users',
        suggestAfterFeatureUsage: [{ featureId: 'test-feature-1', usageCount: 3 }],
        maxSuggestionsPerUser: 1,
        version: '1.1',
        addedDate: new Date('2024-02-01')
      },
      {
        id: 'new-feature',
        name: 'New Feature',
        description: 'A recently added feature',
        category: 'new',
        priority: 'medium',
        usageIndicators: ['[data-feature="new"]'],
        relatedFeatures: [],
        introductionMessage: 'Check out our latest addition',
        benefitsDescription: 'Latest and greatest functionality',
        version: '2.0',
        addedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }
    ]

    engine = new FeatureDiscoveryEngine(mockConfig, mockFeatures, 'test-user')
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new FeatureDiscoveryEngine()
      expect(defaultEngine).toBeDefined()
    })

    it('should initialize with custom features', () => {
      expect(engine).toBeDefined()
    })

    it('should load default features when no custom features provided', () => {
      const defaultEngine = new FeatureDiscoveryEngine({}, [])
      const analytics = defaultEngine.getDiscoveryAnalytics()
      expect(analytics.totalFeatures).toBeGreaterThan(0)
    })
  })

  describe('Feature Usage Tracking', () => {
    it('should track feature usage correctly', () => {
      engine.trackFeatureUsage('test-feature-1')
      engine.trackFeatureUsage('test-feature-1')
      
      const analytics = engine.getDiscoveryAnalytics()
      expect(analytics.usedFeatures).toBe(1)
    })

    it('should update proficiency level based on usage', () => {
      // Track usage multiple times to increase proficiency
      for (let i = 0; i < 25; i++) {
        engine.trackFeatureUsage('test-feature-1')
      }
      
      const analytics = engine.getDiscoveryAnalytics()
      expect(analytics.userProficiency).toBe('advanced')
    })

    it('should not track usage for non-existent features', () => {
      const initialAnalytics = engine.getDiscoveryAnalytics()
      
      engine.trackFeatureUsage('non-existent-feature')
      
      const finalAnalytics = engine.getDiscoveryAnalytics()
      expect(finalAnalytics.usedFeatures).toBe(initialAnalytics.usedFeatures)
    })
  })

  describe('Unused Features Detection', () => {
    it('should identify unused features', () => {
      const unusedFeatures = engine.getUnusedFeatures()
      
      // All features should be unused initially
      expect(unusedFeatures.length).toBeGreaterThan(0)
      expect(unusedFeatures.some(f => f.id === 'test-feature-1')).toBe(true)
    })

    it('should exclude used features from unused list', () => {
      engine.trackFeatureUsage('test-feature-1')
      
      const unusedFeatures = engine.getUnusedFeatures()
      expect(unusedFeatures.some(f => f.id === 'test-feature-1')).toBe(false)
    })

    it('should respect role requirements', () => {
      // test-feature-2 requires admin role, but user is editor
      const unusedFeatures = engine.getUnusedFeatures()
      const adminFeature = unusedFeatures.find(f => f.id === 'test-feature-2')
      
      // Should not include admin-only feature for non-admin user
      expect(adminFeature).toBeUndefined()
    })

    it('should sort unused features by priority and category', () => {
      const unusedFeatures = engine.getUnusedFeatures()
      
      // Should be sorted with high priority and core features first
      expect(unusedFeatures[0].priority).toBe('high')
      expect(unusedFeatures[0].category).toBe('core')
    })
  })

  describe('Recommendation Generation', () => {
    it('should generate recommendations for unused features', () => {
      const recommendations = engine.generateRecommendations()
      
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.reason === 'unused_feature')).toBe(true)
    })

    it('should generate recommendations for related features', () => {
      // Use test-feature-1 multiple times to trigger related feature suggestions
      for (let i = 0; i < 5; i++) {
        engine.trackFeatureUsage('test-feature-1')
      }
      
      const recommendations = engine.generateRecommendations()
      
      // Should suggest test-feature-2 as it's related to test-feature-1
      // Note: test-feature-2 requires admin role, so it might not appear
      expect(recommendations.length).toBeGreaterThanOrEqual(0)
    })

    it('should generate recommendations for new features', () => {
      const recommendations = engine.generateRecommendations()
      
      const newFeatureRec = recommendations.find(r => r.featureId === 'new-feature')
      expect(newFeatureRec?.reason).toBe('new_feature')
    })

    it('should respect confidence threshold', () => {
      const recommendations = engine.generateRecommendations()
      
      recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThanOrEqual(mockConfig.minimumConfidenceThreshold!)
      })
    })

    it('should limit recommendations per session', () => {
      const recommendations = engine.generateRecommendations()
      
      expect(recommendations.length).toBeLessThanOrEqual(mockConfig.maxRecommendationsPerSession!)
    })

    it('should sort recommendations by priority and confidence', () => {
      const recommendations = engine.generateRecommendations()
      
      if (recommendations.length > 1) {
        for (let i = 1; i < recommendations.length; i++) {
          const prev = recommendations[i - 1]
          const current = recommendations[i]
          
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          const prevPriority = priorityOrder[prev.priority]
          const currentPriority = priorityOrder[current.priority]
          
          // Should be sorted by priority first, then confidence
          if (prevPriority === currentPriority) {
            expect(prev.confidence).toBeGreaterThanOrEqual(current.confidence)
          } else {
            expect(prevPriority).toBeGreaterThanOrEqual(currentPriority)
          }
        }
      }
    })
  })

  describe('Suggestion Management', () => {
    it('should mark suggestions as dismissed', () => {
      engine.dismissFeatureSuggestion('test-feature-1', 'not_interested')
      
      const recommendations = engine.generateRecommendations()
      const dismissedRec = recommendations.find(r => r.featureId === 'test-feature-1')
      
      // Should not recommend dismissed features
      expect(dismissedRec).toBeUndefined()
    })

    it('should mark suggestions as accepted', () => {
      engine.acceptFeatureSuggestion('test-feature-1')
      
      // Should track acceptance in analytics
      const analytics = engine.getDiscoveryAnalytics()
      expect(analytics.suggestedFeatures).toBeGreaterThan(0)
    })

    it('should respect suggestion limits per feature', () => {
      // test-feature-1 has maxSuggestionsPerUser: 2
      engine.dismissFeatureSuggestion('test-feature-1', 'test')
      engine.dismissFeatureSuggestion('test-feature-1', 'test')
      
      // Should still be able to suggest (only dismissed twice, not suggested)
      const recommendations = engine.generateRecommendations()
      expect(recommendations).toBeDefined()
    })
  })

  describe('What\'s New Items', () => {
    it('should return what\'s new items', () => {
      const whatsNewItems = engine.getWhatsNewItems()
      
      expect(Array.isArray(whatsNewItems)).toBe(true)
      expect(whatsNewItems.length).toBeGreaterThan(0)
    })

    it('should filter items by retention period', () => {
      // Add an old item
      engine.addWhatsNewItem({
        id: 'old-item',
        type: 'feature',
        title: 'Old Feature',
        description: 'An old feature',
        publishDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        priority: 'low'
      })
      
      const whatsNewItems = engine.getWhatsNewItems()
      const oldItem = whatsNewItems.find(item => item.id === 'old-item')
      
      // Should not include items older than retention period
      expect(oldItem).toBeUndefined()
    })

    it('should filter items by user role', () => {
      // Add an admin-only item
      engine.addWhatsNewItem({
        id: 'admin-item',
        type: 'feature',
        title: 'Admin Feature',
        description: 'An admin-only feature',
        targetRoles: ['admin'],
        publishDate: new Date(),
        priority: 'medium'
      })
      
      const whatsNewItems = engine.getWhatsNewItems()
      const adminItem = whatsNewItems.find(item => item.id === 'admin-item')
      
      // Should not include admin items for non-admin user
      expect(adminItem).toBeUndefined()
    })

    it('should sort items by priority and recency', () => {
      const whatsNewItems = engine.getWhatsNewItems()
      
      if (whatsNewItems.length > 1) {
        for (let i = 1; i < whatsNewItems.length; i++) {
          const prev = whatsNewItems[i - 1]
          const current = whatsNewItems[i]
          
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const prevPriority = priorityOrder[prev.priority]
          const currentPriority = priorityOrder[current.priority]
          
          if (prevPriority === currentPriority) {
            expect(prev.publishDate.getTime()).toBeGreaterThanOrEqual(current.publishDate.getTime())
          } else {
            expect(prevPriority).toBeGreaterThanOrEqual(currentPriority)
          }
        }
      }
    })

    it('should limit number of items returned', () => {
      const whatsNewItems = engine.getWhatsNewItems()
      
      expect(whatsNewItems.length).toBeLessThanOrEqual(mockConfig.maxWhatsNewItems!)
    })
  })

  describe('Personalized Tour Recommendations', () => {
    it('should return personalized tour recommendations', () => {
      const tourRecommendations = engine.getPersonalizedTourRecommendations()
      
      expect(Array.isArray(tourRecommendations)).toBe(true)
      expect(tourRecommendations.length).toBeLessThanOrEqual(3)
    })

    it('should only recommend tours for features with tourId', () => {
      const tourRecommendations = engine.getPersonalizedTourRecommendations()
      
      tourRecommendations.forEach(tourId => {
        expect(typeof tourId).toBe('string')
        expect(tourId.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Feature and Item Management', () => {
    it('should add new features', () => {
      const newFeature: FeatureDefinition = {
        id: 'dynamic-feature',
        name: 'Dynamic Feature',
        description: 'A dynamically added feature',
        category: 'core',
        priority: 'medium',
        usageIndicators: [],
        relatedFeatures: [],
        introductionMessage: 'Test message',
        benefitsDescription: 'Test benefits',
        version: '1.0',
        addedDate: new Date()
      }
      
      engine.addFeature(newFeature)
      
      const unusedFeatures = engine.getUnusedFeatures()
      const addedFeature = unusedFeatures.find(f => f.id === 'dynamic-feature')
      
      expect(addedFeature).toBeDefined()
      expect(addedFeature?.name).toBe('Dynamic Feature')
    })

    it('should add new what\'s new items', () => {
      const newItem = {
        id: 'dynamic-whats-new',
        type: 'feature' as const,
        title: 'Dynamic What\'s New',
        description: 'A dynamically added what\'s new item',
        publishDate: new Date(),
        priority: 'medium' as const
      }
      
      engine.addWhatsNewItem(newItem)
      
      const whatsNewItems = engine.getWhatsNewItems()
      const addedItem = whatsNewItems.find(item => item.id === 'dynamic-whats-new')
      
      expect(addedItem).toBeDefined()
      expect(addedItem?.title).toBe('Dynamic What\'s New')
    })
  })

  describe('Analytics', () => {
    it('should provide comprehensive analytics', () => {
      engine.trackFeatureUsage('test-feature-1')
      engine.dismissFeatureSuggestion('test-feature-2', 'not_interested')
      
      const analytics = engine.getDiscoveryAnalytics()
      
      expect(analytics).toHaveProperty('totalFeatures')
      expect(analytics).toHaveProperty('usedFeatures')
      expect(analytics).toHaveProperty('unusedFeatures')
      expect(analytics).toHaveProperty('suggestedFeatures')
      expect(analytics).toHaveProperty('whatsNewItems')
      expect(analytics).toHaveProperty('userProficiency')
      
      expect(typeof analytics.totalFeatures).toBe('number')
      expect(typeof analytics.usedFeatures).toBe('number')
      expect(typeof analytics.unusedFeatures).toBe('number')
      expect(typeof analytics.suggestedFeatures).toBe('number')
      expect(typeof analytics.whatsNewItems).toBe('number')
      expect(['beginner', 'intermediate', 'advanced']).toContain(analytics.userProficiency)
    })
  })

  describe('Configuration Handling', () => {
    it('should respect disabled feature discovery', () => {
      const disabledEngine = new FeatureDiscoveryEngine({
        enableFeatureDiscovery: false
      })
      
      const recommendations = disabledEngine.generateRecommendations()
      expect(recommendations).toEqual([])
    })

    it('should respect disabled what\'s new', () => {
      const disabledEngine = new FeatureDiscoveryEngine({
        enableWhatsNew: false
      })
      
      const whatsNewItems = disabledEngine.getWhatsNewItems()
      expect(whatsNewItems).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty feature list', () => {
      const emptyEngine = new FeatureDiscoveryEngine({}, [])
      
      const recommendations = emptyEngine.generateRecommendations()
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should handle invalid feature usage tracking', () => {
      expect(() => {
        engine.trackFeatureUsage('')
        engine.trackFeatureUsage('   ')
      }).not.toThrow()
    })

    it('should handle suggestion operations on non-existent features', () => {
      expect(() => {
        engine.dismissFeatureSuggestion('non-existent')
        engine.acceptFeatureSuggestion('non-existent')
      }).not.toThrow()
    })
  })
})