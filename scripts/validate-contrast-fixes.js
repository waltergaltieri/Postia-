#!/usr/bin/env node

/**
 * Validate Contrast Fixes
 * Tests the implemented contrast fixes to ensure they meet WCAG AA standards
 */

const fs = require('fs');
const path = require('path');

// Import the contrast analyzer
const { getContrastRatio, meetsWCAG } = require('./contrast-issue-analyzer');

/**
 * Test the fixed color combinations
 */
function testFixedColors() {
  console.log('🧪 Testing fixed color combinations...\n');
  
  const fixedCombinations = [
    // Fixed placeholder colors
    { 
      fg: '#6b7280', // gray-500 (improved from gray-400)
      bg: '#ffffff', 
      context: 'Fixed input placeholder',
      expected: 'PASS'
    },
    
    // Fixed muted foreground
    { 
      fg: '#57534e', // Improved muted-foreground for light theme
      bg: '#ffffff', 
      context: 'Fixed muted text on white',
      expected: 'PASS'
    },
    
    // Fixed primary button
    { 
      fg: '#ffffff', 
      bg: '#1d4ed8', // blue-700 (improved from blue-600)
      context: 'Fixed primary button',
      expected: 'PASS'
    },
    
    // Status colors
    { 
      fg: '#166534', // green-800
      bg: '#dcfce7', // green-100
      context: 'Success status',
      expected: 'PASS'
    },
    
    { 
      fg: '#92400e', // yellow-800
      bg: '#fef3c7', // yellow-100
      context: 'Warning status',
      expected: 'PASS'
    },
    
    { 
      fg: '#991b1b', // red-800
      bg: '#fee2e2', // red-100
      context: 'Error status',
      expected: 'PASS'
    },
    
    { 
      fg: '#1e40af', // blue-800
      bg: '#dbeafe', // blue-100
      context: 'Info status',
      expected: 'PASS'
    }
  ];
  
  const results = [];
  
  fixedCombinations.forEach((combo, index) => {
    const ratio = getContrastRatio(combo.fg, combo.bg);
    const passes = meetsWCAG(ratio);
    const result = passes ? 'PASS' : 'FAIL';
    
    console.log(`${index + 1}. ${combo.context}`);
    console.log(`   Colors: ${combo.fg} on ${combo.bg}`);
    console.log(`   Contrast Ratio: ${ratio.toFixed(2)}:1`);
    console.log(`   Result: ${result === 'PASS' ? '✅' : '❌'} ${result}`);
    console.log(`   Expected: ${combo.expected}`);
    console.log('');
    
    results.push({
      ...combo,
      ratio: ratio.toFixed(2),
      result,
      success: result === combo.expected
    });
  });
  
  return results;
}

/**
 * Check if CSS files contain the fixes
 */
function validateCSSFixes() {
  console.log('📁 Validating CSS fixes implementation...\n');
  
  const filesToCheck = [
    'src/styles/contrast-fixes.css',
    'src/styles/themes.css',
    'src/app/globals.css'
  ];
  
  const expectedFixes = [
    'placeholder:text-muted-foreground',
    'focus-visible:ring-2',
    'contrast-safe',
    'status-success-contrast-safe',
    'status-warning-contrast-safe',
    'status-error-contrast-safe',
    'high-contrast-border'
  ];
  
  const results = [];
  
  filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      results.push({ file: filePath, exists: false, fixes: [] });
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const foundFixes = expectedFixes.filter(fix => content.includes(fix));
    
    console.log(`📄 ${filePath}:`);
    console.log(`   Found ${foundFixes.length}/${expectedFixes.length} expected fixes`);
    
    foundFixes.forEach(fix => {
      console.log(`   ✅ ${fix}`);
    });
    
    const missingFixes = expectedFixes.filter(fix => !content.includes(fix));
    missingFixes.forEach(fix => {
      console.log(`   ❌ Missing: ${fix}`);
    });
    
    console.log('');
    
    results.push({
      file: filePath,
      exists: true,
      foundFixes,
      missingFixes,
      coverage: (foundFixes.length / expectedFixes.length) * 100
    });
  });
  
  return results;
}

/**
 * Generate validation report
 */
function generateValidationReport(colorResults, cssResults) {
  const report = {
    timestamp: new Date().toISOString(),
    colorTests: {
      total: colorResults.length,
      passed: colorResults.filter(r => r.success).length,
      failed: colorResults.filter(r => !r.success).length,
      results: colorResults
    },
    cssValidation: {
      files: cssResults.length,
      averageCoverage: cssResults.reduce((acc, r) => acc + (r.coverage || 0), 0) / cssResults.length,
      results: cssResults
    },
    summary: {
      overallSuccess: colorResults.every(r => r.success) && cssResults.every(r => r.coverage > 80),
      recommendations: []
    }
  };
  
  // Add recommendations
  if (report.colorTests.failed > 0) {
    report.summary.recommendations.push('Some color combinations still fail WCAG AA standards. Review and adjust colors.');
  }
  
  if (report.cssValidation.averageCoverage < 90) {
    report.summary.recommendations.push('CSS fix coverage is below 90%. Ensure all fixes are properly implemented.');
  }
  
  if (report.summary.overallSuccess) {
    report.summary.recommendations.push('All contrast fixes are successfully implemented! 🎉');
  }
  
  return report;
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Validating contrast fixes implementation...\n');
  
  const colorResults = testFixedColors();
  const cssResults = validateCSSFixes();
  
  const report = generateValidationReport(colorResults, cssResults);
  
  // Save validation report
  const reportPath = path.join(__dirname, '..', 'audit-reports', 'contrast-fixes-validation.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📊 Validation Summary:');
  console.log(`   Color Tests: ${report.colorTests.passed}/${report.colorTests.total} passed`);
  console.log(`   CSS Coverage: ${report.cssValidation.averageCoverage.toFixed(1)}%`);
  console.log(`   Overall Success: ${report.summary.overallSuccess ? '✅ YES' : '❌ NO'}`);
  console.log('');
  
  report.summary.recommendations.forEach(rec => {
    console.log(`💡 ${rec}`);
  });
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return report;
}

if (require.main === module) {
  main();
}

module.exports = { testFixedColors, validateCSSFixes, generateValidationReport };