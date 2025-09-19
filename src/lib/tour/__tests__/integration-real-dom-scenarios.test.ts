/**
 * Integration tests for TourElementValidator with real DOM scenarios
 * Tests the fixed validator against realistic DOM structures and conditions
 */

import { TourElementValidator } from '../element-validator'

// Mock DOM environment with realistic structures
const createRealisticDOM = () => {
    const mockDocument = {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(),
        createElement: jest.fn(),
        body: {
            children: { length: 10 },
            querySelector: jest.fn(),
            querySelectorAll: jest.fn()
        }
    }

    const mockWindow = {
        getComputedStyle: jest.fn(),
        self: {},
        top: {},
        innerWidth: 1920,
        innerHeight: 1080,
        scrollX: 0,
        scrollY: 0
    }

    // Create realistic element structures
    const createMockElement = (config: {
        id?: string
        className?: string
        tagName?: string
        textContent?: string
        visible?: boolean
        inViewport?: boolean
        hasChildren?: boolean
        attributes?: Record<string, string>
    }) => {
        const element = {
            tagName: config.tagName || 'DIV',
            id: config.id || '',
            className: config.className || '',
            textContent: config.textContent || '',
            getAttribute: jest.fn((attr: string) => config.attributes?.[attr] || null),
            hasAttribute: jest.fn((attr: string) => Boolean(config.attributes?.[attr])),
            getBoundingClientRect: jest.fn(() => ({
                x: config.inViewport !== false ? 100 : -100,
                y: config.inViewport !== false ? 100 : -100,
                width: config.visible !== false ? 200 : 0,
                height: config.visible !== false ? 50 : 0,
                top: config.inViewport !== false ? 100 : -100,
                left: config.inViewport !== false ? 100 : -100,
                right: config.inViewport !== false ? 300 : -100,
                bottom: config.inViewport !== false ? 150 : -100
            })),
            parentElement: config.hasChildren ? {
                children: { length: 3 },
                querySelector: jest.fn(),
                querySelectorAll: jest.fn()
            } : null,
            children: config.hasChildren ? [
                { tagName: 'SPAN', textContent: 'Child 1' },
                { tagName: 'SPAN', textContent: 'Child 2' }
            ] : [],
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            checkValidity: jest.fn(() => true),
            ...config.attributes
        } as any

        return element
    }

    return { mockDocument, mockWindow, createMockElement }
}

describe('TourElementValidator - Real DOM Scenarios Integration', () => {
    let mockDocument: any
    let mockWindow: any
    let createMockElement: any

    beforeAll(() => {
        const dom = createRealisticDOM()
        mockDocument = dom.mockDocument
        mockWindow = dom.mockWindow
        createMockElement = dom.createMockElement

        global.document = mockDocument
        global.window = mockWindow
        global.performance = {
            now: jest.fn(() => Date.now())
        } as any
    })

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

    describe('Real-world button scenarios', () => {
        it('should find submit button in form', async () => {
            const submitButton = createMockElement({
                tagName: 'BUTTON',
                id: 'submit-btn',
                className: 'btn btn-primary',
                textContent: 'Submit Form',
                attributes: { type: 'submit', 'data-testid': 'submit-button' }
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector === '#submit-btn' || 
                    selector === '[data-testid="submit-button"]' ||
                    selector === 'button[type="submit"]') {
                    return submitButton
                }
                return null
            })

            const result = await TourElementValidator.findElement('#submit-btn')

            expect(result.found).toBe(true)
            expect(result.element).toBe(submitButton)
            expect(result.performance?.searchTime).toBeGreaterThanOrEqual(0)
        })

        it('should handle disabled button with fallback', async () => {
            const disabledButton = createMockElement({
                tagName: 'BUTTON',
                className: 'btn btn-disabled',
                textContent: 'Disabled Button',
                attributes: { disabled: 'true', 'aria-disabled': 'true' }
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector.includes('btn-disabled')) {
                    return disabledButton
                }
                return null
            })

            const result = await TourElementValidator.executeWithFallbackStrategies('.btn-disabled', {
                validateAccessibility: true
            })

            expect(result.found).toBe(true)
            expect(result.error).toContain('Element found but has issues')
            expect(result.fallbackStrategies?.recommendations).toContain('Fix accessibility issues for better user experience')
        })

        it('should find button by text content when ID fails', async () => {
            const textButton = createMockElement({
                tagName: 'BUTTON',
                textContent: 'Click Me',
                className: 'dynamic-btn'
            })

            // First call (by ID) fails, second call (by text) succeeds
            let callCount = 0
            mockDocument.querySelector.mockImplementation((selector: string) => {
                callCount++
                if (callCount === 1 && selector === '#missing-btn') {
                    return null
                }
                if (selector.includes('dynamic-btn')) {
                    return textButton
                }
                return null
            })

            const result = await TourElementValidator.executeWithFallbackStrategies('#missing-btn', {
                generateFallbacks: true,
                maxRetries: 2
            })

            expect(result.fallbackStrategies?.attempted.length).toBeGreaterThan(0)
            expect(result.fallbackStrategies?.recommendations).toContain('Add data-testid attribute to target element for more reliable selection')
        })
    })

    describe('Complex navigation scenarios', () => {
        it('should handle nested navigation menu', async () => {
            const navMenu = createMockElement({
                tagName: 'NAV',
                className: 'main-navigation',
                hasChildren: true,
                attributes: { role: 'navigation', 'aria-label': 'Main menu' }
            })

            const menuItem = createMockElement({
                tagName: 'A',
                className: 'nav-link',
                textContent: 'Dashboard',
                attributes: { href: '/dashboard', role: 'menuitem' }
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector.includes('main-navigation')) return navMenu
                if (selector.includes('nav-link')) return menuItem
                return null
            })

            const result = await TourElementValidator.findElement('.main-navigation .nav-link')

            expect(result.found).toBe(true)
            expect(result.validationMethod).toBeDefined()
        })

        it('should handle dropdown menu interactions', async () => {
            const dropdown = createMockElement({
                tagName: 'DIV',
                className: 'dropdown-menu',
                attributes: { 'aria-expanded': 'false', role: 'menu' }
            })

            const dropdownItem = createMockElement({
                tagName: 'A',
                className: 'dropdown-item',
                textContent: 'Settings',
                visible: false, // Initially hidden
                attributes: { role: 'menuitem', tabindex: '-1' }
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector.includes('dropdown-menu')) return dropdown
                if (selector.includes('dropdown-item')) return dropdownItem
                return null
            })

            const result = await TourElementValidator.validateElementComprehensively(
                dropdownItem,
                '.dropdown-item'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element is not visible')
            expect(result.recommendations).toContain('Check CSS display, visibility, and opacity properties')
        })
    })

    describe('Form interaction scenarios', () => {
        it('should validate form input with labels', async () => {
            const input = createMockElement({
                tagName: 'INPUT',
                id: 'email-input',
                attributes: { 
                    type: 'email', 
                    'aria-label': 'Email address',
                    'aria-describedby': 'email-help',
                    required: 'true'
                }
            })

            const label = createMockElement({
                tagName: 'LABEL',
                textContent: 'Email Address',
                attributes: { for: 'email-input' }
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector === '#email-input') return input
                if (selector === 'label[for="email-input"]') return label
                return null
            })

            const result = await TourElementValidator.validateElementComprehensively(
                input,
                '#email-input'
            )

            expect(result.isValid).toBe(true)
            expect(result.accessibilityScore).toBeGreaterThan(80)
        })

        it('should handle dynamic form validation states', async () => {
            const invalidInput = createMockElement({
                tagName: 'INPUT',
                className: 'form-control is-invalid',
                attributes: { 
                    'aria-invalid': 'true',
                    'aria-describedby': 'error-message'
                }
            })

            mockDocument.querySelector.mockImplementation(() => invalidInput)

            const result = await TourElementValidator.validateElementComprehensively(
                invalidInput,
                '.form-control.is-invalid'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues.length).toBeGreaterThan(0)
            expect(result.recommendations).toContain('Fix accessibility issues for better user experience')
        })
    })

    describe('Modal and overlay scenarios', () => {
        it('should handle modal dialog elements', async () => {
            const modal = createMockElement({
                tagName: 'DIV',
                className: 'modal fade show',
                attributes: { 
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-labelledby': 'modal-title',
                    tabindex: '-1'
                }
            })

            const modalButton = createMockElement({
                tagName: 'BUTTON',
                className: 'btn btn-primary',
                textContent: 'Confirm',
                attributes: { 'data-bs-dismiss': 'modal' }
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector.includes('modal')) return modal
                if (selector.includes('btn-primary')) return modalButton
                return null
            })

            const result = await TourElementValidator.executeWithFallbackStrategies('.modal .btn-primary', {
                validateAccessibility: true,
                timeout: 2000
            })

            expect(result.found).toBe(true)
            expect(result.performance?.searchTime).toBeDefined()
        })

        it('should handle overlay z-index issues', async () => {
            const overlayElement = createMockElement({
                tagName: 'DIV',
                className: 'overlay-content',
                attributes: { style: 'z-index: 1000' }
            })

            mockWindow.getComputedStyle.mockReturnValue({
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                pointerEvents: 'auto',
                position: 'fixed',
                zIndex: '1000'
            })

            mockDocument.querySelector.mockImplementation(() => overlayElement)

            const result = await TourElementValidator.validateElementComprehensively(
                overlayElement,
                '.overlay-content'
            )

            expect(result.isValid).toBe(true)
            expect(result.accessibilityScore).toBeGreaterThan(0)
        })
    })

    describe('Dynamic content scenarios', () => {
        it('should handle lazy-loaded content', async () => {
            let elementLoaded = false
            const lazyElement = createMockElement({
                tagName: 'DIV',
                className: 'lazy-content',
                textContent: 'Loaded content'
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector.includes('lazy-content')) {
                    return elementLoaded ? lazyElement : null
                }
                return null
            })

            // Simulate lazy loading after delay
            setTimeout(() => {
                elementLoaded = true
            }, 100)

            const result = await TourElementValidator.executeWithFallbackStrategies('.lazy-content', {
                timeout: 500,
                maxRetries: 3,
                retryDelay: 50
            })

            // Should eventually find the element or provide meaningful error
            expect(result.errorDetails).toBeDefined()
            expect(result.fallbackStrategies?.recommendations.length).toBeGreaterThan(0)
        })

        it('should handle infinite scroll scenarios', async () => {
            const scrollContainer = createMockElement({
                tagName: 'DIV',
                className: 'infinite-scroll-container',
                hasChildren: true
            })

            const scrollItem = createMockElement({
                tagName: 'DIV',
                className: 'scroll-item',
                textContent: 'Item 50',
                inViewport: false // Initially out of viewport
            })

            mockDocument.querySelector.mockImplementation((selector: string) => {
                if (selector.includes('scroll-container')) return scrollContainer
                if (selector.includes('scroll-item')) return scrollItem
                return null
            })

            const result = await TourElementValidator.validateElementComprehensively(
                scrollItem,
                '.scroll-item'
            )

            expect(result.isValid).toBe(false)
            expect(result.issues).toContain('Element is outside viewport')
            expect(result.recommendations).toContain('Scroll element into view')
        })
    })

    describe('Error recovery scenarios', () => {
        it('should recover from DOM manipulation errors', async () => {
            const unstableElement = createMockElement({
                tagName: 'DIV',
                className: 'unstable-element'
            })

            // Mock getBoundingClientRect to throw error first time
            let callCount = 0
            unstableElement.getBoundingClientRect.mockImplementation(() => {
                callCount++
                if (callCount === 1) {
                    throw new Error('Element removed from DOM')
                }
                return {
                    x: 100, y: 100, width: 200, height: 50,
                    top: 100, left: 100, right: 300, bottom: 150
                }
            })

            mockDocument.querySelector.mockImplementation(() => unstableElement)

            const result = await TourElementValidator.validateElementComprehensively(
                unstableElement,
                '.unstable-element'
            )

            expect(result.errorDetails).toBeDefined()
            expect(result.errorDetails?.code).toBe('DOM_NOT_READY')
        })

        it('should handle memory pressure scenarios', async () => {
            // Simulate memory pressure by creating many elements
            const elements = Array.from({ length: 1000 }, (_, i) => 
                createMockElement({
                    id: `element-${i}`,
                    className: 'memory-test'
                })
            )

            mockDocument.querySelectorAll.mockImplementation(() => elements)

            const startTime = performance.now()
            const result = await TourElementValidator.findElement('.memory-test')
            const endTime = performance.now()

            expect(result.performance?.searchTime).toBeDefined()
            expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
        })
    })

    describe('Performance validation', () => {
        it('should complete validation within reasonable time limits', async () => {
            const complexElement = createMockElement({
                tagName: 'DIV',
                className: 'complex-element deeply-nested-content with-many-classes',
                hasChildren: true,
                attributes: {
                    'data-testid': 'complex-test',
                    'aria-label': 'Complex element',
                    role: 'region'
                }
            })

            mockDocument.querySelector.mockImplementation(() => complexElement)

            const startTime = Date.now()
            const result = await TourElementValidator.executeWithFallbackStrategies(
                '.complex-element.deeply-nested-content.with-many-classes',
                {
                    validateAccessibility: true,
                    generateFallbacks: true,
                    timeout: 1000
                }
            )
            const endTime = Date.now()

            expect(endTime - startTime).toBeLessThan(1500) // Allow some buffer
            expect(result.performance?.searchTime).toBeLessThan(1000)
        })

        it('should generate comprehensive validation report', () => {
            // Simulate some validation history
            const report = TourElementValidator.getValidationReport()

            expect(report).toBeDefined()
            expect(report.healthScore).toBeGreaterThanOrEqual(0)
            expect(report.healthScore).toBeLessThanOrEqual(100)
            expect(report.recommendations).toBeInstanceOf(Array)
            expect(report.performanceStats).toBeDefined()
            expect(report.observerStats).toBeDefined()
        })
    })
})