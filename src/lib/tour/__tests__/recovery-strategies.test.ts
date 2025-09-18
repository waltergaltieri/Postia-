/**
 * Tests for Default Recovery Strategies
 */

import { DefaultRecoveryStrategies } from '../recovery-strategies'
import {
  TourElementNotFoundError,
  TourNavigationError,
  TourPermissionError,
  TourTimeoutError,
  TourError
} from '../error-handling'

// Mock DOM methods
Object.defineProperty(document, 'querySelector', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(document, 'readyState', {
  value: 'complete',
  writable: true
})

// Mock window.location
delete (window as any).location
;(window as any).location = {
  pathname: '/test',
  href: 'http://test.com/test'
}

Object.defineProperty(window, 'history', {
  value: {
    pushState: jest.fn()
  },
  writable: true
})

Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
  writable: true
})

describe('DefaultRecoveryStrategies', () => {
  let strategies: DefaultRecoveryStrategies

  beforeEach(() => {
    strategies = new DefaultRecoveryStrategies()
    jest.clearAllMocks()
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('onElementNotFound', () => {
    test('should recover when element is found on retry', async () => {
      const error = new TourElementNotFoundError('tour-1', '#test-element', 1)
      
      // Mock querySelector to return element immediately
      ;(document.querySelector as jest.Mock).mockReturnValue(document.createElement('div'))

      const result = await strategies.onElementNotFound(error)
      
      expect(result).toBe(true)
      expect(document.querySelector).toHaveBeenCalled()
    })

    test('should return false when element cannot be found', async () => {
      const error = new TourElementNotFoundError('tour-1', '#missing-element', 1)
      
      ;(document.querySelector as jest.Mock).mockReturnValue(null)

      const result = await strategies.onElementNotFound(error)
      
      expect(result).toBe(false)
    })
  })

  describe('onNavigationError', () => {
    test('should attempt navigation recovery', async () => {
      const error = new TourNavigationError('tour-1', '/expected', '/actual', 1)
      
      const result = await strategies.onNavigationError(error)
      
      // Should attempt recovery (may succeed or fail depending on implementation)
      expect(typeof result).toBe('boolean')
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/expected')
    })

    test('should recover when paths are similar', async () => {
      const error = new TourNavigationError('tour-1', '/users/:id', '/users/123', 1)
      
      const result = await strategies.onNavigationError(error)
      
      expect(result).toBe(true)
    })

    test('should return false for unrecoverable navigation errors', async () => {
      const error = new TourNavigationError('tour-1', '/completely/different', '/path', 1)
      
      const result = await strategies.onNavigationError(error)
      
      expect(result).toBe(false)
    })
  })

  describe('onPermissionError', () => {
    test('should handle permission error gracefully', async () => {
      const error = new TourPermissionError('tour-1', 'admin', 1)
      
      const result = await strategies.onPermissionError(error)
      
      expect(result).toBe(false) // Permission errors are not recoverable
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tour-recovery-action'
        })
      )
    })
  })

  describe('onTimeout', () => {
    test('should return false when timeout cannot be recovered', async () => {
      const error = new TourTimeoutError('tour-1', 1, 5000)
      
      const result = await strategies.onTimeout(error)
      
      expect(result).toBe(false)
    })
  })

  describe('onGenericError', () => {
    test('should handle generic errors', async () => {
      const error = new TourError('Generic error', 'tour-1', 1)
      
      const result = await strategies.onGenericError(error)
      
      expect(result).toBe(false)
    })
  })
})