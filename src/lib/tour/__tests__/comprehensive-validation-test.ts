/**
 * Comprehensive validation and error reporting tests
 * Tests the enhanced validation features added in task 8
 */

import { TourElementValidator, ElementValidationResult } from '../element-validator'

// Mock DOM environment for testing
const mockDocument = {
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    createElement: jest.fn(),
    body: {
        children: { length: 5 }
    }
}

const mockWindow = {
    getComputedStyle: jest.fn(),
    self: {},
    top: {}
}

// Mock element for testing
const createMockElement = (overrides: Partial<HTMLElement> = {}): HTMLElement => {
    const mockElement = {
        tagName: 'DIV',
        id: 'test-element',
        className: 'test-class',
        textContent: 'Test content',
        getAttribute: jest.fn(),
        hasAttribute: jest.fn(),
        getBoundingClientRect: jest.fn(() => ({
            x: 10,
            y: 10,
            width: 100,
            height: 50,
            top: 10,
            left: 10,
            right: 110,
            bottom: 60
        })),
        parentElement: {
            children: { length: 3 }
        },
        attributes: [
            { name: 'id', value: 'test-element' },
            { name: 'class', value: 'test-class' }
        ],
        checkValidity: jest.fn(() => true),
        ...overrides
    } as unknown as HTMLElement

    return mockElement
}

// Setup global mocks
beforeAll(() => {
    global.document = mockDocument as any
    global.window = mockWindow as any
    global.performance = {
        now: jest.fn(() => Date.now())
    } as any
})

describe('TourElementValidator - Comprehensive Validation and Error Reporting', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockWindow.getComputedStyle.mockReturnValue({
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            pointerEvents: 'auto',
            position: 'static',
            zIndex: 'auto'
        })
    })

    describe('validateElementComprehensively', () => {
        it('should return valid result for healthy element', () => {
            const element = createMockElement()
            
            // Mock visibility checks
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementInViewport' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementAccessible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'checkElementAccessibility' as any).mockReturnValue([])

            const result = TourElementValidator.validateElementComprehensively(
                element,
                '#test-element'
            )

            expect(result.isValid).toBe(true)
            expect(result.issues).toHaveLength(0)
            expect(result.accessibilityScore).toBe(100)
            expect(result.recommendations).toHaveLength(0)
        })

        it('should detect element not found', () => {
            const result = TourElementValidator.validateElementComprehensively(
                null,
                '#missing-element'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element not found')
            expect(result.accessibilityScore).toBe(0)
            expect(result.recommendations).toContain('Check if element exists in DOM')
            expect(result.errorDetails).toBeDefined()
            expect(result.errorDetails?.code).toBe('SELECTOR_NOT_FOUND')
        })

        it('should detect visibility issues', () => {
            const element = createMockElement()
            
            // Mock element as not visible
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockReturnValue(false)
            jest.spyOn(TourElementValidator, 'isElementInViewport' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementAccessible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'checkElementAccessibility' as any).mockReturnValue([])

            const result = TourElementValidator.validateElementComprehensively(
                element,
                '#test-element'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element is not visible')
            expect(result.accessibilityScore).toBeLessThan(100)
            expect(result.recommendations).toContain('Check CSS display, visibility, and opacity properties')
        })

        it('should detect zero dimensions', () => {
            const element = createMockElement({
                getBoundingClientRect: jest.fn(() => ({
                    x: 0, y: 0, width: 0, height: 0,
                    top: 0, left: 0, right: 0, bottom: 0
                }))
            })
            
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementInViewport' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementAccessible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'checkElementAccessibility' as any).mockReturnValue([])

            const result = TourElementValidator.validateElementComprehensively(
                element,
                '#test-element'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element has zero dimensions')
            expect(result.recommendations).toContain('Check CSS width and height properties')
        })

        it('should detect viewport issues', () => {
            const element = createMockElement()
            
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementInViewport' as any).mockReturnValue(false)
            jest.spyOn(TourElementValidator, 'isElementAccessible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'checkElementAccessibility' as any).mockReturnValue([])

            const result = TourElementValidator.validateElementComprehensively(
                element,
                '#test-element'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element is outside viewport')
            expect(result.recommendations).toContain('Scroll element into view')
        })

        it('should detect accessibility issues', () => {
            const element = createMockElement()
            
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementInViewport' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementAccessible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'checkElementAccessibility' as any).mockReturnValue(['Element is disabled'])

            const result = TourElementValidator.validateElementComprehensively(
                element,
                '#test-element'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element is disabled')
            expect(result.recommendations).toContain('Fix accessibility issues for better user experience')
        })

        it('should handle validation errors gracefully', () => {
            const element = createMockElement()
            
            // Mock error in visibility check
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockImplementation(() => {
                throw new Error('Test error')
            })

            const result = TourElementValidator.validateElementComprehensively(
                element,
                '#test-element'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Validation error occurred')
            expect(result.accessibilityScore).toBe(0)
            expect(result.errorDetails?.code).toBe('DOM_NOT_READY')
        })
    })

    describe('executeWithFallbackStrategies', () => {
        it('should handle invalid selector input', async () => {
            const result = await TourElementValidator.executeWithFallbackStrategies('')

            expect(result.found).toBe(false)
            expect(result.error).toContain('Invalid selector syntax')
            expect(result.errorDetails?.code).toBe('SELECTOR_INVALID')
            expect(result.fallbackStrategies?.recommendations).toContain('Provide a valid CSS selector string')
        })

        it('should execute with retries and fallbacks', async () => {
            // Mock findElement to fail first time, succeed second time
            let callCount = 0
            jest.spyOn(TourElementValidator, 'findElement').mockImplementation(async () => {
                callCount++
                if (callCount === 1) {
                    return {
                        element: null,
                        selector: '#test',
                        found: false,
                        error: 'Not found',
                        fallbackStrategies: {
                            attempted: ['#test'],
                            failed: ['#test'],
                            recommendations: []
                        }
                    } as ElementValidationResult
                } else {
                    const mockElement = createMockElement()
                    return {
                        element: mockElement,
                        selector: '#test',
                        found: true,
                        fallbackStrategies: {
                            attempted: ['#test'],
                            failed: [],
                            recommendations: []
                        }
                    } as ElementValidationResult
                }
            })

            const result = await TourElementValidator.executeWithFallbackStrategies('#test', {
                maxRetries: 2,
                retryDelay: 10
            })

            expect(result.found).toBe(true)
            expect(callCount).toBe(2)
        })

        it('should validate accessibility when requested', async () => {
            const mockElement = createMockElement()
            
            jest.spyOn(TourElementValidator, 'findElement').mockResolvedValue({
                element: mockElement,
                selector: '#test',
                found: true,
                fallbackStrategies: {
                    attempted: ['#test'],
                    failed: [],
                    recommendations: []
                }
            } as ElementValidationResult)

            jest.spyOn(TourElementValidator, 'validateElementComprehensively').mockReturnValue({
                isValid: false,
                issues: ['Element is disabled'],
                recommendations: ['Enable the element'],
                accessibilityScore: 70,
                errorDetails: {
                    code: 'ELEMENT_NOT_ACCESSIBLE',
                    category: 'visibility',
                    severity: 'medium',
                    context: {},
                    suggestions: []
                }
            })

            const result = await TourElementValidator.executeWithFallbackStrategies('#test', {
                validateAccessibility: true
            })

            expect(result.found).toBe(true)
            expect(result.error).toContain('Element found but has issues')
            expect(result.errorDetails?.code).toBe('ELEMENT_NOT_ACCESSIBLE')
        })

        it('should handle execution errors', async () => {
            jest.spyOn(TourElementValidator, 'findElement').mockRejectedValue(new Error('Test error'))

            const result = await TourElementValidator.executeWithFallbackStrategies('#test')

            expect(result.found).toBe(false)
            expect(result.errorDetails?.code).toBe('DOM_NOT_READY')
            expect(result.fallbackStrategies?.recommendations).toContain('Check browser console for detailed error information')
        })
    })

    describe('getValidationReport', () => {
        it('should generate comprehensive validation report', () => {
            // Mock performance and observer stats
            jest.spyOn(require('../element-validator'), 'PerformanceMonitor').mockImplementation(() => ({
                getOverallStats: () => ({
                    totalSelectors: 10,
                    averageSearchTime: 500,
                    slowSearchPercentage: 10,
                    successRate: 90,
                    fallbackUsageRate: 20,
                    performanceGrade: 'B' as const
                })
            }))

            jest.spyOn(require('../element-validator'), 'ObserverManager').mockImplementation(() => ({
                getStatistics: () => ({
                    activeCount: 5,
                    oldestAge: 60000,
                    averageAge: 30000
                })
            }))

            const report = TourElementValidator.getValidationReport()

            expect(report.healthScore).toBeGreaterThan(0)
            expect(report.recommendations).toBeDefined()
            expect(report.performanceStats).toBeDefined()
            expect(report.observerStats).toBeDefined()
        })

        it('should handle report generation errors', () => {
            // Mock error in performance stats
            jest.spyOn(require('../element-validator'), 'PerformanceMonitor').mockImplementation(() => ({
                getOverallStats: () => {
                    throw new Error('Test error')
                }
            }))

            const report = TourElementValidator.getValidationReport()

            expect(report.healthScore).toBe(0)
            expect(report.recommendations).toContain('Error generating report - check system health')
            expect(report.performanceStats.performanceGrade).toBe('F')
        })
    })

    describe('Performance and complexity calculations', () => {
        it('should calculate selector complexity correctly', () => {
            const calculateComplexity = (TourElementValidator as any).calculateSelectorComplexity

            expect(calculateComplexity('#simple')).toBe(1) // 1 ID
            expect(calculateComplexity('.class1.class2')).toBe(2) // 2 classes
            expect(calculateComplexity('[data-testid="test"]')).toBe(2) // 1 attribute * 2
            expect(calculateComplexity('div:hover:focus')).toBe(6) // 2 pseudo-selectors * 3
            expect(calculateComplexity('parent > child')).toBe(1) // 1 direct child
            expect(calculateComplexity('a + b ~ c')).toBe(2) // 1 adjacent + 1 general sibling
        })

        it('should calculate DOM depth correctly', () => {
            const mockElement = createMockElement({
                parentElement: {
                    parentElement: {
                        parentElement: {
                            parentElement: null
                        }
                    }
                }
            } as any)

            const calculateDepth = (TourElementValidator as any).calculateDOMDepth
            const depth = calculateDepth(mockElement)

            expect(depth).toBe(3) // 3 levels up from element
        })
    })

    describe('Element information gathering', () => {
        it('should gather comprehensive element info', () => {
            const element = createMockElement()
            
            jest.spyOn(TourElementValidator, 'isElementVisible' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementInViewport' as any).mockReturnValue(true)
            jest.spyOn(TourElementValidator, 'isElementAccessible' as any).mockReturnValue(true)

            const getElementInfo = (TourElementValidator as any).getElementInfo
            const info = getElementInfo(element)

            expect(info.tagName).toBe('div')
            expect(info.id).toBe('test-element')
            expect(info.className).toBe('test-class')
            expect(info.position).toBeDefined()
            expect(info.style).toBeDefined()
            expect(info.attributes).toBeDefined()
            expect(info.isVisible).toBe(true)
            expect(info.isAccessible).toBe(true)
            expect(info.isInViewport).toBe(true)
        })

        it('should handle errors in element info gathering', () => {
            const element = createMockElement({
                getBoundingClientRect: jest.fn(() => {
                    throw new Error('Test error')
                })
            })

            const getElementInfo = (TourElementValidator as any).getElementInfo
            const info = getElementInfo(element)

            expect(info.error).toBe('Could not get element info')
        })
    })
})