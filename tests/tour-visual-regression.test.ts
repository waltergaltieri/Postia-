import { test, expect, Page } from '@playwright/test'

// Visual test utilities
async function setupTourDemo(page: Page, variant: string = 'default') {
  await page.goto(`/iframe.html?id=onboarding-tour-demo--${variant}`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('[data-testid="demo-ready"]', { timeout: 10000 })
}

async function startTourForVisualTest(page: Page, tourId: string) {
  await page.evaluate((id) => {
    window.postMessage({ type: 'START_TOUR', tourId: id }, '*')
  }, tourId)
  
  await page.waitForSelector('[data-testid="tour-popover"]', { timeout: 5000 })
  // Wait for animations to complete
  await page.waitForTimeout(500)
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((themeName) => {
    document.documentElement.setAttribute('data-theme', themeName)
  }, theme)
  await page.waitForTimeout(200) // Wait for theme transition
}

async function setClientBranding(page: Page, branding: any) {
  await page.evaluate((brandingConfig) => {
    window.postMessage({
      type: 'SET_CLIENT_BRANDING',
      branding: brandingConfig
    }, '*')
  }, branding)
  await page.waitForTimeout(200)
}

test.describe('Tour Visual Regression Tests', () => {
  test.describe('Basic Tour UI Components', () => {
    test('tour popover - default state', async ({ page }) => {
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      const popover = page.locator('[data-testid="tour-popover"]')
      await expect(popover).toHaveScreenshot('tour-popover-default.png')
    })

    test('tour popover - with progress indicator', async ({ page }) => {
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      const popover = page.locator('[data-testid="tour-popover"]')
      const progress = page.locator('[data-testid="tour-progress"]')
      
      await expect(popover).toBeVisible()
      await expect(progress).toBeVisible()
      await expect(popover).toHaveScreenshot('tour-popover-with-progress.png')
    })

    test('tour controls - all states', async ({ page }) => {
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      const controls = page.locator('[data-testid="tour-controls"]')
      
      // First step - previous disabled
      await expect(controls).toHaveScreenshot('tour-controls-first-step.png')
      
      // Middle step - all buttons enabled
      await page.click('[data-testid="tour-next-button"]')
      await page.waitForTimeout(300)
      await expect(controls).toHaveScreenshot('tour-controls-middle-step.png')
      
      // Navigate to last step
      await page.click('[data-testid="tour-next-button"]')
      await page.click('[data-testid="tour-next-button"]')
      await page.click('[data-testid="tour-next-button"]')
      await page.waitForTimeout(300)
      
      // Last step - finish button
      await expect(controls).toHaveScreenshot('tour-controls-last-step.png')
    })

    test('tour spotlight - different positions', async ({ page }) => {
      await setupTourDemo(page, 'spotlight-positions')
      
      // Top position
      await startTourForVisualTest(page, 'spotlight-top-tour')
      await expect(page.locator('[data-testid="tour-spotlight"]')).toHaveScreenshot('spotlight-top.png')
      
      // Bottom position
      await page.evaluate(() => window.postMessage({ type: 'STOP_TOUR' }, '*'))
      await startTourForVisualTest(page, 'spotlight-bottom-tour')
      await expect(page.locator('[data-testid="tour-spotlight"]')).toHaveScreenshot('spotlight-bottom.png')
      
      // Left position
      await page.evaluate(() => window.postMessage({ type: 'STOP_TOUR' }, '*'))
      await startTourForVisualTest(page, 'spotlight-left-tour')
      await expect(page.locator('[data-testid="tour-spotlight"]')).toHaveScreenshot('spotlight-left.png')
      
      // Right position
      await page.evaluate(() => window.postMessage({ type: 'STOP_TOUR' }, '*'))
      await startTourForVisualTest(page, 'spotlight-right-tour')
      await expect(page.locator('[data-testid="tour-spotlight"]')).toHaveScreenshot('spotlight-right.png')
    })
  })

  test.describe('Theme Integration', () => {
    test('light theme - complete tour appearance', async ({ page }) => {
      await setupTourDemo(page)
      await setTheme(page, 'light')
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Full page screenshot with tour
      await expect(page).toHaveScreenshot('tour-light-theme-full.png')
      
      // Individual components
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-popover-light.png')
      await expect(page.locator('[data-testid="tour-controls"]')).toHaveScreenshot('tour-controls-light.png')
      await expect(page.locator('[data-testid="tour-spotlight"]')).toHaveScreenshot('tour-spotlight-light.png')
    })

    test('dark theme - complete tour appearance', async ({ page }) => {
      await setupTourDemo(page)
      await setTheme(page, 'dark')
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Full page screenshot with tour
      await expect(page).toHaveScreenshot('tour-dark-theme-full.png')
      
      // Individual components
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-popover-dark.png')
      await expect(page.locator('[data-testid="tour-controls"]')).toHaveScreenshot('tour-controls-dark.png')
      await expect(page.locator('[data-testid="tour-spotlight"]')).toHaveScreenshot('tour-spotlight-dark.png')
    })

    test('theme transition - smooth animation', async ({ page }) => {
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Start with light theme
      await setTheme(page, 'light')
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('theme-transition-light.png')
      
      // Switch to dark theme
      await setTheme(page, 'dark')
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('theme-transition-dark.png')
    })
  })

  test.describe('Client Branding', () => {
    test('branded tour - custom colors', async ({ page }) => {
      await setupTourDemo(page)
      
      const customBranding = {
        primaryColor: '#FF6B35',
        secondaryColor: '#F7931E',
        accentColor: '#FFD23F',
        brandName: 'Custom Brand'
      }
      
      await setClientBranding(page, customBranding)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-custom-branding.png')
      await expect(page).toHaveScreenshot('tour-branded-full-page.png')
    })

    test('branded tour - with logo', async ({ page }) => {
      await setupTourDemo(page)
      
      const brandingWithLogo = {
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        accentColor: '#60A5FA',
        brandName: 'Acme Corp',
        logoUrl: 'https://via.placeholder.com/120x40/1E40AF/FFFFFF?text=ACME'
      }
      
      await setClientBranding(page, brandingWithLogo)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-with-logo.png')
    })

    test('multiple brand variations', async ({ page }) => {
      await setupTourDemo(page)
      
      const brandVariations = [
        {
          name: 'tech-startup',
          colors: { primaryColor: '#6366F1', secondaryColor: '#8B5CF6', accentColor: '#A855F7' }
        },
        {
          name: 'healthcare',
          colors: { primaryColor: '#059669', secondaryColor: '#10B981', accentColor: '#34D399' }
        },
        {
          name: 'finance',
          colors: { primaryColor: '#DC2626', secondaryColor: '#EF4444', accentColor: '#F87171' }
        }
      ]
      
      for (const brand of brandVariations) {
        await setClientBranding(page, { ...brand.colors, brandName: brand.name })
        await startTourForVisualTest(page, 'welcome-tour')
        
        await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot(`tour-brand-${brand.name}.png`)
        
        // Stop tour before next iteration
        await page.evaluate(() => window.postMessage({ type: 'STOP_TOUR' }, '*'))
        await page.waitForTimeout(300)
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('mobile viewport - portrait', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await setupTourDemo(page, 'mobile-optimized')
      await startTourForVisualTest(page, 'mobile-welcome-tour')
      
      await expect(page).toHaveScreenshot('tour-mobile-portrait.png')
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-popover-mobile.png')
    })

    test('mobile viewport - landscape', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 })
      await setupTourDemo(page, 'mobile-optimized')
      await startTourForVisualTest(page, 'mobile-welcome-tour')
      
      await expect(page).toHaveScreenshot('tour-mobile-landscape.png')
    })

    test('tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page).toHaveScreenshot('tour-tablet.png')
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-popover-tablet.png')
    })

    test('desktop viewport - standard', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 })
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page).toHaveScreenshot('tour-desktop-standard.png')
    })

    test('desktop viewport - wide', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page).toHaveScreenshot('tour-desktop-wide.png')
    })
  })

  test.describe('Accessibility Visual States', () => {
    test('high contrast mode', async ({ page }) => {
      await setupTourDemo(page)
      
      // Enable high contrast mode
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-high-contrast', 'true')
      })
      
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-high-contrast.png')
      await expect(page).toHaveScreenshot('tour-high-contrast-full.png')
    })

    test('reduced motion mode', async ({ page }) => {
      await setupTourDemo(page)
      
      // Enable reduced motion
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-reduced-motion', 'true')
      })
      
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Should show tour without animations
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-reduced-motion.png')
    })

    test('focus states - keyboard navigation', async ({ page }) => {
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Focus on next button
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="tour-controls"]')).toHaveScreenshot('tour-controls-focus-next.png')
      
      // Focus on skip button
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="tour-controls"]')).toHaveScreenshot('tour-controls-focus-skip.png')
      
      // Focus on close button
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="tour-controls"]')).toHaveScreenshot('tour-controls-focus-close.png')
    })
  })

  test.describe('Animation States', () => {
    test('tour entrance animation', async ({ page }) => {
      await setupTourDemo(page)
      
      // Capture before tour starts
      await expect(page).toHaveScreenshot('before-tour-start.png')
      
      // Start tour and capture during entrance animation
      await page.evaluate(() => {
        window.postMessage({ type: 'START_TOUR', tourId: 'welcome-tour' }, '*')
      })
      
      // Capture at different animation stages
      await page.waitForTimeout(100)
      await expect(page).toHaveScreenshot('tour-entrance-100ms.png')
      
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('tour-entrance-300ms.png')
      
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('tour-entrance-complete.png')
    })

    test('step transition animation', async ({ page }) => {
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Capture before step transition
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('before-step-transition.png')
      
      // Trigger step transition
      await page.click('[data-testid="tour-next-button"]')
      
      // Capture during transition
      await page.waitForTimeout(150)
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('step-transition-mid.png')
      
      // Capture after transition
      await page.waitForTimeout(350)
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('step-transition-complete.png')
    })

    test('tour exit animation', async ({ page }) => {
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Capture before exit
      await expect(page).toHaveScreenshot('before-tour-exit.png')
      
      // Trigger tour exit
      await page.click('[data-testid="tour-close-button"]')
      
      // Capture during exit animation
      await page.waitForTimeout(100)
      await expect(page).toHaveScreenshot('tour-exit-100ms.png')
      
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('tour-exit-300ms.png')
      
      // Capture after exit complete
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('tour-exit-complete.png')
    })
  })

  test.describe('Error States', () => {
    test('tour error message display', async ({ page }) => {
      await setupTourDemo(page)
      
      // Trigger tour error
      await page.evaluate(() => {
        window.postMessage({ type: 'START_TOUR', tourId: 'invalid-tour' }, '*')
      })
      
      await page.waitForSelector('[data-testid="tour-error-message"]')
      await expect(page.locator('[data-testid="tour-error-message"]')).toHaveScreenshot('tour-error-message.png')
    })

    test('missing element fallback', async ({ page }) => {
      await setupTourDemo(page)
      
      // Remove an element that the tour expects
      await page.evaluate(() => {
        const element = document.querySelector('#demo-element-2')
        element?.remove()
      })
      
      await startTourForVisualTest(page, 'welcome-tour')
      
      // Navigate to the step with missing element
      await page.click('[data-testid="tour-next-button"]')
      await page.waitForTimeout(500)
      
      // Should show fallback state
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-missing-element-fallback.png')
    })
  })

  test.describe('Tour Suggestion UI', () => {
    test('contextual tour suggestion appearance', async ({ page }) => {
      await setupTourDemo(page, 'contextual-suggestions')
      
      // Trigger contextual suggestion
      await page.evaluate(() => {
        window.postMessage({ type: 'TRIGGER_CONTEXTUAL_SUGGESTION' }, '*')
      })
      
      await page.waitForSelector('[data-testid="tour-suggestion"]')
      await expect(page.locator('[data-testid="tour-suggestion"]')).toHaveScreenshot('contextual-suggestion.png')
      
      // Test different suggestion types
      const suggestionTypes = ['help', 'feature-discovery', 'error-recovery']
      
      for (const type of suggestionTypes) {
        await page.evaluate((suggestionType) => {
          window.postMessage({ 
            type: 'TRIGGER_CONTEXTUAL_SUGGESTION', 
            suggestionType 
          }, '*')
        }, type)
        
        await page.waitForTimeout(300)
        await expect(page.locator('[data-testid="tour-suggestion"]')).toHaveScreenshot(`suggestion-${type}.png`)
      }
    })

    test('suggestion interaction states', async ({ page }) => {
      await setupTourDemo(page, 'contextual-suggestions')
      
      await page.evaluate(() => {
        window.postMessage({ type: 'TRIGGER_CONTEXTUAL_SUGGESTION' }, '*')
      })
      
      const suggestion = page.locator('[data-testid="tour-suggestion"]')
      await expect(suggestion).toBeVisible()
      
      // Hover state
      await suggestion.hover()
      await expect(suggestion).toHaveScreenshot('suggestion-hover.png')
      
      // Focus state on accept button
      await page.keyboard.press('Tab')
      await expect(suggestion).toHaveScreenshot('suggestion-focus-accept.png')
      
      // Focus state on dismiss button
      await page.keyboard.press('Tab')
      await expect(suggestion).toHaveScreenshot('suggestion-focus-dismiss.png')
    })
  })

  test.describe('Cross-browser Consistency', () => {
    test('chromium rendering', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium')
      
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-chromium.png')
    })

    test('firefox rendering', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox')
      
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-firefox.png')
    })

    test('webkit rendering', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit')
      
      await setupTourDemo(page)
      await startTourForVisualTest(page, 'welcome-tour')
      
      await expect(page.locator('[data-testid="tour-popover"]')).toHaveScreenshot('tour-webkit.png')
    })
  })
})