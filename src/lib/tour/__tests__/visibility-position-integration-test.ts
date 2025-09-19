/**
 * Integration test for enhanced visibility and position calculation
 * Tests the actual implementation with real DOM elements
 */

import { TourElementValidator } from '../element-validator'

describe('Enhanced Visibility and Position Integration Test', () => {
    let testElement: HTMLElement

    beforeEach(() => {
        // Create a real DOM element for testing
        testElement = document.createElement('div')
        testElement.id = 'test-element'
        testElement.style.width = '200px'
        testElement.style.height = '150px'
        testElement.style.position = 'absolute'
        testElement.style.top = '100px'
        testElement.style.left = '100px'
        testElement.textContent = 'Test Element'
        document.body.appendChild(testElement)
    })

    afterEach(() => {
        // Clean up
        if (testElement && testElement.parentNode) {
            testElement.parentNode.removeChild(testElement)
        }
    })

    describe('Enhanced Visibility Checking', () => {
        test('should detect visible element', () => {
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(true)
        })

        test('should detect hidden element with display none', () => {
            testElement.style.display = 'none'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(false)
        })

        test('should detect hidden element with visibility hidden', () => {
            testElement.style.visibility = 'hidden'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(false)
        })

        test('should detect hidden element with zero opacity', () => {
            testElement.style.opacity = '0'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(false)
        })

        test('should handle zero-sized elements', () => {
            testElement.style.width = '0px'
            testElement.style.height = '0px'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(false)
        })
    })

    describe('Enhanced Position Calculation', () => {
        test('should calculate element position', () => {
            const position = TourElementValidator.getElementPosition(testElement)
            
            expect(position).toBeTruthy()
            expect(position?.width).toBe(200)
            expect(position?.height).toBe(150)
            expect(position?.viewport).toBeDefined()
            expect(position?.scroll).toBeDefined()
        })

        test('should include viewport information', () => {
            const position = TourElementValidator.getElementPosition(testElement)
            
            expect(position?.viewport.isVisible).toBeDefined()
            expect(position?.viewport.visibleArea).toBeGreaterThanOrEqual(0)
            expect(position?.viewport.visibleArea).toBeLessThanOrEqual(1)
        })

        test('should handle scroll position', () => {
            const position = TourElementValidator.getElementPosition(testElement)
            
            expect(position?.scroll).toBeDefined()
            expect(typeof position?.scroll.x).toBe('number')
            expect(typeof position?.scroll.y).toBe('number')
        })
    })

    describe('Shadow DOM Support', () => {
        test('should handle regular DOM elements in shadow DOM check', () => {
            const isVisible = TourElementValidator.isElementVisibleInShadowDOM(testElement)
            expect(typeof isVisible).toBe('boolean')
        })

        test('should handle shadow DOM position calculation', () => {
            const position = TourElementValidator.getElementPositionInShadowDOM(testElement)
            expect(position).toBeTruthy()
            expect(position?.shadowDOM?.isInShadowDOM).toBe(false)
        })
    })

    describe('Error Handling', () => {
        test('should handle null elements gracefully', () => {
            const isVisible = TourElementValidator.isElementVisible(null as any)
            expect(isVisible).toBe(false)

            const position = TourElementValidator.getElementPosition(null as any)
            expect(position).toBeNull()
        })

        test('should handle undefined elements gracefully', () => {
            const isVisible = TourElementValidator.isElementVisible(undefined as any)
            expect(isVisible).toBe(false)

            const position = TourElementValidator.getElementPosition(undefined as any)
            expect(position).toBeNull()
        })
    })

    describe('Viewport Edge Cases', () => {
        test('should handle element positioned outside viewport', () => {
            testElement.style.top = '-1000px'
            testElement.style.left = '-1000px'
            
            const position = TourElementValidator.getElementPosition(testElement)
            expect(position?.viewport.isVisible).toBe(false)
            expect(position?.viewport.visibleArea).toBe(0)
        })

        test('should handle partially visible elements', () => {
            // Position element so it's partially outside viewport
            testElement.style.top = `${window.innerHeight - 50}px`
            testElement.style.left = '100px'
            
            const position = TourElementValidator.getElementPosition(testElement)
            if (position?.viewport.visibleArea !== undefined) {
                expect(position.viewport.visibleArea).toBeGreaterThan(0)
                expect(position.viewport.visibleArea).toBeLessThan(1)
            }
        })
    })

    describe('CSS Transform Handling', () => {
        test('should detect elements hidden by scale(0)', () => {
            testElement.style.transform = 'scale(0)'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(false)
        })

        test('should handle visible scaled elements', () => {
            testElement.style.transform = 'scale(0.5)'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(true)
        })

        test('should handle rotation transforms', () => {
            testElement.style.transform = 'rotate(45deg)'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(true)
        })
    })

    describe('Clip Path Handling', () => {
        test('should detect elements hidden by clip-path', () => {
            testElement.style.clipPath = 'inset(100%)'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(false)
        })

        test('should handle partially clipped elements', () => {
            testElement.style.clipPath = 'inset(10%)'
            const isVisible = TourElementValidator.isElementVisible(testElement)
            expect(isVisible).toBe(true)
        })
    })
})