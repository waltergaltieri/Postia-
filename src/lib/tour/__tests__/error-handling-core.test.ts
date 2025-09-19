/**
 * Core tests for enhanced error handling and async operation safety
 */

import { TourElementValidator } from '../element-validator'

// Mock console methods to capture warnings
const originalConsoleWarn = console.warn
const mockConsoleWarn = jest.fn()

beforeAll(() => {
    console.warn = mockConsoleWarn
})

afterAll(() => {
    console.warn = originalConsoleWarn
})

describe('Core Error Handling Improvements', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockConsoleWarn.mockClear()
    })

    describe('Input Validation', () => {
        test('should handle null selectors', async () => {
            const result = await TourElementValidator.findElement(null as any)
            expect(result.found).toBe(false)
            expect(result.error).toBe('No selectors provided')
            expect(result.performance?.searchTime).toBe(0)
            expect(result.performance?.fallbacksAttempted).toBe(0)
        })

        test('should handle undefined selectors', async () => {
            const result = await TourElementValidator.findElement(undefined as any)
            expect(result.found).toBe(false)
            expect(result.error).toBe('No selectors provided')
        })

        test('should handle empty string selector', async () => {
            const result = await TourElementValidator.findElement('')
            expect(result.found).toBe(false)
            expect(result.error).toBe('No valid selectors provided')
        })

        test('should handle array with invalid selectors', async () => {
            const result = await TourElementValidator.findElement(['', null, undefined, '   '] as any[])
            expect(result.found).toBe(false)
            expect(result.error).toBe('No valid selectors provided')
        })

        test('should handle invalid timeout values', () => {
            // Test that invalid timeouts are handled and warnings are logged
            TourElementValidator.findElement('.test', -1)
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid timeout provided')
            )

            TourElementValidator.findElement('.test', NaN)
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid timeout provided')
            )

            TourElementValidator.findElement('.test', Infinity)
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid timeout provided')
            )
        })
    })

    describe('Observer Error Handling', () => {
        test('should handle invalid selector in observer', () => {
            const cleanup1 = TourElementValidator.createElementObserver('', () => {})
            expect(typeof cleanup1).toBe('function')
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid selector provided')
            )

            const cleanup2 = TourElementValidator.createElementObserver(null as any, () => {})
            expect(typeof cleanup2).toBe('function')
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid selector provided')
            )
        })

        test('should handle invalid callback in observer', () => {
            const cleanup = TourElementValidator.createElementObserver('.test', null as any)
            expect(typeof cleanup).toBe('function')
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid callback provided')
            )
        })

        test('should handle multiple cleanup calls gracefully', () => {
            const cleanup = TourElementValidator.createElementObserver('.test', () => {}, { timeout: 100 })
            
            // Multiple cleanup calls should not throw
            expect(() => {
                cleanup()
                cleanup()
                cleanup()
                cleanup()
                cleanup()
            }).not.toThrow()
        })

        test('should handle invalid timeout options', () => {
            const cleanup1 = TourElementValidator.createElementObserver('.test', () => {}, { timeout: -1 })
            expect(typeof cleanup1).toBe('function')

            const cleanup2 = TourElementValidator.createElementObserver('.test', () => {}, { timeout: NaN })
            expect(typeof cleanup2).toBe('function')

            const cleanup3 = TourElementValidator.createElementObserver('.test', () => {}, { timeout: Infinity })
            expect(typeof cleanup3).toBe('function')
        })
    })

    describe('validateTourSteps Error Handling', () => {
        test('should handle null steps array', async () => {
            const result = await TourElementValidator.validateTourSteps(null as any)
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Invalid steps array provided')
            expect(result.results).toEqual([])
            expect(result.missingElements).toEqual([])
        })

        test('should handle non-array input', async () => {
            const result = await TourElementValidator.validateTourSteps('invalid' as any)
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Invalid steps array provided')
        })

        test('should handle steps with invalid structure', async () => {
            const steps = [
                { element: '.valid' },
                null,
                { element: '' },
                { element: 123 },
                {},
                { element: '   ' }
            ] as any[]

            const result = await TourElementValidator.validateTourSteps(steps)
            
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.missingElements.length).toBeGreaterThan(0)
            
            // Should have specific error messages for invalid steps
            const errorMessages = result.errors.join(' ')
            expect(errorMessages).toContain('Invalid step structure')
        })

        test('should handle empty steps array', async () => {
            const result = await TourElementValidator.validateTourSteps([])
            expect(result.valid).toBe(true) // Empty array is valid
            expect(result.results).toEqual([])
            expect(result.missingElements).toEqual([])
            expect(result.errors).toEqual([])
        })
    })

    describe('Error Message Quality', () => {
        test('should provide meaningful error messages', async () => {
            const result = await TourElementValidator.findElement(['', null, undefined] as any[])
            expect(result.error).toBe('No valid selectors provided')
            expect(result.element).toBeNull()
            expect(result.found).toBe(false)
        })

        test('should track performance metrics even on errors', async () => {
            const result = await TourElementValidator.findElement(null as any)
            expect(result.performance).toBeDefined()
            expect(result.performance?.searchTime).toBe(0)
            expect(result.performance?.fallbacksAttempted).toBe(0)
        })
    })

    describe('Race Condition Prevention', () => {
        test('should handle concurrent observer cleanup', () => {
            const cleanup = TourElementValidator.createElementObserver('.test', () => {}, { timeout: 100 })
            
            // Simulate concurrent cleanup calls
            const promises = Array.from({ length: 10 }, () => 
                Promise.resolve().then(() => cleanup())
            )
            
            return expect(Promise.all(promises)).resolves.toBeDefined()
        })
    })
})