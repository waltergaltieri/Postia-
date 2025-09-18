import { test, expect, Page } from '@playwright/test'

// Test utilities for tour triggering
async function simulateUserInactivity(page: Page, duration: number) {
  await page.waitForTimeout(duration)
}

async function simulateUserActivity(page: Page) {
  await page.mouse.move(100, 100)
  await page.waitForTimeout(100)
  await page.mouse.move(200, 200)
  await page.waitForTimeout(100)
  await page.click('body')
}

async function simulateFeatureUsage(page: Page, feature: string) {
  await page.evaluate((featureName) => {
    window.postMessage({
      type: 'TRACK_FEATURE_USAGE',
      feature: featureName
    }, '*')
  }, feature)
}

async function simulateError(page: Page, errorType: string) {
  await page.evaluate((type) => {
    window.postMessage({
      type: 'TRACK_ERROR',
      errorType: type
    }, '*')
  }, errorType)
}

test.describe('Tour Triggering and Contextual Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=onboarding-tour-demo--contextual-behavior')
    await page.waitForLoadState('networkidle')
    
    // Initialize tour system
    await page.evaluate(() => {
      window.postMessage({ type: 'INIT_TOUR_SYSTEM' }, '*')
    })
  })

  test.describe('Behavior-Based Tour Triggers', () => {
    test('should trigger help tour after user inactivity', async ({ page }) => {
      // Simulate user inactivity for 30 seconds
      await simulateUserInactivity(page, 30000)

      // Check if inactivity tour suggestion appears
      const inactivitySuggestion = page.locator('[data-testid="inactivity-tour-suggestion"]')
      await expect(inactivitySuggestion).toBeVisible({ timeout: 5000 })
      
      // Verify suggestion content
      await expect(inactivitySuggestion).toContainText('Need help getting started?')
      await expect(inactivitySuggestion).toContainText('Take a quick tour')

      // Accept the suggestion
      await page.click('[data-testid="accept-inactivity-tour"]')
      
      // Verify contextual help tour started
      await expect(page.locator('[data-testid="tour-popover"]')).toBeVisible()
      await expect(page.locator('[data-testid="tour-popover"]')).toContainText('Let us help you')
    })

    test('should not trigger tours when user is active', async ({ page }) => {
      // Simulate continuous user activity
      for (let i = 0; i < 10; i++) {
        await simulateUserActivity(page)
        await page.waitForTimeout(3000)
      }

      // Verify no tour suggestions appear
      const suggestions = page.locator('[data-testid*="tour-suggestion"]')
      await expect(suggestions).toHaveCount(0)
    })

    test('should trigger error recovery tour after repeated errors', async ({ page }) => {
      // Simulate repeated errors
      await simulateError(page, 'content_generation_error')
      await page.waitForTimeout(1000)
      await simulateError(page, 'content_generation_error')
      await page.waitForTimeout(1000)
      await simulateError(page, 'content_generation_error')

      // Check if error recovery tour suggestion appears
      const errorSuggestion = page.locator('[data-testid="error-recovery-tour-suggestion"]')
      await expect(errorSuggestion).toBeVisible({ timeout: 5000 })
      
      await expect(errorSuggestion).toContainText('Having trouble?')
      await expect(errorSuggestion).toContainText('Learn best practices')

      // Start error recovery tour
      await page.click('[data-testid="start-error-recovery-tour"]')
      
      // Verify error recovery tour started
      await expect(page.locator('[data-testid="tour-popover"]')).toBeVisible()
      await expect(page.locator('[data-testid="tour-popover"]')).toContainText('Troubleshooting')
    })

    test('should suggest feature tours for unused features', async ({ page }) => {
      // Wait for feature discovery system to analyze usage
      await page.waitForTimeout(5000)

      // Check if unused feature suggestion appears
      const featureSuggestion = page.locator('[data-testid="unused-feature-suggestion"]')
      await expect(featureSuggestion).toBeVisible({ timeout: 10000 })
      
      await expect(featureSuggestion).toContainText('Discover new features')
      
      // Accept feature discovery tour
      await page.click('[data-testid="start-feature-discovery"]')
      
      // Verify feature discovery tour started
      await expect(page.locator('[data-testid="tour-popover"]')).toBeVisible()
      await expect(page.locator('[data-testid="tour-popover"]')).toContainText('Feature Discovery')
    })
  })

  test.describe('Smart Timing Engine', () => {
    test('should respect user preferences for tour frequency', async ({ page }) => {
      // Set user preference to "once per session"
      await page.evaluate(() => {
        localStorage.setItem('tour-preferences', JSON.stringify({
          tourFrequency: 'once_per_session'
        }))
      })

      // Trigger a tour
      await simulateUserInactivity(page, 30000)
      const firstSuggestion = page.locator('[data-testid="inactivity-tour-suggestion"]')
      await expect(firstSuggestion).toBeVisible()
      
      // Dismiss the tour
      await page.click('[data-testid="dismiss-tour-suggestion"]')

      // Try to trigger the same tour again in the same session
      await simulateUserInactivity(page, 30000)
      
      // Should not appear again in the same session
      await expect(firstSuggestion).not.toBeVisible({ timeout: 5000 })
    })

    test('should prioritize tours based on user context', async ({ page }) => {
      // Navigate to content generation area
      await page.click('[data-testid="content-generation-tab"]')
      
      // Simulate both inactivity and feature access
      await simulateUserInactivity(page, 15000)
      
      // Should prioritize feature-specific tour over general help
      const featureTour = page.locator('[data-testid="content-generation-tour-suggestion"]')
      const generalTour = page.locator('[data-testid="general-help-tour-suggestion"]')
      
      await expect(featureTour).toBeVisible({ timeout: 5000 })
      await expect(generalTour).not.toBeVisible()
    })

    test('should adapt timing based on user skill level', async ({ page }) => {
      // Set user as experienced (completed multiple tours)
      await page.evaluate(() => {
        localStorage.setItem('tour-progress', JSON.stringify({
          'welcome-tour': { status: 'completed' },
          'content-generation-tour': { status: 'completed' },
          'campaign-management-tour': { status: 'completed' }
        }))
      })

      // Experienced users should get fewer and less frequent suggestions
      await simulateUserInactivity(page, 60000) // Longer wait for experienced users
      
      const suggestion = page.locator('[data-testid*="tour-suggestion"]')
      await expect(suggestion).toBeVisible({ timeout: 10000 })
      
      // Should be more advanced/specific suggestions
      await expect(suggestion).toContainText(/advanced|tips|optimization/)
    })
  })

  test.describe('Contextual Tour Suggestions', () => {
    test('should suggest relevant tours based on page context', async ({ page }) => {
      // Navigate to different sections and verify contextual suggestions
      
      // Dashboard context
      await page.click('[data-testid="dashboard-tab"]')
      await page.waitForTimeout(2000)
      
      let contextualSuggestion = page.locator('[data-testid="contextual-tour-suggestion"]')
      await expect(contextualSuggestion).toContainText('Dashboard Overview')

      // Content generation context
      await page.click('[data-testid="content-generation-tab"]')
      await page.waitForTimeout(2000)
      
      await expect(contextualSuggestion).toContainText('Content Creation')

      // Campaign management context
      await page.click('[data-testid="campaigns-tab"]')
      await page.waitForTimeout(2000)
      
      await expect(contextualSuggestion).toContainText('Campaign Management')
    })

    test('should suggest tours based on user role', async ({ page }) => {
      // Set user role to admin
      await page.evaluate(() => {
        window.postMessage({
          type: 'SET_USER_ROLE',
          role: 'admin'
        }, '*')
      })

      await simulateUserInactivity(page, 10000)
      
      const adminSuggestion = page.locator('[data-testid="role-based-tour-suggestion"]')
      await expect(adminSuggestion).toBeVisible()
      await expect(adminSuggestion).toContainText('Admin Features')

      // Change to editor role
      await page.evaluate(() => {
        window.postMessage({
          type: 'SET_USER_ROLE',
          role: 'editor'
        }, '*')
      })

      await page.reload()
      await page.waitForLoadState('networkidle')
      await simulateUserInactivity(page, 10000)
      
      const editorSuggestion = page.locator('[data-testid="role-based-tour-suggestion"]')
      await expect(editorSuggestion).toBeVisible()
      await expect(editorSuggestion).toContainText('Content Creation')
    })

    test('should suggest client-specific tours', async ({ page }) => {
      // Set specific client context
      await page.evaluate(() => {
        window.postMessage({
          type: 'SET_CLIENT_CONTEXT',
          client: {
            id: 'client-123',
            name: 'Acme Corp',
            hasCustomFeatures: true
          }
        }, '*')
      })

      await simulateUserInactivity(page, 10000)
      
      const clientSuggestion = page.locator('[data-testid="client-specific-tour-suggestion"]')
      await expect(clientSuggestion).toBeVisible()
      await expect(clientSuggestion).toContainText('Acme Corp Features')
    })
  })

  test.describe('Tour Suggestion UI', () => {
    test('should display tour suggestions with proper styling', async ({ page }) => {
      await simulateUserInactivity(page, 30000)
      
      const suggestion = page.locator('[data-testid="tour-suggestion"]')
      await expect(suggestion).toBeVisible()
      
      // Check visual elements
      await expect(suggestion.locator('[data-testid="suggestion-icon"]')).toBeVisible()
      await expect(suggestion.locator('[data-testid="suggestion-title"]')).toBeVisible()
      await expect(suggestion.locator('[data-testid="suggestion-description"]')).toBeVisible()
      await expect(suggestion.locator('[data-testid="suggestion-actions"]')).toBeVisible()
      
      // Check action buttons
      await expect(suggestion.locator('[data-testid="accept-suggestion"]')).toBeVisible()
      await expect(suggestion.locator('[data-testid="dismiss-suggestion"]')).toBeVisible()
      await expect(suggestion.locator('[data-testid="not-now-suggestion"]')).toBeVisible()
    })

    test('should handle suggestion interactions correctly', async ({ page }) => {
      await simulateUserInactivity(page, 30000)
      
      const suggestion = page.locator('[data-testid="tour-suggestion"]')
      await expect(suggestion).toBeVisible()
      
      // Test "Not Now" action
      await page.click('[data-testid="not-now-suggestion"]')
      await expect(suggestion).not.toBeVisible()
      
      // Should reappear after some time
      await simulateUserInactivity(page, 60000)
      await expect(suggestion).toBeVisible({ timeout: 10000 })
      
      // Test "Dismiss" action
      await page.click('[data-testid="dismiss-suggestion"]')
      await expect(suggestion).not.toBeVisible()
      
      // Should not reappear for this session
      await simulateUserInactivity(page, 60000)
      await expect(suggestion).not.toBeVisible({ timeout: 5000 })
    })

    test('should animate suggestion appearance and dismissal', async ({ page }) => {
      await simulateUserInactivity(page, 30000)
      
      const suggestion = page.locator('[data-testid="tour-suggestion"]')
      
      // Check for animation classes during appearance
      await expect(suggestion).toHaveClass(/animate-in|fade-in|slide-in/)
      
      // Dismiss and check animation
      await page.click('[data-testid="dismiss-suggestion"]')
      await expect(suggestion).toHaveClass(/animate-out|fade-out|slide-out/)
    })
  })

  test.describe('Tour Analytics Integration', () => {
    test('should track tour suggestion events', async ({ page }) => {
      // Listen for analytics events
      const analyticsEvents: any[] = []
      await page.exposeFunction('trackAnalytics', (event: any) => {
        analyticsEvents.push(event)
      })

      await page.evaluate(() => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'ANALYTICS_EVENT') {
            (window as any).trackAnalytics(event.data)
          }
        })
      })

      await simulateUserInactivity(page, 30000)
      
      const suggestion = page.locator('[data-testid="tour-suggestion"]')
      await expect(suggestion).toBeVisible()
      
      // Accept suggestion
      await page.click('[data-testid="accept-suggestion"]')
      
      // Verify analytics events were tracked
      expect(analyticsEvents).toContainEqual(
        expect.objectContaining({
          type: 'tour_suggestion_shown',
          tourId: expect.any(String)
        })
      )
      
      expect(analyticsEvents).toContainEqual(
        expect.objectContaining({
          type: 'tour_suggestion_accepted',
          tourId: expect.any(String)
        })
      )
    })

    test('should track user behavior patterns', async ({ page }) => {
      const behaviorEvents: any[] = []
      await page.exposeFunction('trackBehavior', (event: any) => {
        behaviorEvents.push(event)
      })

      await page.evaluate(() => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'BEHAVIOR_EVENT') {
            (window as any).trackBehavior(event.data)
          }
        })
      })

      // Simulate various user behaviors
      await simulateUserActivity(page)
      await simulateFeatureUsage(page, 'content-generation')
      await simulateError(page, 'validation_error')
      await simulateUserInactivity(page, 10000)

      // Verify behavior tracking
      expect(behaviorEvents).toContainEqual(
        expect.objectContaining({
          type: 'user_activity',
          timestamp: expect.any(Number)
        })
      )
      
      expect(behaviorEvents).toContainEqual(
        expect.objectContaining({
          type: 'feature_usage',
          feature: 'content-generation'
        })
      )
      
      expect(behaviorEvents).toContainEqual(
        expect.objectContaining({
          type: 'error_occurred',
          errorType: 'validation_error'
        })
      )
    })
  })

  test.describe('Performance and Optimization', () => {
    test('should not impact page performance significantly', async ({ page }) => {
      // Measure performance before tour system initialization
      const beforeMetrics = await page.evaluate(() => performance.now())
      
      // Initialize tour system
      await page.evaluate(() => {
        window.postMessage({ type: 'INIT_TOUR_SYSTEM' }, '*')
      })
      
      // Measure performance after initialization
      const afterMetrics = await page.evaluate(() => performance.now())
      
      const initializationTime = afterMetrics - beforeMetrics
      expect(initializationTime).toBeLessThan(100) // Should initialize quickly
      
      // Test ongoing performance impact
      const startTime = Date.now()
      
      // Simulate normal user activity
      for (let i = 0; i < 10; i++) {
        await simulateUserActivity(page)
        await page.waitForTimeout(1000)
      }
      
      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(15000) // Should not significantly slow down interactions
    })

    test('should handle multiple concurrent tour suggestions efficiently', async ({ page }) => {
      // Trigger multiple conditions that could suggest tours
      await simulateUserInactivity(page, 30000)
      await simulateFeatureUsage(page, 'unused-feature')
      await simulateError(page, 'repeated-error')
      
      // Should show only the highest priority suggestion
      const suggestions = page.locator('[data-testid*="tour-suggestion"]')
      await expect(suggestions).toHaveCount(1)
      
      // Should handle suggestion efficiently
      const startTime = Date.now()
      await page.click('[data-testid="accept-suggestion"]')
      await expect(page.locator('[data-testid="tour-popover"]')).toBeVisible()
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(1000) // Should respond quickly
    })
  })
})