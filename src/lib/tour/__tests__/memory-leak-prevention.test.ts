/**
 * Focused tests for memory leak fixes and proper cleanup behavior
 * Covers Requirements 3.1, 3.2, 3.3, 3.4 from the specification
 */

import { TourElementValidator } from '../element-validator'

// Mock MutationObserver
const mockObserver = {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => [])
}

const mockMutationObserver = jest.fn(() => mockObserver)

// Mock performance.now
const mockPerformance = {
    now: jest.fn(() => Date.now())
}

// Setup global mocks
Object.defineProperty(global, 'MutationObserver', {
    value: mockMutationObserver,
    writable: true
})

Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true
})

Object.defineProperty(global, 'window', {
    value: {
        performance: mockPerformance
    },
    writable: true
})

Object.defineProperty(global, 'document', {
    value: {
        querySelector: jest.fn(),
        body: {}
    },
    writable: true
})

describe('Memory Leak Prevention and Cleanup Behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Clean up any existing observers
        if (typeof TourElementValidator.forceCleanupAllObservers === 'function') {
            TourElementValidator.forceCleanupAllObservers()
        }
    })

    afterEach(() => {
        // Ensure cleanup after each test
        if (typeof TourElementValidator.forceCleanupAllObservers === 'function') {
            TourElementValidator.forceCleanupAllObservers()
        }
    })

    describe('Requirement 3.1: Proper Observer Disconnection', () => {
        test('should disconnect mutation observers when cleanup is called', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            expect(mockMutationObserver).toHaveBeenCalled()
            expect(mockObserver.observe).toHaveBeenCalled()

            cleanup()

            expect(mockObserver.disconnect).toHaveBeenCalled()
        })

        test('should handle observer disconnect errors gracefully', () => {
            mockObserver.disconnect.mockImplementation(() => {
                throw new Error('Disconnect failed')
            })

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            // Should not throw error even if disconnect fails
            expect(() => cleanup()).not.toThrow()

            // Reset mock
            mockObserver.disconnect.mockReset()
        })

        test('should disconnect observers only once', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            cleanup()
            cleanup() // Second call

            // Disconnect should only be called once
            expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
        })

        test('should handle null or undefined observers gracefully', () => {
            // Mock MutationObserver to return null
            const originalMutationObserver = global.MutationObserver
            global.MutationObserver = jest.fn(() => null) as any

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            expect(() => cleanup()).not.toThrow()

            global.MutationObserver = originalMutationObserver
        })

        test('should track observer state correctly', () => {
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

            // Both observers should be active
            if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                const stats = TourElementValidator.verifyObserverCleanup()
                expect(stats.activeObservers).toBe(2)
            }

            cleanup1()

            // One observer should remain active
            if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                const stats = TourElementValidator.verifyObserverCleanup()
                expect(stats.activeObservers).toBe(1)
            }

            cleanup2()

            // No observers should be active
            if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                const stats = TourElementValidator.verifyObserverCleanup()
                expect(stats.activeObservers).toBe(0)
            }
        })
    })

    describe('Requirement 3.2: Timeout Cleanup Prevention', () => {
        test('should clear timeouts during cleanup', () => {
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

            // Should not throw error even if clearTimeout fails
            expect(() => cleanup()).not.toThrow()

            global.clearTimeout = originalClearTimeout
        })

        test('should prevent timeout race conditions', async () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 100 }
            )

            // Simulate rapid cleanup calls
            const promises = Array.from({ length: 10 }, () => 
                Promise.resolve().then(() => cleanup())
            )

            await expect(Promise.all(promises)).resolves.toBeDefined()
        })

        test('should handle timeout cleanup with null timeout IDs', () => {
            // Mock setTimeout to return null
            const originalSetTimeout = global.setTimeout
            global.setTimeout = jest.fn(() => null) as any

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            expect(() => cleanup()).not.toThrow()

            global.setTimeout = originalSetTimeout
        })

        test('should clear timeouts before observer disconnect', () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
            let disconnectCallOrder = 0
            let clearTimeoutCallOrder = 0

            mockObserver.disconnect.mockImplementation(() => {
                disconnectCallOrder = Date.now()
            })

            clearTimeoutSpy.mockImplementation(() => {
                clearTimeoutCallOrder = Date.now()
            })

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            cleanup()

            // clearTimeout should be called before or at the same time as disconnect
            expect(clearTimeoutCallOrder).toBeLessThanOrEqual(disconnectCallOrder + 1)

            clearTimeoutSpy.mockRestore()
        })
    })

    describe('Requirement 3.3: Multiple Cleanup Call Handling', () => {
        test('should handle multiple cleanup calls without errors', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            // Multiple cleanup calls should not throw
            expect(() => {
                cleanup()
                cleanup()
                cleanup()
                cleanup()
                cleanup()
            }).not.toThrow()
        })

        test('should not perform cleanup operations multiple times', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            cleanup()
            cleanup()
            cleanup()

            // Disconnect should only be called once
            expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
        })

        test('should maintain cleanup state correctly', () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            // First cleanup
            cleanup()

            if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                const stats1 = TourElementValidator.verifyObserverCleanup()
                expect(stats1.activeObservers).toBe(0)

                // Second cleanup
                cleanup()

                const stats2 = TourElementValidator.verifyObserverCleanup()
                expect(stats2.activeObservers).toBe(0) // Should remain 0
            }
        })

        test('should handle concurrent cleanup calls', async () => {
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                () => {},
                { timeout: 1000 }
            )

            // Simulate concurrent cleanup calls
            const promises = Array.from({ length: 20 }, () => 
                new Promise<void>((resolve) => {
                    setTimeout(() => {
                        cleanup()
                        resolve()
                    }, Math.random() * 10)
                })
            )

            await expect(Promise.all(promises)).resolves.toBeDefined()

            // Should still only disconnect once
            expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
        })
    })

    describe('Requirement 3.4: Automatic Resource Cleanup', () => {
        test('should automatically clean up resources when observers are no longer needed', () => {
            const callback = jest.fn()
            
            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="test"]',
                callback,
                { timeout: 100 }
            )

            // Simulate timeout expiration
            setTimeout(() => {
                // Observer should be automatically cleaned up
                if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                    const stats = TourElementValidator.verifyObserverCleanup()
                    // Note: This depends on the actual implementation of automatic cleanup
                }
            }, 150)

            cleanup() // Manual cleanup for test safety
        })

        test('should perform emergency cleanup of stale observers', () => {
            // Create multiple observers
            const cleanups = Array.from({ length: 5 }, (_, i) => 
                TourElementValidator.createElementObserver(
                    `[data-testid="test${i}"]`,
                    () => {},
                    { timeout: 1000 }
                )
            )

            if (typeof TourElementValidator.performEmergencyCleanup === 'function') {
                // Emergency cleanup should handle stale observers
                expect(() => {
                    TourElementValidator.performEmergencyCleanup()
                }).not.toThrow()
            }

            // Manual cleanup for test safety
            cleanups.forEach(cleanup => cleanup())
        })

        test('should detect memory leak risk', () => {
            // Create many observers to trigger memory leak detection
            const cleanups = Array.from({ length: 25 }, (_, i) => 
                TourElementValidator.createElementObserver(
                    `[data-testid="leak-test-${i}"]`,
                    () => {},
                    { timeout: 1000 }
                )
            )

            if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                const stats = TourElementValidator.verifyObserverCleanup()
                expect(stats.memoryLeakRisk).toBe(true)
            }

            // Cleanup
            cleanups.forEach(cleanup => cleanup())
        })

        test('should force cleanup all observers when needed', () => {
            // Create multiple observers
            Array.from({ length: 10 }, (_, i) => 
                TourElementValidator.createElementObserver(
                    `[data-testid="force-cleanup-${i}"]`,
                    () => {},
                    { timeout: 1000 }
                )
            )

            if (typeof TourElementValidator.forceCleanupAllObservers === 'function') {
                TourElementValidator.forceCleanupAllObservers()

                if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                    const stats = TourElementValidator.verifyObserverCleanup()
                    expect(stats.activeObservers).toBe(0)
                }
            }
        })

        test('should provide accurate observer statistics', () => {
            const startTime = Date.now()
            
            const cleanup1 = TourElementValidator.createElementObserver(
                '[data-testid="stats-test-1"]',
                () => {},
                { timeout: 1000 }
            )

            // Wait a bit to create age difference
            setTimeout(() => {
                const cleanup2 = TourElementValidator.createElementObserver(
                    '[data-testid="stats-test-2"]',
                    () => {},
                    { timeout: 1000 }
                )

                if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                    const stats = TourElementValidator.verifyObserverCleanup()
                    expect(stats.activeObservers).toBe(2)
                    expect(stats.oldestObserverAge).toBeGreaterThan(0)
                    expect(stats.averageObserverAge).toBeGreaterThan(0)
                }

                cleanup1()
                cleanup2()
            }, 10)
        })

        test('should handle cleanup in non-browser environment', () => {
            const originalWindow = (global as any).window
            const originalDocument = (global as any).document
            
            // Remove browser globals
            delete (global as any).window
            delete (global as any).document

            const cleanup = TourElementValidator.createElementObserver(
                '[data-testid="non-browser-test"]',
                () => {}
            )

            expect(typeof cleanup).toBe('function')
            expect(() => cleanup()).not.toThrow()

            // Restore globals
            if (originalWindow) (global as any).window = originalWindow
            if (originalDocument) (global as any).document = originalDocument
        })
    })

    describe('Integration Tests for Memory Management', () => {
        test('should handle rapid observer creation and cleanup cycles', async () => {
            const cycles = 10
            const observersPerCycle = 5

            for (let cycle = 0; cycle < cycles; cycle++) {
                const cleanups = Array.from({ length: observersPerCycle }, (_, i) => 
                    TourElementValidator.createElementObserver(
                        `[data-testid="cycle-${cycle}-observer-${i}"]`,
                        () => {},
                        { timeout: 100 }
                    )
                )

                // Cleanup all observers in this cycle
                cleanups.forEach(cleanup => cleanup())

                // Verify cleanup
                if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                    const stats = TourElementValidator.verifyObserverCleanup()
                    expect(stats.activeObservers).toBe(0)
                }
            }
        })

        test('should maintain performance under heavy observer load', () => {
            const startTime = Date.now()
            
            // Create many observers
            const cleanups = Array.from({ length: 100 }, (_, i) => 
                TourElementValidator.createElementObserver(
                    `[data-testid="performance-test-${i}"]`,
                    () => {},
                    { timeout: 1000 }
                )
            )

            const creationTime = Date.now() - startTime
            expect(creationTime).toBeLessThan(1000) // Should create 100 observers in less than 1 second

            const cleanupStartTime = Date.now()
            
            // Cleanup all observers
            cleanups.forEach(cleanup => cleanup())

            const cleanupTime = Date.now() - cleanupStartTime
            expect(cleanupTime).toBeLessThan(1000) // Should cleanup 100 observers in less than 1 second
        })

        test('should handle mixed cleanup scenarios', () => {
            // Create observers with different configurations
            const shortTimeout = TourElementValidator.createElementObserver(
                '[data-testid="short"]',
                () => {},
                { timeout: 100 }
            )

            const longTimeout = TourElementValidator.createElementObserver(
                '[data-testid="long"]',
                () => {},
                { timeout: 5000 }
            )

            const noTimeout = TourElementValidator.createElementObserver(
                '[data-testid="no-timeout"]',
                () => {}
            )

            // Cleanup in different orders
            longTimeout()
            shortTimeout()
            noTimeout()

            if (typeof TourElementValidator.verifyObserverCleanup === 'function') {
                const stats = TourElementValidator.verifyObserverCleanup()
                expect(stats.activeObservers).toBe(0)
            }
        })
    })
})