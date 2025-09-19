/**
 * Tests for CSS selector fixes in TourElementValidator
 */

import { TourElementValidator, SmartSelectorBuilder } from '../element-validator'

// Mock DOM environment
const mockDocument = {
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    body: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    }
}

// Mock window object
const mockWindow = {
    getComputedStyle: jest.fn(() => ({
        display: 'block',
        visibility: 'visible',
        opacity: '1'
    }))
}

// Setup DOM mocks
Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true
})

Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
})

Object.defineProperty(global, 'performance', {
    value: {
        now: jest.fn(() => Date.now())
    },
    writable: true
})

describe('TourElementValidator CSS Selector Fixes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('CSS Selector Validation', () => {
        test('should detect invalid :contains() selectors', () => {
            const invalidSelector = 'button:contains("Click me")'
            
            // Mock querySelector to throw for invalid selectors
            mockDocument.querySelector.mockImplementation((selector) => {
                if (selector.includes(':contains(')) {
                    throw new Error('Invalid selector')
                }
                return null
            })

            // This should not throw an error due to our fallback handling
            expect(() => {
                TourElementValidator['findElementWithJavaScriptFallback'](invalidSelector)
            }).not.toThrow()
        })

        test('should detect invalid :has() selectors when not supported', () => {
            const invalidSelector = 'button:has(span:contains("text"))'
            
            // Mock querySelector to throw for :has() selectors
            mockDocument.querySelector.mockImplementation((selector) => {
                if (selector.includes(':has(')) {
                    throw new Error('Invalid selector')
                }
                return null
            })

            expect(() => {
                TourElementValidator['findElementWithJavaScriptFallback'](invalidSelector)
            }).not.toThrow()
        })
    })

    describe('SmartSelectorBuilder Fixes', () => {
        test('should generate valid CSS selectors for navigation', () => {
            const selectors = SmartSelectorBuilder.forNavigation('Home')
            
            // Should not contain :contains() or :has()
            selectors.forEach(selector => {
                expect(selector).not.toMatch(/:contains\(/)
                expect(selector).not.toMatch(/:has\(/)
            })

            // Should contain valid alternatives
            expect(selectors).toContain('[data-testid="home"]')
            expect(selectors).toContain('nav a[href*="home"]')
            expect(selectors).toContain('[aria-label*="Home"]')
        })

        test('should generate valid CSS selectors for buttons', () => {
            const selectors = SmartSelectorBuilder.forButton('Submit')
            
            // Should not contain :contains()
            selectors.forEach(selector => {
                expect(selector).not.toMatch(/:contains\(/)
            })

            // Should contain valid alternatives
            expect(selectors).toContain('[data-testid="submit-button"]')
            expect(selectors).toContain('button[aria-label*="Submit"]')
            expect(selectors).toContain('[role="button"][aria-label*="Submit"]')
        })

        test('should generate valid CSS selectors for forms', () => {
            const selectors = SmartSelectorBuilder.forForm('email')
            
            // Should not contain :contains() + combinator
            selectors.forEach(selector => {
                expect(selector).not.toMatch(/label:contains\(.+\)\s*\+\s*input/)
            })

            // Should contain valid alternatives
            expect(selectors).toContain('[data-testid="email"]')
            expect(selectors).toContain('input[name="email"]')
            expect(selectors).toContain('[aria-label*="email"]')
        })

        test('should properly escape special characters in class names', () => {
            const selectors = SmartSelectorBuilder.forContent('my-class.with-dots')
            
            // Should escape special characters
            expect(selectors).toContain('.my-class\\.with-dots')
        })
    })

    describe('JavaScript Fallback Functions', () => {
        test('should provide JavaScript alternatives for text-based selection', () => {
            const hybridSelectors = SmartSelectorBuilder.generateHybridSelectors('Click me', 'button')
            
            expect(hybridSelectors.cssSelectors).toBeDefined()
            expect(hybridSelectors.jsFunction).toBeDefined()
            expect(typeof hybridSelectors.jsFunction).toBe('function')
        })

        test('should provide JavaScript alternatives for form label selection', () => {
            const hybridSelectors = SmartSelectorBuilder.generateHybridSelectors('Email', 'input')
            
            expect(hybridSelectors.cssSelectors).toBeDefined()
            expect(hybridSelectors.jsFunction).toBeDefined()
            expect(typeof hybridSelectors.jsFunction).toBe('function')
        })
    })

    describe('Performance Tracking', () => {
        test('should track search performance in results', async () => {
            // Mock a successful element find
            const mockElement = {
                getBoundingClientRect: () => ({ width: 100, height: 50, top: 0, left: 0 }),
                offsetParent: document.body
            }
            
            mockDocument.querySelector.mockReturnValue(mockElement)

            const result = await TourElementValidator.findElement('[data-testid="test"]', 1000)
            
            expect(result.performance).toBeDefined()
            expect(result.performance?.searchTime).toBeGreaterThanOrEqual(0)
            expect(result.performance?.fallbacksAttempted).toBe(1)
            expect(result.validationMethod).toBeDefined()
        })
    })

    describe('Observer Cleanup', () => {
        test('should provide proper cleanup function', () => {
            const mockObserver = {
                observe: jest.fn(),
                disconnect: jest.fn()
            }

            // Mock MutationObserver
            global.MutationObserver = jest.fn(() => mockObserver) as any

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            expect(typeof cleanup).toBe('function')
            
            // Call cleanup
            cleanup()
            
            // Should disconnect observer
            expect(mockObserver.disconnect).toHaveBeenCalled()
        })
    })
})