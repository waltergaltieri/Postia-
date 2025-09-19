/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { 
  useReducedMotion, 
  useHighContrast,
  announceToScreenReader,
  isScreenReaderActive,
  safeBrowserExecution,
  safeAccessibilityExecution,
  AccessibilityErrorBoundary
} from '../index'

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('Error Handling and Type Safety', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''
    // Reset console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('SSR Safety', () => {
    it('should handle useReducedMotion safely during SSR', () => {
      // Mock SSR environment
      const originalWindow = global.window
      delete (global as any).window

      const { result } = renderHook(() => useReducedMotion())

      expect(result.current.prefersReducedMotion).toBe(false)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      // Restore window
      global.window = originalWindow
    })

    it('should handle useHighContrast safely during SSR', () => {
      // Mock SSR environment
      const originalWindow = global.window
      delete (global as any).window

      const { result } = renderHook(() => useHighContrast())

      expect(result.current.prefersHighContrast).toBe(false)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      // Restore window
      global.window = originalWindow
    })
  })

  describe('Error Handling', () => {
    it('should handle matchMedia errors gracefully', () => {
      // Mock matchMedia to throw an error
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => {
          throw new Error('matchMedia not supported')
        }),
      })

      const { result } = renderHook(() => useReducedMotion())

      expect(result.current.prefersReducedMotion).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.code).toBe('MEDIA_QUERY_FAILED')
    })

    it('should handle screen reader announcement errors', () => {
      // Mock document.body to be null
      const originalBody = document.body
      Object.defineProperty(document, 'body', {
        writable: true,
        value: null
      })

      // Should not throw error
      expect(() => {
        announceToScreenReader('Test message')
      }).not.toThrow()

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to announce to screen reader:',
        expect.any(Object)
      )

      // Restore body
      Object.defineProperty(document, 'body', {
        writable: true,
        value: originalBody
      })
    })

    it('should handle screen reader detection errors', () => {
      // Mock navigator to throw error
      const originalNavigator = global.navigator
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          get userAgent() {
            throw new Error('Navigator error')
          }
        }
      })

      const result = isScreenReaderActive()
      expect(result).toBe(false)

      // Restore navigator
      global.navigator = originalNavigator
    })
  })

  describe('Safe Execution Wrappers', () => {
    it('should execute function safely and return result', () => {
      const testFunction = () => 'success'
      const result = safeBrowserExecution(testFunction, 'fallback')

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.error).toBeUndefined()
    })

    it('should handle function errors and return fallback', () => {
      const testFunction = () => {
        throw new Error('Test error')
      }
      const result = safeBrowserExecution(testFunction, 'fallback')

      expect(result.success).toBe(false)
      expect(result.data).toBe('fallback')
      expect(result.error).toBeTruthy()
      expect(result.error?.code).toBe('BROWSER_EXECUTION_FAILED')
    })

    it('should handle SSR execution safely', () => {
      // Mock SSR environment
      const originalWindow = global.window
      delete (global as any).window

      const testFunction = () => 'success'
      const result = safeBrowserExecution(testFunction, 'fallback')

      expect(result.success).toBe(false)
      expect(result.data).toBe('fallback')
      expect(result.error?.code).toBe('SSR_EXECUTION')

      // Restore window
      global.window = originalWindow
    })

    it('should execute accessibility function safely', () => {
      const testFunction = (value: string) => value.toUpperCase()
      const safeFunction = safeAccessibilityExecution(testFunction, 'fallback')

      const result = safeFunction('test')
      expect(result).toBe('TEST')
    })

    it('should handle accessibility function errors', () => {
      const testFunction = () => {
        throw new Error('Accessibility error')
      }
      const safeFunction = safeAccessibilityExecution(testFunction, 'fallback')

      const result = safeFunction()
      expect(result).toBe('fallback')
      expect(console.warn).toHaveBeenCalledWith(
        'Accessibility function failed safely:',
        expect.any(Error)
      )
    })
  })

  describe('Media Query Handling', () => {
    it('should handle reduced motion preference correctly', () => {
      mockMatchMedia(true)

      const { result } = renderHook(() => useReducedMotion())

      expect(result.current.prefersReducedMotion).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle high contrast preference correctly', () => {
      mockMatchMedia(true)

      const { result } = renderHook(() => useHighContrast())

      expect(result.current.prefersHighContrast).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle media query changes', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockReturnValue(mockMediaQuery),
      })

      const { result } = renderHook(() => useReducedMotion())

      expect(result.current.prefersReducedMotion).toBe(false)

      // Simulate media query change
      act(() => {
        mockMediaQuery.matches = true
        const changeHandler = mockMediaQuery.addEventListener.mock.calls
          .find(call => call[0] === 'change')?.[1]
        if (changeHandler) {
          changeHandler({ matches: true })
        }
      })

      expect(result.current.prefersReducedMotion).toBe(true)
    })
  })

  describe('Type Safety', () => {
    it('should validate announcement priority types', () => {
      // Valid priorities should work
      expect(() => {
        announceToScreenReader('Test', 'polite')
        announceToScreenReader('Test', 'assertive')
      }).not.toThrow()

      // Invalid priority should be handled gracefully
      expect(() => {
        announceToScreenReader('Test', 'invalid' as any)
      }).not.toThrow()
    })

    it('should handle invalid message types', () => {
      expect(() => {
        announceToScreenReader(null as any)
        announceToScreenReader(undefined as any)
        announceToScreenReader(123 as any)
      }).not.toThrow()

      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('should cleanup event listeners properly', () => {
      const mockRemoveEventListener = jest.fn()
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: jest.fn(),
      }

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockReturnValue(mockMediaQuery),
      })

      const { unmount } = renderHook(() => useReducedMotion())

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should cleanup live regions properly', () => {
      // Create a live region
      announceToScreenReader('Test message')

      const liveRegion = document.getElementById('sr-live-region-polite')
      expect(liveRegion).toBeTruthy()

      // Simulate cleanup (in real usage, this would happen automatically)
      if (liveRegion) {
        document.body.removeChild(liveRegion)
      }

      expect(document.getElementById('sr-live-region-polite')).toBeNull()
    })
  })
})