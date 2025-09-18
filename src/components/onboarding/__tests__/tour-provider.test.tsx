import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TourProvider, useTourContext } from '../tour-provider'
import { TourDefinition } from '@/types/tour'

// Mock dependencies
vi.mock('@/lib/tour/tour-config', () => ({
  TourConfigLoader: {
    loadTourConfig: vi.fn(),
    getTourConfig: vi.fn()
  }
}))

vi.mock('@/lib/accessibility/screen-reader', () => ({
  announceToScreenReader: vi.fn()
}))

vi.mock('@/lib/accessibility/focus-trap', () => ({
  createFocusTrap: vi.fn(() => ({
    activate: vi.fn(),
    deactivate: vi.fn()
  }))
}))

const mockTourDefinition: TourDefinition = {
  id: 'test-tour',
  name: 'Test Tour',
  description: 'A test tour',
  category: 'onboarding',
  triggers: [{ type: 'manual' }],
  steps: [
    {
      element: '#step-1',
      title: 'Step 1',
      description: 'First step'
    },
    {
      element: '#step-2',
      title: 'Step 2',
      description: 'Second step'
    }
  ],
  metadata: {
    version: '1.0.0',
    author: 'Test',
    lastUpdated: '2024-01-01',
    estimatedDuration: 120
  }
}

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TourProvider>{children}</TourProvider>
)

const TestComponent = () => {
  const context = useTourContext()
  return (
    <div>
      <div data-testid="current-tour">{context.currentTour || 'none'}</div>
      <div data-testid="current-step">{context.currentStep}</div>
      <div data-testid="total-steps">{context.totalSteps}</div>
      <div data-testid="is-active">{context.isActive ? 'active' : 'inactive'}</div>
      <button onClick={() => context.startTour('test-tour')}>Start Tour</button>
      <button onClick={() => context.nextStep()}>Next Step</button>
      <button onClick={() => context.previousStep()}>Previous Step</button>
      <button onClick={() => context.skipTour()}>Skip Tour</button>
      <button onClick={() => context.stopTour()}>Stop Tour</button>
    </div>
  )
}

describe('TourProvider', () => {
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

  describe('Context Provider', () => {
    it('should provide initial context values', () => {
      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      expect(screen.getByTestId('current-tour')).toHaveTextContent('none')
      expect(screen.getByTestId('current-step')).toHaveTextContent('0')
      expect(screen.getByTestId('total-steps')).toHaveTextContent('0')
      expect(screen.getByTestId('is-active')).toHaveTextContent('inactive')
    })

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTourContext must be used within a TourProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Tour State Management', () => {
    it('should start tour correctly', async () => {
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      const startButton = screen.getByText('Start Tour')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-tour')).toHaveTextContent('test-tour')
        expect(screen.getByTestId('is-active')).toHaveTextContent('active')
        expect(screen.getByTestId('total-steps')).toHaveTextContent('2')
      })
    })

    it('should navigate between steps', async () => {
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      // Start tour
      fireEvent.click(screen.getByText('Start Tour'))

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('0')
      })

      // Go to next step
      fireEvent.click(screen.getByText('Next Step'))

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('1')
      })

      // Go back to previous step
      fireEvent.click(screen.getByText('Previous Step'))

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('0')
      })
    })

    it('should complete tour when reaching last step', async () => {
      const onTourComplete = vi.fn()
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      render(
        <TourProvider onTourComplete={onTourComplete}>
          <TestComponent />
        </TourProvider>
      )

      // Start tour
      fireEvent.click(screen.getByText('Start Tour'))

      await waitFor(() => {
        expect(screen.getByTestId('is-active')).toHaveTextContent('active')
      })

      // Navigate to last step and complete
      fireEvent.click(screen.getByText('Next Step'))
      fireEvent.click(screen.getByText('Next Step'))

      await waitFor(() => {
        expect(onTourComplete).toHaveBeenCalledWith('test-tour')
        expect(screen.getByTestId('is-active')).toHaveTextContent('inactive')
      })
    })

    it('should skip tour correctly', async () => {
      const onTourSkip = vi.fn()
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      render(
        <TourProvider onTourSkip={onTourSkip}>
          <TestComponent />
        </TourProvider>
      )

      // Start tour
      fireEvent.click(screen.getByText('Start Tour'))

      await waitFor(() => {
        expect(screen.getByTestId('is-active')).toHaveTextContent('active')
      })

      // Skip tour
      fireEvent.click(screen.getByText('Skip Tour'))

      await waitFor(() => {
        expect(onTourSkip).toHaveBeenCalledWith('test-tour')
        expect(screen.getByTestId('is-active')).toHaveTextContent('inactive')
      })
    })

    it('should stop tour correctly', async () => {
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      // Start tour
      fireEvent.click(screen.getByText('Start Tour'))

      await waitFor(() => {
        expect(screen.getByTestId('is-active')).toHaveTextContent('active')
      })

      // Stop tour
      fireEvent.click(screen.getByText('Stop Tour'))

      await waitFor(() => {
        expect(screen.getByTestId('is-active')).toHaveTextContent('inactive')
        expect(screen.getByTestId('current-tour')).toHaveTextContent('none')
      })
    })
  })

  describe('Accessibility Features', () => {
    it('should announce tour start to screen readers', async () => {
      const { announceToScreenReader } = await import('@/lib/accessibility/screen-reader')
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      fireEvent.click(screen.getByText('Start Tour'))

      await waitFor(() => {
        expect(announceToScreenReader).toHaveBeenCalledWith(
          expect.stringContaining('Tour started')
        )
      })
    })

    it('should manage focus trap during active tour', async () => {
      const { createFocusTrap } = await import('@/lib/accessibility/focus-trap')
      const mockFocusTrap = {
        activate: vi.fn(),
        deactivate: vi.fn()
      }
      vi.mocked(createFocusTrap).mockReturnValue(mockFocusTrap)

      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      // Start tour
      fireEvent.click(screen.getByText('Start Tour'))

      await waitFor(() => {
        expect(mockFocusTrap.activate).toHaveBeenCalled()
      })

      // Stop tour
      fireEvent.click(screen.getByText('Stop Tour'))

      await waitFor(() => {
        expect(mockFocusTrap.deactivate).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle tour loading errors gracefully', async () => {
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockRejectedValue(
        new Error('Tour not found')
      )

      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      fireEvent.click(screen.getByText('Start Tour'))

      await waitFor(() => {
        // Should remain inactive on error
        expect(screen.getByTestId('is-active')).toHaveTextContent('inactive')
      })
    })

    it('should handle missing DOM elements gracefully', async () => {
      const tourWithMissingElement: TourDefinition = {
        ...mockTourDefinition,
        steps: [
          {
            element: '#non-existent-element',
            title: 'Missing Step',
            description: 'This element does not exist'
          }
        ]
      }

      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(tourWithMissingElement)

      render(
        <TourProvider>
          <TestComponent />
        </TourProvider>
      )

      fireEvent.click(screen.getByText('Start Tour'))

      // Should handle missing element gracefully
      await waitFor(() => {
        expect(screen.getByTestId('is-active')).toHaveTextContent('active')
      })
    })
  })

  describe('Hook Integration', () => {
    it('should work with useTourContext hook', () => {
      const { result } = renderHook(() => useTourContext(), {
        wrapper: TestWrapper
      })

      expect(result.current.currentTour).toBeNull()
      expect(result.current.isActive).toBe(false)
      expect(typeof result.current.startTour).toBe('function')
      expect(typeof result.current.stopTour).toBe('function')
    })

    it('should update hook values when tour state changes', async () => {
      const { TourConfigLoader } = await import('@/lib/tour/tour-config')
      vi.mocked(TourConfigLoader.loadTourConfig).mockResolvedValue(mockTourDefinition)

      const { result } = renderHook(() => useTourContext(), {
        wrapper: TestWrapper
      })

      await act(async () => {
        await result.current.startTour('test-tour')
      })

      expect(result.current.currentTour).toBe('test-tour')
      expect(result.current.isActive).toBe(true)
      expect(result.current.totalSteps).toBe(2)
    })
  })
})