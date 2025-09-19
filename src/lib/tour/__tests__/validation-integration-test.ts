/**
 * Integration test for comprehensive validation and error reporting
 * Tests the enhanced validation features in a more realistic environment
 */

import { TourElementValidator } from '../element-validator'

describe('TourElementValidator - Comprehensive Validation Integration', () => {
    // Create a simple DOM environment for testing
    beforeAll(() => {
        // Mock basic DOM methods
        global.document = {
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            createElement: jest.fn(),
            body: { children: { length: 5 } }
        } as any

        global.window = {
            getComputedStyle: jest.fn(() => ({
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                pointerEvents: 'auto',
                position: 'static',
                zIndex: 'auto'
            })),
            self: {},
            top: {}
        } as any

        global.performance = {
            now: jest.fn(() => Date.now())
        } as any
    })

    describe('Error Reporting', () => {
        it('should provide meaningful error messages for invalid selectors', async () => {
            const result = await TourElementValidator.findElement('')

            expect(result.found).toBe(false)
            expect(result.error).toContain('Invalid selector syntax')
            expect(result.errorDetails).toBeDefined()
            expect(result.errorDetails?.code).toBe('SELECTOR_INVALID')
            expect(result.errorDetails?.suggestions).toContain('Provide valid CSS selector or selector array')
        })

        it('should provide detailed error context', async () => {
            const result = await TourElementValidator.findElement('#non-existent')

            expect(result.found).toBe(false)
            expect(result.errorDetails).toBeDefined()
            expect(result.errorDetails?.context).toBeDefined()
            expect(result.errorDetails?.context.timestamp).toBeDefined()
            expect(result.errorDetails?.suggestions).toBeInstanceOf(Array)
        })
    })

    describe('Performance Monitoring', () => {
        it('should record performance metrics', async () => {
            const startTime = Date.now()
            const result = await TourElementValidator.findElement('#test-element')

            expect(result.performance).toBeDefined()
            expect(result.performance?.searchTime).toBeGreaterThanOrEqual(0)
            expect(result.performance?.fallbacksAttempted).toBeGreaterThanOrEqual(0)
        })

        it('should generate validation report', () => {
            const report = TourElementValidator.getValidationReport()

            expect(report).toBeDefined()
            expect(report.healthScore).toBeGreaterThanOrEqual(0)
            expect(report.healthScore).toBeLessThanOrEqual(100)
            expect(report.recommendations).toBeInstanceOf(Array)
            expect(report.performanceStats).toBeDefined()
            expect(report.observerStats).toBeDefined()
        })
    })

    describe('Fallback Strategies', () => {
        it('should provide fallback recommendations', async () => {
            const result = await TourElementValidator.findElement('#missing-element')

            expect(result.fallbackStrategies).toBeDefined()
            expect(result.fallbackStrategies?.recommendations).toBeInstanceOf(Array)
            expect(result.fallbackStrategies?.recommendations.length).toBeGreaterThan(0)
            expect(result.fallbackStrategies?.attempted).toBeInstanceOf(Array)
            expect(result.fallbackStrategies?.failed).toBeInstanceOf(Array)
        })

        it('should execute with comprehensive fallback strategies', async () => {
            const result = await TourElementValidator.executeWithFallbackStrategies('#test-element', {
                timeout: 100,
                maxRetries: 1,
                retryDelay: 10,
                generateFallbacks: true,
                validateAccessibility: false
            })

            expect(result).toBeDefined()
            expect(result.fallbackStrategies).toBeDefined()
            expect(result.performance).toBeDefined()
            expect(result.errorDetails).toBeDefined()
        })
    })

    describe('Comprehensive Element Validation', () => {
        it('should handle null element gracefully', () => {
            const result = TourElementValidator.validateElementComprehensively(
                null,
                '#missing-element'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element not found')
            expect(result.accessibilityScore).toBe(0)
            expect(result.recommendations).toContain('Check if element exists in DOM')
            expect(result.errorDetails).toBeDefined()
        })

        it('should provide accessibility scoring', () => {
            // Create a mock element that passes basic validation
            const mockElement = {
                tagName: 'DIV',
                id: 'test',
                className: 'test-class',
                textContent: 'Test',
                getAttribute: jest.fn(),
                hasAttribute: jest.fn(),
                getBoundingClientRect: jest.fn(() => ({
                    x: 10, y: 10, width: 100, height: 50,
                    top: 10, left: 10, right: 110, bottom: 60
                })),
                parentElement: { children: { length: 3 } },
                attributes: [],
                checkValidity: jest.fn(() => true)
            } as any

            // Mock the validation methods to return positive results
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementInViewport' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementAccessible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'checkElementAccessibility' as any).mockReturnValue([])

            const result = TourElementValidator.validateElementComprehensively(
                mockElement,
                '#test'
            )

            expect(result.accessibilityScore).toBeGreaterThanOrEqual(0)
            expect(result.accessibilityScore).toBeLessThanOrEqual(100)
            expect(result.issues).toBeInstanceOf(Array)
            expect(result.recommendations).toBeInstanceOf(Array)
        })
    })

    describe('Error Categories and Severity', () => {
        it('should categorize errors correctly', async () => {
            const result = await TourElementValidator.findElement('')

            expect(result.errorDetails?.category).toBe('selector')
            expect(result.errorDetails?.severity).toBe('high')
        })

        it('should provide contextual suggestions', async () => {
            const result = await TourElementValidator.findElement(':contains("test")')

            expect(result.errorDetails?.suggestions).toContain('Replace :contains() with JavaScript text matching')
        })
    })

    describe('Performance Complexity Analysis', () => {
        it('should calculate selector complexity', () => {
            const calculateComplexity = (TourElementValidator as any).calculateSelectorComplexity

            expect(calculateComplexity('#simple')).toBeGreaterThan(0)
            expect(calculateComplexity('.class1.class2')).toBeGreaterThan(calculateComplexity('.class1'))
            expect(calculateComplexity('[data-testid="test"]')).toBeGreaterThan(calculateComplexity('#simple'))
            expect(calculateComplexity('div:hover:focus')).toBeGreaterThan(calculateComplexity('div'))
        })

        it('should handle invalid complexity inputs', () => {
            const calculateComplexity = (TourElementValidator as any).calculateSelectorComplexity

            expect(calculateComplexity('')).toBe(0)
            expect(calculateComplexity(null)).toBe(0)
            expect(calculateComplexity(undefined)).toBe(0)
        })
    })
})