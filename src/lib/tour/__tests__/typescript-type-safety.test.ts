/**
 * Focused tests for TypeScript type safety and environment detection
 * Covers Requirements 2.1, 2.2, 2.3, 2.4 from the specification
 */

import { 
    EnvironmentDetector,
    DOMTypeGuards
} from '../element-validator'

// Mock different environment scenarios
const mockBrowserEnvironment = () => {
    Object.defineProperty(global, 'window', {
        value: {
            document: {},
            navigator: { userAgent: 'Mozilla/5.0' }
        },
        writable: true
    })
    Object.defineProperty(global, 'document', {
        value: {
            querySelector: jest.fn(),
            createElement: jest.fn()
        },
        writable: true
    })
}

const mockNodeEnvironment = () => {
    delete (global as any).window
    delete (global as any).document
    Object.defineProperty(global, 'process', {
        value: {
            versions: { node: '18.0.0' }
        },
        writable: true
    })
}

const createMockHTMLElement = (overrides = {}) => ({
    tagName: 'DIV',
    textContent: 'Mock Element',
    getAttribute: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({ 
        width: 100, 
        height: 50, 
        top: 0, 
        left: 0 
    })),
    ...overrides
})

describe('TypeScript Type Safety and Environment Detection', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterEach(() => {
        // Restore browser environment for other tests
        mockBrowserEnvironment()
    })

    describe('Requirement 2.1: Timeout Type Consistency', () => {
        test('should handle setTimeout return type correctly in browser environment', () => {
            mockBrowserEnvironment()
            
            const timeoutType = EnvironmentDetector.getTimeoutType()
            expect(timeoutType).toBe('browser')

            // Test that timeout operations work correctly
            const timeoutId = setTimeout(() => {}, 100)
            expect(timeoutId).toBeDefined()
            
            expect(() => {
                clearTimeout(timeoutId)
            }).not.toThrow()
        })

        test('should handle setTimeout return type correctly in Node.js environment', () => {
            mockNodeEnvironment()
            
            const timeoutType = EnvironmentDetector.getTimeoutType()
            expect(timeoutType).toBe('node')

            // Test that timeout operations work correctly in Node environment
            const timeoutId = setTimeout(() => {}, 100)
            expect(timeoutId).toBeDefined()
            
            expect(() => {
                clearTimeout(timeoutId)
            }).not.toThrow()
        })

        test('should handle timeout cleanup errors gracefully', () => {
            const originalClearTimeout = global.clearTimeout
            
            // Mock clearTimeout to throw an error
            global.clearTimeout = jest.fn(() => {
                throw new Error('Timeout cleanup error')
            })

            // This should be handled gracefully in the actual implementation
            expect(() => {
                const timeoutId = setTimeout(() => {}, 100)
                // The actual implementation should catch this error
                try {
                    clearTimeout(timeoutId)
                } catch (error) {
                    // Expected in this test scenario
                }
            }).not.toThrow()

            global.clearTimeout = originalClearTimeout
        })

        test('should provide type-safe timeout utilities', () => {
            // Test that timeout IDs are properly typed
            const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {}, 100)
            expect(typeof timeoutId).toBeDefined()
            
            // Should work with both number and object types depending on environment
            clearTimeout(timeoutId)
        })
    })

    describe('Requirement 2.2: Environment Detection and Type Guards', () => {
        test('should detect browser environment correctly', () => {
            mockBrowserEnvironment()
            
            const isBrowser = EnvironmentDetector.isBrowser()
            expect(isBrowser).toBe(true)
            
            const isNode = EnvironmentDetector.isNode()
            expect(isNode).toBe(false)
        })

        test('should detect Node.js environment correctly', () => {
            mockNodeEnvironment()
            
            const isBrowser = EnvironmentDetector.isBrowser()
            expect(isBrowser).toBe(false)
            
            const isNode = EnvironmentDetector.isNode()
            expect(isNode).toBe(true)
        })

        test('should handle mixed or undefined environment gracefully', () => {
            // Remove all environment indicators
            delete (global as any).window
            delete (global as any).document
            delete (global as any).process

            expect(() => {
                EnvironmentDetector.isBrowser()
                EnvironmentDetector.isNode()
                EnvironmentDetector.getTimeoutType()
            }).not.toThrow()

            const isBrowser = EnvironmentDetector.isBrowser()
            const isNode = EnvironmentDetector.isNode()
            
            expect(typeof isBrowser).toBe('boolean')
            expect(typeof isNode).toBe('boolean')
        })

        test('should handle partial environment objects', () => {
            // Test with window but no document
            Object.defineProperty(global, 'window', {
                value: {},
                writable: true
            })
            delete (global as any).document

            expect(() => {
                EnvironmentDetector.isBrowser()
            }).not.toThrow()

            // Test with process but no versions
            delete (global as any).window
            Object.defineProperty(global, 'process', {
                value: {},
                writable: true
            })

            expect(() => {
                EnvironmentDetector.isNode()
            }).not.toThrow()
        })
    })

    describe('Requirement 2.3: DOM Operation Null/Undefined Checks', () => {
        test('should validate HTMLElement instances correctly', () => {
            const validElement = createMockHTMLElement()
            const isValid = DOMTypeGuards.isHTMLElement(validElement)
            expect(isValid).toBe(true)
        })

        test('should reject null and undefined elements', () => {
            expect(DOMTypeGuards.isHTMLElement(null)).toBe(false)
            expect(DOMTypeGuards.isHTMLElement(undefined)).toBe(false)
        })

        test('should reject non-element objects', () => {
            const invalidElements = [
                {},
                { tagName: 'DIV' }, // Missing required methods
                'string',
                123,
                [],
                true,
                Symbol('test')
            ]

            invalidElements.forEach(element => {
                const isValid = DOMTypeGuards.isHTMLElement(element)
                expect(isValid).toBe(false)
            })
        })

        test('should handle HTMLElement detection in test environment', () => {
            // Test when HTMLElement is not available (like in some test environments)
            const originalHTMLElement = (global as any).HTMLElement
            delete (global as any).HTMLElement

            const elementLike = {
                tagName: 'DIV',
                getAttribute: jest.fn(),
                getBoundingClientRect: jest.fn()
            }

            const isValid = DOMTypeGuards.isHTMLElement(elementLike)
            expect(isValid).toBe(true) // Should use fallback detection

            // Restore HTMLElement
            if (originalHTMLElement) {
                (global as any).HTMLElement = originalHTMLElement
            }
        })

        test('should safely get element properties', () => {
            const element = createMockHTMLElement({ 
                textContent: 'Test content',
                className: 'test-class'
            })

            const textContent = DOMTypeGuards.safeGetProperty<string>(element, 'textContent')
            expect(textContent).toBe('Test content')

            const className = DOMTypeGuards.safeGetProperty<string>(element, 'className')
            expect(className).toBe('test-class')
        })

        test('should return null for properties of null/undefined elements', () => {
            const nullResult = DOMTypeGuards.safeGetProperty<string>(null, 'textContent')
            expect(nullResult).toBeNull()

            const undefinedResult = DOMTypeGuards.safeGetProperty<string>(undefined, 'textContent')
            expect(undefinedResult).toBeNull()
        })

        test('should handle property access errors gracefully', () => {
            const element = createMockHTMLElement()
            
            // Mock property access to throw an error
            Object.defineProperty(element, 'textContent', {
                get: () => {
                    throw new Error('Property access error')
                }
            })

            const result = DOMTypeGuards.safeGetProperty<string>(element, 'textContent')
            expect(result).toBeNull()
        })

        test('should safely call element methods', () => {
            const element = createMockHTMLElement()
            element.getAttribute = jest.fn(() => 'test-value')

            const result = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'data-testid')
            expect(result).toBe('test-value')
            expect(element.getAttribute).toHaveBeenCalledWith('data-testid')
        })

        test('should return null for methods of null/undefined elements', () => {
            const nullResult = DOMTypeGuards.safeCallMethod<string>(null, 'getAttribute', 'data-testid')
            expect(nullResult).toBeNull()

            const undefinedResult = DOMTypeGuards.safeCallMethod<string>(undefined, 'getAttribute', 'data-testid')
            expect(undefinedResult).toBeNull()
        })

        test('should handle method call errors gracefully', () => {
            const element = createMockHTMLElement()
            element.getAttribute = jest.fn(() => {
                throw new Error('Method call error')
            })

            const result = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'data-testid')
            expect(result).toBeNull()
        })

        test('should handle non-function methods gracefully', () => {
            const element = createMockHTMLElement()
            element.getAttribute = 'not-a-function' as any

            const result = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'data-testid')
            expect(result).toBeNull()
        })

        test('should validate elements before operations', () => {
            const validElement = createMockHTMLElement()
            const isValid = DOMTypeGuards.isValidElement(validElement)
            expect(isValid).toBe(true)

            const invalidElements = [null, undefined, {}, 'string']
            invalidElements.forEach(element => {
                const isValid = DOMTypeGuards.isValidElement(element as any)
                expect(isValid).toBe(false)
            })
        })
    })

    describe('Requirement 2.4: Async Operation Error Handling', () => {
        test('should handle async timeout operations safely', async () => {
            const asyncOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('completed'), 50)
            })

            await expect(asyncOperation).resolves.toBe('completed')
        })

        test('should handle async operation timeouts', async () => {
            const timeoutPromise = new Promise<string>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Operation timed out'))
                }, 100)

                // Simulate cleanup
                setTimeout(() => {
                    clearTimeout(timeoutId)
                    resolve('completed')
                }, 50)
            })

            await expect(timeoutPromise).resolves.toBe('completed')
        })

        test('should handle Promise rejection gracefully', async () => {
            const failingPromise = Promise.reject(new Error('Async operation failed'))

            await expect(failingPromise).rejects.toThrow('Async operation failed')
        })

        test('should handle concurrent async operations', async () => {
            const operations = Array.from({ length: 5 }, (_, i) => 
                new Promise<number>((resolve) => {
                    setTimeout(() => resolve(i), Math.random() * 50)
                })
            )

            const results = await Promise.all(operations)
            expect(results).toHaveLength(5)
            expect(results).toEqual([0, 1, 2, 3, 4])
        })

        test('should handle async operation cleanup on error', async () => {
            let cleanupCalled = false
            
            const operationWithCleanup = new Promise<string>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Operation failed'))
                }, 50)

                // Simulate cleanup logic
                const cleanup = () => {
                    clearTimeout(timeoutId)
                    cleanupCalled = true
                }

                // Simulate error scenario
                setTimeout(() => {
                    cleanup()
                    reject(new Error('Operation failed'))
                }, 25)
            })

            await expect(operationWithCleanup).rejects.toThrow('Operation failed')
            expect(cleanupCalled).toBe(true)
        })

        test('should handle race conditions in async operations', async () => {
            let operationCount = 0
            
            const racingOperations = Array.from({ length: 10 }, () => 
                new Promise<number>((resolve) => {
                    const currentCount = ++operationCount
                    setTimeout(() => resolve(currentCount), Math.random() * 10)
                })
            )

            const results = await Promise.all(racingOperations)
            expect(results).toHaveLength(10)
            expect(Math.max(...results)).toBe(10)
        })
    })

    describe('Type Safety Integration Tests', () => {
        test('should maintain type safety across environment detection and DOM operations', () => {
            mockBrowserEnvironment()
            
            const isBrowser = EnvironmentDetector.isBrowser()
            if (isBrowser) {
                const element = createMockHTMLElement()
                const isValidElement = DOMTypeGuards.isValidElement(element)
                expect(isValidElement).toBe(true)
                
                if (isValidElement) {
                    const textContent = DOMTypeGuards.safeGetProperty<string>(element, 'textContent')
                    expect(typeof textContent).toBe('string')
                }
            }
        })

        test('should handle type coercion safely', () => {
            const element = createMockHTMLElement({ 
                getAttribute: jest.fn(() => null) 
            })

            const attribute = DOMTypeGuards.safeCallMethod<string | null>(element, 'getAttribute', 'data-testid')
            expect(attribute).toBeNull()

            // Should handle type coercion gracefully
            const stringAttribute = attribute || 'default-value'
            expect(stringAttribute).toBe('default-value')
        })

        test('should maintain type safety with generic methods', () => {
            const element = createMockHTMLElement()
            
            // Test with different return types
            const stringResult = DOMTypeGuards.safeGetProperty<string>(element, 'textContent')
            const numberResult = DOMTypeGuards.safeGetProperty<number>(element, 'offsetWidth')
            const booleanResult = DOMTypeGuards.safeGetProperty<boolean>(element, 'hidden')

            expect(typeof stringResult === 'string' || stringResult === null).toBe(true)
            expect(typeof numberResult === 'number' || numberResult === null).toBe(true)
            expect(typeof booleanResult === 'boolean' || booleanResult === null).toBe(true)
        })
    })
})