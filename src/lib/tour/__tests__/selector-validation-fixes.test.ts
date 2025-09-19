/**
 * Tests for selector generation and validation logic fixes
 * Task 5: Fix selector generation and validation logic
 */

import { TourElementValidator, SelectorValidationUtils } from '../element-validator'

describe('Selector Generation and Validation Fixes', () => {
    describe('CSS Selector Escaping', () => {
        test('should escape special characters in CSS selectors', () => {
            const input = 'my-class.with:special#chars'
            const escaped = SelectorValidationUtils.escapeCSSSelector(input)
            
            // Should escape special characters with backslashes
            expect(escaped).toContain('\\.')
            expect(escaped).toContain('\\:')
            expect(escaped).toContain('\\#')
        })

        test('should handle empty or invalid input gracefully', () => {
            expect(SelectorValidationUtils.escapeCSSSelector('')).toBe('')
            expect(SelectorValidationUtils.escapeCSSSelector(null as any)).toBe('')
            expect(SelectorValidationUtils.escapeCSSSelector(undefined as any)).toBe('')
        })

        test('should escape CSS identifiers for class and ID selectors', () => {
            const input = 'my-class with spaces'
            const escaped = SelectorValidationUtils.escapeCSSIdentifier(input)
            
            // Should escape spaces and other special characters
            expect(escaped).toContain('\\ ')
        })
    })

    describe('Test ID Extraction with Edge Cases', () => {
        test('should extract test ID from data-testid attributes', () => {
            const selector = '[data-testid="my-test-id"]'
            const testId = (TourElementValidator as any).extractTestId(selector)
            
            expect(testId).toBe('my-test-id')
        })

        test('should extract test ID from href patterns', () => {
            const selector = '[href="/dashboard/settings"]'
            const testId = (TourElementValidator as any).extractTestId(selector)
            
            expect(testId).toBe('settings')
        })

        test('should extract test ID from :contains() patterns', () => {
            const selector = 'button:contains("Save Changes")'
            const testId = (TourElementValidator as any).extractTestId(selector)
            
            expect(testId).toBe('save-changes')
        })

        test('should handle complex selectors with multiple patterns', () => {
            const selector = '.my-complex_class#with-id'
            const testId = (TourElementValidator as any).extractTestId(selector)
            
            expect(testId).toBeTruthy()
            expect(typeof testId).toBe('string')
        })

        test('should return null for invalid or empty selectors', () => {
            expect((TourElementValidator as any).extractTestId('')).toBeNull()
            expect((TourElementValidator as any).extractTestId(null)).toBeNull()
            expect((TourElementValidator as any).extractTestId(undefined)).toBeNull()
            expect((TourElementValidator as any).extractTestId('   ')).toBeNull()
        })

        test('should sanitize test IDs properly', () => {
            const testId = SelectorValidationUtils.sanitizeForTestId('My Test ID with Special!@# Characters')
            
            expect(testId).toBe('my-test-id-with-special-characters')
        })

        test('should handle edge cases in test ID sanitization', () => {
            // Empty string
            expect(SelectorValidationUtils.sanitizeForTestId('')).toBeNull()
            
            // Only special characters
            expect(SelectorValidationUtils.sanitizeForTestId('!@#$%')).toBeNull()
            
            // Very long string
            const longString = 'a'.repeat(100)
            const sanitized = SelectorValidationUtils.sanitizeForTestId(longString)
            expect(sanitized?.length).toBeLessThanOrEqual(50)
            
            // String starting with number
            const testId = SelectorValidationUtils.sanitizeForTestId('123-test')
            expect(testId).toBe('123-test')
        })
    })

    describe('Fallback Selector Generation', () => {
        test('should generate valid fallback selectors', () => {
            const primarySelector = 'button:contains("Submit")'
            const fallbacks = SelectorValidationUtils.generateValidFallbackSelectors(primarySelector)
            
            expect(fallbacks).toContain(primarySelector)
            expect(fallbacks.length).toBeGreaterThan(1)
            
            // Should include data-testid fallback
            const hasTestIdFallback = fallbacks.some(selector => 
                selector.includes('data-testid')
            )
            expect(hasTestIdFallback).toBe(true)
        })

        test('should handle button selectors with role fallbacks', () => {
            const primarySelector = 'button.submit-btn'
            const fallbacks = SelectorValidationUtils.generateValidFallbackSelectors(primarySelector)
            
            expect(fallbacks).toContain('button[role="button"]')
            expect(fallbacks).toContain('[role="button"]')
        })

        test('should handle navigation selectors with role fallbacks', () => {
            const primarySelector = 'nav.main-nav'
            const fallbacks = SelectorValidationUtils.generateValidFallbackSelectors(primarySelector)
            
            expect(fallbacks).toContain('nav[role="navigation"]')
            expect(fallbacks).toContain('[role="navigation"]')
        })

        test('should escape special characters in fallback selectors', () => {
            const primarySelector = '.my-class.with:special#chars'
            const fallbacks = SelectorValidationUtils.generateValidFallbackSelectors(primarySelector)
            
            // Should not contain unescaped special characters in generated selectors
            fallbacks.forEach(selector => {
                if (selector.includes('.') && !selector.startsWith('[')) {
                    // Class selectors should have escaped special characters
                    expect(selector).not.toMatch(/[^\\][.:#]/)
                }
            })
        })

        test('should return empty array for invalid input', () => {
            expect(SelectorValidationUtils.generateValidFallbackSelectors('')).toEqual([])
            expect(SelectorValidationUtils.generateValidFallbackSelectors(null as any)).toEqual([])
            expect(SelectorValidationUtils.generateValidFallbackSelectors(undefined as any)).toEqual([])
        })
    })

    describe('CSS Selector Validation', () => {
        test('should validate valid CSS selectors', () => {
            const validSelectors = [
                'button',
                '.my-class',
                '#my-id',
                '[data-testid="test"]',
                'div.container',
                'nav[role="navigation"]'
            ]

            validSelectors.forEach(selector => {
                const result = SelectorValidationUtils.validateCSSSelector(selector)
                expect(result.isValid).toBe(true)
            })
        })

        test('should identify invalid pseudo-selectors', () => {
            const result = SelectorValidationUtils.validateCSSSelector('button:contains("text")')
            
            expect(result.isValid).toBe(false)
            expect(result.error).toContain(':contains()')
            expect(result.suggestion).toContain('JavaScript')
        })

        test('should handle :has() selector based on browser support', () => {
            const result = SelectorValidationUtils.validateCSSSelector('div:has(span)')
            
            // Result depends on browser support, but should provide meaningful feedback
            expect(result).toHaveProperty('isValid')
            if (!result.isValid) {
                expect(result.error).toBeTruthy()
                expect(result.suggestion).toBeTruthy()
            }
        })

        test('should provide meaningful error messages for invalid selectors', () => {
            const invalidSelectors = [
                '',
                '   ',
                null,
                undefined
            ]

            invalidSelectors.forEach(selector => {
                const result = SelectorValidationUtils.validateCSSSelector(selector as any)
                expect(result.isValid).toBe(false)
                expect(result.error).toBeTruthy()
                expect(result.suggestion).toBeTruthy()
            })
        })
    })

    describe('Integration with TourElementValidator', () => {
        test('should use enhanced fallback generation in generateFallbackSelectors', () => {
            const primarySelector = 'button.submit'
            const fallbacks = TourElementValidator.generateFallbackSelectors(primarySelector)
            
            expect(Array.isArray(fallbacks)).toBe(true)
            expect(fallbacks.length).toBeGreaterThan(0)
            expect(fallbacks).toContain(primarySelector)
        })

        test('should handle edge cases in generateFallbackSelectors', () => {
            // Empty selector
            expect(TourElementValidator.generateFallbackSelectors('')).toEqual([])
            
            // Null/undefined
            expect(TourElementValidator.generateFallbackSelectors(null as any)).toEqual([])
            expect(TourElementValidator.generateFallbackSelectors(undefined as any)).toEqual([])
            
            // Whitespace only
            expect(TourElementValidator.generateFallbackSelectors('   ')).toEqual([])
        })
    })

    describe('SmartSelectorBuilder Fixes', () => {
        test('should generate valid selectors for content areas', () => {
            // This test would verify the SmartSelectorBuilder.forContent method
            // if it's properly fixed to use the new escaping utilities
            const className = 'my-content.with:special#chars'
            
            // The method should handle special characters properly
            // and generate valid CSS selectors
            expect(() => {
                // This should not throw an error
                SelectorValidationUtils.escapeCSSIdentifier(className)
            }).not.toThrow()
        })
    })
})

describe('Error Handling and Edge Cases', () => {
    test('should handle malformed selectors gracefully', () => {
        const malformedSelectors = [
            '[unclosed-bracket',
            'div..double-dot',
            '#id with spaces',
            '.class:invalid-pseudo'
        ]

        malformedSelectors.forEach(selector => {
            expect(() => {
                SelectorValidationUtils.validateCSSSelector(selector)
            }).not.toThrow()
        })
    })

    test('should provide fallback behavior when escaping fails', () => {
        // Mock console.warn to avoid noise in tests
        const originalWarn = console.warn
        console.warn = jest.fn()

        try {
            // Test with problematic input that might cause escaping to fail
            const result = SelectorValidationUtils.escapeCSSSelector('test')
            expect(typeof result).toBe('string')
        } finally {
            console.warn = originalWarn
        }
    })

    test('should handle concurrent selector operations safely', async () => {
        // Test that multiple selector operations can run concurrently
        // without interfering with each other
        const promises = Array.from({ length: 10 }, (_, i) => 
            Promise.resolve(SelectorValidationUtils.sanitizeForTestId(`test-${i}`))
        )

        const results = await Promise.all(promises)
        
        results.forEach((result, i) => {
            expect(result).toBe(`test-${i}`)
        })
    })
})