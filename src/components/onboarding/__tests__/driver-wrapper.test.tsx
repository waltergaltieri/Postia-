import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DriverWrapper from '../driver-wrapper'
import { DriverConfig, ClientBranding } from '@/types/tour'

// Mock Driver.js
const mockDriver = {
  highlight: vi.fn(),
  destroy: vi.fn(),
  moveNext: vi.fn(),
  movePrevious: vi.fn(),
  hasNextStep: vi.fn(() => true),
  hasPreviousStep: vi.fn(() => false),
  getActiveIndex: vi.fn(() => 0),
  getTotalSteps: vi.fn(() => 2),
  isActivated: vi.fn(() => true)
}

vi.mock('driver.js', () => ({
  driver: vi.fn(() => mockDriver)
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

// Mock accessibility utilities
vi.mock('@/lib/accessibility', () => ({
  announceToScreenReader: vi.fn(),
  prefersReducedMotion: vi.fn(() => false)
}))

const mockConfig: DriverConfig = {
  steps: [
    {
      element: '#step-1',
      title: 'Step 1',
      description: 'First step description',
      position: 'bottom'
    },
    {
      element: '#step-2',
      title: 'Step 2',
      description: 'Second step description',
      position: 'top'
    }
  ],
  showProgress: true,
  allowClose: true,
  allowKeyboardControl: true,
  animate: true
}

const mockClientBranding: ClientBranding = {
  primaryColor: '#FF0000',
  secondaryColor: '#00FF00',
  accentColor: '#0000FF',
  brandName: 'Test Brand',
  logoUrl: 'https://example.com/logo.png'
}

describe('DriverWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="step-1">Step 1 Element</div>
      <div id="step-2">Step 2 Element</div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Basic Functionality', () => {
    it('should render without crashing', () => {
      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      expect(screen.getByTestId('driver-wrapper')).toBeInTheDocument()
    })

    it('should initialize driver with correct configuration', async () => {
      const { driver } = await import('driver.js')
      
      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      expect(driver).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: mockConfig.steps,
          showProgress: true,
          allowClose: true
        })
      )
    })

    it('should start tour automatically when autoStart is true', async () => {
      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
          autoStart={true}
        />
      )

      await waitFor(() => {
        expect(mockDriver.highlight).toHaveBeenCalled()
      })
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme classes', () => {
      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      const wrapper = screen.getByTestId('driver-wrapper')
      expect(wrapper).toHaveClass('theme-light')
    })

    it('should apply dark theme classes', () => {
      render(
        <DriverWrapper
          config={mockConfig}
          theme="dark"
        />
      )

      const wrapper = screen.getByTestId('driver-wrapper')
      expect(wrapper).toHaveClass('theme-dark')
    })

    it('should apply client branding styles', () => {
      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
          clientBranding={mockClientBranding}
        />
      )

      const wrapper = screen.getByTestId('driver-wrapper')
      const style = wrapper.getAttribute('style')
      expect(style).toContain('--tour-primary-color: #FF0000')
      expect(style).toContain('--tour-secondary-color: #00FF00')
      expect(style).toContain('--tour-accent-color: #0000FF')
    })
  })

  describe('Accessibility Features', () => {
    it('should respect reduced motion preferences', async () => {
      const { prefersReducedMotion } = await import('@/lib/accessibility')
      vi.mocked(prefersReducedMotion).mockReturnValue(true)

      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      const wrapper = screen.getByTestId('driver-wrapper')
      expect(wrapper).toHaveClass('reduced-motion')
    })

    it('should announce step changes to screen readers', async () => {
      const { announceToScreenReader } = await import('@/lib/accessibility')
      const onStepChange = vi.fn()

      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
          onStepChange={onStepChange}
        />
      )

      // Simulate step change
      fireEvent.keyDown(document, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(announceToScreenReader).toHaveBeenCalledWith(
          expect.stringContaining('Step 1 of 2')
        )
      })
    })

    it('should handle keyboard navigation', () => {
      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      // Test next step with arrow key
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      expect(mockDriver.moveNext).toHaveBeenCalled()

      // Test previous step with arrow key
      fireEvent.keyDown(document, { key: 'ArrowLeft' })
      expect(mockDriver.movePrevious).toHaveBeenCalled()

      // Test close with escape key
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockDriver.destroy).toHaveBeenCalled()
    })
  })

  describe('Event Handling', () => {
    it('should call onStepChange when step changes', async () => {
      const onStepChange = vi.fn()

      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
          onStepChange={onStepChange}
        />
      )

      // Simulate step change
      fireEvent.keyDown(document, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(onStepChange).toHaveBeenCalledWith(1)
      })
    })

    it('should call onComplete when tour completes', async () => {
      const onComplete = vi.fn()
      mockDriver.hasNextStep.mockReturnValue(false)

      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
          onComplete={onComplete}
        />
      )

      // Simulate completing last step
      fireEvent.keyDown(document, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })
    })

    it('should call onSkip when tour is skipped', async () => {
      const onSkip = vi.fn()

      render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
          onSkip={onSkip}
        />
      )

      // Simulate skip action
      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      const configWithMissingElement: DriverConfig = {
        ...mockConfig,
        steps: [
          {
            element: '#non-existent',
            title: 'Missing',
            description: 'This element does not exist'
          }
        ]
      }

      expect(() => {
        render(
          <DriverWrapper
            config={configWithMissingElement}
            theme="light"
          />
        )
      }).not.toThrow()
    })

    it('should handle driver initialization errors', async () => {
      const { driver } = await import('driver.js')
      vi.mocked(driver).mockImplementation(() => {
        throw new Error('Driver initialization failed')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(
          <DriverWrapper
            config={mockConfig}
            theme="light"
          />
        )
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Driver initialization failed')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should destroy driver instance on unmount', () => {
      const { unmount } = render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      unmount()

      expect(mockDriver.destroy).toHaveBeenCalled()
    })

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Performance', () => {
    it('should not recreate driver instance on theme change', () => {
      const { driver } = vi.mocked(require('driver.js'))
      
      const { rerender } = render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      const initialCallCount = driver.mock.calls.length

      rerender(
        <DriverWrapper
          config={mockConfig}
          theme="dark"
        />
      )

      expect(driver.mock.calls.length).toBe(initialCallCount)
    })

    it('should recreate driver instance when config changes', () => {
      const { driver } = vi.mocked(require('driver.js'))
      
      const { rerender } = render(
        <DriverWrapper
          config={mockConfig}
          theme="light"
        />
      )

      const initialCallCount = driver.mock.calls.length

      const newConfig = {
        ...mockConfig,
        steps: [...mockConfig.steps, {
          element: '#step-3',
          title: 'Step 3',
          description: 'Third step'
        }]
      }

      rerender(
        <DriverWrapper
          config={newConfig}
          theme="light"
        />
      )

      expect(driver.mock.calls.length).toBe(initialCallCount + 1)
    })
  })
})