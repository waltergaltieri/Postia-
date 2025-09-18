import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  announceToScreenReader,
  createLiveRegion,
  updateLiveRegion,
  removeLiveRegion,
  setAriaLabel,
  setAriaDescription,
  announceStepChange,
  announceTourStart,
  announceTourComplete,
  ScreenReaderPriority
} from '../screen-reader'

describe('Screen Reader Support', () => {
  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any live regions
    const liveRegions = document.querySelectorAll('[aria-live]')
    liveRegions.forEach(region => region.remove())
  })

  describe('announceToScreenReader', () => {
    it('should create and use live region for announcements', () => {
      const message = 'Test announcement'
      
      announceToScreenReader(message)

      const liveRegion = document.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeInTheDocument()
      expect(liveRegion?.textContent).toBe(message)
    })

    it('should use assertive priority for urgent messages', () => {
      const message = 'Urgent announcement'
      
      announceToScreenReader(message, ScreenReaderPriority.ASSERTIVE)

      const liveRegion = document.querySelector('[aria-live="assertive"]')
      expect(liveRegion).toBeInTheDocument()
      expect(liveRegion?.textContent).toBe(message)
    })

    it('should clear previous announcement before new one', async () => {
      announceToScreenReader('First message')
      
      // Wait for clearing timeout
      await new Promise(resolve => setTimeout(resolve, 100))
      
      announceToScreenReader('Second message')

      const liveRegion = document.querySelector('[aria-live="polite"]')
      expect(liveRegion?.textContent).toBe('Second message')
    })

    it('should handle empty messages gracefully', () => {
      expect(() => {
        announceToScreenReader('')
      }).not.toThrow()

      const liveRegion = document.querySelector('[aria-live]')
      expect(liveRegion).toBeNull()
    })

    it('should handle null/undefined messages', () => {
      expect(() => {
        announceToScreenReader(null as any)
        announceToScreenReader(undefined as any)
      }).not.toThrow()
    })
  })

  describe('createLiveRegion', () => {
    it('should create live region with correct attributes', () => {
      const regionId = 'test-live-region'
      
      const region = createLiveRegion(regionId, ScreenReaderPriority.POLITE)

      expect(region).toBeInTheDocument()
      expect(region.id).toBe(regionId)
      expect(region.getAttribute('aria-live')).toBe('polite')
      expect(region.getAttribute('aria-atomic')).toBe('true')
      expect(region.getAttribute('role')).toBe('status')
    })

    it('should create assertive live region', () => {
      const regionId = 'assertive-region'
      
      const region = createLiveRegion(regionId, ScreenReaderPriority.ASSERTIVE)

      expect(region.getAttribute('aria-live')).toBe('assertive')
      expect(region.getAttribute('role')).toBe('alert')
    })

    it('should not create duplicate regions with same ID', () => {
      const regionId = 'duplicate-test'
      
      const region1 = createLiveRegion(regionId, ScreenReaderPriority.POLITE)
      const region2 = createLiveRegion(regionId, ScreenReaderPriority.POLITE)

      expect(region1).toBe(region2)
      expect(document.querySelectorAll(`#${regionId}`)).toHaveLength(1)
    })

    it('should position live region off-screen', () => {
      const region = createLiveRegion('positioned-region', ScreenReaderPriority.POLITE)

      const styles = window.getComputedStyle(region)
      expect(region.style.position).toBe('absolute')
      expect(region.style.left).toBe('-10000px')
      expect(region.style.width).toBe('1px')
      expect(region.style.height).toBe('1px')
      expect(region.style.overflow).toBe('hidden')
    })
  })

  describe('updateLiveRegion', () => {
    it('should update existing live region content', () => {
      const regionId = 'update-test'
      const region = createLiveRegion(regionId, ScreenReaderPriority.POLITE)
      
      updateLiveRegion(regionId, 'Updated content')

      expect(region.textContent).toBe('Updated content')
    })

    it('should handle non-existent region gracefully', () => {
      expect(() => {
        updateLiveRegion('non-existent', 'Content')
      }).not.toThrow()
    })

    it('should clear content when message is empty', () => {
      const regionId = 'clear-test'
      const region = createLiveRegion(regionId, ScreenReaderPriority.POLITE)
      region.textContent = 'Initial content'
      
      updateLiveRegion(regionId, '')

      expect(region.textContent).toBe('')
    })
  })

  describe('removeLiveRegion', () => {
    it('should remove live region from DOM', () => {
      const regionId = 'remove-test'
      createLiveRegion(regionId, ScreenReaderPriority.POLITE)
      
      expect(document.getElementById(regionId)).toBeInTheDocument()
      
      removeLiveRegion(regionId)
      
      expect(document.getElementById(regionId)).not.toBeInTheDocument()
    })

    it('should handle non-existent region gracefully', () => {
      expect(() => {
        removeLiveRegion('non-existent')
      }).not.toThrow()
    })
  })

  describe('setAriaLabel', () => {
    it('should set aria-label on element', () => {
      const element = document.createElement('button')
      document.body.appendChild(element)
      
      setAriaLabel(element, 'Test label')

      expect(element.getAttribute('aria-label')).toBe('Test label')
    })

    it('should handle null element gracefully', () => {
      expect(() => {
        setAriaLabel(null, 'Label')
      }).not.toThrow()
    })

    it('should remove aria-label when label is empty', () => {
      const element = document.createElement('button')
      element.setAttribute('aria-label', 'Initial label')
      
      setAriaLabel(element, '')

      expect(element.hasAttribute('aria-label')).toBe(false)
    })
  })

  describe('setAriaDescription', () => {
    it('should set aria-describedby with generated ID', () => {
      const element = document.createElement('button')
      document.body.appendChild(element)
      
      setAriaDescription(element, 'Test description')

      const describedBy = element.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      
      const descriptionElement = document.getElementById(describedBy!)
      expect(descriptionElement).toBeInTheDocument()
      expect(descriptionElement?.textContent).toBe('Test description')
    })

    it('should update existing description', () => {
      const element = document.createElement('button')
      document.body.appendChild(element)
      
      setAriaDescription(element, 'First description')
      const firstDescribedBy = element.getAttribute('aria-describedby')
      
      setAriaDescription(element, 'Second description')
      const secondDescribedBy = element.getAttribute('aria-describedby')

      expect(firstDescribedBy).toBe(secondDescribedBy)
      
      const descriptionElement = document.getElementById(secondDescribedBy!)
      expect(descriptionElement?.textContent).toBe('Second description')
    })

    it('should remove description when empty', () => {
      const element = document.createElement('button')
      document.body.appendChild(element)
      
      setAriaDescription(element, 'Description')
      const describedBy = element.getAttribute('aria-describedby')
      
      setAriaDescription(element, '')

      expect(element.hasAttribute('aria-describedby')).toBe(false)
      expect(document.getElementById(describedBy!)).not.toBeInTheDocument()
    })
  })

  describe('Tour-specific announcements', () => {
    describe('announceStepChange', () => {
      it('should announce step change with progress', () => {
        const stepTitle = 'Navigation Overview'
        const currentStep = 2
        const totalSteps = 5
        
        announceStepChange(stepTitle, currentStep, totalSteps)

        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion?.textContent).toContain('Step 2 of 5')
        expect(liveRegion?.textContent).toContain('Navigation Overview')
      })

      it('should handle first step announcement', () => {
        announceStepChange('Welcome', 1, 3)

        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion?.textContent).toContain('Step 1 of 3')
        expect(liveRegion?.textContent).toContain('Welcome')
      })

      it('should handle last step announcement', () => {
        announceStepChange('Completion', 3, 3)

        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion?.textContent).toContain('Final step')
        expect(liveRegion?.textContent).toContain('Completion')
      })
    })

    describe('announceTourStart', () => {
      it('should announce tour start with details', () => {
        const tourName = 'Welcome Tour'
        const totalSteps = 4
        
        announceTourStart(tourName, totalSteps)

        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion?.textContent).toContain('Welcome Tour')
        expect(liveRegion?.textContent).toContain('4 steps')
        expect(liveRegion?.textContent).toContain('started')
      })

      it('should include keyboard navigation instructions', () => {
        announceTourStart('Test Tour', 3)

        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion?.textContent).toContain('Use Tab to navigate')
        expect(liveRegion?.textContent).toContain('Escape to close')
      })
    })

    describe('announceTourComplete', () => {
      it('should announce tour completion', () => {
        const tourName = 'Onboarding Tour'
        
        announceTourComplete(tourName)

        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion?.textContent).toContain('Onboarding Tour')
        expect(liveRegion?.textContent).toContain('completed')
      })

      it('should use assertive priority for completion', () => {
        announceTourComplete('Test Tour')

        const assertiveRegion = document.querySelector('[aria-live="assertive"]')
        expect(assertiveRegion).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Best Practices', () => {
    it('should not announce duplicate messages rapidly', () => {
      const message = 'Duplicate message'
      
      announceToScreenReader(message)
      announceToScreenReader(message)

      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions).toHaveLength(1)
    })

    it('should queue announcements when multiple are made quickly', async () => {
      announceToScreenReader('First message')
      announceToScreenReader('Second message')
      announceToScreenReader('Third message')

      // Should handle queuing gracefully
      const liveRegion = document.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeInTheDocument()
    })

    it('should respect user preferences for reduced announcements', () => {
      // Mock user preference for reduced announcements
      const mockPreference = { reduceAnnouncements: true }
      
      announceToScreenReader('Test message', ScreenReaderPriority.POLITE, mockPreference)

      // Should still announce but potentially with less verbosity
      const liveRegion = document.querySelector('[aria-live]')
      expect(liveRegion).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle DOM manipulation errors gracefully', () => {
      // Mock DOM error
      const originalCreateElement = document.createElement
      document.createElement = vi.fn(() => {
        throw new Error('DOM error')
      })

      expect(() => {
        announceToScreenReader('Test message')
      }).not.toThrow()

      // Restore original method
      document.createElement = originalCreateElement
    })

    it('should handle invalid priority values', () => {
      expect(() => {
        announceToScreenReader('Test', 'invalid' as any)
      }).not.toThrow()
    })

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000)
      
      expect(() => {
        announceToScreenReader(longMessage)
      }).not.toThrow()

      const liveRegion = document.querySelector('[aria-live]')
      expect(liveRegion?.textContent).toBe(longMessage)
    })
  })

  describe('Performance', () => {
    it('should reuse live regions efficiently', () => {
      announceToScreenReader('Message 1')
      announceToScreenReader('Message 2')
      announceToScreenReader('Message 3')

      const liveRegions = document.querySelectorAll('[aria-live="polite"]')
      expect(liveRegions).toHaveLength(1)
    })

    it('should clean up old description elements', () => {
      const element = document.createElement('button')
      document.body.appendChild(element)
      
      setAriaDescription(element, 'Description 1')
      const initialDescriptions = document.querySelectorAll('[id^="description-"]')
      
      setAriaDescription(element, 'Description 2')
      const finalDescriptions = document.querySelectorAll('[id^="description-"]')

      expect(finalDescriptions).toHaveLength(initialDescriptions.length)
    })
  })
})