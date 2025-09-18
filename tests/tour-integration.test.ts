import { test, expect, Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

// Test data and utilities
const TOUR_SELECTORS = {
  tourWrapper: '[data-testid="driver-wrapper"]',
  tourPopover: '[data-testid="tour-popover"]',
  tourSpotlight: '[data-testid="tour-spotlight"]',
  tourControls: '[data-testid="tour-controls"]',
  nextButton: '[data-testid="tour-next-button"]',
  previousButton: '[data-testid="tour-previous-button"]',
  skipButton: '[data-testid="tour-skip-button"]',
  closeButton: '[data-testid="tour-close-button"]',
  progressIndicator: '[data-testid="tour-progress"]',
  liveRegion: '[aria-live]'
}

const DEMO_ELEMENTS = {
  welcomeButton: '#welcome-demo-button',
  navigationSidebar: '#navigation-sidebar',
  contentArea: '#content-area',
  userProfile: '#user-profile',
  helpMenu: '#help-menu'
}

// Helper functions
async function startTour(page: Page, tourId: string) {
  await page.evaluate((id) => {
    window.postMessage({ type: 'START_TOUR', tourId: id }, '*')
  }, tourId)
  
  await page.waitForSelector(TOUR_SELECTORS.tourPopover, { timeout: 5000 })
}

async function waitForTourStep(page: Page, stepIndex: number) {
  await page.waitForFunction(
    (index) => {
      const progressElement = document.querySelector('[data-testid="tour-progress"]')
      return progressElement?.textContent?.includes(`${index + 1} of`)
    },
    stepIndex,
    { timeout: 5000 }
  )
}

async function completeTourStep(page: Page) {
  await page.click(TOUR_SELECTORS.nextButton)
  await page.waitForTimeout(500) // Wait for animations
}

test.describe('Tour Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tour demo page
    await page.goto('/iframe.html?id=onboarding-tour-demo--default')
    await page.waitForLoadState('networkidle')
    
    // Ensure demo elements are present
    await page.waitForSelector(DEMO_ELEMENTS.welcomeButton)
  })

  test.describe('Complete Tour Flows', () => {
    test('should complete welcome tour successfully', async ({ page }) => {
      // Start the welcome tour
      await startTour(page, 'welcome-tour')

      // Verify tour started
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toBeVisible()
      await expect(page.locator(TOUR_SELECTORS.tourSpotlight)).toBeVisible()

      // Step 1: Welcome message
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toContainText('Welcome to Postia')
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('1 of 5')
      
      await completeTourStep(page)

      // Step 2: Navigation sidebar
      await waitForTourStep(page, 1)
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toContainText('Navigation')
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('2 of 5')
      
      await completeTourStep(page)

      // Step 3: Content area
      await waitForTourStep(page, 2)
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toContainText('Content Area')
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('3 of 5')
      
      await completeTourStep(page)

      // Step 4: User profile
      await waitForTourStep(page, 3)
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toContainText('Profile')
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('4 of 5')
      
      await completeTourStep(page)

      // Step 5: Help menu (final step)
      await waitForTourStep(page, 4)
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toContainText('Help')
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('5 of 5')
      await expect(page.locator(TOUR_SELECTORS.nextButton)).toContainText('Finish')
      
      // Complete the tour
      await page.click(TOUR_SELECTORS.nextButton)

      // Verify tour completed
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).not.toBeVisible()
      await expect(page.locator('[data-testid="tour-complete-message"]')).toBeVisible()
    })

    test('should handle tour navigation correctly', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Navigate forward through steps
      await completeTourStep(page)
      await completeTourStep(page)
      
      await waitForTourStep(page, 2)
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('3 of 5')

      // Navigate backward
      await page.click(TOUR_SELECTORS.previousButton)
      await waitForTourStep(page, 1)
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('2 of 5')

      // Navigate forward again
      await completeTourStep(page)
      await waitForTourStep(page, 2)
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('3 of 5')
    })

    test('should skip tour correctly', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Verify tour is active
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toBeVisible()

      // Skip the tour
      await page.click(TOUR_SELECTORS.skipButton)

      // Verify tour was skipped
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).not.toBeVisible()
      await expect(page.locator('[data-testid="tour-skipped-message"]')).toBeVisible()
    })

    test('should close tour correctly', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Verify tour is active
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toBeVisible()

      // Close the tour
      await page.click(TOUR_SELECTORS.closeButton)

      // Verify tour was closed
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).not.toBeVisible()
    })
  })

  test.describe('Contextual Tour Behavior', () => {
    test('should trigger contextual tour based on user behavior', async ({ page }) => {
      // Simulate user staying on page without interaction
      await page.waitForTimeout(3000)

      // Check if contextual tour suggestion appears
      const suggestion = page.locator('[data-testid="tour-suggestion"]')
      await expect(suggestion).toBeVisible({ timeout: 10000 })
      
      // Accept the suggestion
      await page.click('[data-testid="accept-tour-suggestion"]')
      
      // Verify contextual tour started
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toBeVisible()
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toContainText('Need help?')
    })

    test('should suggest feature tour when accessing new feature', async ({ page }) => {
      // Navigate to a feature area
      await page.click('[data-testid="content-generation-tab"]')
      
      // Wait for feature tour suggestion
      const featureSuggestion = page.locator('[data-testid="feature-tour-suggestion"]')
      await expect(featureSuggestion).toBeVisible({ timeout: 5000 })
      
      // Start feature tour
      await page.click('[data-testid="start-feature-tour"]')
      
      // Verify feature-specific tour started
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toBeVisible()
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toContainText('Content Generation')
    })

    test('should not show tour suggestions when user is active', async ({ page }) => {
      // Simulate active user behavior
      await page.click(DEMO_ELEMENTS.welcomeButton)
      await page.waitForTimeout(1000)
      await page.click(DEMO_ELEMENTS.navigationSidebar)
      await page.waitForTimeout(1000)
      await page.click(DEMO_ELEMENTS.contentArea)
      
      // Wait and verify no tour suggestions appear
      await page.waitForTimeout(5000)
      const suggestion = page.locator('[data-testid="tour-suggestion"]')
      await expect(suggestion).not.toBeVisible()
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should navigate tour using keyboard', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Test Tab navigation
      await page.keyboard.press('Tab')
      await expect(page.locator(TOUR_SELECTORS.nextButton)).toBeFocused()

      // Test Enter to proceed
      await page.keyboard.press('Enter')
      await waitForTourStep(page, 1)

      // Test Arrow key navigation
      await page.keyboard.press('ArrowRight')
      await waitForTourStep(page, 2)

      // Test Arrow key backward navigation
      await page.keyboard.press('ArrowLeft')
      await waitForTourStep(page, 1)

      // Test Escape to close
      await page.keyboard.press('Escape')
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).not.toBeVisible()
    })

    test('should trap focus within tour controls', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Focus should be trapped within tour controls
      await page.keyboard.press('Tab')
      await expect(page.locator(TOUR_SELECTORS.nextButton)).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(page.locator(TOUR_SELECTORS.skipButton)).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(page.locator(TOUR_SELECTORS.closeButton)).toBeFocused()

      // Tab should cycle back to first control
      await page.keyboard.press('Tab')
      await expect(page.locator(TOUR_SELECTORS.nextButton)).toBeFocused()
    })
  })

  test.describe('Accessibility Compliance', () => {
    test('should be accessible throughout tour flow', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Run accessibility scan on tour start
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])

      // Check accessibility at each step
      for (let step = 0; step < 3; step++) {
        await completeTourStep(page)
        await waitForTourStep(page, step + 1)
        
        const stepScanResults = await new AxeBuilder({ page }).analyze()
        expect(stepScanResults.violations).toEqual([])
      }
    })

    test('should announce tour progress to screen readers', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Check for live region announcements
      const liveRegion = page.locator(TOUR_SELECTORS.liveRegion)
      await expect(liveRegion).toBeVisible()
      await expect(liveRegion).toContainText('Tour started')

      // Check step announcements
      await completeTourStep(page)
      await expect(liveRegion).toContainText('Step 2 of 5')

      await completeTourStep(page)
      await expect(liveRegion).toContainText('Step 3 of 5')
    })

    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Check tour controls have proper ARIA labels
      await expect(page.locator(TOUR_SELECTORS.nextButton)).toHaveAttribute(
        'aria-label', 
        /Next step/
      )
      await expect(page.locator(TOUR_SELECTORS.previousButton)).toHaveAttribute(
        'aria-label', 
        /Previous step/
      )
      await expect(page.locator(TOUR_SELECTORS.skipButton)).toHaveAttribute(
        'aria-label', 
        /Skip tour/
      )
      await expect(page.locator(TOUR_SELECTORS.closeButton)).toHaveAttribute(
        'aria-label', 
        /Close tour/
      )

      // Check progress indicator has proper ARIA attributes
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toHaveAttribute(
        'role', 
        'progressbar'
      )
    })
  })

  test.describe('Visual Regression', () => {
    test('should maintain consistent visual appearance', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Take screenshot of tour start
      await expect(page).toHaveScreenshot('tour-step-1.png')

      // Navigate through steps and capture screenshots
      await completeTourStep(page)
      await waitForTourStep(page, 1)
      await expect(page).toHaveScreenshot('tour-step-2.png')

      await completeTourStep(page)
      await waitForTourStep(page, 2)
      await expect(page).toHaveScreenshot('tour-step-3.png')
    })

    test('should handle different viewport sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await startTour(page, 'welcome-tour')
      await expect(page).toHaveScreenshot('tour-mobile.png')

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()
      await page.waitForSelector(DEMO_ELEMENTS.welcomeButton)
      await startTour(page, 'welcome-tour')
      await expect(page).toHaveScreenshot('tour-tablet.png')

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.reload()
      await page.waitForSelector(DEMO_ELEMENTS.welcomeButton)
      await startTour(page, 'welcome-tour')
      await expect(page).toHaveScreenshot('tour-desktop.png')
    })
  })

  test.describe('Theme Integration', () => {
    test('should adapt to light theme', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light')
      })

      await startTour(page, 'welcome-tour')

      // Verify light theme classes are applied
      await expect(page.locator(TOUR_SELECTORS.tourWrapper)).toHaveClass(/theme-light/)
      await expect(page).toHaveScreenshot('tour-light-theme.png')
    })

    test('should adapt to dark theme', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark')
      })

      await startTour(page, 'welcome-tour')

      // Verify dark theme classes are applied
      await expect(page.locator(TOUR_SELECTORS.tourWrapper)).toHaveClass(/theme-dark/)
      await expect(page).toHaveScreenshot('tour-dark-theme.png')
    })

    test('should apply client branding', async ({ page }) => {
      // Set client branding
      await page.evaluate(() => {
        window.postMessage({
          type: 'SET_CLIENT_BRANDING',
          branding: {
            primaryColor: '#FF0000',
            secondaryColor: '#00FF00',
            accentColor: '#0000FF',
            brandName: 'Test Brand'
          }
        }, '*')
      })

      await startTour(page, 'welcome-tour')

      // Verify branding is applied
      const tourWrapper = page.locator(TOUR_SELECTORS.tourWrapper)
      const styles = await tourWrapper.getAttribute('style')
      expect(styles).toContain('--tour-primary-color: #FF0000')
      
      await expect(page).toHaveScreenshot('tour-branded.png')
    })
  })

  test.describe('Error Handling', () => {
    test('should handle missing tour elements gracefully', async ({ page }) => {
      // Remove a demo element that the tour expects
      await page.evaluate(() => {
        const element = document.querySelector('#navigation-sidebar')
        element?.remove()
      })

      await startTour(page, 'welcome-tour')

      // Tour should still start and handle missing element
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toBeVisible()
      
      // Should skip the missing element step
      await completeTourStep(page)
      await completeTourStep(page)
      
      // Should continue with remaining steps
      await expect(page.locator(TOUR_SELECTORS.progressIndicator)).toContainText('of 4') // One less step
    })

    test('should recover from tour configuration errors', async ({ page }) => {
      // Simulate tour configuration error
      await page.evaluate(() => {
        window.postMessage({
          type: 'SIMULATE_TOUR_ERROR',
          error: 'Configuration invalid'
        }, '*')
      })

      await startTour(page, 'invalid-tour')

      // Should show error message instead of crashing
      await expect(page.locator('[data-testid="tour-error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="tour-error-message"]')).toContainText('Unable to start tour')
    })
  })

  test.describe('Performance', () => {
    test('should load tour quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await startTour(page, 'welcome-tour')
      await expect(page.locator(TOUR_SELECTORS.tourPopover)).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(2000) // Should load within 2 seconds
    })

    test('should handle rapid navigation without issues', async ({ page }) => {
      await startTour(page, 'welcome-tour')

      // Rapidly navigate through steps
      for (let i = 0; i < 4; i++) {
        await page.click(TOUR_SELECTORS.nextButton)
        await page.waitForTimeout(100) // Minimal wait
      }

      // Should complete successfully
      await expect(page.locator('[data-testid="tour-complete-message"]')).toBeVisible()
    })
  })
})