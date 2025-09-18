/**
 * Tests for Tour Error Handling System
 */

import {
  TourError,
  TourElementNotFoundError,
  TourNavigationError,
  TourPermissionError,
  TourTimeoutError,
  TourErrorHandler,
  ErrorRecoveryStrategy
} from '../error-handling'

// Mock recovery strategies for testing
class MockRecoveryStrategies implements ErrorRecoveryStrategy {
  async onElementNotFound(): Promise<boolean> {
    return true
  }

  async onNavigationError(): Promise<boolean> {
    return true
  }

  async onPermissionError(): Promise<boolean> {
    return false // Permission errors typically not recoverable
  }

  async onTimeout(): Promise<boolean> {
    return true
  }

  async onGenericError(): Promise<boolean> {
    return false
  }
}

class FailingRecoveryStrategies implements ErrorRecoveryStrategy {
  async onElementNotFound(): Promise<boolean> {
    throw new Error('Recovery failed')
  }

  async onNavigationError(): Promise<boolean> {
    return false
  }

  async onPermissionError(): Promise<boolean> {
    return false
  }

  async onTimeout(): Promise<boolean> {
    return false
  }

  async onGenericError(): Promise<boolean> {
    return false
  }
}

describe('TourError Classes', () => {
  test('TourError should be created with correct properties', () => {
    const error = new TourError('Test error', 'tour-1', 2, undefined, true)
    
    expect(error.message).toBe('Test error')
    expect(error.tourId).toBe('tour-1')
    expect(error.stepIndex).toBe(2)
    expect(error.recoverable).toBe(true)
    expect(error.name).toBe('TourError')
  })

  test('TourElementNotFoundError should extend TourError', () => {
    const error = new TourElementNotFoundError('tour-1', '#missing-element', 1)
    
    expect(error).toBeInstanceOf(TourError)
    expect(error.name).toBe('TourElementNotFoundError')
    expect(error.message).toBe('Element not found: #missing-element')
    expect(error.tourId).toBe('tour-1')
    expect(error.stepIndex).toBe(1)
    expect(error.recoverable).toBe(true)
  })

  test('TourNavigationError should extend TourError', () => {
    const error = new TourNavigationError('tour-1', '/expected', '/actual', 2)
    
    expect(error).toBeInstanceOf(TourError)
    expect(error.name).toBe('TourNavigationError')
    expect(error.message).toBe('Navigation error: expected /expected, got /actual')
    expect(error.recoverable).toBe(true)
  })

  test('TourPermissionError should extend TourError', () => {
    const error = new TourPermissionError('tour-1', 'admin', 3)
    
    expect(error).toBeInstanceOf(TourError)
    expect(error.name).toBe('TourPermissionError')
    expect(error.message).toBe('Permission denied: admin')
    expect(error.recoverable).toBe(false)
  })

  test('TourTimeoutError should extend TourError', () => {
    const error = new TourTimeoutError('tour-1', 1, 5000)
    
    expect(error).toBeInstanceOf(TourError)
    expect(error.name).toBe('TourTimeoutError')
    expect(error.message).toBe('Tour step timed out after 5000ms')
    expect(error.recoverable).toBe(true)
  })
})

describe('TourErrorHandler', () => {
  let errorHandler: TourErrorHandler
  let mockStrategies: MockRecoveryStrategies
  let mockContext: any

  beforeEach(() => {
    mockStrategies = new MockRecoveryStrategies()
    errorHandler = new TourErrorHandler(mockStrategies)
    
    mockContext = {
      tourId: 'test-tour',
      stepIndex: 1,
      sessionId: 'session-123',
      timestamp: new Date(),
      userAgent: 'test-agent',
      url: 'http://test.com',
      viewport: { width: 1920, height: 1080 }
    }

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()

    // Mock window.dispatchEvent
    Object.defineProperty(window, 'dispatchEvent', {
      value: jest.fn(),
      writable: true
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should handle recoverable error successfully', async () => {
    const error = new TourElementNotFoundError('test-tour', '#element', 1)
    
    const result = await errorHandler.handleError(error, mockContext)
    
    expect(result).toBe(true)
  })

  test('should handle non-recoverable error gracefully', async () => {
    const error = new TourPermissionError('test-tour', 'admin', 1)
    
    const result = await errorHandler.handleError(error, mockContext)
    
    expect(result).toBe(false)
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tour-error-recovery'
      })
    )
  })

  test('should handle recovery strategy failure', async () => {
    const failingStrategies = new FailingRecoveryStrategies()
    const handler = new TourErrorHandler(failingStrategies)
    const error = new TourElementNotFoundError('test-tour', '#element', 1)
    
    const result = await handler.handleError(error, mockContext)
    
    expect(result).toBe(false)
  })

  test('should collect error statistics', async () => {
    const error1 = new TourElementNotFoundError('test-tour', '#element1', 1)
    const error2 = new TourTimeoutError('test-tour', 2, 5000)
    const error3 = new TourPermissionError('test-tour', 'admin', 3)
    
    await errorHandler.handleError(error1, mockContext)
    await errorHandler.handleError(error2, mockContext)
    await errorHandler.handleError(error3, mockContext)
    
    const stats = errorHandler.getErrorStats()
    
    expect(stats.totalErrors).toBe(3)
    expect(stats.recoverableErrors).toBe(2)
    expect(stats.recoveredErrors).toBe(2)
    expect(stats.errorsByType['TourElementNotFoundError']).toBe(1)
    expect(stats.errorsByType['TourTimeoutError']).toBe(1)
    expect(stats.errorsByType['TourPermissionError']).toBe(1)
  })

  test('should clear error reports', async () => {
    const error = new TourElementNotFoundError('test-tour', '#element', 1)
    await errorHandler.handleError(error, mockContext)
    
    expect(errorHandler.getErrorStats().totalErrors).toBe(1)
    
    errorHandler.clearErrorReports()
    
    expect(errorHandler.getErrorStats().totalErrors).toBe(0)
  })
})