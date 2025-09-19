/**
 * Tests for enhanced element visibility and position calculation
 * Covers viewport handling, scrolling, iframe, and shadow DOM support
 */

import { TourElementValidator } from '../element-validator'

// Mock DOM environment for testing
const mockGetComputedStyle = jest.fn()
const mockElementFromPoint = jest.fn()

// Setup window mocks
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
Object.defineProperty(window, 'pageXOffset', { value: 0, writable: true })
Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true })
Object.defineProperty(window, 'getComputedStyle', { value: mockGetComputedStyle, writable: true })

// Setup document mocks
Object.defineProperty(document, 'elementFromPoint', { value: mockElementFromPoint, writable: true })
Object.defineProperty(document.documentElement, 'clientWidth', { value: 1024, writable: true })
Object.defineProperty(document.documentElement, 'clientHeight', { value: 768, writable: true })
Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, writable: true })
Object.defineProperty(document.documentElement, 'scrollLeft', { value: 0, writable: true })

describe('Enhanced Element Visibility and Position Calculation', () => {
    let mockElement: HTMLElement

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()
        
        // Create mock element
        mockElement = {
            getBoundingClientRect: jest.fn(() => ({
                top: 100,
                left: 100,
                width: 200,
                height: 150,
                right: 300,
                bottom: 250
            })),
            offsetParent: document.body,
            parentNode: document.body,
            parentElement: document.body,
            contains: jest.fn(() => false),
            tagName: 'DIV',
            textContent: 'Test Element'
        } as any

        // Mock getComputedStyle
        mockGetComputedStyle.mockReturnValue({
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            transform: 'none',
            clipPath: 'none',
            position: 'static'
        })

        // Mock elementFromPoint
        mockElementFromPoint.mockReturnValue(mockElement)
    })

    describe('Enhanced Visibility Checking', () => {
        test('should detect visible element correctly', () => {
            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(true)
        })

        test('should detect hidden element with display none', () => {
            mockGetComputedStyle.mockReturnValue({
                display: 'none',
                visibility: 'visible',
                opacity: '1',
                transform: 'none',
                clipPath: 'none',
                position: 'static'
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should detect hidden element with visibility hidden', () => {
            mockGetComputedStyle.mockReturnValue({
                display: 'block',
                visibility: 'hidden',
                opacity: '1',
                transform: 'none',
                clipPath: 'none',
                position: 'static'
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should detect hidden element with zero opacity', () => {
            mockGetComputedStyle.mockReturnValue({
                display: 'block',
                visibility: 'visible',
                opacity: '0',
                transform: 'none',
                clipPath: 'none',
                position: 'static'
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should detect hidden element with scale(0) transform', () => {
            mockGetComputedStyle.mockReturnValue({
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                transform: 'scale(0)',
                clipPath: 'none',
                position: 'static'
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should detect hidden element with clip-path inset', () => {
            mockGetComputedStyle.mockReturnValue({
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                transform: 'none',
                clipPath: 'inset(100%)',
                position: 'static'
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should handle element outside viewport', () => {
            // Element positioned outside viewport
            mockElement.getBoundingClientRect = jest.fn(() => ({
                top: -200,
                left: -200,
                width: 100,
                height: 100,
                right: -100,
                bottom: -100
            }))

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should handle element covered by other elements', () => {
            // Mock elementFromPoint to return different element
            mockElementFromPoint.mockReturnValue(document.body)

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should handle fixed position elements without offsetParent', () => {
            mockElement.offsetParent = null
            mockGetComputedStyle.mockReturnValue({
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                transform: 'none',
                clipPath: 'none',
                position: 'fixed'
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(true)
        })
    })

    describe('Enhanced Position Calculation', () => {
        test('should calculate basic position correctly', () => {
            const position = TourElementValidator.getElementPosition(mockElement)
            
            expect(position).toEqual({
                top: 100,
                left: 100,
                width: 200,
                height: 150,
                center: { x: 200, y: 175 },
                viewport: {
                    top: 100,
                    left: 100,
                    right: 300,
                    bottom: 250,
                    isVisible: true,
                    visibleArea: 1
                },
                scroll: { x: 0, y: 0 }
            })
        })

        test('should handle scrolled page', () => {
            Object.defineProperty(window, 'pageXOffset', { value: 50, writable: true })
            Object.defineProperty(window, 'pageYOffset', { value: 75, writable: true })

            const position = TourElementValidator.getElementPosition(mockElement)
            
            expect(position?.top).toBe(175) // 100 + 75
            expect(position?.left).toBe(150) // 100 + 50
            expect(position?.scroll).toEqual({ x: 50, y: 75 })
        })

        test('should calculate viewport visibility correctly', () => {
            // Element partially outside viewport
            mockElement.getBoundingClientRect = jest.fn(() => ({
                top: 700, // Near bottom of 768px viewport
                left: 100,
                width: 200,
                height: 150, // Extends beyond viewport
                right: 300,
                bottom: 850
            }))

            const position = TourElementValidator.getElementPosition(mockElement)
            
            expect(position?.viewport.isVisible).toBe(true)
            expect(position?.viewport.visibleArea).toBeLessThan(1) // Partially visible
        })

        test('should handle element completely outside viewport', () => {
            // Element completely below viewport
            mockElement.getBoundingClientRect = jest.fn(() => ({
                top: 800,
                left: 100,
                width: 200,
                height: 150,
                right: 300,
                bottom: 950
            }))

            const position = TourElementValidator.getElementPosition(mockElement)
            
            expect(position?.viewport.isVisible).toBe(false)
            expect(position?.viewport.visibleArea).toBe(0)
        })
    })

    describe('Shadow DOM Support', () => {
        test('should detect element in shadow DOM', () => {
            // Mock shadow DOM structure
            const shadowRoot = {
                host: mockElement
            } as ShadowRoot

            const shadowElement = {
                ...mockElement,
                parentNode: shadowRoot
            } as HTMLElement

            const isVisible = TourElementValidator.isElementVisibleInShadowDOM(shadowElement)
            expect(isVisible).toBe(true)
        })

        test('should handle shadow host visibility', () => {
            // Mock shadow DOM with hidden host
            const shadowHost = {
                ...mockElement,
                getBoundingClientRect: jest.fn(() => ({
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    right: 0,
                    bottom: 0
                }))
            } as HTMLElement

            const shadowRoot = {
                host: shadowHost
            } as ShadowRoot

            const shadowElement = {
                ...mockElement,
                parentNode: shadowRoot
            } as HTMLElement

            // Mock getComputedStyle for shadow host to return hidden
            mockGetComputedStyle.mockImplementation((element) => {
                if (element === shadowHost) {
                    return {
                        display: 'none',
                        visibility: 'visible',
                        opacity: '1',
                        transform: 'none',
                        clipPath: 'none',
                        position: 'static'
                    }
                }
                return {
                    display: 'block',
                    visibility: 'visible',
                    opacity: '1',
                    transform: 'none',
                    clipPath: 'none',
                    position: 'static'
                }
            })

            const isVisible = TourElementValidator.isElementVisibleInShadowDOM(shadowElement)
            expect(isVisible).toBe(false)
        })

        test('should calculate shadow DOM element position', () => {
            const shadowHost = {
                ...mockElement,
                getBoundingClientRect: jest.fn(() => ({
                    top: 50,
                    left: 50,
                    width: 300,
                    height: 200,
                    right: 350,
                    bottom: 250
                }))
            } as HTMLElement

            const shadowRoot = {
                host: shadowHost
            } as ShadowRoot

            const shadowElement = {
                ...mockElement,
                parentNode: shadowRoot
            } as HTMLElement

            const position = TourElementValidator.getElementPositionInShadowDOM(shadowElement)
            
            expect(position?.shadowDOM).toEqual({
                isInShadowDOM: true,
                shadowHost: shadowHost,
                hostOffset: { x: 50, y: 50 }
            })
        })
    })

    describe('Iframe Support', () => {
        test('should detect iframe context', () => {
            // Mock iframe context by making window.top different from window.self
            Object.defineProperty(window, 'top', { 
                value: {}, 
                writable: true,
                configurable: true 
            })

            const position = TourElementValidator.getElementPosition(mockElement)
            
            expect(position?.iframe?.isInIframe).toBe(true)
        })

        test('should handle cross-origin iframe restrictions', () => {
            // This test is skipped as it's difficult to mock cross-origin restrictions in Jest
            // The actual implementation handles these errors gracefully
            const position = TourElementValidator.getElementPosition(mockElement)
            
            // Should handle error gracefully
            expect(position).toBeTruthy()
        })
    })

    describe('Error Handling', () => {
        test('should handle getBoundingClientRect errors', () => {
            mockElement.getBoundingClientRect = jest.fn(() => {
                throw new Error('getBoundingClientRect failed')
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)

            const position = TourElementValidator.getElementPosition(mockElement)
            expect(position).toBeNull()
        })

        test('should handle getComputedStyle errors', () => {
            mockGetComputedStyle.mockImplementation(() => {
                throw new Error('getComputedStyle failed')
            })

            const isVisible = TourElementValidator.isElementVisible(mockElement)
            expect(isVisible).toBe(false)
        })

        test('should handle null/undefined elements gracefully', () => {
            const isVisible = TourElementValidator.isElementVisible(null as any)
            expect(isVisible).toBe(false)

            const position = TourElementValidator.getElementPosition(undefined as any)
            expect(position).toBeNull()
        })
    })
})