/**
 * Simple test for SmartSelectorBuilder fixes
 */

import { SmartSelectorBuilder } from '../element-validator'

console.log('🧪 Testing SmartSelectorBuilder Fixes...\n')

// Test 1: Navigation selectors should not contain :contains() or :has()
console.log('✅ Test 1: Navigation selectors')
const navSelectors = SmartSelectorBuilder.forNavigation('Home')
const hasInvalidNavSelectors = navSelectors.some(s => s.includes(':contains(') || s.includes(':has('))
console.log('  Generated selectors:', navSelectors)
console.log('  Contains invalid selectors:', hasInvalidNavSelectors ? '❌ FAIL' : '✅ PASS')

// Test 2: Button selectors should not contain :contains()
console.log('\n✅ Test 2: Button selectors')
const buttonSelectors = SmartSelectorBuilder.forButton('Submit')
const hasInvalidButtonSelectors = buttonSelectors.some(s => s.includes(':contains('))
console.log('  Generated selectors:', buttonSelectors)
console.log('  Contains invalid selectors:', hasInvalidButtonSelectors ? '❌ FAIL' : '✅ PASS')

// Test 3: Form selectors should not contain label:contains() + input
console.log('\n✅ Test 3: Form selectors')
const formSelectors = SmartSelectorBuilder.forForm('email')
const hasInvalidFormSelectors = formSelectors.some(s => s.match(/label:contains\(.+\)\s*\+\s*input/))
console.log('  Generated selectors:', formSelectors)
console.log('  Contains invalid selectors:', hasInvalidFormSelectors ? '❌ FAIL' : '✅ PASS')

// Test 4: Content selectors should escape special characters
console.log('\n✅ Test 4: Content selectors with special characters')
const contentSelectors = SmartSelectorBuilder.forContent('my-class.with-dots')
const hasEscapedSelectors = contentSelectors.some(s => s.includes('my-class\\.with-dots'))
console.log('  Generated selectors:', contentSelectors)
console.log('  Properly escaped:', hasEscapedSelectors ? '✅ PASS' : '❌ FAIL')

// Test 5: Hybrid selectors should provide JavaScript alternatives
console.log('\n✅ Test 5: Hybrid selectors')
const hybridSelectors = SmartSelectorBuilder.generateHybridSelectors('Click me', 'button')
const hasJsFunction = typeof hybridSelectors.jsFunction === 'function'
const hasCssSelectors = Array.isArray(hybridSelectors.cssSelectors)
console.log('  Has CSS selectors:', hasCssSelectors ? '✅ PASS' : '❌ FAIL')
console.log('  Has JS function:', hasJsFunction ? '✅ PASS' : '❌ FAIL')

// Test 6: Input validation
console.log('\n✅ Test 6: Input validation')
const emptySelectors = SmartSelectorBuilder.forNavigation('')
const nullSelectors = SmartSelectorBuilder.forButton(null as any)
const undefinedSelectors = SmartSelectorBuilder.forForm(undefined as any)
console.log('  Empty string handling:', emptySelectors.length === 0 ? '✅ PASS' : '❌ FAIL')
console.log('  Null handling:', nullSelectors.length === 0 ? '✅ PASS' : '❌ FAIL')
console.log('  Undefined handling:', undefinedSelectors.length === 0 ? '✅ PASS' : '❌ FAIL')

// Test 7: Browser compatibility checks
console.log('\n✅ Test 7: Browser compatibility')
try {
    // Test that methods don't throw errors
    SmartSelectorBuilder.forNavigation('Test')
    SmartSelectorBuilder.forButton('Test')
    SmartSelectorBuilder.forForm('test')
    SmartSelectorBuilder.forContent('test-class')
    console.log('  No runtime errors:', '✅ PASS')
} catch (error) {
    console.log('  Runtime error:', '❌ FAIL', error)
}

console.log('\n🎉 SmartSelectorBuilder Tests Complete!')