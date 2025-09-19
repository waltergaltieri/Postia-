/**
 * Cross-browser compatibility tests for TourElementValidator
 * Tests selector methods across different browser environments and capabilities
 */

import { TourElementValidator } from '../element-validator'

// Mock different browser environments
const createBrowserEnvironment = (browserType: 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie11') => {
    const userAgents = {
        chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        ie11: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
    }

    const capabilities = {
        chrome: {
            hasSupport: true,
            cssGrid: true,
            flexbox: true,
            customProperties: true,
            querySelector: true,
            querySelectorAll: true,
            shadowDOM: true,
            webComponents: true
        },
        firefox: {
            hasSupport: true,
            cssGrid: true,
            flexbox: true,
            customProperties: true,
            querySelector: true,
            querySelectorAll: true,
            shadowDOM: true,
            webComponents: true
        },
        safari: {
            hasSupport: false, // :has() support varies
            cssGrid: true,
            flexbox: true,
            customProperties: true,
            querySelector: true,
            querySelectorAll: true,
            shadowDOM: true,
            webComponents: true
        },
        edge: {
            hasSupport: true,
            cssGrid: true,
            flexbox: true,
            customProperties: true,
            querySelector: true,
            querySelectorAll: true,
            shadowDOM: true,
            webComponents: true
        },
        ie11: {
            hasSupport: false,
            cssGrid: false,
            flexbox: true,
            customProperties: false,
            querySelector: true,
            querySelectorAll: true,
            shadowDOM: false,
            webComponents: false
        }
    }

    return {
        userAgent: userAgents[browserType],
        capabilities: capabilities[browserType],
        browserType
    }
}

describe('TourElementValidator - Cross-Browser Compatibility', () => {
    const browsers: Array<'chrome' | 'firefox' | 'safari' | 'edge' | 'ie11'> = 
        ['chrome', 'firefox', 'safari', 'edge', 'ie11']

    beforeAll(() => {
        global.performance = {
            now: jest.fn(() => Date.now())
        } as any
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('CSS Selector Support Detection', () => {
        browsers.forEach(browserType => {
            it(`should detect :has() support correctly in ${browserType}`, () => {
                const env = createBrowserEnvironment(browserType)
                
                // Mock navigator
                Object.defineProperty(global, 'navigator', {
                    value: { userAgent: env.userAgent },
                    writable: true
                })

                // Mock document.querySelector behavior based on browser capabilities
                const mockDocument = {
                    querySelector: jest.fn((selector: string) => {
                        if (selector.includes(':has(') && !env.capabilities.hasSupport) {
                            throw new Error('Syntax error, unrecognized expression')
                        }
                        return document.createElement('div')
                    })
                }

                global.document = mockDocument as any

                // Test :has() support detection
                const SelectorSupport = (TourElementValidator as any).SelectorSupport
                if (SelectorSupport) {
                    const hasSupport = SelectorSupport.hasHasSupport()
                    expect(typeof hasSupport).toBe('boolean')
                    
                    if (browserType === 'ie11' || browserType === 'safari') {
                        expect(hasSupport).toBe(false)
                    }
                }
            })

            it(`should validate selectors correctly in ${browserType}`, () => {
                const env = createBrowserEnvironment(browserType)
                
                const mockDocument = {
                    querySelector: jest.fn((selector: string) => {
                        // Simulate browser-specific selector support
                        if (browserType === 'ie11') {
                            if (selector.includes(':has(') || 
                                selector.includes('::placeholder') ||
                                selector.includes(':focus-visible')) {
                                throw new Error('Syntax error')
                            }
                        }
                        return document.createElement('div')
                    })
                }

                global.document = mockDocument as any

                const SelectorSupport = (TourElementValidator as any).SelectorSupport
                if (SelectorSupport) {
                    const testSelectors = [
                        '#simple-id',
                        '.simple-class',
                        '[data-testid="test"]',
                        'button:hover',
                        'div:has(span)', // Modern selector
                        'input::placeholder', // Modern selector
                        'button:focus-visible' // Modern selector
                    ]

                    testSelectors.forEach(selector => {
                        const isValid = SelectorSupport.isValidSelector(selector)
                        expect(typeof isValid).toBe('boolean')
                        
                        if (browserType === 'ie11' && 
                            (selector.includes(':has(') || 
                             selector.includes('::placeholder') || 
                             selector.includes(':focus-visible'))) {
                            expect(isValid).toBe(false)
                        }
                    })
                }
            })
        })
    })

    describe('JavaScript Fallback Mechanisms', () => {
        browsers.forEach(browserType => {
            it(`should provide JavaScript fallbacks in ${browserType}`, async () => {
                const env = createBrowserEnvironment(browserType)
                
                // Mock browser environment
                Object.defineProperty(global, 'navigator', {
                    value: { userAgent: env.userAgent },
                    writable: true
                })

                const mockElement = {
                    tagName: 'BUTTON',
                    textContent: 'Click Me',
                    className: 'btn-primary',
                    getAttribute: jest.fn(),
                    getBoundingClientRect: jest.fn(() => ({
                        x: 100, y: 100, width: 200, height: 50,
                        top: 100, left: 100, right: 300, bottom: 150
                    }))
                } as any

                const mockDocument = {
                    querySelector: jest.fn((selector: string) => {
                        // Simulate :contains() not working in standard CSS
                        if (selector.includes(':contains(')) {
                            throw new Error('Syntax error')
                        }
                        return mockElement
                    }),
                    querySelectorAll: jest.fn(() => [mockElement])
                }

                global.document = mockDocument as any
                global.window = {
                    getComputedStyle: jest.fn(() => ({
                        display: 'block',
                        visibility: 'visible',
                        opacity: '1'
                    }))
                } as any

                // Test JavaScript fallback for text-based selection
                const JavaScriptElementFinder = (TourElementValidator as any).JavaScriptElementFinder
                if (JavaScriptElementFinder) {
                    const elements = JavaScriptElementFinder.findByTextContent('button', 'Click Me')
                    expect(Array.isArray(elements)).toBe(true)
                }

                // Test element finding with fallbacks
                const result = await TourElementValidator.executeWithFallbackStrategies(
                    'button:contains("Click Me")', // Invalid CSS selector
                    { generateFallbacks: true }
                )

                expect(result.fallbackStrategies).toBeDefined()
                expect(result.fallbackStrategies?.recommendations.length).toBeGreaterThan(0)
            })
        })
    })

    describe('DOM API Compatibility', () => {
        browsers.forEach(browserType => {
            it(`should handle DOM operations safely in ${browserType}`, () => {
                const env = createBrowserEnvironment(browserType)
                
                const mockElement = {
                    tagName: 'DIV',
                    getBoundingClientRect: jest.fn(() => {
                        if (browserType === 'ie11') {
                            // IE11 sometimes returns different object structure
                            return {
                                top: 100, left: 100, right: 300, bottom: 150,
                                width: 200, height: 50
                                // Missing x, y properties in IE11
                            }
                        }
                        return {
                            x: 100, y: 100, width: 200, height: 50,
                            top: 100, left: 100, right: 300, bottom: 150
                        }
                    }),
                    getAttribute: jest.fn(),
                    hasAttribute: jest.fn(),
                    checkValidity: browserType === 'ie11' ? undefined : jest.fn(() => true)
                } as any

                // Test DOM type guards
                const DOMTypeGuards = (TourElementValidator as any).DOMTypeGuards
                if (DOMTypeGuards) {
                    expect(DOMTypeGuards.isValidElement(mockElement)).toBe(true)
                    expect(DOMTypeGuards.isValidElement(null)).toBe(false)
                    expect(DOMTypeGuards.isValidElement(undefined)).toBe(false)

                    // Test safe property access
                    const tagName = DOMTypeGuards.safeGetProperty(mockElement, 'tagName')
                    expect(tagName).toBe('DIV')

                    // Test safe method calling
                    const rect = DOMTypeGuards.safeCallMethod(mockElement, 'getBoundingClientRect')
                    expect(rect).toBeDefined()
                    expect(rect.width).toBe(200)
                }
            })

            it(`should handle environment detection in ${browserType}`, () => {
                const env = createBrowserEnvironment(browserType)
                
                // Mock environment
                Object.defineProperty(global, 'navigator', {
                    value: { userAgent: env.userAgent },
                    writable: true
                })

                global.window = {
                    self: {},
                    top: {}
                } as any

                global.document = {
                    querySelector: jest.fn()
                } as any

                // Test environment detection
                const EnvironmentDetector = (TourElementValidator as any).EnvironmentDetector
                if (EnvironmentDetector) {
                    expect(EnvironmentDetector.isBrowser()).toBe(true)
                    expect(EnvironmentDetector.isNode()).toBe(false)
                    expect(EnvironmentDetector.getTimeoutType()).toBe('browser')
                }
            })
        })
    })

    describe('Selector Escaping and Special Characters', () => {
        browsers.forEach(browserType => {
            it(`should handle special characters in selectors for ${browserType}`, () => {
                const env = createBrowserEnvironment(browserType)
                
                const mockDocument = {
                    querySelector: jest.fn((selector: string) => {
                        // All browsers should handle properly escaped selectors
                        if (selector.includes('\\')) {
                            return document.createElement('div')
                        }
                        // Unescaped special characters should fail
                        if (selector.includes('.') && !selector.startsWith('.')) {
                            throw new Error('Syntax error')
                        }
                        return document.createElement('div')
                    })
                }

                global.document = mockDocument as any

                // Test special character handling
                const specialCharacters = [
                    'my-class.with.dots',
                    'class:with:colons',
                    'class[with]brackets',
                    'class#with#hash',
                    'class with spaces'
                ]

                specialCharacters.forEach(className => {
                    // Test that SmartSelectorBuilder properly escapes special characters
                    const SmartSelectorBuilder = (TourElementValidator as any).SmartSelectorBuilder
                    if (SmartSelectorBuilder) {
                        const selectors = SmartSelectorBuilder.forContent(className)
                        expect(Array.isArray(selectors)).toBe(true)
                        
                        // Check that at least one selector has proper escaping
                        const hasEscapedSelector = selectors.some((s: string) => s.includes('\\'))
                        if (className.includes('.') || className.includes(':') || 
                            className.includes('[') || className.includes('#')) {
                            expect(hasEscapedSelector).toBe(true)
                        }
                    }
                })
            })
        })
    })

    describe('Performance Across Browsers', () => {
        browsers.forEach(browserType => {
            it(`should maintain performance standards in ${browserType}`, async () => {
                const env = createBrowserEnvironment(browserType)
                
                // Mock slower performance for older browsers
                const performanceMultiplier = browserType === 'ie11' ? 2 : 1
                
                global.performance = {
                    now: jest.fn(() => Date.now() * performanceMultiplier)
                } as any

                const mockElement = {
                    tagName: 'DIV',
                    getBoundingClientRect: jest.fn(() => ({
                        x: 100, y: 100, width: 200, height: 50,
                        top: 100, left: 100, right: 300, bottom: 150
                    }))
                } as any

                const mockDocument = {
                    querySelector: jest.fn(() => mockElement)
                }

                global.document = mockDocument as any
                global.window = {
                    getComputedStyle: jest.fn(() => ({
                        display: 'block',
                        visibility: 'visible',
                        opacity: '1'
                    }))
                } as any

                const startTime = Date.now()
                const result = await TourElementValidator.findElement('#test-element')
                const endTime = Date.now()

                expect(result.found).toBe(true)
                expect(result.performance?.searchTime).toBeDefined()
                
                // Allow more time for older browsers
                const maxTime = browserType === 'ie11' ? 2000 : 1000
                expect(endTime - startTime).toBeLessThan(maxTime)
            })
        })
    })

    describe('Error Handling Across Browsers', () => {
        browsers.forEach(browserType => {
            it(`should handle browser-specific errors in ${browserType}`, async () => {
                const env = createBrowserEnvironment(browserType)
                
                const mockDocument = {
                    querySelector: jest.fn((selector: string) => {
                        // Simulate browser-specific error messages
                        if (browserType === 'ie11' && selector.includes(':has(')) {
                            throw new Error('Object doesn\'t support property or method')
                        } else if (browserType === 'firefox' && selector.includes(':has(')) {
                            throw new Error('An invalid or illegal selector was specified')
                        } else if (selector.includes(':has(')) {
                            throw new Error('Failed to execute \'querySelector\' on \'Document\'')
                        }
                        return null
                    })
                }

                global.document = mockDocument as any

                const result = await TourElementValidator.findElement('div:has(span)')

                expect(result.found).toBe(false)
                expect(result.error).toBeDefined()
                expect(result.errorDetails?.code).toBe('SELECTOR_INVALID')
                expect(result.errorDetails?.suggestions).toContain('Use feature detection for :has() or provide JavaScript fallback')
            })

            it(`should provide browser-appropriate fallback suggestions in ${browserType}`, async () => {
                const env = createBrowserEnvironment(browserType)
                
                Object.defineProperty(global, 'navigator', {
                    value: { userAgent: env.userAgent },
                    writable: true
                })

                const result = await TourElementValidator.executeWithFallbackStrategies(
                    'button:contains("Click")', // Invalid CSS
                    { generateFallbacks: true }
                )

                expect(result.fallbackStrategies?.recommendations).toBeDefined()
                expect(result.fallbackStrategies?.recommendations.length).toBeGreaterThan(0)
                
                // Should include browser-appropriate suggestions
                const suggestions = result.fallbackStrategies?.recommendations || []
                expect(suggestions.some(s => s.includes('JavaScript') || s.includes('fallback'))).toBe(true)
            })
        })
    })

    describe('Accessibility Features Across Browsers', () => {
        browsers.forEach(browserType => {
            it(`should validate accessibility consistently in ${browserType}`, () => {
                const env = createBrowserEnvironment(browserType)
                
                const mockElement = {
                    tagName: 'BUTTON',
                    getAttribute: jest.fn((attr: string) => {
                        if (attr === 'aria-label') return 'Test button'
                        if (attr === 'role') return 'button'
                        return null
                    }),
                    hasAttribute: jest.fn((attr: string) => {
                        return ['aria-label', 'role'].includes(attr)
                    }),
                    getBoundingClientRect: jest.fn(() => ({
                        x: 100, y: 100, width: 200, height: 50,
                        top: 100, left: 100, right: 300, bottom: 150
                    })),
                    checkValidity: browserType === 'ie11' ? undefined : jest.fn(() => true)
                } as any

                global.window = {
                    getComputedStyle: jest.fn(() => ({
                        display: 'block',
                        visibility: 'visible',
                        opacity: '1'
                    }))
                } as any

                const result = TourElementValidator.validateElementComprehensively(
                    mockElement,
                    'button'
                )

                expect(result.accessibilityScore).toBeGreaterThanOrEqual(0)
                expect(result.accessibilityScore).toBeLessThanOrEqual(100)
                expect(result.isValid).toBe(true)
                
                // Should work consistently across browsers
                expect(result.issues).toBeInstanceOf(Array)
                expect(result.recommendations).toBeInstanceOf(Array)
            })
        })
    })
})