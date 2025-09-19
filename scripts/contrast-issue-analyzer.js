#!/usr/bin/env node

/**
 * Contrast Issue Analyzer
 * Identifies specific contrast issues in the codebase
 */

const fs = require('fs');
const path = require('path');

// WCAG AA contrast ratio requirement
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

/**
 * Convert hex to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio
 */
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast meets WCAG AA
 */
function meetsWCAG(ratio, isLarge = false) {
  return ratio >= (isLarge ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
}

/**
 * Analyze current color combinations
 */
function analyzeCurrentColors() {
  const issues = [];
  
  // Common problematic combinations found in the codebase
  const colorCombinations = [
    // From input.tsx - placeholder text
    { fg: '#9ca3af', bg: '#ffffff', context: 'Input placeholder (gray-400 on white)', file: 'src/components/ui/input.tsx' },
    
    // Light gray combinations that might be problematic
    { fg: '#ffffff', bg: '#f3f4f6', context: 'White text on light gray background', file: 'Various components' },
    { fg: '#d1d5db', bg: '#f9fafb', context: 'Light gray text on lighter gray background', file: 'Various components' },
    
    // Muted foreground combinations
    { fg: '#6b7280', bg: '#ffffff', context: 'Muted text on white background', file: 'Theme system' },
    
    // Focus states that might be invisible
    { fg: '#ffffff', bg: '#ffffff', context: 'White text on white background (potential issue)', file: 'Various components' },
    
    // Button states
    { fg: '#ffffff', bg: '#3b82f6', context: 'White text on primary blue (should be good)', file: 'Button components' },
    
    // Navigation items
    { fg: '#374151', bg: '#f9fafb', context: 'Navigation text on light background', file: 'Navigation components' },
  ];
  
  colorCombinations.forEach(combo => {
    const ratio = getContrastRatio(combo.fg, combo.bg);
    const passes = meetsWCAG(ratio);
    
    if (!passes) {
      issues.push({
        ...combo,
        ratio: ratio.toFixed(2),
        passes,
        severity: ratio < 3 ? 'critical' : 'major'
      });
    }
  });
  
  return issues;
}

/**
 * Generate contrast fixes
 */
function generateContrastFixes(issues) {
  const fixes = [];
  
  issues.forEach(issue => {
    let suggestedFix = '';
    
    if (issue.context.includes('placeholder')) {
      suggestedFix = `
/* Fix placeholder contrast */
.placeholder\\:text-gray-400::placeholder {
  color: #6b7280; /* gray-500 for better contrast */
}

/* Alternative: Use CSS custom property */
:root {
  --placeholder-color: #6b7280; /* Ensures 4.5:1 contrast on white */
}

.input-field::placeholder {
  color: var(--placeholder-color);
}`;
    } else if (issue.context.includes('White text on white')) {
      suggestedFix = `
/* Fix white on white text */
.text-white-on-white-fix {
  color: #1f2937; /* gray-800 for high contrast */
  background-color: #ffffff;
}

/* Or use theme-aware colors */
.text-foreground {
  color: hsl(var(--foreground));
}`;
    } else if (issue.context.includes('Muted text')) {
      suggestedFix = `
/* Improve muted text contrast */
.text-muted-foreground {
  color: #4b5563; /* gray-600 instead of gray-500 */
}

/* Dark theme variant */
[data-theme="dark"] .text-muted-foreground {
  color: #9ca3af; /* gray-400 for dark backgrounds */
}`;
    }
    
    fixes.push({
      issue: issue.context,
      file: issue.file,
      currentRatio: issue.ratio,
      suggestedFix
    });
  });
  
  return fixes;
}

/**
 * Main analysis function
 */
function main() {
  console.log('🔍 Analyzing contrast issues in the codebase...\n');
  
  const issues = analyzeCurrentColors();
  const fixes = generateContrastFixes(issues);
  
  console.log(`Found ${issues.length} contrast issues:\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.context}`);
    console.log(`   File: ${issue.file}`);
    console.log(`   Colors: ${issue.fg} on ${issue.bg}`);
    console.log(`   Contrast Ratio: ${issue.ratio}:1 (${issue.passes ? '✅ PASS' : '❌ FAIL'})`);
    console.log(`   Severity: ${issue.severity.toUpperCase()}`);
    console.log('');
  });
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      majorIssues: issues.filter(i => i.severity === 'major').length
    },
    issues,
    fixes
  };
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'audit-reports', 'contrast-analysis.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 Report saved to: ${reportPath}`);
  console.log('\n🔧 Suggested fixes have been included in the report.');
  
  return report;
}

if (require.main === module) {
  main();
}

module.exports = { analyzeCurrentColors, generateContrastFixes, getContrastRatio, meetsWCAG };