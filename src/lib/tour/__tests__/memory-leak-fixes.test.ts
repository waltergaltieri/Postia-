/**
 * Tests for memory leak fixes in mutation observer management
 */

import { TourElementValidator, ObserverManager } from '../element-validator'

// Mock MutationObserver
const mockObserver = {
    observe: jest.fn(),
    disconnect: jest.fn()
}

const mockMutationObserver = jest.fn(() => mockObserver)

// Setup global mocks
Object.defineProperty(global, 'MutationObserver', {
    value: mockMutationObserver,
    writable: true
})

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
    value: jest.fn(() => ({
        display: 'block',
        visibility: 'visible',
        opacity: '1'
    })),
    writable: true
})

// Mock performance.now
Object.defineProperty(global, 'performance', {
    value: {
        now: jest.fn(() => Date.now())
    },
    writable: true
})

describe('Memory Leak Fixes - Observer Management', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Clean up any existing observers
        TourElementValidator.forceCleanupAllObservers()
    })

    afterEach(() => {
        // Ensure cleanup after each test
        TourElementValidator.forceCleanupAllObservers()
    })

    describe('Observer State Tracking', () => {
        test('should track active observers', () => {
            const cleanup1 = TourElementValidator.createElementObserver(
                '[data-testid="test1"]',
                () => {},
                { timeout: 1000 }
            )

            const cleanup2 = TourElementValidator.createElementObserver(
                '[data-testid="test2"]',
                () => {},
                { timeout: 1000 }
            )

            const stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(2)

            cleanup1()
            cleanup2()
        })

        test('should properly cleanup observers', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            let stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(1)

            cleanup()

            stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(0)
        })

        test('should handle multiple cleanup calls gracefully', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            // Call cleanup multiple times
            cleanup()
            cleanup()
            cleanup()

            const stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(0)
        })
    })

    describe('Timeout Cleanup Race Conditions', () => {
        test('should clear timeouts properly during cleanup', async () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
            
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 5000 }
            )

            cleanup()

            expect(clearTimeoutSpy).toHaveBeenCalled()
            clearTimeoutSpy.mockRestore()
        })

        test('should handle timeout cleanup errors gracefully', () => {
            const originalClearTimeout = global.clearTimeout
            global.clearTimeout = jest.fn(() => {
                throw new Error('Timeout cleanup error')
            })

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            // Should not throw error
            expect(() => cleanup()).not.toThrow()

            global.clearTimeout = originalClearTimeout
        })

        test('should prevent race conditions in cleanup', async () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 100 }
            )

            // Simulate rapid cleanup calls
            const promises = Array.from({ length: 10 }, () => 
                Promise.resolve().then(() => cleanup())
            )

            await Promise.all(promises)

            const stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(0)
        })
    })

    describe('Emergency Cleanup', () => {
        test('should perform emergency cleanup of stale observers', () => {
            // Create observers but don't clean them up
            const cleanup1 = TourElementValidator.createElementObserver(
                '[data-testid="test1"]',
                () => {},
                { timeout: 1000 }
            )

            const cleanup2 = TourElementValidator.createElementObserver(
                '[data-testid="test2"]',
                () => {},
                { timeout: 1000 }
            )

            let stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(2)

            // Emergency cleanup should not clean up fresh observers
            TourElementValidator.performEmergencyCleanup()

            stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(2) // Should still be 2 since they're not stale

            // Clean up manually
            cleanup1()
            cleanup2()

            stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(0)
        })

        test('should detect memory leak risk', () => {
            // Create many observers to trigger memory leak detection
            const cleanupFunctions: (() => void)[] = []
            
            for (let i = 0; i < 25; i++) {
                const cleanup = TourElementValidator.createElementObserver(
                    `[data-testid="test${i}"]`,
                    () => {},
                    { timeout: 1000 }
                )
                cleanupFunctions.push(cleanup)
            }

            const stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.memoryLeakRisk).toBe(true)

            // Cleanup
            cleanupFunctions.forEach(cleanup => cleanup())
        })

        test('should force cleanup all observers', () => {
            // Create multiple observers
            TourElementValidator.createElementObserver('[data-testid="test1"]', () => {})
            TourElementValidator.createElementObserver('[data-testid="test2"]', () => {})
            TourElementValidator.createElementObserver('[data-testid="test3"]', () => {})

            let stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(3)

            TourElementValidator.forceCleanupAllObservers()

            stats = TourElementValidator.verifyObserverCleanup()
            expect(stats.activeObservers).toBe(0)
        })
    })

    describe('Observer Disconnect Handling', () => {
        test('should handle observer disconnect errors gracefully', () => {
            mockObserver.disconnect.mockImplementation(() => {
                throw new Error('Disconnect error')
            })

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            // Should not throw error
            expect(() => cleanup()).not.toThrow()

            // Reset mock
            mockObserver.disconnect.mockReset()
        })

        test('should properly disconnect observers', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            cleanup()

            expect(mockObserver.disconnect).toHaveBeenCalled()
        })
    })

    describe('Observer Statistics', () => {
        test('should provide accurate observer statistics', () => {
            const startTime = Date.now()
            
            const cleanup1 = TourElementValidator.createElementObserver(
                '[data-testid="test1"]',
                () => {},
                { timeout: 1000 }
            )

            // Wait a bit to create age difference
            setTimeout(() => {
                const cleanup2 = TourElementValidator.createElementObserver(
                    '[data-testid="test2"]',
                    () => {},
                    { timeout: 1000 }
                )

                const stats = TourElementValidator.verifyObserverCleanup()
                expect(stats.activeObservers).toBe(2)
                expect(stats.oldestObserverAge).toBeGreaterThan(0)
                expect(stats.averageObserverAge).toBeGreaterThan(0)

                cleanup1()
                cleanup2()
            }, 10)
        })
    })

    describe('Non-browser Environment', () => {
        test('should handle non-browser environment gracefully', () => {
            const originalWindow = (global as any).window
            const originalDocument = (global as any).document
            
            // Temporarily remove window and document
            delete (global as any).window
            delete (global as any).document

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {}
            )

            expect(typeof cleanup).toBe('function')
            expect(() => cleanup()).not.toThrow()

            // Restore
            if (originalWindow) (global as any).window = originalWindow
            if (originalDocument) (global as any).document = originalDocument
        })
    })
})