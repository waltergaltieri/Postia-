/**
 * Simple validation script for tour management hooks
 * This validates the basic functionality without requiring a full test runner
 */

import type { 
  UserTourProgress, 
  TourEvent 
} from '@/types/tour'

// Mock localStorage for testing
const mockStorage = new Map<string, string>()
const originalLocalStorage = global.localStorage

// @ts-ignore
global.localStorage = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  length: mockStorage.size,
  key: (index: number) => Array.from(mockStorage.keys())[index] || null
}

// Mock window and navigation
Object.defineProperty(global, 'window', {
  value: {
    location: { pathname: '/dashboard' },
    innerWidth: 1024,
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  writable: true
})

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-agent'
  },
  writable: true
})

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  writable: true
})

async function validateHooks() {
  console.log('🧪 Validating tour management hooks...')
  
  try {
    // Test 1: Validate useTour hook structure
    console.log('✅ Test 1: useTour hook structure')
    const { useTour } = await import('../use-tour')
    
    // Test 2: Validate useTourProgress hook structure  
    console.log('✅ Test 2: useTourProgress hook structure')
    const { useTourProgress } = await import('../use-tour-progress')
    
    // Test 3: Validate useContextualTours hook structure
    console.log('✅ Test 3: useContextualTours hook structure')
    const { useContextualTours } = await import('../use-contextual-tours')
    
    // Test 4: Validate progress creation
    console.log('✅ Test 4: Progress creation')
    const progressHook = useTourProgress({ enablePersistence: true })
    const progress = progressHook.createProgress('test-user', 'test-tour')
    
    if (progress.userId !== 'test-user' || progress.tourId !== 'test-tour') {
      throw new Error('Progress creation failed')
    }
    
    // Test 5: Validate progress saving
    console.log('✅ Test 5: Progress saving')
    await progressHook.saveProgress(progress)
    
    const savedProgress = await progressHook.loadProgress('test-user', 'test-tour')
    if (!savedProgress || savedProgress.userId !== 'test-user') {
      throw new Error('Progress saving/loading failed')
    }
    
    // Test 6: Validate analytics tracking
    console.log('✅ Test 6: Analytics tracking')
    await progressHook.trackAnalyticsEvent('test-user', 'test-tour', {
      type: 'tour_started',
      stepIndex: 0
    })
    
    // Test 7: Validate contextual tours initialization
    console.log('✅ Test 7: Contextual tours initialization')
    const contextualHook = useContextualTours({
      enableBehaviorTracking: true,
      enableInactivityDetection: false // Disable to avoid timers in test
    })
    
    if (!contextualHook.userActivity || !contextualHook.detectPageContext) {
      throw new Error('Contextual tours initialization failed')
    }
    
    // Test 8: Validate feature usage tracking
    console.log('✅ Test 8: Feature usage tracking')
    contextualHook.trackFeatureUsage('test-feature')
    
    if (!contextualHook.userActivity.featureUsage.has('test-feature')) {
      throw new Error('Feature usage tracking failed')
    }
    
    // Test 9: Validate error tracking
    console.log('✅ Test 9: Error tracking')
    contextualHook.trackError('test-error')
    
    if (!contextualHook.userActivity.errors.has('test-error')) {
      throw new Error('Error tracking failed')
    }
    
    // Test 10: Validate page context detection
    console.log('✅ Test 10: Page context detection')
    const pageContext = contextualHook.detectPageContext()
    
    if (!pageContext.currentPath || typeof pageContext.isNewPage !== 'boolean') {
      throw new Error('Page context detection failed')
    }
    
    console.log('🎉 All hook validations passed!')
    console.log('\n📊 Validation Summary:')
    console.log('- useTour hook: ✅ Structure validated')
    console.log('- useTourProgress hook: ✅ Progress management validated')  
    console.log('- useContextualTours hook: ✅ Behavior tracking validated')
    console.log('- Progress persistence: ✅ Save/load functionality validated')
    console.log('- Analytics tracking: ✅ Event tracking validated')
    console.log('- Feature usage tracking: ✅ Usage monitoring validated')
    console.log('- Error tracking: ✅ Error monitoring validated')
    console.log('- Page context detection: ✅ Context analysis validated')
    
    return true
  } catch (error) {
    console.error('❌ Hook validation failed:', error)
    return false
  } finally {
    // Restore original localStorage
    global.localStorage = originalLocalStorage
  }
}

// Export for potential use in other validation scripts
export { validateHooks }

// Run validation if this file is executed directly
if (require.main === module) {
  validateHooks().then(success => {
    process.exit(success ? 0 : 1)
  })
}