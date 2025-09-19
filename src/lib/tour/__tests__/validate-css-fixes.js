/**
 * Simple validation script to verify CSS selector fixes
 * Run with: node validate-css-fixes.js
 */

// Mock DOM environment for Node.js
const { JSDOM } = require('jsdom');

// Create a mock DOM
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <button data-testid="submit-button">Submit</button>
    <button aria-label="Click me">Click me</button>
    <nav>
        <a href="/home" data-testid="home">Home</a>
        <a href="/about">About</a>
    </nav>
    <form>
        <label for="email">Email</label>
        <input id="email" name="email" type="email">
    </form>
    <div class="content-area">Content</div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window;
global.performance = { now: () => Date.now() };
global.MutationObserver = class {
    observe() {}
    disconnect() {}
};

// Import the fixed module
const { SmartSelectorBuilder } = require('../element-validator.ts');

console.log('🧪 Testing CSS Selector Fixes...\n');

// Test 1: Navigation selectors should not contain :contains()
console.log('✅ Test 1: Navigation selectors');
const navSelectors = SmartSelectorBuilder.forNavigation('Home');
const hasInvalidNavSelectors = navSelectors.some(s => s.includes(':contains(') || s.includes(':has('));
console.log('  Generated selectors:', navSelectors);
console.log('  Contains invalid selectors:', hasInvalidNavSelectors ? '❌ FAIL' : '✅ PASS');

// Test 2: Button selectors should not contain :contains()
console.log('\n✅ Test 2: Button selectors');
const buttonSelectors = SmartSelectorBuilder.forButton('Submit');
const hasInvalidButtonSelectors = buttonSelectors.some(s => s.includes(':contains('));
console.log('  Generated selectors:', buttonSelectors);
console.log('  Contains invalid selectors:', hasInvalidButtonSelectors ? '❌ FAIL' : '✅ PASS');

// Test 3: Form selectors should not contain label:contains() + input
console.log('\n✅ Test 3: Form selectors');
const formSelectors = SmartSelectorBuilder.forForm('email');
const hasInvalidFormSelectors = formSelectors.some(s => s.match(/label:contains\(.+\)\s*\+\s*input/));
console.log('  Generated selectors:', formSelectors);
console.log('  Contains invalid selectors:', hasInvalidFormSelectors ? '❌ FAIL' : '✅ PASS');

// Test 4: Content selectors should escape special characters
console.log('\n✅ Test 4: Content selectors with special characters');
const contentSelectors = SmartSelectorBuilder.forContent('my-class.with-dots');
const hasEscapedSelectors = contentSelectors.some(s => s.includes('my-class\\.with-dots'));
console.log('  Generated selectors:', contentSelectors);
console.log('  Properly escaped:', hasEscapedSelectors ? '✅ PASS' : '❌ FAIL');

// Test 5: Hybrid selectors should provide JavaScript alternatives
console.log('\n✅ Test 5: Hybrid selectors');
const hybridSelectors = SmartSelectorBuilder.generateHybridSelectors('Click me', 'button');
const hasJsFunction = typeof hybridSelectors.jsFunction === 'function';
const hasCssSelectors = Array.isArray(hybridSelectors.cssSelectors);
console.log('  Has CSS selectors:', hasCssSelectors ? '✅ PASS' : '❌ FAIL');
console.log('  Has JS function:', hasJsFunction ? '✅ PASS' : '❌ FAIL');

console.log('\n🎉 CSS Selector Fixes Validation Complete!');