/**
 * Test browser compatibility features in SmartSelectorBuilder
 */

import { SmartSelectorBuilder } from '../element-validator'

console.log('🧪 Testing Browser Compatibility Features...\n')

// Test 1: Special characters in class names
console.log('✅ Test 1: Special characters in class names')
const specialChars = ['my-class.with-dots', 'class:with:colons', 'class[with]brackets', 'class#with#hash']
specialChars.forEach(className => {
    const selectors = SmartSelectorBuilder.forContent(className)
    const hasValidEscaping = selectors.some(s => s.includes('\\'))
    console.log(`  "${className}": ${hasValidEscaping ? '✅ PASS' : '❌ FAIL'}`)
    if (hasValidEscaping) {
        console.log(`    Escaped selector: ${selectors.find(s => s.includes('\\'))}`)
    }
})

// Test 2: Attribute value sanitization
console.log('\n✅ Test 2: Attribute value sanitization')
const problematicValues = ['value\nwith\nnewlines', 'value\twith\ttabs', 'value"with"quotes']
problematicValues.forEach(value => {
    const selectors = SmartSelectorBuilder.forButton(value)
    const hasValidSelectors = selectors.length > 0 && selectors.every(s => !s.includes('\n') && !s.includes('\t'))
    console.log(`  "${value.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}": ${hasValidSelectors ? '✅ PASS' : '❌ FAIL'}`)
})

// Test 3: Test ID generation
console.log('\n✅ Test 3: Test ID generation')
const testTexts = ['Simple Text', 'Text with Spaces', 'Text/with\\special:chars', '']
testTexts.forEach(text => {
    const selectors = SmartSelectorBuilder.forNavigation(text)
    const hasTestId = selectors.some(s => s.includes('[data-testid='))
    console.log(`  "${text}": ${text === '' ? (selectors.length === 0 ? '✅ PASS' : '❌ FAIL') : (hasTestId ? '✅ PASS' : '❌ FAIL')}`)
    if (hasTestId) {
        console.log(`    Test ID: ${selectors.find(s => s.includes('[data-testid='))}`)
    }
})

// Test 4: Selector validation
console.log('\n✅ Test 4: Selector validation')
const testCases = [
    { input: 'normal-text', expectValid: true },
    { input: 'text with spaces', expectValid: true },
    { input: '', expectValid: false },
    { input: null, expectValid: false },
    { input: undefined, expectValid: false }
]

testCases.forEach(testCase => {
    const selectors = SmartSelectorBuilder.forButton(testCase.input as any)
    const isValid = selectors.length > 0
    const passed = isValid === testCase.expectValid
    console.log(`  Input: ${testCase.input === null ? 'null' : testCase.input === undefined ? 'undefined' : `"${testCase.input}"`} - ${passed ? '✅ PASS' : '❌ FAIL'}`)
})

// Test 5: Hybrid selector functionality
console.log('\n✅ Test 5: Hybrid selector functionality')
const hybridTypes: Array<'button' | 'link' | 'input' | 'navigation'> = ['button', 'link', 'input', 'navigation']
hybridTypes.forEach(type => {
    const hybrid = SmartSelectorBuilder.generateHybridSelectors('Test', type)
    const hasValidStructure = hybrid.cssSelectors && Array.isArray(hybrid.cssSelectors) && 
                             hybrid.jsFunction && typeof hybrid.jsFunction === 'function'
    console.log(`  ${type}: ${hasValidStructure ? '✅ PASS' : '❌ FAIL'}`)
    if (hasValidStructure) {
        console.log(`    CSS selectors count: ${hybrid.cssSelectors.length}`)
    }
})

console.log('\n🎉 Browser Compatibility Tests Complete!')