/**
 * Performance testing under heavy DOM mutation scenarios
 * Tests the validator's performance and stability during intensive DOM operations
 */

import { TourElementValidator } from '../element-validator'

// Mock heavy DOM mutation scenarios
const createHeavyDOMEnvironment = () => {
    let elementCounter = 0
    const activeElements = new Map<string, any>()
    const mutationObservers = new Set<any>()

    const createMockElement = (id?: string) => {
        const elementId = id || `element-${++elementCounter}`
        const element = {
            id: elementId,
            tagName: 'DIV',
            className: `dynamic-element element-${elementCounter}`,
            textContent: `Dynamic content ${elementCounter}`,
            getAttribute: jest.fn(),
            hasAttribute: jest.fn(),
            getBoundingClientRect: jest.fn(() => ({
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                width: 100 + Math.random() * 200,
                height: 50 + Math.random() * 100,
                top: Math.random() * 1000,
                left: Math.random() * 1000,
                right: Math.random() * 1000 + 300,
                bottom: Math.random() * 1000 + 150
            })),
            parentElement: null,
            children: [],
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        } as any

        activeElements.set(elementId, element)
        return element
    }

    const simulateDOMChurn = (intensity: 'low' | 'medium' | 'high' | 'extreme') => {
        const operations = {
            low: 10,
            medium: 50,
            high: 200,
            extreme: 1000
        }

        const operationCount = operations[intensity]
        
        for (let i = 0; i < operationCount; i++) {
            const operation = Math.random()
            
            if (operation < 0.4) {
                // Add elements
                createMockElement()
            } else if (operation < 0.7) {
                // Remove elements
                const keys = Array.from(activeElements.keys())
                if (keys.length > 0) {
                    const randomKey = keys[Math.floor(Math.random() * keys.length)]
                    activeElements.delete(randomKey)
                }
            } else {
                // Modify existing elements
                const keys = Array.from(activeElements.keys())
                if (keys.length > 0) {
                    const randomKey = keys[Math.floor(Math.random() * keys.length)]
                    const element = activeElements.get(randomKey)
                    if (element) {
                        element.className = `modified-element-${Date.now()}`
                        element.textContent = `Modified content ${Date.now()}`
                    }
                }
            }
        }
    }

    const mockDocument = {
        querySelector: jest.fn((selector: string) => {
            // Simulate search through many elements
            const elements = Array.from(activeElements.values())
            return elements.find(el => 
                selector.includes(el.id) || 
                selector.includes(el.className.split(' ')[0])
            ) || null
        }),
        querySelectorAll: jest.fn((selector: string) => {
            const elements = Array.from(activeElements.values())
            return elements.filter(el => 
                selector.includes(el.className.split(' ')[0]) ||
                selector.includes('dynamic-element')
            )
        }),
        createElement: jest.fn(() => createMockElement()),
        body: {
            children: { length: activeElements.size },
            appendChild: jest.fn(),
            removeChild: jest.fn()
        }
    }

    const mockMutationObserver = jest.fn().mockImplementation((callback) => {
        const observer = {
            observe: jest.fn(),
            disconnect: jest.fn(),
            takeRecords: jest.fn(() => [])
        }
        mutationObservers.add(observer)
        return observer
    })

    return {
        mockDocument,
        mockMutationObserver,
        createMockElement,
        simulateDOMChurn,
        getActiveElementCount: () => activeElements.size,
        getObserverCount: () => mutationObservers.size,
        cleanup: () => {
            activeElements.clear()
            mutationObservers.clear()
        }
    }
}

describe('TourElementValidator - Performance Under Heavy DOM Mutations', () => {
    let domEnvironment: ReturnType<typeof createHeavyDOMEnvironment>

    beforeAll(() => {
        global.performance = {
            now: jest.fn(() => Date.now())
        } as any
    })

    beforeEach(() => {
        domEnvironment = createHeavyDOMEnvironment()
        global.document = domEnvironment.mockDocument as any
        global.MutationObserver = domEnvironment.mockMutationObserver as any
        global.window = {
            getComputedStyle: jest.fn(() => ({
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                pointerEvents: 'auto'
            }))
        } as any
        jest.clearAllMocks()
    })

    afterEach(() => {
        domEnvironment.cleanup()
    })

    describe('Performance under low DOM mutation load', () => {
        it('should maintain fast response times with low mutation activity', async () => {
            // Simulate low DOM churn
            domEnvironment.simulateDOMChurn('low')
            
            const testElement = domEnvironment.createMockElement('test-element')
            
            const startTime = Date.now()
            const result = await TourElementValidator.findElement('#test-element')
            const endTime = Date.now()

            expect(result.found).toBe(true)
            expect(endTime - startTime).toBeLessThan(100) // Should be very fast
            expect(result.performance?.searchTime).toBeLessThan(100)
        })

        it('should handle multiple concurrent searches efficiently', async () => {
            domEnvironment.simulateDOMChurn('low')
            
            // Create multiple test elements
            const elements = Array.from({ length: 10 }, (_, i) => 
                domEnvironment.createMockElement(`concurrent-test-${i}`)
            )

            const startTime = Date.now()
            
            // Run multiple searches concurrently
            const promises = elements.map((_, i) => 
                TourElementValidator.findElement(`#concurrent-test-${i}`)
            )
            
            const results = await Promise.all(promises)
            const endTime = Date.now()

            expect(results.every(r => r.found)).toBe(true)
            expect(endTime - startTime).toBeLessThan(500) // All searches should complete quickly
        })
    })

    describe('Performance under medium DOM mutation load', () => {
        it('should maintain acceptable performance with medium mutation activity', async () => {
            // Simulate medium DOM churn
            domEnvironment.simulateDOMChurn('medium')
            
            const testElement = domEnvironment.createMockElement('medium-test')
            
            const startTime = Date.now()
            const result = await TourElementValidator.findElement('#medium-test')
            const endTime = Date.now()

            expect(result.found).toBe(true)
            expect(endTime - startTime).toBeLessThan(300) // Still reasonably fast
            expect(result.performance?.searchTime).toBeLessThan(300)
        })

        it('should handle observer management under medium load', async () => {
            domEnvironment.simulateDOMChurn('medium')
            
            // Test observer creation and cleanup
            const observerPromises = Array.from({ length: 5 }, () => 
                TourElementValidator.waitForElement('.dynamic-element', { timeout: 100 })
            )

            const results = await Promise.allSettled(observerPromises)
            
            // Should handle multiple observers without memory leaks
            expect(results.length).toBe(5)
            expect(domEnvironment.getObserverCount()).toBeGreaterThan(0)
        })
    })

    describe('Performance under high DOM mutation load', () => {
        it('should maintain stability with high mutation activity', async () => {
            // Simulate high DOM churn
            domEnvironment.simulateDOMChurn('high')
            
            const testElement = domEnvironment.createMockElement('high-test')
            
            const startTime = Date.now()
            const result = await TourElementValidator.executeWithFallbackStrategies('#high-test', {
                timeout: 1000,
                maxRetries: 3
            })
            const endTime = Date.now()

            expect(result.found).toBe(true)
            expect(endTime - startTime).toBeLessThan(1500) // Allow more time for high load
            expect(result.performance?.searchTime).toBeLessThan(1000)
        })

        it('should handle memory pressure gracefully', async () => {
            domEnvironment.simulateDOMChurn('high')
            
            // Monitor memory usage indicators
            const initialElementCount = domEnvironment.getActiveElementCount()
            
            // Perform multiple validation operations
            const operations = Array.from({ length: 20 }, (_, i) => 
                TourElementValidator.validateElementComprehensively(
                    domEnvironment.createMockElement(`memory-test-${i}`),
                    `#memory-test-${i}`
                )
            )

            const results = operations.map(op => op)
            
            expect(results.every(r => r.isValid !== undefined)).toBe(true)
            expect(domEnvironment.getActiveElementCount()).toBeGreaterThan(initialElementCount)
        })

        it('should provide performance degradation warnings', async () => {
            domEnvironment.simulateDOMChurn('high')
            
            // Simulate slow DOM operations
            domEnvironment.mockDocument.querySelector.mockImplementation((selector: string) => {
                // Add artificial delay to simulate slow DOM
                const start = Date.now()
                while (Date.now() - start < 100) {
                    // Busy wait to simulate slow operation
                }
                return domEnvironment.createMockElement()
            })

            const result = await TourElementValidator.findElement('#slow-element')
            
            expect(result.found).toBe(true)
            expect(result.performance?.searchTime).toBeGreaterThan(100)
            
            // Check if performance monitoring detected the issue
            const report = TourElementValidator.getValidationReport()
            expect(report.performanceStats.performanceGrade).toBeDefined()
        })
    })

    describe('Performance under extreme DOM mutation load', () => {
        it('should survive extreme mutation scenarios', async () => {
            // Simulate extreme DOM churn
            domEnvironment.simulateDOMChurn('extreme')
            
            const testElement = domEnvironment.createMockElement('extreme-test')
            
            const startTime = Date.now()
            const result = await TourElementValidator.executeWithFallbackStrategies('#extreme-test', {
                timeout: 2000,
                maxRetries: 5,
                retryDelay: 100
            })
            const endTime = Date.now()

            // Should either find the element or provide meaningful error
            expect(result.errorDetails).toBeDefined()
            expect(endTime - startTime).toBeLessThan(3000) // Should not hang indefinitely
        })

        it('should implement circuit breaker for extreme conditions', async () => {
            domEnvironment.simulateDOMChurn('extreme')
            
            // Simulate extremely slow DOM operations
            let operationCount = 0
            domEnvironment.mockDocument.querySelector.mockImplementation(() => {
                operationCount++
                if (operationCount > 10) {
                    // Simulate circuit breaker
                    throw new Error('Circuit breaker: Too many DOM operations')
                }
                const start = Date.now()
                while (Date.now() - start < 200) {
                    // Simulate very slow operation
                }
                return null
            })

            const result = await TourElementValidator.findElement('#circuit-breaker-test')
            
            expect(result.found).toBe(false)
            expect(result.errorDetails?.code).toBe('DOM_NOT_READY')
            expect(operationCount).toBeLessThanOrEqual(10)
        })
    })

    describe('Observer cleanup under heavy mutations', () => {
        it('should clean up observers properly during heavy mutations', async () => {
            domEnvironment.simulateDOMChurn('high')
            
            // Create multiple observers
            const observerPromises = Array.from({ length: 10 }, (_, i) => 
                TourElementValidator.waitForElement(`.observer-test-${i}`, { timeout: 200 })
            )

            // Let some observers timeout
            await Promise.allSettled(observerPromises)
            
            // Simulate more mutations
            domEnvironment.simulateDOMChurn('medium')
            
            // Check that observers are cleaned up
            const report = TourElementValidator.getValidationReport()
            expect(report.observerStats).toBeDefined()
            expect(report.observerStats.activeCount).toBeGreaterThanOrEqual(0)
        })

        it('should prevent memory leaks during rapid observer creation/destruction', async () => {
            const initialObserverCount = domEnvironment.getObserverCount()
            
            // Rapidly create and destroy observers
            for (let i = 0; i < 50; i++) {
                domEnvironment.simulateDOMChurn('medium')
                
                const promise = TourElementValidator.waitForElement(`.rapid-test-${i}`, { 
                    timeout: 50 
                })
                
                // Don't await - let them timeout
                promise.catch(() => {}) // Ignore timeout errors
            }

            // Wait for cleanup
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Observer count should not grow indefinitely
            const finalObserverCount = domEnvironment.getObserverCount()
            expect(finalObserverCount - initialObserverCount).toBeLessThan(50)
        })
    })

    describe('Performance monitoring and reporting', () => {
        it('should track performance metrics during heavy mutations', async () => {
            domEnvironment.simulateDOMChurn('high')
            
            // Perform various operations
            const operations = [
                () => TourElementValidator.findElement('#perf-test-1'),
                () => TourElementValidator.findElement('.perf-test-class'),
                () => TourElementValidator.findElement('[data-testid="perf-test"]'),
                () => TourElementValidator.executeWithFallbackStrategies('#missing-element'),
                () => TourElementValidator.validateElementComprehensively(
                    domEnvironment.createMockElement(), '#validation-test'
                )
            ]

            // Execute operations with mutations happening
            for (const operation of operations) {
                domEnvironment.simulateDOMChurn('medium')
                await operation()
            }

            const report = TourElementValidator.getValidationReport()
            
            expect(report.performanceStats).toBeDefined()
            expect(report.performanceStats.totalSelectors).toBeGreaterThan(0)
            expect(report.performanceStats.averageSearchTime).toBeGreaterThanOrEqual(0)
            expect(report.performanceStats.performanceGrade).toMatch(/^[A-F]$/)
        })

        it('should provide actionable performance recommendations', async () => {
            domEnvironment.simulateDOMChurn('extreme')
            
            // Simulate poor performance conditions
            domEnvironment.mockDocument.querySelector.mockImplementation(() => {
                const start = Date.now()
                while (Date.now() - start < 300) {
                    // Simulate very slow DOM
                }
                return null
            })

            await TourElementValidator.findElement('#slow-performance-test')
            
            const report = TourElementValidator.getValidationReport()
            
            expect(report.recommendations).toBeDefined()
            expect(report.recommendations.length).toBeGreaterThan(0)
            expect(report.healthScore).toBeLessThan(100)
            
            // Should include performance-related recommendations
            const hasPerformanceRecommendations = report.recommendations.some(rec => 
                rec.includes('performance') || 
                rec.includes('optimize') || 
                rec.includes('slow')
            )
            expect(hasPerformanceRecommendations).toBe(true)
        })
    })

    describe('Stress testing edge cases', () => {
        it('should handle rapid element creation and destruction', async () => {
            const elementIds: string[] = []
            
            // Rapidly create elements
            for (let i = 0; i < 100; i++) {
                const element = domEnvironment.createMockElement(`stress-${i}`)
                elementIds.push(element.id)
                
                if (i % 10 === 0) {
                    domEnvironment.simulateDOMChurn('high')
                }
            }

            // Try to find elements while DOM is churning
            const searchPromises = elementIds.slice(0, 10).map(id => 
                TourElementValidator.findElement(`#${id}`)
            )

            const results = await Promise.allSettled(searchPromises)
            
            // Should handle the stress without crashing
            expect(results.length).toBe(10)
            expect(results.every(r => r.status === 'fulfilled')).toBe(true)
        })

        it('should maintain functionality during DOM thrashing', async () => {
            // Simulate DOM thrashing - rapid add/remove cycles
            const thrashingInterval = setInterval(() => {
                domEnvironment.simulateDOMChurn('extreme')
            }, 10)

            try {
                const result = await TourElementValidator.executeWithFallbackStrategies(
                    '#thrashing-test',
                    {
                        timeout: 1000,
                        maxRetries: 10,
                        retryDelay: 50
                    }
                )

                // Should complete without hanging
                expect(result).toBeDefined()
                expect(result.errorDetails).toBeDefined()
            } finally {
                clearInterval(thrashingInterval)
            }
        })
    })
})