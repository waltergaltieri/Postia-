import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TourHelpMenu from '../tour-help-menu'
import { useTour } from '@/hooks/use-tour'
import { useTourProgress } from '@/hooks/use-tour-progress'
import { getTourRegistry } from '@/lib/tour/tour-registry'

// Mock the hooks
vi.mock('@/hooks/use-tour')
vi.mock('@/hooks/use-tour-progress')
vi.mock('@/lib/tour/tour-registry')

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

const mockTours = [
  {
    id: 'welcome-tour',
    name: 'Welcome Tour',
    description: 'Get started with Postia',
    category: 'onboarding',
    steps: [],
    triggers: [],
    metadata: {
      version: '1.0.0',
      author: 'Postia Team',
      lastUpdated: '2024-01-01',
      estimatedDuration: 10
    }
  },
  {
    id: 'content-generation-tour',
    name: 'Content Generation',
    description: 'Learn how to generate content with AI',
    category: 'feature',
    steps: [],
    triggers: [],
    metadata: {
      version: '1.0.0',
      author: 'Postia Team',
      lastUpdated: '2024-01-01',
      estimatedDuration: 15
    }
  }
]

describe('TourHelpMenu', () => {
  const mockStartTour = vi.fn()
  const mockGetTourProgress = vi.fn()
  const mockRegistry = {
    getAvailableTours: vi.fn(),
    loadTour: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mocks
    vi.mocked(useTour).mockReturnValue({
      startTour: mockStartTour,
      stopTour: vi.fn(),
      nextStep: vi.fn(),
      previousStep: vi.fn(),
      skipTour: vi.fn(),
      currentTour: null,
      currentStep: 0,
      totalSteps: 0,
      isActive: false
    })

    vi.mocked(useTourProgress).mockReturnValue({
      getTourProgress: mockGetTourProgress,
      updateTourProgress: vi.fn(),
      completeTour: vi.fn(),
      skipTour: vi.fn(),
      resetTour: vi.fn(),
      getAllProgress: vi.fn()
    })

    vi.mocked(getTourRegistry).mockReturnValue(mockRegistry as any)
    
    mockRegistry.getAvailableTours.mockReturnValue(['welcome-tour', 'content-generation-tour'])
    mockRegistry.loadTour.mockImplementation((id: string) => {
      const tour = mockTours.find(t => t.id === id)
      return Promise.resolve(tour)
    })

    mockGetTourProgress.mockReturnValue({ status: 'not_started' })
  })

  it('renders help menu trigger button', () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    expect(button).toBeInTheDocument()
  })

  it('opens tour library when clicked', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Tour Library')).toBeInTheDocument()
    })
  })

  it('displays available tours when opened', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument()
      expect(screen.getByText('Content Generation')).toBeInTheDocument()
    })
  })

  it('filters tours by search query', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search tours...')
    fireEvent.change(searchInput, { target: { value: 'content' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Welcome Tour')).not.toBeInTheDocument()
      expect(screen.getByText('Content Generation')).toBeInTheDocument()
    })
  })

  it('filters tours by category', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument()
    })

    const onboardingCategory = screen.getByText('Getting Started')
    fireEvent.click(onboardingCategory)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument()
      expect(screen.queryByText('Content Generation')).not.toBeInTheDocument()
    })
  })

  it('starts tour when start button is clicked', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument()
    })

    const startButtons = screen.getAllByText('Start')
    fireEvent.click(startButtons[0])
    
    expect(mockStartTour).toHaveBeenCalledWith('welcome-tour')
  })

  it('shows different button text based on tour status', async () => {
    mockGetTourProgress.mockImplementation((tourId: string) => {
      if (tourId === 'welcome-tour') {
        return { status: 'completed' }
      }
      if (tourId === 'content-generation-tour') {
        return { status: 'in_progress' }
      }
      return { status: 'not_started' }
    })

    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Replay')).toBeInTheDocument() // For completed tour
      expect(screen.getByText('Continue')).toBeInTheDocument() // For in-progress tour
    })
  })

  it('closes modal when backdrop is clicked', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Tour Library')).toBeInTheDocument()
    })

    // Click backdrop (the modal overlay)
    const backdrop = screen.getByText('Tour Library').closest('[class*="fixed inset-0"]')?.previousSibling as HTMLElement
    if (backdrop) {
      fireEvent.click(backdrop)
    }
    
    await waitFor(() => {
      expect(screen.queryByText('Tour Library')).not.toBeInTheDocument()
    })
  })

  it('closes modal when X button is clicked', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Tour Library')).toBeInTheDocument()
    })

    const closeButton = screen.getByRole('button', { name: '' }) // X button
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Tour Library')).not.toBeInTheDocument()
    })
  })

  it('displays tour duration correctly', async () => {
    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('10m')).toBeInTheDocument() // Welcome tour duration
      expect(screen.getByText('15m')).toBeInTheDocument() // Content generation tour duration
    })
  })

  it('shows loading state while tours are being loaded', async () => {
    // Make loadTour return a pending promise
    mockRegistry.loadTour.mockReturnValue(new Promise(() => {}))

    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Loading tours...')).toBeInTheDocument()
    })
  })

  it('handles tour loading errors gracefully', async () => {
    mockRegistry.loadTour.mockRejectedValue(new Error('Failed to load tour'))

    render(<TourHelpMenu />)
    
    const button = screen.getByRole('button', { name: /open tour help menu/i })
    fireEvent.click(button)
    
    // Should not crash and should show empty state
    await waitFor(() => {
      expect(screen.queryByText('Loading tours...')).not.toBeInTheDocument()
    })
  })
})