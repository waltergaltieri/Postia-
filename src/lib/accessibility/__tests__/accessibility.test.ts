/**
 * @jest-environment jsdom
 */

import { 
  useKeyboardNavigation,
  announceToScreenReader,
  useReducedMotion,
  useHighContrast,
  checkTourWCAGCompliance
} from '../index'
import { renderHook, act } from '@testing-library/react'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('Accessibility Features', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = ''
    
    // Reset matchMedia mock
    ;(window.matchMedia as jest.Mock).mockClear()
  })

  describe('useReducedMotion', () => {
    it('should detect reduced motion preference', () => {
      // Mock reduced motion preference
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useReducedMotion())
      expect(result.current).toBe(true)
    })

    it('should return false when reduced motion is not preferred', () => {
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useReducedMotion())
      expect(result.current).toBe(false)
    })
  })

  describe('useHighContrast', () => {
    it('should detect high contrast preference', () => {
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useHighContrast())
      expect(result.current).toBe(true)
    })
  })

  describe('announceToScreenReader', () => {
    it('should create live region for announcements', () => {
      announceToScreenReader('Test announcement', 'polite')
      
      const liveRegion = document.getElementById('sr-live-region-polite')
      expect(liveRegion).toBeTruthy()
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite')
    })

    it('should handle assertive announcements', () => {
      announceToScreenReader('Urgent announcement', 'assertive')
      
      const liveRegion = document.getElementById('sr-live-region-assertive')
      expect(liveRegion).toBeTruthy()
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive')
    })
  })

  describe('useKeyboardNavigation', () => {
    it('should handle keyboard events', () => {
      const onArrowRight = jest.fn()
      const onEscape = jest.fn()
      
      const { result } = renderHook(() => 
        useKeyboardNavigation({
          onArrowRight,
          onEscape
        })
      )

      const keydownHandler = result.current

      // Simulate arrow right key
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      act(() => {
        keydownHandler(arrowRightEvent)
      })
      expect(onArrowRight).toHaveBeenCalled()

      // Simulate escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      act(() => {
        keydownHandler(escapeEvent)
      })
      expect(onEscape).toHaveBeenCalled()
    })
  })

  describe('checkTourWCAGCompliance', () => {
    it('should check basic compliance', () => {
      // Create a test element
      const testElement = document.createElement('div')
      testElement.innerHTML = `
        <button aria-label="Test button">Click me</button>
        <div role="dialog" aria-modal="true" aria-describedby="desc">
          <p id="desc">Dialog description</p>
        </div>
      `
      document.body.appendChild(testElement)

      const result = checkTourWCAGCompliance(testElement)
      
      expect(result).toBeDefined()
      expect(result.level).toMatch(/^(AA|AAA|fail)$/)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.issues)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('should detect missing ARIA labels', () => {
      const testElement = document.createElement('div')
      testElement.innerHTML = `<button>Unlabeled button</button>`
      document.body.appendChild(testElement)

      const result = checkTourWCAGCompliance(testElement, {
        checkAria: true,
        checkContrast: false,
        checkKeyboard: false,
        checkMotion: false,
        checkFocus: false
      })

      // Should find issues with unlabeled button
      const ariaIssues = result.issues.filter(issue => issue.type === 'aria')
      expect(ariaIssues.length).toBeGreaterThan(0)
    })

    it('should detect keyboard navigation issues', () => {
      const testElement = document.createElement('div')
      testElement.innerHTML = `<div>No focusable elements</div>`
      document.body.appendChild(testElement)

      const result = checkTourWCAGCompliance(testElement, {
        checkKeyboard: true,
        checkAria: false,
        checkContrast: false,
        checkMotion: false,
        checkFocus: false
      })

      const keyboardIssues = result.issues.filter(issue => issue.type === 'keyboard')
      expect(keyboardIssues.length).toBeGreaterThan(0)
    })
  })
})