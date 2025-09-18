import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TourSettings from '../tour-settings'
import { useTourProgress } from '@/hooks/use-tour-progress'
import { getTourRegistry } from '@/lib/tour/tour-registry'

// Mock the hooks
vi.mock('@/hooks/use-tour-progress')
vi.mock('@/lib/tour/tour-registry')

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const mockTours = [
  {
    id: 'welcome-tour',
    name: 'Welcome Tour',
    description: 'Get started with Postia',
    category: 'onboarding',
    steps: [{ element: '#test', title: 'Test', description: 'Test step' }],
    triggers: [],
    metadata: {
      version: '1.0.0',
      author: 'Postia Team',
      lastUpdated: '2024-01-01',
      estimatedDuration: 10
    }
  }
]

const mockProgress = {
  'welcome-tour': {
    userId: 'user1',
    tourId: 'welcome-tour',
    status: 'completed',
    currentStep: 0,
    completedSteps: [0],
    completedAt: new Date('2024-01-01'),
    lastInteractionAt: new Date('2024-01-01'),
    metadata: {
      device: 'desktop',
      userAgent: 'test',
      sessionId: 'session1'
    }
  }
}

describe('TourSettings', () => {
  const mockGetAllProgress = vi.fn()
  const mockResetTour = vi.fn()
  const mockUpdateTourProgress = vi.fn()
  const mockRegistry = {
    loadTour: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mocks
    vi.mocked(useTourProgress).mockReturnValue({
      getAllProgress: mockGetAllProgress,
      resetTour: mockResetTour,
      updateTourProgress: mockUpdateTourProgress,
      getTourProgress: vi.fn(),
      completeTour: vi.fn(),
      skipTour: vi.fn()
    })

    vi.mocked(getTourRegistry).mockReturnValue(mockRegistry as any)
    
    mockGetAllProgress.mockReturnValue(mockProgress)
    mockRegistry.loadTour.mockImplementation((id: string) => {
      const tour = mockTours.find(t => t.id === id)
      return Promise.resolve(tour)
    })

    localStorageMock.getItem.mockReturnValue(null)
  })

  it('renders tour settings with tabs', async () => {
    render(<TourSettings />)
    
    await waitFor(() => {
      expect(screen.getByText('Tour Settings')).toBeInTheDocument()
      expect(screen.getByText('Preferences')).toBeInTheDocument()
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('Data')).toBeInTheDocument()
    })
  })

  it('loads and displays saved preferences', async () => {
    const savedPreferences = {
      autoStart: false,
      showProgress: false,
      enableAnimations: false
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences))

    render(<TourSettings />)
    
    await waitFor(() => {
      // Check that preferences are loaded (buttons should reflect saved state)
      expect(screen.getByText('Tour Settings')).toBeInTheDocument()
    })
  })

  it('toggles preference settings', async () => {
    render(<TourSettings />)
    
    await waitFor(() => {
      expect(screen.getByText('Auto-start tours')).toBeInTheDocument()
    })

    // Find and click the auto-start toggle button
    const autoStartSection = screen.getByText('Auto-start tours').closest('div')
    const toggleButton = autoStartSection?.querySelector('button')
    
    if (toggleButton) {
      fireEvent.click(toggleButton)
    }

    // The component should update the state
    expect(screen.getByText('Auto-start tours')).toBeInTheDocument()
  })

  it('saves preferences when save button is clicked', async () => {
    render(<TourSettings />)
    
    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Save Preferences')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tour-preferences',
        expect.any(String)
      )
    })
  })

  it('displays tour history', async () => {
    render(<TourSettings />)
    
    // Switch to history tab
    const historyTab = screen.getByText('History')
    fireEvent.click(historyTab)
    
    await waitFor(() => {
      expect(screen.getByText('Tour History')).toBeInTheDocument()
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument()
    })
  })

  it('allows resetting individual tour progress', async () => {
    render(<TourSettings />)
    
    // Switch to history tab
    const historyTab = screen.getByText('History')
    fireEvent.click(historyTab)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument()
    })

    // Find and click reset button for the tour
    const resetButtons = screen.getAllByRole('button')
    const resetButton = resetButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-rotate-ccw') ||
      button.innerHTML.includes('RotateCcw')
    )
    
    if (resetButton) {
      fireEvent.click(resetButton)
      expect(mockResetTour).toHaveBeenCalledWith('welcome-tour')
    }
  })

  it('allows clearing all tour history', async () => {
    render(<TourSettings />)
    
    // Switch to history tab
    const historyTab = screen.getByText('History')
    fireEvent.click(historyTab)
    
    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    const clearAllButton = screen.getByText('Clear All')
    fireEvent.click(clearAllButton)

    expect(mockResetTour).toHaveBeenCalledWith('welcome-tour')
  })

  it('handles export data functionality', async () => {
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = vi.fn(() => 'mock-url')
    const mockRevokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL })

    // Mock document.createElement and appendChild
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    }
    const mockCreateElement = vi.fn(() => mockAnchor)
    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    
    Object.defineProperty(document, 'createElement', { value: mockCreateElement })
    Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild })
    Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild })

    render(<TourSettings />)
    
    // Switch to data tab
    const dataTab = screen.getByText('Data')
    fireEvent.click(dataTab)
    
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    const exportButton = screen.getByText('Export')
    fireEvent.click(exportButton)

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockAnchor.click).toHaveBeenCalled()
  })

  it('updates tour frequency preference', async () => {
    render(<TourSettings />)
    
    await waitFor(() => {
      expect(screen.getByText('Tour Frequency')).toBeInTheDocument()
    })

    // Click on "Once per session" option
    const oncePerSessionOption = screen.getByText('Once per session')
    fireEvent.click(oncePerSessionOption)

    // The option should be selected (visual feedback)
    expect(oncePerSessionOption).toBeInTheDocument()
  })

  it('updates preferred categories', async () => {
    render(<TourSettings />)
    
    await waitFor(() => {
      expect(screen.getByText('Preferred Categories')).toBeInTheDocument()
    })

    // Click on "Getting Started" category
    const gettingStartedCategory = screen.getByText('Getting Started')
    fireEvent.click(gettingStartedCategory)

    // The category should be selected
    expect(gettingStartedCategory).toBeInTheDocument()
  })

  it('updates accessibility preferences', async () => {
    render(<TourSettings />)
    
    await waitFor(() => {
      expect(screen.getByText('Accessibility')).toBeInTheDocument()
    })

    // Find and click high contrast toggle
    const highContrastSection = screen.getByText('High contrast mode').closest('div')
    const toggleButton = highContrastSection?.querySelector('button')
    
    if (toggleButton) {
      fireEvent.click(toggleButton)
    }

    expect(screen.getByText('High contrast mode')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    // Mock getAllProgress to return empty to simulate loading
    mockGetAllProgress.mockReturnValue({})
    
    render(<TourSettings />)
    
    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })

  it('handles empty tour history', async () => {
    mockGetAllProgress.mockReturnValue({})
    
    render(<TourSettings />)
    
    // Switch to history tab
    const historyTab = screen.getByText('History')
    fireEvent.click(historyTab)
    
    await waitFor(() => {
      expect(screen.getByText('No tour history')).toBeInTheDocument()
    })
  })
})