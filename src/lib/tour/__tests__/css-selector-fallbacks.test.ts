/**
 * Focused tests for CSS selector fixes and JavaScript fallbacks
 * Covers Requirements 1.1, 1.2, 1.3 from the specification
 */

import { 
    SelectorSupport,
    JavaScriptElementFinder,
    FallbackStrategyManager
} from '../element-validator'

// Mock DOM setup
const createMockElement = (overrides = {}) => ({
    tagName: 'DIV',
    textContent: 'Mock Element',
    getAttribute: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    nextElementSibling: null,
    ...overrides
})

const mockDocument = {
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    getElementById: jest.fn()
}

Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true
})

describe('CSS Selector Fixes and JavaScript Fallbacks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Requirement 1.1: CSS Pseudo-Selector Syntax Handling', () => {
        test('should detect invalid :contains() pseudo-selector', () => {
            const invalidSelector = 'button:contains("Submit")'
            
            // Mock querySelector to throw for :contains()
            mockDocument.querySelector.mockImplementation((selector) => {
                if (selector.includes(':contains(')) {
                    throw new Error('Invalid pseudo-selector')
                }
                return null
            })

            const isValid = SelectorSupport.isValidSelector(invalidSelector)
            expect(isValid).toBe(false)
        })

        test('should detect invalid :has() pseudo-selector when unsupported', () => {
            const invalidSelector = 'div:has(span.active)'
            
            // Mock querySelector to throw for :has()
            mockDocument.querySelector.mockImplementation((selector) => {
                if (selector.includes(':has(')) {
                    throw new Error('Unsupported pseudo-selector')
                }
                return null
            })

            const isValid = SelectorSupport.isValidSelector(invalidSelector)
            expect(isValid).toBe(false)
        })

        test('should validate standard CSS3 selectors', () => {
            const validSelectors = [
                'button',
                '.submit-button',
                '#main-form',
                '[data-testid="submit"]',
                'form > button',
                'button[type="submit"]',
                'nav ul li a',
                '.container .button:hover',
                'input:focus',
                'div:nth-child(2n+1)'
            ]

            validSelectors.forEach(selector => {
                mockDocument.querySelector.mockReturnValue(null) // No error = valid
                const isValid = SelectorSupport.isValidSelector(selector)
                expect(isValid).toBe(true)
            })
        })

        test('should handle malformed selectors gracefully', () => {
            const malformedSelectors = [
                '[unclosed-bracket',
                'div..double-class',
                '#id with spaces',
                '.class:unknown-pseudo',
                '>>invalid-combinator',
                ''
            ]

            malformedSelectors.forEach(selector => {
                mockDocument.querySelector.mockImplementation(() => {
                    throw new Error('Malformed selector')
                })

                const isValid = SelectorSupport.isValidSelector(selector)
                expect(isValid).toBe(false)
            })
        })
    })

    describe('Requirement 1.2: Fallback Selector Generation', () => {
        test('should generate valid CSS fallback selectors for buttons', () => {
            const originalSelector = 'button:contains("Submit")'
            const fallbacks = FallbackStrategyManager.generateFallbackStrategies(originalSelector)

            expect(fallbacks.attempted.length).toBeGreaterThan(0)
            
            // Should include data-testid fallback
            const hasTestIdFallback = fallbacks.attempted.some(selector => 
                selector.includes('data-testid')
            )
            expect(hasTestIdFallback).toBe(true)

            // Should include role-based fallback
            const hasRoleFallback = fallbacks.attempted.some(selector => 
                selector.includes('role="button"')
            )
            expect(hasRoleFallback).toBe(true)

            // Should not contain :contains() in fallbacks
            fallbacks.attempted.forEach(selector => {
                expect(selector).not.toMatch(/:contains\(/)
            })
        })

        test('should generate valid CSS fallback selectors for navigation', () => {
            const originalSelector = 'nav:contains("Home")'
            const fallbacks = FallbackStrategyManager.generateFallbackStrategies(originalSelector)

            // Should include navigation-specific fallbacks
            const hasNavFallback = fallbacks.attempted.some(selector => 
                selector.includes('role="navigation"')
            )
            expect(hasNavFallback).toBe(true)

            // Should include ARIA label fallback
            const hasAriaFallback = fallbacks.attempted.some(selector => 
                selector.includes('aria-label')
            )
            expect(hasAriaFallback).toBe(true)
        })

        test('should generate valid CSS fallback selectors for forms', () => {
            const originalSelector = 'label:contains("Email") + input'
            const fallbacks = FallbackStrategyManager.generateFallbackStrategies(originalSelector)

            // Should include input-specific fallbacks
            const hasInputFallback = fallbacks.attempted.some(selector => 
                selector.includes('input')
            )
            expect(hasInputFallback).toBe(true)

            // Should include name attribute fallback
            const hasNameFallback = fallbacks.attempted.some(selector => 
                selector.includes('name=')
            )
            expect(hasNameFallback).toBe(true)
        })

        test('should handle class-based selectors with special characters', () => {
            const originalSelector = '.my-class.with:special#chars'
            const fallbacks = FallbackStrategyManager.generateFallbackStrategies(originalSelector)

            // Should include attribute-based alternatives
            const hasAttributeFallback = fallbacks.attempted.some(selector => 
                selector.includes('[class')
            )
            expect(hasAttributeFallback).toBe(true)

            // Generated selectors should be valid (no unescaped special chars)
            fallbacks.attempted.forEach(selector => {
                expect(() => {
                    // This should not throw if selector is properly escaped
                    SelectorSupport.isValidSelector(selector)
                }).not.toThrow()
            })
        })
    })

    describe('Requirement 1.3: Text-Based Selector Methods', () => {
        test('should find elements by text content using JavaScript', () => {
            const mockButton1 = createMockElement({ 
                tagName: 'BUTTON',
                textContent: 'Submit Form' 
            })
            const mockButton2 = createMockElement({ 
                tagName: 'BUTTON',
                textContent: 'Cancel Operation' 
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockButton1, mockButton2])

            const submitButtons = JavaScriptElementFinder.findByTextContent('button', 'Submit')
            expect(submitButtons.length).toBe(1)
            expect(submitButtons[0].textContent).toBe('Submit Form')
        })

        test('should support exact vs partial text matching', () => {
            const mockElement = createMockElement({ 
                textContent: 'Submit Form Now' 
            })
            mockDocument.querySelectorAll.mockReturnValue([mockElement])

            // Partial match
            const partialMatch = JavaScriptElementFinder.findByTextContent('button', 'Submit', false)
            expect(partialMatch.length).toBe(1)

            // Exact match - should not match
            const exactMatch = JavaScriptElementFinder.findByTextContent('button', 'Submit', true)
            expect(exactMatch.length).toBe(0)

            // Exact match - should match
            const exactMatch2 = JavaScriptElementFinder.findByTextContent('button', 'Submit Form Now', true)
            expect(exactMatch2.length).toBe(1)
        })

        test('should find buttons by text with nested elements', () => {
            const mockSpan = createMockElement({ 
                tagName: 'SPAN',
                textContent: 'Submit' 
            })
            const mockButton = createMockElement({ 
                tagName: 'BUTTON',
                textContent: '',
                querySelectorAll: jest.fn(() => [mockSpan])
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockButton])

            const buttons = JavaScriptElementFinder.findButtonByText('Submit')
            expect(buttons.length).toBe(1)
        })

        test('should find links by text content', () => {
            const mockLink = createMockElement({ 
                tagName: 'A',
                textContent: 'Go to Dashboard' 
            })
            mockDocument.querySelectorAll.mockReturnValue([mockLink])

            const links = JavaScriptElementFinder.findLinkByText('Dashboard')
            expect(links.length).toBe(1)
        })

        test('should find inputs by associated label text', () => {
            const mockInput = createMockElement({ 
                tagName: 'INPUT',
                id: 'email-field'
            })
            const mockLabel = createMockElement({ 
                tagName: 'LABEL',
                textContent: 'Email Address',
                getAttribute: jest.fn(() => 'email-field')
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockLabel])
            mockDocument.getElementById.mockReturnValue(mockInput)

            const inputs = JavaScriptElementFinder.findInputByLabelText('Email')
            expect(inputs.length).toBe(1)
        })

        test('should find inputs with label as next sibling', () => {
            const mockInput = createMockElement({ 
                tagName: 'INPUT'
            })
            const mockLabel = createMockElement({ 
                tagName: 'LABEL',
                textContent: 'Username',
                nextElementSibling: mockInput
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockLabel])

            const inputs = JavaScriptElementFinder.findInputByLabelText('Username')
            expect(inputs.length).toBe(1)
        })

        test('should find inputs nested within labels', () => {
            const mockInput = createMockElement({ 
                tagName: 'INPUT'
            })
            const mockLabel = createMockElement({ 
                tagName: 'LABEL',
                textContent: 'Password',
                querySelector: jest.fn(() => mockInput)
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockLabel])

            const inputs = JavaScriptElementFinder.findInputByLabelText('Password')
            expect(inputs.length).toBe(1)
        })

        test('should handle elements with role="button"', () => {
            const mockDiv = createMockElement({ 
                tagName: 'DIV',
                textContent: 'Click Me',
                getAttribute: jest.fn((attr) => attr === 'role' ? 'button' : null)
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockDiv])

            const buttons = JavaScriptElementFinder.findButtonByText('Click Me')
            expect(buttons.length).toBe(1)
        })

        test('should deduplicate found elements', () => {
            const mockButton = createMockElement({ 
                tagName: 'BUTTON',
                textContent: 'Submit'
            })
            
            // Mock multiple queries returning the same element
            mockDocument.querySelectorAll.mockImplementation((selector) => {
                if (selector === 'button' || selector === '[role="button"]') {
                    return [mockButton]
                }
                return []
            })

            const buttons = JavaScriptElementFinder.findButtonByText('Submit')
            expect(buttons.length).toBe(1) // Should be deduplicated
        })

        test('should handle empty or invalid text input gracefully', () => {
            expect(() => {
                JavaScriptElementFinder.findByTextContent('button', '')
                JavaScriptElementFinder.findByTextContent('', 'text')
                JavaScriptElementFinder.findButtonByText('')
                JavaScriptElementFinder.findLinkByText('')
                JavaScriptElementFinder.findInputByLabelText('')
            }).not.toThrow()

            // Should return empty arrays for invalid input
            expect(JavaScriptElementFinder.findByTextContent('button', '')).toEqual([])
            expect(JavaScriptElementFinder.findByTextContent('', 'text')).toEqual([])
        })

        test('should handle non-browser environment gracefully', () => {
            const originalDocument = (global as any).document
            delete (global as any).document

            expect(() => {
                JavaScriptElementFinder.findByTextContent('button', 'text')
                JavaScriptElementFinder.findButtonByText('text')
                JavaScriptElementFinder.findLinkByText('text')
                JavaScriptElementFinder.findInputByLabelText('text')
            }).not.toThrow()

            // Should return empty arrays in non-browser environment
            expect(JavaScriptElementFinder.findByTextContent('button', 'text')).toEqual([])

            if (originalDocument) (global as any).document = originalDocument
        })
    })

    describe('Integration with :has() Selector Fallback', () => {
        test('should provide JavaScript fallback for :has() functionality', () => {
            const mockChild = createMockElement({ tagName: 'SPAN' })
            const mockParent = createMockElement({ 
                tagName: 'DIV',
                querySelector: jest.fn(() => mockChild)
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockParent])

            const elements = JavaScriptElementFinder.findWithHasSelector('div', 'span')
            expect(elements.length).toBe(1)
        })

        test('should handle :has() fallback with no matching children', () => {
            const mockParent = createMockElement({ 
                tagName: 'DIV',
                querySelector: jest.fn(() => null)
            })
            
            mockDocument.querySelectorAll.mockReturnValue([mockParent])

            const elements = JavaScriptElementFinder.findWithHasSelector('div', 'span')
            expect(elements.length).toBe(0)
        })

        test('should handle :has() fallback with invalid selectors', () => {
            expect(() => {
                JavaScriptElementFinder.findWithHasSelector('', 'span')
                JavaScriptElementFinder.findWithHasSelector('div', '')
                JavaScriptElementFinder.findWithHasSelector(null as any, 'span')
                JavaScriptElementFinder.findWithHasSelector('div', null as any)
            }).not.toThrow()

            // Should return empty arrays for invalid input
            expect(JavaScriptElementFinder.findWithHasSelector('', 'span')).toEqual([])
            expect(JavaScriptElementFinder.findWithHasSelector('div', '')).toEqual([])
        })
    })
})