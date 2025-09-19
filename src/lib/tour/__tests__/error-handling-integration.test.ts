/**
 * Integration tests for enhanced error handling and async operation safety
 */

import { TourElementValidator, findTourElement } from '../element-validator'

describe('Error Handling Integration Tests', () => {
    // Mock console to capture warnings
    const originalConsoleWarn = console.warn
    const mockConsoleWarn = jest.fn()

    beforeAll(() => {
        console.warn = mockConsoleWarn
    })

    afterAll(() => {
        console.warn = originalConsoleWarn
    })

    beforeEach(() => {
        mockConsoleWarn.mockClear()
    })

    test('should handle complete error scenarios gracefully', async () => {
        // Test with various invalid inputs
        const results = await Promise.all([
            TourElementValidator.findElement(null as any),
            TourElementValidator.findElement(''),
            TourElementValidator.findElement([null, '', undefined] as any[]),
            findTourElement(null as any),
            TourElementValidator.validateTourSteps(null as any),
            TourElementValidator.validateTourSteps([{ element: null }] as any[])
        ])

        // All should handle errors gracefully without throwing
        expect(results).toHaveLength(6)
        
        // First three are findElement results
        expect(results[0].found).toBe(false)
        expect(results[1].found).toBe(false)
        expect(results[2].found).toBe(false)
        
        // Fourth is findTourElement result
        expect(results[3]).toBeNull()
        
        // Fifth and sixth are validateTourSteps results
        expect(results[4].valid).toBe(false)
        expect(results[5].valid).toBe(false)
    })

    test('should provide consistent error reporting', async () => {
        const result = await TourElementValidator.findElement(['', '   ', null] as any[])
        
        expect(result).toMatchObject({
            element: null,
            found: false,
            error: 'No valid selectors provided',
            validationMethod: 'hybrid',
            performance: {
                searchTime: 0,
                fallbacksAttempted: 0
            }
        })
    })

    test('should handle observer cleanup in error scenarios', () => {
        // Test observer with invalid inputs
        const cleanup1 = TourElementValidator.createElementObserver('', () => {})
        const cleanup2 = TourElementValidator.createElementObserver('.test', null as any)
        const cleanup3 = TourElementValidator.createElementObserver(null as any, () => {})

        // All should return cleanup functions
        expect(typeof cleanup1).toBe('function')
        expect(typeof cleanup2).toBe('function')
        expect(typeof cleanup3).toBe('function')

        // All cleanup functions should be safe to call
        expect(() => {
            cleanup1()
            cleanup2()
            cleanup3()
        }).not.toThrow()

        // Should have logged appropriate warnings
        expect(mockConsoleWarn).toHaveBeenCalledWith(
            expect.stringContaining('Invalid selector provided')
        )
        expect(mockConsoleWarn).toHaveBeenCalledWith(
            expect.stringContaining('Invalid callback provided')
        )
    })

    test('should handle timeout edge cases', async () => {
        // Test with various invalid timeout values
        const promises = [
            TourElementValidator.findElement('.test', -1),
            TourElementValidator.findElement('.test', NaN),
            TourElementValidator.findElement('.test', Infinity),
            TourElementValidator.waitForElement('.test', -1),
            TourElementValidator.waitForElement('.test', NaN)
        ]

        const results = await Promise.all(promises)
        
        // All should complete without hanging or throwing
        expect(results).toHaveLength(5)
        
        // Should have logged warnings about invalid timeouts
        expect(mockConsoleWarn).toHaveBeenCalledWith(
            expect.stringContaining('Invalid timeout provided')
        )
    })

    test('should maintain performance tracking during errors', async () => {
        const startTime = performance.now()
        const result = await TourElementValidator.findElement(['', null, undefined] as any[])
        const endTime = performance.now()
        
        expect(result.performance).toBeDefined()
        expect(result.performance?.searchTime).toBe(0) // Should be 0 for immediate failures
        expect(result.performance?.fallbacksAttempted).toBe(0)
        
        // The actual test execution should be very fast for invalid inputs
        expect(endTime - startTime).toBeLessThan(100) // Less than 100ms
    })

    test('should handle concurrent operations safely', async () => {
        // Test multiple concurrent operations with various inputs
        const operations = Array.from({ length: 10 }, (_, i) => {
            if (i % 3 === 0) return TourElementValidator.findElement(null as any)
            if (i % 3 === 1) return TourElementValidator.findElement('')
            return TourElementValidator.findElement([null, ''] as any[])
        })

        const results = await Promise.all(operations)
        
        // All should complete successfully
        expect(results).toHaveLength(10)
        results.forEach(result => {
            expect(result.found).toBe(false)
            expect(result.error).toBeDefined()
        })
    })

    test('should handle DOM manipulation errors gracefully', () => {
        // Mock querySelector to throw
        const originalQuerySelector = document.querySelector
        document.querySelector = jest.fn().mockImplementation(() => {
            throw new Error('DOM error')
        })

        // Should not throw when creating observer
        const cleanup = TourElementValidator.createElementObserver('.test', () => {})
        expect(typeof cleanup).toBe('function')
        
        // Cleanup should be safe
        expect(() => cleanup()).not.toThrow()

        // Restore
        document.querySelector = originalQuerySelector
    })
})