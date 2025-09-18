import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  handleKeyboardNavigation,
  createKeyboardNavigationHandler,
  KeyboardNavigationConfig,
  KeyboardNavigationResult
} from '../keyboard-navigation'

// Mock DOM methods
const mockElement = {
  focus: vi.fn(),
  blur: vi.fn(),
  click: vi.fn(),
  getAttribute: vi.fn(),
  setAttribute: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  contains: vi.fn(() => true)
}

Object.defineProperty(document, 'activeElement', {
  value: mockElement,
  writable: true
})

Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => mockElement)
})

Object.defineProperty(document, 'querySelectorAll', {
  value: vi.fn(() => [mockElement])
})

describe('Keyboard Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleKeyboardNavigation', () => {
    it('should handle Tab key for forward navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button', 'input', '[tabindex]'],
        trapFocus: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('focus_next')
    })

    it('should handle Shift+Tab for backward navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button', 'input'],
        trapFocus: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('focus_previous')
    })

    it('should handle Enter key activation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        allowActivation: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('activate')
    })

    it('should handle Space key activation', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        allowActivation: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('activate')
    })

    it('should handle Escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        allowEscape: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('escape')
    })

    it('should handle Arrow keys for directional navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        allowArrowKeys: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('navigate_right')
    })

    it('should not handle keys when disabled', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        disabled: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(false)
      expect(result.action).toBe('none')
    })

    it('should call custom key handlers', () => {
      const customHandler = vi.fn(() => ({ handled: true, action: 'custom' as const }))
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        customKeyHandlers: {
          'F1': customHandler
        }
      }

      const result = handleKeyboardNavigation(event, config)

      expect(customHandler).toHaveBeenCalledWith(event, config)
      expect(result.handled).toBe(true)
      expect(result.action).toBe('custom')
    })
  })

  describe('createKeyboardNavigationHandler', () => {
    it('should create a reusable keyboard handler', () => {
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button', 'input'],
        trapFocus: true
      }

      const handler = createKeyboardNavigationHandler(config)
      expect(typeof handler).toBe('function')

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const result = handler(event)

      expect(result.handled).toBe(true)
    })

    it('should maintain config state across calls', () => {
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        trapFocus: true
      }

      const handler = createKeyboardNavigationHandler(config)
      
      const event1 = new KeyboardEvent('keydown', { key: 'Tab' })
      const result1 = handler(event1)
      
      const event2 = new KeyboardEvent('keydown', { key: 'Enter' })
      const result2 = handler(event2)

      expect(result1.handled).toBe(true)
      expect(result2.handled).toBe(true)
    })
  })

  describe('Focus Management', () => {
    it('should find focusable elements correctly', () => {
      const focusableElements = [
        { tagName: 'BUTTON', disabled: false, tabIndex: 0 },
        { tagName: 'INPUT', disabled: false, tabIndex: 0 },
        { tagName: 'A', href: '#', tabIndex: 0 }
      ]

      vi.mocked(document.querySelectorAll).mockReturnValue(focusableElements as any)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button', 'input', 'a[href]'],
        trapFocus: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(document.querySelectorAll).toHaveBeenCalledWith(
        expect.stringContaining('button, input, a[href]')
      )
    })

    it('should skip disabled elements', () => {
      const elements = [
        { tagName: 'BUTTON', disabled: true, tabIndex: 0, focus: vi.fn() },
        { tagName: 'BUTTON', disabled: false, tabIndex: 0, focus: vi.fn() }
      ]

      vi.mocked(document.querySelectorAll).mockReturnValue(elements as any)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        trapFocus: true
      }

      handleKeyboardNavigation(event, config)

      // Should focus the non-disabled element
      expect(elements[1].focus).toHaveBeenCalled()
      expect(elements[0].focus).not.toHaveBeenCalled()
    })

    it('should respect tabindex order', () => {
      const elements = [
        { tabIndex: 2, focus: vi.fn() },
        { tabIndex: 1, focus: vi.fn() },
        { tabIndex: 3, focus: vi.fn() }
      ]

      vi.mocked(document.querySelectorAll).mockReturnValue(elements as any)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['[tabindex]'],
        trapFocus: true
      }

      handleKeyboardNavigation(event, config)

      // Should focus elements in tabindex order (1, 2, 3)
      expect(elements[1].focus).toHaveBeenCalled() // tabIndex: 1
    })
  })

  describe('Focus Trap', () => {
    it('should trap focus within container', () => {
      const containerElements = [
        { focus: vi.fn(), tabIndex: 0 },
        { focus: vi.fn(), tabIndex: 0 }
      ]

      vi.mocked(mockElement.querySelectorAll).mockReturnValue(containerElements as any)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        trapFocus: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.focusTrapped).toBe(true)
    })

    it('should not trap focus when disabled', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        trapFocus: false
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.focusTrapped).toBe(false)
    })
  })

  describe('Accessibility Features', () => {
    it('should announce navigation to screen readers', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        announceNavigation: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.announcement).toBeDefined()
    })

    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({
          matches: true, // prefers-reduced-motion: reduce
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }))
      })

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        respectReducedMotion: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.reducedMotion).toBe(true)
    })

    it('should handle high contrast mode', () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({
          matches: true, // prefers-contrast: high
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }))
      })

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        respectHighContrast: true
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(true)
      expect(result.highContrast).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing container gracefully', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: null as any,
        focusableSelectors: ['button']
      }

      expect(() => {
        handleKeyboardNavigation(event, config)
      }).not.toThrow()
    })

    it('should handle empty focusable selectors', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: []
      }

      const result = handleKeyboardNavigation(event, config)

      expect(result.handled).toBe(false)
    })

    it('should handle focus errors gracefully', () => {
      const elementWithError = {
        focus: vi.fn(() => { throw new Error('Focus failed') }),
        tabIndex: 0
      }

      vi.mocked(document.querySelectorAll).mockReturnValue([elementWithError] as any)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button']
      }

      expect(() => {
        handleKeyboardNavigation(event, config)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should cache focusable elements when enabled', () => {
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        cacheFocusableElements: true
      }

      const handler = createKeyboardNavigationHandler(config)
      
      const event1 = new KeyboardEvent('keydown', { key: 'Tab' })
      handler(event1)
      
      const event2 = new KeyboardEvent('keydown', { key: 'Tab' })
      handler(event2)

      // Should only query DOM once due to caching
      expect(document.querySelectorAll).toHaveBeenCalledTimes(1)
    })

    it('should debounce rapid key events', () => {
      const config: KeyboardNavigationConfig = {
        container: mockElement as any,
        focusableSelectors: ['button'],
        debounceMs: 100
      }

      const handler = createKeyboardNavigationHandler(config)
      
      // Rapid key events
      const event1 = new KeyboardEvent('keydown', { key: 'Tab' })
      const event2 = new KeyboardEvent('keydown', { key: 'Tab' })
      
      const result1 = handler(event1)
      const result2 = handler(event2)

      expect(result1.handled).toBe(true)
      expect(result2.handled).toBe(false) // Debounced
    })
  })
})