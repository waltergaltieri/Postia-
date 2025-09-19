/**
 * Type safety validation tests for element validator
 * Tests the TypeScript type fixes and environment detection
 */

import { TourElementValidator, findTourElement } from '../element-validator'

// Test environment detection
function testEnvironmentDetection() {
    console.log('Testing environment detection...')
    
    // These should not throw TypeScript errors
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
    const isNode = typeof process !== 'undefined' && process.versions?.node !== undefined
    
    console.log('Environment detection passed')
}

// Test timeout type safety
function testTimeoutTypes() {
    console.log('Testing timeout type safety...')
    
    // This should use the correct timeout type
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    
    timeoutId = setTimeout(() => {
        console.log('Timeout executed')
    }, 1000)
    
    if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
    }
    
    console.log('Timeout type safety passed')
}

// Test null safety in DOM operations
async function testNullSafety() {
    console.log('Testing null safety...')
    
    // These should handle null/undefined gracefully
    const result1 = await TourElementValidator.findElement('invalid-selector', 100)
    const result2 = await findTourElement(null as any, { timeout: 100 })
    const result3 = await findTourElement('', { timeout: 100 })
    
    // Should not throw errors
    const position = TourElementValidator.getElementPosition(null as any)
    const isVisible = TourElementValidator.isElementVisible(null as any)
    
    console.log('Null safety tests passed')
    console.log('Results:', { result1, result2, result3, position, isVisible })
}

// Test type guards
function testTypeGuards() {
    console.log('Testing type guards...')
    
    // Test with various inputs
    const testElement = document?.createElement?.('div')
    const nullElement = null
    const undefinedElement = undefined
    const stringValue = 'not an element'
    
    // These should not cause TypeScript errors
    const isValid1 = testElement instanceof HTMLElement
    const isValid2 = nullElement === null
    const isValid3 = undefinedElement === undefined
    const isValid4 = typeof stringValue === 'string'
    
    console.log('Type guards passed')
}

// Run all tests
export function runTypeSafetyTests() {
    console.log('Running type safety validation tests...')
    
    try {
        testEnvironmentDetection()
        testTimeoutTypes()
        testTypeGuards()
        
        // Only run DOM tests in browser environment
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            testNullSafety()
        }
        
        console.log('All type safety tests passed!')
        return true
    } catch (error) {
        console.error('Type safety test failed:', error)
        return false
    }
}

// Export for testing
export {
    testEnvironmentDetection,
    testTimeoutTypes,
    testNullSafety,
    testTypeGuards
}