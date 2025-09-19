import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TourControls from '../tour-controls'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  }
}))

// Mock accessibility utilities
vi.mock('@/lib/accessibility', () => ({
  handleKeyboardNavigation: vi.fn(),
  announceToScreenReader: vi.fn()
}))

describe('TourControls', () => {
  const defaultProps = {
    currentStep: 0,
    totalSteps: 3,
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onSkip: vi.fn(),
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all control buttons', () => {
      render(<TourControls {...defaultProps} />)

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should show progress indicator', () => {
      render(<TourControls {...defaultProps} />)

      expect(screen.getByText('1 of 3')).toBeInTheDocument()
    })

    it('should disable previous button on first step', () => {
      render(<TourControls {...defaultProps} currentStep={0} />)

      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).toBeDisabled()
    })

    it('should show "Finish" instead of "Next" on last step', () => {
      render(<TourControls {...defaultProps} currentStep={2} />)

      expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    })
  })

  describe('Button Interactions', () => {
    it('should call onNext when next button is clicked', () => {
      const onNext = vi.fn()
      render(<TourControls {...defaultProps} onNext={onNext} />)

      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('should call onPrevious when previous button is clicked', () => {
      const onPrevious = vi.fn()
      render(<TourControls {...defaultProps} currentStep={1} onPrevious={onPrevious} />)

      fireEvent.click(screen.getByRole('button', { name: /previous/i }))
      expect(onPrevious).toHaveBeenCalledTimes(1)
    })

    it('should call onSkip when skip button is clicked', () => {
      const onSkip = vi.fn()
      render(<TourControls {...defaultProps} onSkip={onSkip} />)

      fireEvent.click(screen.getByRole('button', { name: /skip/i }))
      expect(onSkip).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(<TourControls {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: /close/i }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onNext when finish button is clicked on last step', () => {
      const onNext = vi.fn()
      render(<TourControls {...defaultProps} currentStep={2} onNext={onNext} />)

      fireEvent.click(screen.getByRole('button', { name: /finish/i }))
      expect(onNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation', async () => {
      const { handleKeyboardNavigation } = await import('@/lib/accessibility')
      
      render(<TourControls {...defaultProps} />)

      const controlsContainer = screen.getByTestId('tour-controls')
      fireEvent.keyDown(controlsContainer, { key: 'Tab' })

      expect(handleKeyboardNavigation).toHaveBeenCalled()
    })

    it('should handle Enter key on focused button', () => {
      const onNext = vi.fn()
      render(<TourControls {...defaultProps} onNext={onNext} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      nextButton.focus()
      fireEvent.keyDown(nextButton, { key: 'Enter' })

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('should handle Space key on focused button', () => {
      const onNext = vi.fn()
      render(<TourControls {...defaultProps} onNext={onNext} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      nextButton.focus()
      fireEvent.keyDown(nextButton, { key: ' ' })

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('should handle Escape key to close tour', () => {
      const onClose = vi.fn()
      render(<TourControls {...defaultProps} onClose={onClose} />)

      const controlsContainer = screen.getByTestId('tour-controls')
      fireEvent.keyDown(controlsContainer, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TourControls {...defaultProps} />)

      expect(screen.getByRole('button', { name: /previous/i })).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Previous step')
      )
      expect(screen.getByRole('button', { name: /next/i })).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Next step')
      )
      expect(screen.getByRole('button', { name: /skip/i })).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Skip tour')
      )
      expect(screen.getByRole('button', { name: /close/i })).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Close tour')
      )
    })

    it('should announce step changes to screen readers', async () => {
      const { announceToScreenReader } = await import('@/lib/accessibility')
      
      const { rerender } = render(<TourControls {...defaultProps} currentStep={0} />)

      rerender(<TourControls {...defaultProps} currentStep={1} />)

      await waitFor(() => {
        expect(announceToScreenReader).toHaveBeenCalledWith(
          expect.stringContaining('Step 2 of 3')
        )
      })
    })

    it('should have proper focus management', () => {
      render(<TourControls {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      nextButton.focus()

      expect(document.activeElement).toBe(nextButton)
    })

    it('should support high contrast mode', () => {
      render(<TourControls {...defaultProps} highContrast={true} />)

      const controlsContainer = screen.getByTestId('tour-controls')
      expect(controlsContainer).toHaveClass('high-contrast')
    })
  })

  describe('Progress Indicator', () => {
    it('should show correct progress for different steps', () => {
      const { rerender } = render(<TourControls {...defaultProps} currentStep={0} totalSteps={5} />)
      expect(screen.getByText('1 of 5')).toBeInTheDocument()

      rerender(<TourControls {...defaultProps} currentStep={2} totalSteps={5} />)
      expect(screen.getByText('3 of 5')).toBeInTheDocument()

      rerender(<TourControls {...defaultProps} currentStep={4} totalSteps={5} />)
      expect(screen.getByText('5 of 5')).toBeInTheDocument()
    })

    it('should show progress bar when showProgressBar is true', () => {
      render(<TourControls {...defaultProps} showProgressBar={true} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '3')
    })

    it('should update progress bar value correctly', () => {
      render(<TourControls {...defaultProps} currentStep={1} showProgressBar={true} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '1')
    })
  })

  describe('Customization', () => {
    it('should apply custom button labels', () => {
      const customLabels = {
        previous: 'Go Back',
        next: 'Continue',
        skip: 'Skip This',
        close: 'Exit',
        finish: 'Complete'
      }

      render(<TourControls {...defaultProps} labels={customLabels} />)

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /skip this/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument()
    })

    it('should hide buttons when specified', () => {
      render(
        <TourControls 
          {...defaultProps} 
          showSkip={false}
          showClose={false}
        />
      )

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
    })

    it('should apply custom CSS classes', () => {
      render(<TourControls {...defaultProps} className="custom-controls" />)

      const controlsContainer = screen.getByTestId('tour-controls')
      expect(controlsContainer).toHaveClass('custom-controls')
    })
  })

  describe('Loading States', () => {
    it('should show loading state on buttons when specified', () => {
      render(<TourControls {...defaultProps} isLoading={true} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
      expect(nextButton).toHaveAttribute('aria-busy', 'true')
    })

    it('should disable all buttons during loading', () => {
      render(<TourControls {...defaultProps} isLoading={true} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid step numbers gracefully', () => {
      expect(() => {
        render(<TourControls {...defaultProps} currentStep={-1} />)
      }).not.toThrow()

      expect(() => {
        render(<TourControls {...defaultProps} currentStep={10} totalSteps={3} />)
      }).not.toThrow()
    })

    it('should handle missing callback functions gracefully', () => {
      expect(() => {
        render(
          <TourControls 
            currentStep={0}
            totalSteps={3}
            onNext={undefined as any}
            onPrevious={undefined as any}
            onSkip={undefined as any}
            onClose={undefined as any}
          />
        )
      }).not.toThrow()
    })
  })
})