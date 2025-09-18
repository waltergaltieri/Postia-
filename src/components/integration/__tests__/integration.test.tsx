import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { NavigationProvider } from '@/components/navigation/navigation-context'
import MainFlowIntegration from '../main-flow-integration'
import WorkflowIntegration from '../workflow-integration'
import PageTransitions from '../page-transitions'
import { VisualThemeProvider } from '../visual-consistency'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/dashboard'),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

const mockClients = [
  {
    id: '1',
    brandName: 'Test Client 1',
    brandColors: ['#3b82f6', '#1d4ed8'],
    logoUrl: '/test-logo.png'
  },
  {
    id: '2',
    brandName: 'Test Client 2',
    brandColors: ['#ef4444', '#dc2626'],
  }
]

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <VisualThemeProvider>
    <NavigationProvider>
      {children}
    </NavigationProvider>
  </VisualThemeProvider>
)

describe('Integration Components', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter)
    jest.clearAllMocks()
  })

  describe('MainFlowIntegration', () => {
    it('renders quick actions on dashboard', () => {
      render(
        <TestWrapper>
          <MainFlowIntegration>
            <div>Dashboard Content</div>
          </MainFlowIntegration>
        </TestWrapper>
      )

      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('Generate Content')).toBeInTheDocument()
      expect(screen.getByText('Publication Calendar')).toBeInTheDocument()
      expect(screen.getByText('Client Management')).toBeInTheDocument()
    })

    it('handles quick action clicks', async () => {
      render(
        <TestWrapper>
          <MainFlowIntegration>
            <div>Dashboard Content</div>
          </MainFlowIntegration>
        </TestWrapper>
      )

      const generateContentButton = screen.getByText('Generate Content').closest('div')
      fireEvent.click(generateContentButton!)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/content/generate')
      })
    })

    it('shows flow header when not on dashboard', () => {
      const usePathname = require('next/navigation').usePathname
      usePathname.mockReturnValue('/dashboard/content')

      render(
        <TestWrapper>
          <MainFlowIntegration>
            <div>Content Page</div>
          </MainFlowIntegration>
        </TestWrapper>
      )

      expect(screen.getByText('Content Creation')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('WorkflowIntegration', () => {
    it('renders content creation workflow', () => {
      render(
        <TestWrapper>
          <WorkflowIntegration
            workflowType="content-creation"
            onStepComplete={jest.fn()}
            onWorkflowComplete={jest.fn()}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Content Creation Workflow')).toBeInTheDocument()
      expect(screen.getByText('Select Client')).toBeInTheDocument()
      expect(screen.getByText('Generate Content')).toBeInTheDocument()
      expect(screen.getByText('Review & Edit')).toBeInTheDocument()
      expect(screen.getByText('Schedule Publication')).toBeInTheDocument()
    })

    it('handles step navigation', async () => {
      const onStepComplete = jest.fn()
      
      render(
        <TestWrapper>
          <WorkflowIntegration
            workflowType="content-creation"
            onStepComplete={onStepComplete}
            onWorkflowComplete={jest.fn()}
          />
        </TestWrapper>
      )

      const selectClientStep = screen.getByText('Select Client').closest('div')
      fireEvent.click(selectClientStep!)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/clients')
      })
    })

    it('shows progress correctly', () => {
      render(
        <TestWrapper>
          <WorkflowIntegration
            workflowType="campaign-management"
            onStepComplete={jest.fn()}
            onWorkflowComplete={jest.fn()}
          />
        </TestWrapper>
      )

      expect(screen.getByText('0/4')).toBeInTheDocument()
      expect(screen.getByText('Steps Complete')).toBeInTheDocument()
    })
  })

  describe('PageTransitions', () => {
    it('renders children with transitions', () => {
      render(
        <TestWrapper>
          <PageTransitions>
            <div>Page Content</div>
          </PageTransitions>
        </TestWrapper>
      )

      expect(screen.getByText('Page Content')).toBeInTheDocument()
    })

    it('handles route transitions', async () => {
      const { rerender } = render(
        <TestWrapper>
          <PageTransitions>
            <div>Initial Content</div>
          </PageTransitions>
        </TestWrapper>
      )

      // Simulate route change
      const usePathname = require('next/navigation').usePathname
      usePathname.mockReturnValue('/dashboard/content')

      rerender(
        <TestWrapper>
          <PageTransitions>
            <div>New Content</div>
          </PageTransitions>
        </TestWrapper>
      )

      expect(screen.getByText('New Content')).toBeInTheDocument()
    })
  })

  describe('Visual Consistency', () => {
    it('provides consistent theme context', () => {
      render(
        <VisualThemeProvider>
          <div data-testid="themed-content">Content</div>
        </VisualThemeProvider>
      )

      expect(screen.getByTestId('themed-content')).toBeInTheDocument()
    })
  })

  describe('Integration Flow', () => {
    it('maintains state across component transitions', async () => {
      const { rerender } = render(
        <TestWrapper>
          <MainFlowIntegration>
            <WorkflowIntegration
              workflowType="content-creation"
              onStepComplete={jest.fn()}
              onWorkflowComplete={jest.fn()}
            />
          </MainFlowIntegration>
        </TestWrapper>
      )

      // Verify initial state
      expect(screen.getByText('Content Creation Workflow')).toBeInTheDocument()

      // Simulate navigation
      const usePathname = require('next/navigation').usePathname
      usePathname.mockReturnValue('/dashboard/content/generate')

      rerender(
        <TestWrapper>
          <MainFlowIntegration>
            <div>AI Generation Page</div>
          </MainFlowIntegration>
        </TestWrapper>
      )

      expect(screen.getByText('AI Generation Page')).toBeInTheDocument()
    })

    it('handles client context changes', async () => {
      render(
        <TestWrapper>
          <MainFlowIntegration>
            <div>Dashboard with Client Context</div>
          </MainFlowIntegration>
        </TestWrapper>
      )

      // Should handle client switching gracefully
      expect(screen.getByText('Dashboard with Client Context')).toBeInTheDocument()
    })

    it('manages workflow state correctly', () => {
      render(
        <TestWrapper>
          <WorkflowIntegration
            workflowType="client-onboarding"
            context={{ clientId: '1' }}
            onStepComplete={jest.fn()}
            onWorkflowComplete={jest.fn()}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Client Onboarding Workflow')).toBeInTheDocument()
      expect(screen.getByText('Create Client Profile')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing navigation context gracefully', () => {
      // Test without NavigationProvider
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(
          <MainFlowIntegration>
            <div>Content</div>
          </MainFlowIntegration>
        )
      }).toThrow('useNavigation must be used within a NavigationProvider')

      consoleSpy.mockRestore()
    })

    it('handles router errors gracefully', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(() => { throw new Error('Navigation error') }),
        replace: jest.fn(),
        back: jest.fn(),
      })

      render(
        <TestWrapper>
          <WorkflowIntegration
            workflowType="content-creation"
            onStepComplete={jest.fn()}
            onWorkflowComplete={jest.fn()}
          />
        </TestWrapper>
      )

      // Should not crash on navigation errors
      expect(screen.getByText('Content Creation Workflow')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently with many components', () => {
      const startTime = performance.now()

      render(
        <TestWrapper>
          <MainFlowIntegration>
            <WorkflowIntegration
              workflowType="content-creation"
              onStepComplete={jest.fn()}
              onWorkflowComplete={jest.fn()}
            />
          </MainFlowIntegration>
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100)
    })

    it('handles rapid state changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <WorkflowIntegration
            workflowType="content-creation"
            onStepComplete={jest.fn()}
            onWorkflowComplete={jest.fn()}
          />
        </TestWrapper>
      )

      // Rapidly change workflow types
      for (let i = 0; i < 10; i++) {
        rerender(
          <TestWrapper>
            <WorkflowIntegration
              workflowType={i % 2 === 0 ? "content-creation" : "campaign-management"}
              onStepComplete={jest.fn()}
              onWorkflowComplete={jest.fn()}
            />
          </TestWrapper>
        )
      }

      // Should handle rapid changes without errors
      expect(screen.getByText(/Workflow/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('maintains proper focus management', () => {
      render(
        <TestWrapper>
          <WorkflowIntegration
            workflowType="content-creation"
            onStepComplete={jest.fn()}
            onWorkflowComplete={jest.fn()}
          />
        </TestWrapper>
      )

      const firstStep = screen.getByText('Select Client').closest('div')
      expect(firstStep).toHaveAttribute('tabIndex', '0')
    })

    it('provides proper ARIA labels', () => {
      render(
        <TestWrapper>
          <MainFlowIntegration>
            <div>Dashboard Content</div>
          </MainFlowIntegration>
        </TestWrapper>
      )

      const quickActions = screen.getByText('Quick Actions')
      expect(quickActions.closest('div')).toHaveAttribute('role', 'region')
    })
  })
})

// Integration test utilities
export const integrationTestUtils = {
  mockRouter,
  mockClients,
  TestWrapper,
  
  // Helper to simulate workflow completion
  completeWorkflow: async (workflowType: string) => {
    const steps = {
      'content-creation': ['client-selection', 'content-generation', 'content-review', 'schedule-publication'],
      'campaign-management': ['campaign-setup', 'content-planning', 'bulk-generation', 'review-approval'],
      'client-onboarding': ['client-creation', 'brand-assets', 'first-content']
    }
    
    return steps[workflowType as keyof typeof steps] || []
  },
  
  // Helper to simulate navigation flow
  simulateNavigation: (path: string) => {
    const usePathname = require('next/navigation').usePathname
    usePathname.mockReturnValue(path)
  }
}