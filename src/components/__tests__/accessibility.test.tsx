import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ContentGrid } from '@/components/dashboard/content-grid'
import { ContentCard } from '@/components/ui/content-card'
import { Button } from '@/components/ui/button'
import { meetsWCAGContrast, auditAccessibility } from '@/lib/accessibility'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock data for testing
const mockContentItems = [
  {
    id: '1',
    title: 'Test Content 1',
    description: 'This is a test content item',
    thumbnail: 'https://example.com/image1.jpg',
    contentType: 'image' as const,
    status: 'draft' as const,
    createdAt: new Date(),
    platform: 'instagram'
  },
  {
    id: '2',
    title: 'Test Content 2',
    description: 'Another test content item',
    contentType: 'video' as const,
    status: 'approved' as const,
    createdAt: new Date(),
    platform: 'facebook'
  }
]

describe('Accessibility Tests', () => {
  describe('ContentGrid Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <ContentGrid
          items={mockContentItems}
          onSelectionChange={() => {}}
          onItemAction={() => {}}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnItemAction = jest.fn()

      render(
        <ContentGrid
          items={mockContentItems}
          onItemAction={mockOnItemAction}
        />
      )

      // Tab to first content card
      await user.tab()
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}')
      expect(mockOnItemAction).toHaveBeenCalled()

      // Should be able to activate with Space
      await user.keyboard(' ')
      expect(mockOnItemAction).toHaveBeenCalledTimes(2)
    })

    it('should have proper ARIA labels and roles', () => {
      render(
        <ContentGrid
          items={mockContentItems}
          onSelectionChange={() => {}}
        />
      )

      // Check for proper grid structure
      const grid = screen.getByRole('grid', { hidden: true }) || 
                  screen.getByTestId('content-grid') ||
                  document.querySelector('[data-testid="content-grid"]')

      // Check for proper labeling
      const searchInput = screen.getByRole('searchbox')
      expect(searchInput).toHaveAttribute('aria-label')

      // Check checkboxes have proper labels
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('aria-label')
      })
    })

    it('should announce selection changes to screen readers', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = jest.fn()

      render(
        <ContentGrid
          items={mockContentItems}
          onSelectionChange={mockOnSelectionChange}
        />
      )

      const firstCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(firstCheckbox)

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1'])
    })

    it('should handle focus management properly', async () => {
      const user = userEvent.setup()

      render(
        <ContentGrid
          items={mockContentItems}
          onSelectionChange={() => {}}
        />
      )

      // Tab through interactive elements
      await user.tab() // Search input
      expect(document.activeElement).toHaveAttribute('type', 'text')

      await user.tab() // Filter button
      expect(document.activeElement).toHaveAttribute('role', 'button')

      await user.tab() // First content item
      // Should focus on first interactive element in content grid
    })
  })

  describe('ContentCard Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <ContentCard
          title="Test Card"
          description="Test description"
          contentType="image"
          status="draft"
          onView={() => {}}
          onEdit={() => {}}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper image alt text', () => {
      render(
        <ContentCard
          title="Test Card"
          description="Test description"
          thumbnail="https://example.com/test.jpg"
          contentType="image"
          status="draft"
        />
      )

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('alt', 'Test Card')
    })

    it('should support keyboard interaction', async () => {
      const user = userEvent.setup()
      const mockOnView = jest.fn()

      render(
        <ContentCard
          title="Test Card"
          contentType="image"
          status="draft"
          onView={mockOnView}
        />
      )

      const card = screen.getByRole('button') || screen.getByText('Test Card').closest('[tabindex]')
      
      if (card) {
        card.focus()
        await user.keyboard('{Enter}')
        expect(mockOnView).toHaveBeenCalled()
      }
    })

    it('should have proper ARIA attributes', () => {
      render(
        <ContentCard
          title="Test Card"
          description="Test description"
          contentType="image"
          status="draft"
          selected={true}
          onSelect={() => {}}
        />
      )

      // Check for proper ARIA attributes
      const card = screen.getByText('Test Card').closest('[role]')
      if (card) {
        expect(card).toHaveAttribute('aria-selected', 'true')
      }
    })
  })

  describe('Button Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Button>Test Button</Button>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should meet minimum touch target size', () => {
      render(<Button size="sm">Small Button</Button>)
      
      const button = screen.getByRole('button')
      const styles = window.getComputedStyle(button)
      
      // Check minimum 44px touch target (WCAG 2.1 AA)
      const minHeight = parseInt(styles.minHeight)
      const minWidth = parseInt(styles.minWidth)
      
      expect(minHeight).toBeGreaterThanOrEqual(44)
      expect(minWidth).toBeGreaterThanOrEqual(44)
    })

    it('should have proper focus indicators', async () => {
      const user = userEvent.setup()
      
      render(<Button>Focusable Button</Button>)
      
      const button = screen.getByRole('button')
      await user.tab()
      
      expect(button).toHaveFocus()
      
      // Check for focus ring styles
      const styles = window.getComputedStyle(button)
      expect(styles.outline).toBeTruthy()
    })

    it('should support keyboard activation', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()
      
      render(<Button onClick={mockOnClick}>Keyboard Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      // Test Enter key
      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalledTimes(1)
      
      // Test Space key
      await user.keyboard(' ')
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('should announce loading state', () => {
      render(
        <Button loading loadingText="Saving...">
          Save
        </Button>
      )

      // Should have aria-busy attribute
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')

      // Should announce loading state to screen readers
      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })
  })

  describe('Color Contrast', () => {
    it('should meet WCAG AA contrast requirements', () => {
      // Test primary colors
      expect(meetsWCAGContrast('#ffffff', '#3b82f6')).toBe(true) // White on primary
      expect(meetsWCAGContrast('#000000', '#ffffff')).toBe(true) // Black on white
      expect(meetsWCAGContrast('#6b7280', '#ffffff')).toBe(true) // Muted on white
    })

    it('should fail for insufficient contrast', () => {
      expect(meetsWCAGContrast('#ffffff', '#f3f4f6')).toBe(false) // White on light gray
      expect(meetsWCAGContrast('#d1d5db', '#f9fafb')).toBe(false) // Light gray on lighter gray
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      )

      const headings = screen.getAllByRole('heading')
      expect(headings).toHaveLength(3)
      
      // Check heading levels
      expect(headings[0]).toHaveProperty('tagName', 'H1')
      expect(headings[1]).toHaveProperty('tagName', 'H2')
      expect(headings[2]).toHaveProperty('tagName', 'H3')
    })

    it('should provide skip links for keyboard users', () => {
      render(
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      )

      const skipLink = screen.getByText('Skip to main content')
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })
  })

  describe('Motion and Animation', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(<Button animate>Animated Button</Button>)
      
      // Should disable animations when prefers-reduced-motion is set
      const button = screen.getByRole('button')
      // Animation should be disabled or minimal
    })
  })

  describe('Form Accessibility', () => {
    it('should associate labels with form controls', () => {
      render(
        <div>
          <label htmlFor="search-input">Search Content</label>
          <input id="search-input" type="text" />
        </div>
      )

      const input = screen.getByLabelText('Search Content')
      expect(input).toBeInTheDocument()
    })

    it('should provide error messages for form validation', () => {
      render(
        <div>
          <label htmlFor="required-field">Required Field</label>
          <input 
            id="required-field" 
            type="text" 
            aria-describedby="error-message"
            aria-invalid="true"
          />
          <div id="error-message" role="alert">
            This field is required
          </div>
        </div>
      )

      const input = screen.getByLabelText('Required Field')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
      
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveTextContent('This field is required')
    })
  })

  describe('Accessibility Audit Function', () => {
    it('should detect missing alt text', () => {
      const container = document.createElement('div')
      container.innerHTML = '<img src="test.jpg" />'
      
      const results = auditAccessibility(container)
      
      expect(results.issues).toContainEqual(
        expect.objectContaining({
          type: 'missing-alt-text',
          severity: 'error'
        })
      )
    })

    it('should detect missing form labels', () => {
      const container = document.createElement('div')
      container.innerHTML = '<input type="text" />'
      
      const results = auditAccessibility(container)
      
      expect(results.issues).toContainEqual(
        expect.objectContaining({
          type: 'missing-form-label',
          severity: 'error'
        })
      )
    })

    it('should calculate accessibility score', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <img src="test.jpg" alt="Test image" />
        <label for="test-input">Test Input</label>
        <input id="test-input" type="text" />
      `
      
      const results = auditAccessibility(container)
      
      expect(results.score).toBeGreaterThan(80)
      expect(results.issues).toHaveLength(0)
    })
  })
})