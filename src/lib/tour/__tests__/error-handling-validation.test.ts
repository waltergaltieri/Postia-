/**
 * Tests for enhanced error handling and async operation safety
 */

import { TourElementValidator, findTourElement } from '../element-validator'

// Mock console methods to capture warnings
const originalConsoleWarn = console.warn
const mockConsoleWarn = jest.fn()

beforeAll(() => {
    console.warn = mockConsoleWarn
})

afterAll(() => {
    console.warn = originalConsoleWarn
})

describe('Enhanced Error Handling and Async Operation Safety', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockConsoleWarn.mockClear()
    })

    describe('Input Validation', () => {
        test('should handle null/undefined selectors gracefully', async () => {
            const result1 = await TourElementValidator.findElement(null as any)
            expect(result1.found).toBe(false)
            expect(result1.error).toContain('No selectors provided')

            const result2 = await TourElementValidator.findElement(undefined as any)
            expect(result2.found).toBe(false)
            expect(result2.error).toContain('No selectors provided')

            const result3 = await TourElementValidator.findElement('')
            expect(result3.found).toBe(false)
            expect(result3.error).toContain('No valid selectors provided')
        })

        test('should handle invalid timeout values', async () => {
            const result1 = await TourElementValidator.findElement('.test', -1)
            expect(result1.found).toBe(false)
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid timeout provided')
            )

            const result2 = await TourElementValidator.findElement('.test', NaN)
            expect(result2.found).toBe(false)
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid timeout provided')
            )

            const result3 = await TourElementValidator.findElement('.test', Infinity)
            expect(result3.found).toBe(false)
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid timeout provided')
            )
        }, 10000)

        test('should filter out invalid selectors from array', async () => {
            const selectors = ['', null, undefined, '   ', '.valid-selector'] as any[]
            const result = await TourElementValidator.findElement(selectors, 100) // Short timeout
            
            // Should only attempt the valid selector
            expect(result.selector).toBe('.valid-selector')
        }, 10000)
    })

    describe('Async Operation Safety', () => {
        test('should handle race conditions in waitForElement', async () => {
            // This test verifies that multiple calls don't interfere with each other
            const promises = [
                TourElementValidator.waitForElement('.test1', 100),
                TourElementValidator.waitForElement('.test2', 100),
                TourElementValidator.waitForElement('.test3', 100)
            ]

            const results = await Promise.all(promises)
            
            // All should resolve (to null since elements don't exist)
            expect(results).toHaveLength(3)
            results.forEach(result => {
                expect(result).toBeNull()
            })
        })

        test('should cleanup timeouts properly', async () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
            
            // Start a search that will timeout
            const promise = TourElementValidator.waitForElement('.non-existent', 50)
            const result = await promise
            
            expect(result).toBeNull()
            expect(clearTimeoutSpy).toHaveBeenCalled()
            
            clearTimeoutSpy.mockRestore()
        })
    })

    describe('Error Recovery', () => {
        test('should continue with fallbacks when CSS selector fails', async () => {
            // Mock querySelector to throw an error
            const originalQuerySelector = document.querySelector
            document.querySelector = jest.fn().mockImplementation(() => {
                throw new Error('CSS selector error')
            })

            const result = await TourElementValidator.findElement(['.invalid', '.fallback'], 100) // Short timeout
            
            // Should have attempted both selectors
            expect(result.performance?.fallbacksAttempted).toBe(2)
            // The error should be logged during the waitForElement process
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('CSS selector error for'),
                expect.any(Error)
            )

            // Restore original
            document.querySelector = originalQuerySelector
        }, 10000)

        test('should handle DOM availability checks', async () => {
            // Mock document to be unavailable
            const originalDocument = global.document
            delete (global as any).document

            const result = await TourElementValidator.waitForElement('.test', 100) // Short timeout
            expect(result).toBeNull()

            // Restore document
            global.document = originalDocument
        }, 10000)
    })

    describe('Observer Error Handling', () => {
        test('should handle invalid callback gracefully', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '.test',
                null as any,
                { timeout: 100 }
            )

            expect(typeof cleanup).toBe('function')
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid callback provided')
            )

            // Should be safe to call cleanup
            expect(() => cleanup()).not.toThrow()
        })

        test('should handle multiple cleanup calls', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '.test',
                () => {},
                { timeout: 100 }
            )

            // Multiple cleanup calls should not throw
            expect(() => {
                cleanup()
                cleanup()
                cleanup()
            }).not.toThrow()
        })

        test('should handle observer creation errors', () => {
            // Mock MutationObserver to throw
            const originalMutationObserver = global.MutationObserver
            global.MutationObserver = jest.fn().mockImplementation(() => {
                throw new Error('Observer creation failed')
            })

            const cleanup = TourElementValidator.createElementObserver(
                '.test',
                () => {},
                { timeout: 100 }
            )

            expect(typeof cleanup).toBe('function')
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Error setting up mutation observer'),
                expect.any(Error)
            )

            // Restore
            global.MutationObserver = originalMutationObserver
        })
    })

    describe('findTourElement Error Handling', () => {
        test('should handle invalid parameters', async () => {
            const result1 = await findTourElement(null as any)
            expect(result1).toBeNull()
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('No selector provided')
            )

            const result2 = await findTourElement('.test', { 
                timeout: -1, 
                retries: -1, 
                retryDelay: -1 
            })
            expect(result2).toBeNull()
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid parameters provided')
            )
        }, 10000)

        test('should handle retry delay errors', async () => {
            // Mock setTimeout to fail
            const originalSetTimeout = global.setTimeout
            let callCount = 0
            global.setTimeout = jest.fn().mockImplementation((callback, delay) => {
                callCount++
                if (callCount > 1) {
                    throw new Error('setTimeout failed')
                }
                return originalSetTimeout(callback, delay)
            })

            const result = await findTourElement('.test', { 
                timeout: 50, 
                retries: 2, 
                retryDelay: 10 
            })
            
            expect(result).toBeNull()
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Error during retry delay'),
                expect.any(Error)
            )

            // Restore
            global.setTimeout = originalSetTimeout
        })
    })

    describe('validateTourSteps Error Handling', () => {
        test('should handle invalid steps array', async () => {
            const result1 = await TourElementValidator.validateTourSteps(null as any)
            expect(result1.valid).toBe(false)
            expect(result1.errors).toContain('Invalid steps array provided')

            const result2 = await TourElementValidator.validateTourSteps('invalid' as any)
            expect(result2.valid).toBe(false)
            expect(result2.errors).toContain('Invalid steps array provided')
        })

        test('should handle invalid step structures', async () => {
            const steps = [
                { element: '.valid' },
                null,
                { element: '' },
                { element: 123 },
                {}
            ] as any[]

            const result = await TourElementValidator.validateTourSteps(steps)
            
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.missingElements.length).toBeGreaterThan(0)
            
            // Should have error messages for invalid steps
            expect(result.errors.some(error => error.includes('Invalid step structure'))).toBe(true)
        })

        test('should handle findElement errors during validation', async () => {
            // Mock findElement to throw
            const originalFindElement = TourElementValidator.findElement
            TourElementValidator.findElement = jest.fn().mockRejectedValue(new Error('Find element failed'))

            const steps = [{ element: '.test' }]
            const result = await TourElementValidator.validateTourSteps(steps)

            expect(result.valid).toBe(false)
            expect(result.errors.some(error => error.includes('Find element failed'))).toBe(true)

            // Restore
            TourElementValidator.findElement = originalFindElement
        })
    })
})