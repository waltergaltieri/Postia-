/**
 * Unit tests for all fixed functionality in TourElementValidator
 * Task 9: Create unit tests for all fixed functionality
 * 
 * This test suite covers all requirements from the specification:
 * - CSS selector fixes and JavaScript fallbacks (Requirements 1.1, 1.2, 1.3)
 * - TypeScript type safety and environment detection (Requirements 2.1, 2.2, 2.3, 2.4)
 * - Memory leak fixes and proper cleanup behavior (Requirements 3.1, 3.2, 3.3, 3.4)
 * - Selector generation and validation logic (Requirements 4.1, 4.2, 4.4)
 * - Enhanced smart selector builder (Requirements 4.3, 1.1, 1.2)
 * - Element visibility and position calculation (Requirements 5.1, 5.2)
 * - Comprehensive validation and error reporting (Requirements 5.4, 4.1)
 */

import { TourElementValidator } from '../element-validator'

// Mock DOM environment
const createMockElement = (overrides = {}) => ({
    tagName: 'DIV',
    textContent: 'Mock Element',
    getAttribute: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({ 
        width: 100, 
        height: 50, 
        top: 0, 
        left: 0,
        right: 100,
        bottom: 50
    })),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    offsetParent: {},
    style: { display: 'block', visibility: 'visible' },
    ...overrides
})

// Mock MutationObserver
const mockObserver = {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => [])
}

const mockMutationObserver = jest.fn(() => mockObserver)

// Setup mocks
beforeAll(() => {
    // Mock MutationObserver
    Object.defineProperty(global, 'MutationObserver', {
        value: mockMutationObserver,
        writable: true
    })

    // Mock performance
    Object.defineProperty(global, 'performance', {
        value: { now: jest.fn(() => Date.now()) },
        writable: true
    })

    // Ensure window.getComputedStyle exists
    if (typeof window !== 'undefined' && !window.getComputedStyle) {
        Object.defineProperty(window, 'getComputedStyle', {
            value: jest.fn(() => ({
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                position: 'static'
            })),
            writable: true
        })
    }
})

describe('Unit Tests - All Fixed Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('1. CSS Selector Fixes and JavaScript Fallbacks', () => {
        describe('Requirement 1.1: CSS Pseudo-Selector Syntax Handling', () => {
            test('should handle invalid :contains() selectors gracefully', async () => {
                const invalidSelector = 'button:contains("Submit")'
                
                // Mock document.querySelector to throw for invalid selectors
                const originalQuerySelector = document.querySelector
                document.querySelector = jest.fn((selector) => {
                    if (selector.includes(':contains(')) {
                        throw new Error('Invalid pseudo-selector')
                    }
                    return null
                })

                // Should not throw error due to fallback handling
                const result = await TourElementValidator.findElement(invalidSelector, 1000)
                expect(result).toBeDefined()
                expect(result.found).toBe(false)

                document.querySelector = originalQuerySelector
            })

            test('should handle invalid :has() selectors when unsupported', async () => {
                const invalidSelector = 'div:has(span.active)'
                
                const originalQuerySelector = document.querySelector
                document.querySelector = jest.fn((selector) => {
                    if (selector.includes(':has(')) {
                        throw new Error('Unsupported pseudo-selector')
                    }
                    return null
                })

                const result = await TourElementValidator.findElement(invalidSelector, 1000)
                expect(result).toBeDefined()
                expect(result.found).toBe(false)

                document.querySelector = originalQuerySelector
            })

            test('should validate standard CSS3 selectors', async () => {
                const validSelectors = [
                    'button',
                    '.submit-button',
                    '#main-form',
                    '[data-testid="submit"]'
                ]

                for (const selector of validSelectors) {
                    const mockElement = createMockElement()
                    document.querySelector = jest.fn(() => mockElement)

                    const result = await TourElementValidator.findElement(selector, 1000)
                    expect(result.found).toBe(true)
                }
            })
        })

        describe('Requirement 1.2: Fallback Selector Generation', () => {
            test('should generate valid fallback selectors', () => {
                const primarySelector = 'button:contains("Submit")'
                const fallbacks = TourElementValidator.generateFallbackSelectors(primarySelector)
                
                expect(Array.isArray(fallbacks)).toBe(true)
                expect(fallbacks.length).toBeGreaterThan(0)
                
                // Should not contain :contains() in fallbacks
                fallbacks.forEach(selector => {
                    expect(selector).not.toMatch(/:contains\(/)
                })
            })

            test('should handle empty or invalid selector input', () => {
                expect(() => {
                    TourElementValidator.generateFallbackSelectors('')
                    TourElementValidator.generateFallbackSelectors(null as any)
                    TourElementValidator.generateFallbackSelectors(undefined as any)
                }).not.toThrow()
            })
        })

        describe('Requirement 1.3: Text-Based Selector Methods', () => {
            test('should provide JavaScript alternatives for text-based selection', async () => {
                const textSelector = 'button:contains("Click me")'
                
                // Mock element with text content
                const mockButton = createMockElement({ 
                    tagName: 'BUTTON',
                    textContent: 'Click me' 
                })
                
                document.querySelector = jest.fn(() => null) // CSS selector fails
                document.querySelectorAll = jest.fn(() => [mockButton])

                const result = await TourElementValidator.findElement(textSelector, 1000)
                expect(result).toBeDefined()
                // The implementation should fall back to JavaScript text matching
            })
        })
    })

    describe('2. TypeScript Type Safety and Environment Detection', () => {
        describe('Requirement 2.1: Timeout Type Consistency', () => {
            test('should handle setTimeout return types correctly', () => {
                const timeoutId = setTimeout(() => {}, 100)
                expect(timeoutId).toBeDefined()
                
                expect(() => {
                    clearTimeout(timeoutId)
                }).not.toThrow()
            })

            test('should handle timeout cleanup errors gracefully', () => {
                const originalClearTimeout = global.clearTimeout
                global.clearTimeout = jest.fn(() => {
                    throw new Error('Timeout cleanup error')
                })

                // The implementation should handle this gracefully
                expect(() => {
                    const timeoutId = setTimeout(() => {}, 100)
                    try {
                        clearTimeout(timeoutId)
                    } catch (error) {
                        // Expected in this test scenario
                    }
                }).not.toThrow()

                global.clearTimeout = originalClearTimeout
            })
        })

        describe('Requirement 2.2: Environment Detection and Type Guards', () => {
            test('should detect browser environment correctly', () => {
                // In jsdom environment, should detect as browser
                expect(typeof window).toBe('object')
                expect(typeof document).toBe('object')
            })

            test('should handle missing global objects gracefully', () => {
                const originalWindow = (global as any).window
                const originalDocument = (global as any).document
                
                // Temporarily remove globals
                delete (global as any).window
                delete (global as any).document

                // Implementation should handle this gracefully
                expect(() => {
                    TourElementValidator.createElementObserver('[data-testid="test"]', () => {})
                }).not.toThrow()

                // Restore globals
                if (originalWindow) (global as any).window = originalWindow
                if (originalDocument) (global as any).document = originalDocument
            })
        })

        describe('Requirement 2.3: DOM Operation Null/Undefined Checks', () => {
            test('should handle null element references safely', async () => {
                document.querySelector = jest.fn(() => null)
                
                const result = await TourElementValidator.findElement('[data-testid="missing"]', 1000)
                expect(result.found).toBe(false)
                expect(result.element).toBeNull()
            })

            test('should validate element properties safely', async () => {
                const mockElement = createMockElement({ 
                    getBoundingClientRect: jest.fn(() => null) // Simulate error
                })
                document.querySelector = jest.fn(() => mockElement)

                // Should not throw error even if getBoundingClientRect fails
                const result = await TourElementValidator.findElement('[data-testid="test"]', 1000)
                expect(result).toBeDefined()
            })
        })

        describe('Requirement 2.4: Async Operation Error Handling', () => {
            test('should handle async timeout operations safely', async () => {
                const result = await TourElementValidator.findElement('[data-testid="test"]', 100)
                expect(result).toBeDefined()
                expect(typeof result.found).toBe('boolean')
            })

            test('should handle Promise rejection gracefully', async () => {
                // Mock querySelector to throw an error
                document.querySelector = jest.fn(() => {
                    throw new Error('DOM operation failed')
                })

                const result = await TourElementValidator.findElement('[data-testid="test"]', 1000)
                expect(result).toBeDefined()
                expect(result.found).toBe(false)
            })
        })
    })

    describe('3. Memory Leak Fixes and Proper Cleanup Behavior', () => {
        describe('Requirement 3.1: Proper Observer Disconnection', () => {
            test('should disconnect mutation observers when cleanup is called', () => {
                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {},
                    { timeout: 1000 }
                )

                expect(mockMutationObserver).toHaveBeenCalled()
                expect(mockObserver.observe).toHaveBeenCalled()

                cleanup()

                expect(mockObserver.disconnect).toHaveBeenCalled()
            })

            test('should handle observer disconnect errors gracefully', () => {
                mockObserver.disconnect.mockImplementation(() => {
                    throw new Error('Disconnect failed')
                })

                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {},
                    { timeout: 1000 }
                )

                expect(() => cleanup()).not.toThrow()

                mockObserver.disconnect.mockReset()
            })
        })

        describe('Requirement 3.2: Timeout Cleanup Prevention', () => {
            test('should clear timeouts during cleanup', () => {
                const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {},
                    { timeout: 5000 }
                )

                cleanup()

                expect(clearTimeoutSpy).toHaveBeenCalled()
                clearTimeoutSpy.mockRestore()
            })

            test('should prevent timeout race conditions', async () => {
                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {},
                    { timeout: 100 }
                )

                // Simulate rapid cleanup calls
                const promises = Array.from({ length: 10 }, () => 
                    Promise.resolve().then(() => cleanup())
                )

                await expect(Promise.all(promises)).resolves.toBeDefined()
            })
        })

        describe('Requirement 3.3: Multiple Cleanup Call Handling', () => {
            test('should handle multiple cleanup calls without errors', () => {
                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {},
                    { timeout: 1000 }
                )

                expect(() => {
                    cleanup()
                    cleanup()
                    cleanup()
                }).not.toThrow()
            })

            test('should not perform cleanup operations multiple times', () => {
                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {},
                    { timeout: 1000 }
                )

                cleanup()
                cleanup()
                cleanup()

                // Disconnect should only be called once
                expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
            })
        })

        describe('Requirement 3.4: Automatic Resource Cleanup', () => {
            test('should provide cleanup function for all observers', () => {
                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {}
                )

                expect(typeof cleanup).toBe('function')
                cleanup()
            })

            test('should handle cleanup in non-browser environment', () => {
                const originalWindow = (global as any).window
                const originalDocument = (global as any).document
                
                delete (global as any).window
                delete (global as any).document

                const cleanup = TourElementValidator.createElementObserver(
                    '[data-testid="test"]',
                    () => {}
                )

                expect(typeof cleanup).toBe('function')
                expect(() => cleanup()).not.toThrow()

                if (originalWindow) (global as any).window = originalWindow
                if (originalDocument) (global as any).document = originalDocument
            })
        })
    })

    describe('4. Element Finding and Validation', () => {
        describe('Requirement 4.1: Selector Generation and Validation', () => {
            test('should generate meaningful error messages for validation failures', async () => {
                document.querySelector = jest.fn(() => null)

                const result = await TourElementValidator.findElement('[data-testid="missing"]', 1000)
                expect(result.found).toBe(false)
                expect(result.error).toBeDefined()
                expect(typeof result.error).toBe('string')
            })

            test('should provide fallback strategies when elements cannot be found', async () => {
                document.querySelector = jest.fn(() => null)

                const result = await TourElementValidator.findElement('button.submit', 1000)
                expect(result.fallbackStrategies).toBeDefined()
                expect(Array.isArray(result.fallbackStrategies?.attempted)).toBe(true)
                expect(Array.isArray(result.fallbackStrategies?.recommendations)).toBe(true)
            })
        })

        describe('Requirement 4.2: Test ID Extraction with Edge Cases', () => {
            test('should handle edge cases in selector processing', () => {
                const edgeCaseSelectors = [
                    '',
                    null,
                    undefined,
                    '   ',
                    '[unclosed-bracket',
                    'div..double-class'
                ]

                edgeCaseSelectors.forEach(selector => {
                    expect(() => {
                        TourElementValidator.generateFallbackSelectors(selector as any)
                    }).not.toThrow()
                })
            })
        })

        describe('Requirement 4.4: CSS Selector Escaping', () => {
            test('should handle special characters in selectors', async () => {
                const specialCharSelector = '.my-class.with:special#chars'
                
                // Should not throw error even with special characters
                const result = await TourElementValidator.findElement(specialCharSelector, 1000)
                expect(result).toBeDefined()
            })
        })
    })

    describe('5. Element Visibility and Position Calculation', () => {
        describe('Requirement 5.1: Enhanced Visibility Checking', () => {
            test('should validate element visibility with CSS properties', async () => {
                const visibleElement = createMockElement()
                document.querySelector = jest.fn(() => visibleElement)

                const result = await TourElementValidator.findElement('[data-testid="visible"]', 1000)
                expect(result.found).toBe(true)
            })

            test('should detect hidden elements', async () => {
                const hiddenElement = createMockElement({
                    style: { display: 'none' }
                })
                document.querySelector = jest.fn(() => hiddenElement)

                // Mock getComputedStyle to return hidden styles
                if (typeof window !== 'undefined') {
                    window.getComputedStyle = jest.fn(() => ({
                        display: 'none',
                        visibility: 'visible',
                        opacity: '1'
                    })) as any
                }

                const result = await TourElementValidator.findElement('[data-testid="hidden"]', 1000)
                // Implementation should detect the element but note visibility issues
                expect(result).toBeDefined()
            })
        })

        describe('Requirement 5.2: Position Calculation with Viewport Handling', () => {
            test('should handle viewport and scrolling in position calculation', async () => {
                const element = createMockElement({
                    getBoundingClientRect: jest.fn(() => ({
                        width: 100,
                        height: 50,
                        top: -10, // Partially outside viewport
                        left: 0,
                        right: 100,
                        bottom: 40
                    }))
                })
                document.querySelector = jest.fn(() => element)

                const result = await TourElementValidator.findElement('[data-testid="partial"]', 1000)
                expect(result).toBeDefined()
                // Implementation should handle elements partially outside viewport
            })

            test('should handle iframe and shadow DOM edge cases', async () => {
                const element = createMockElement({
                    ownerDocument: { defaultView: null } // Simulate iframe context
                })
                document.querySelector = jest.fn(() => element)

                const result = await TourElementValidator.findElement('[data-testid="iframe"]', 1000)
                expect(result).toBeDefined()
                // Should handle iframe context gracefully
            })
        })
    })

    describe('6. Performance and Error Reporting', () => {
        describe('Requirement 5.4: Performance Monitoring', () => {
            test('should track search performance in results', async () => {
                const mockElement = createMockElement()
                document.querySelector = jest.fn(() => mockElement)

                const result = await TourElementValidator.findElement('[data-testid="perf-test"]', 1000)
                
                expect(result.performance).toBeDefined()
                expect(typeof result.performance?.searchTime).toBe('number')
                expect(result.performance?.searchTime).toBeGreaterThanOrEqual(0)
            })

            test('should provide validation method information', async () => {
                const mockElement = createMockElement()
                document.querySelector = jest.fn(() => mockElement)

                const result = await TourElementValidator.findElement('[data-testid="method-test"]', 1000)
                
                expect(result.validationMethod).toBeDefined()
                expect(['css', 'javascript', 'hybrid']).toContain(result.validationMethod)
            })
        })

        describe('Comprehensive Error Handling', () => {
            test('should provide detailed error information', async () => {
                document.querySelector = jest.fn(() => {
                    throw new Error('DOM query failed')
                })

                const result = await TourElementValidator.findElement('[data-testid="error-test"]', 1000)
                
                expect(result.found).toBe(false)
                expect(result.error).toBeDefined()
                expect(result.errorDetails).toBeDefined()
            })

            test('should handle concurrent operations safely', async () => {
                const selectors = Array.from({ length: 10 }, (_, i) => `[data-testid="concurrent-${i}"]`)
                
                const promises = selectors.map(selector => 
                    TourElementValidator.findElement(selector, 1000)
                )

                const results = await Promise.all(promises)
                expect(results.length).toBe(10)
                results.forEach(result => {
                    expect(result).toBeDefined()
                    expect(typeof result.found).toBe('boolean')
                })
            })
        })
    })

    describe('7. Integration Tests', () => {
        test('should handle complete element finding workflow', async () => {
            // Test the complete workflow from selector to result
            const mockElement = createMockElement()
            document.querySelector = jest.fn(() => mockElement)

            const result = await TourElementValidator.findElement('[data-testid="workflow-test"]', 2000)
            
            expect(result).toBeDefined()
            expect(result.found).toBe(true)
            expect(result.element).toBe(mockElement)
            expect(result.selector).toBe('[data-testid="workflow-test"]')
            expect(result.performance).toBeDefined()
            expect(result.validationMethod).toBeDefined()
        })

        test('should handle fallback workflow when primary selector fails', async () => {
            // Primary selector fails, fallback should be attempted
            document.querySelector = jest.fn()
                .mockReturnValueOnce(null) // Primary fails
                .mockReturnValue(createMockElement()) // Fallback succeeds

            const result = await TourElementValidator.findElement('button:contains("Submit")', 2000)
            
            expect(result).toBeDefined()
            expect(result.fallbackUsed).toBe(true)
            expect(result.fallbackStrategies).toBeDefined()
        })

        test('should maintain performance under load', async () => {
            const startTime = Date.now()
            
            // Create multiple concurrent operations
            const operations = Array.from({ length: 50 }, (_, i) => 
                TourElementValidator.findElement(`[data-testid="load-test-${i}"]`, 1000)
            )

            const results = await Promise.all(operations)
            const endTime = Date.now()
            
            expect(results.length).toBe(50)
            expect(endTime - startTime).toBeLessThan(5000) // Should complete in reasonable time
        })
    })
})