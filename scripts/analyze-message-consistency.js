#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Message Consistency Analysis Script
 * Analyzes and fixes inconsistencies in messages and notifications
 */

class MessageConsistencyAnalyzer {
  constructor() {
    this.messagePatterns = [];
    this.inconsistencies = [];
    this.fixes = [];
    
    // Standard message patterns to look for
    this.messageTypes = {
      toast: {
        patterns: [
          /toast\s*\(/i,
          /sonner/i,
          /\.success\s*\(/,
          /\.error\s*\(/,
          /\.warning\s*\(/,
          /\.info\s*\(/
        ],
        standardColors: ['success', 'error', 'warning', 'info']
      },
      alert: {
        patterns: [
          /alert/i,
          /AlertDialog/,
          /QuickAlert/
        ],
        standardColors: ['success', 'error', 'warning', 'info']
      },
      notification: {
        patterns: [
          /notification/i,
          /notify/i,
          /banner/i
        ],
        standardColors: ['success', 'error', 'warning', 'info']
      },
      validation: {
        patterns: [
          /error.*message/i,
          /validation/i,
          /form.*error/i
        ],
        standardColors: ['error', 'warning']
      }
    };
    
    // Standard message structure
    this.standardStructure = {
      colors: {
        success: {
          bg: 'bg-success-50 dark:bg-success-900/20',
          border: 'border-success-200 dark:border-success-800',
          text: 'text-success-800 dark:text-success-200',
          icon: 'text-success-600 dark:text-success-400'
        },
        error: {
          bg: 'bg-error-50 dark:bg-error-900/20',
          border: 'border-error-200 dark:border-error-800',
          text: 'text-error-800 dark:text-error-200',
          icon: 'text-error-600 dark:text-error-400'
        },
        warning: {
          bg: 'bg-warning-50 dark:bg-warning-900/20',
          border: 'border-warning-200 dark:border-warning-800',
          text: 'text-warning-800 dark:text-warning-200',
          icon: 'text-warning-600 dark:text-warning-400'
        },
        info: {
          bg: 'bg-info-50 dark:bg-info-900/20',
          border: 'border-info-200 dark:border-info-800',
          text: 'text-info-800 dark:text-info-200',
          icon: 'text-info-600 dark:text-info-400'
        }
      },
      icons: {
        success: 'CheckCircle',
        error: 'XCircle',
        warning: 'AlertTriangle',
        info: 'Info'
      }
    };
  }

  analyze() {
    console.log('🔍 Analyzing message and notification consistency...\n');
    
    const srcPath = path.join(__dirname, '..', 'src');
    this.analyzeDirectory(srcPath);
    
    this.generateReport();
  }

  analyzeDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          this.analyzeDirectory(fullPath, relativeItemPath);
        }
      } else if (item.match(/\.(tsx?|jsx?)$/)) {
        this.analyzeFile(fullPath, relativeItemPath);
      }
    }
  }

  analyzeFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Find message usage patterns
      this.findMessagePatterns(content, relativePath);
      
      // Check for inconsistent styling
      this.checkStylingConsistency(content, relativePath);
      
      // Check for inconsistent positioning
      this.checkPositioningConsistency(content, relativePath);
      
      // Check for missing accessibility features
      this.checkAccessibilityFeatures(content, relativePath);
      
    } catch (error) {
      console.warn(`Warning: Could not analyze ${relativePath}: ${error.message}`);
    }
  }

  findMessagePatterns(content, filePath) {
    Object.entries(this.messageTypes).forEach(([type, config]) => {
      config.patterns.forEach(pattern => {
        const matches = content.match(new RegExp(pattern.source, 'gi'));
        if (matches) {
          this.messagePatterns.push({
            file: filePath,
            type,
            pattern: pattern.source,
            count: matches.length,
            matches
          });
        }
      });
    });
  }

  checkStylingConsistency(content, filePath) {
    // Check for inconsistent color usage
    const colorPatterns = [
      { pattern: /bg-green-\d+/g, standard: 'bg-success-', type: 'success' },
      { pattern: /bg-red-\d+/g, standard: 'bg-error-', type: 'error' },
      { pattern: /bg-yellow-\d+/g, standard: 'bg-warning-', type: 'warning' },
      { pattern: /bg-blue-\d+/g, standard: 'bg-info-', type: 'info' },
      { pattern: /text-green-\d+/g, standard: 'text-success-', type: 'success' },
      { pattern: /text-red-\d+/g, standard: 'text-error-', type: 'error' },
      { pattern: /text-yellow-\d+/g, standard: 'text-warning-', type: 'warning' },
      { pattern: /text-blue-\d+/g, standard: 'text-info-', type: 'info' }
    ];
    
    colorPatterns.forEach(({ pattern, standard, type }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.inconsistencies.push({
          file: filePath,
          type: 'color-inconsistency',
          issue: `Non-standard ${type} colors found`,
          matches: matches.slice(0, 5), // Limit to first 5 matches
          suggestion: `Use ${standard}* classes instead`
        });
      }
    });
  }

  checkPositioningConsistency(content, filePath) {
    // Check for inconsistent toast positioning
    const positionPatterns = [
      /position:\s*['"]?top-right['"]?/gi,
      /position:\s*['"]?bottom-left['"]?/gi,
      /top:\s*\d+px/gi,
      /right:\s*\d+px/gi
    ];
    
    positionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        this.inconsistencies.push({
          file: filePath,
          type: 'positioning-inconsistency',
          issue: 'Custom positioning found',
          matches: matches.slice(0, 3),
          suggestion: 'Use standardized position props (top-right, bottom-left, etc.)'
        });
      }
    });
  }

  checkAccessibilityFeatures(content, filePath) {
    // Check for missing ARIA labels
    const messageElements = content.match(/<div[^>]*(?:alert|toast|notification)[^>]*>/gi);
    if (messageElements) {
      messageElements.forEach(element => {
        if (!element.includes('role=') && !element.includes('aria-')) {
          this.inconsistencies.push({
            file: filePath,
            type: 'accessibility-missing',
            issue: 'Message element missing accessibility attributes',
            suggestion: 'Add role="alert" or appropriate ARIA attributes'
          });
        }
      });
    }
  }

  fixInconsistencies() {
    console.log('🔧 Fixing message inconsistencies...\n');
    
    const srcPath = path.join(__dirname, '..', 'src');
    this.fixDirectory(srcPath);
  }

  fixDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          this.fixDirectory(fullPath, relativeItemPath);
        }
      } else if (item.match(/\.(tsx?|jsx?)$/)) {
        this.fixFile(fullPath, relativeItemPath);
      }
    }
  }

  fixFile(filePath, relativePath) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      let hasChanges = false;
      
      // Fix color inconsistencies
      const colorFixes = [
        { from: /bg-green-(\d+)/g, to: 'bg-success-$1' },
        { from: /bg-red-(\d+)/g, to: 'bg-error-$1' },
        { from: /bg-yellow-(\d+)/g, to: 'bg-warning-$1' },
        { from: /bg-blue-(\d+)/g, to: 'bg-info-$1' },
        { from: /text-green-(\d+)/g, to: 'text-success-$1' },
        { from: /text-red-(\d+)/g, to: 'text-error-$1' },
        { from: /text-yellow-(\d+)/g, to: 'text-warning-$1' },
        { from: /text-blue-(\d+)/g, to: 'text-info-$1' },
        { from: /border-green-(\d+)/g, to: 'border-success-$1' },
        { from: /border-red-(\d+)/g, to: 'border-error-$1' },
        { from: /border-yellow-(\d+)/g, to: 'border-warning-$1' },
        { from: /border-blue-(\d+)/g, to: 'border-info-$1' }
      ];
      
      colorFixes.forEach(({ from, to }) => {
        const newContent = content.replace(from, to);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      });
      
      // Fix icon inconsistencies
      const iconFixes = [
        { from: /Check\s+className="[^"]*text-green/g, to: match => match.replace('text-green', 'text-success') },
        { from: /X\s+className="[^"]*text-red/g, to: match => match.replace('text-red', 'text-error') },
        { from: /AlertTriangle\s+className="[^"]*text-yellow/g, to: match => match.replace('text-yellow', 'text-warning') },
        { from: /Info\s+className="[^"]*text-blue/g, to: match => match.replace('text-blue', 'text-info') }
      ];
      
      iconFixes.forEach(({ from, to }) => {
        const newContent = content.replace(from, to);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      });
      
      // Add missing accessibility attributes
      const accessibilityFixes = [
        {
          from: /<div([^>]*(?:alert|toast|notification)[^>]*)>/gi,
          to: (match, attributes) => {
            if (!attributes.includes('role=') && !attributes.includes('aria-')) {
              return match.replace('>', ' role="alert">');
            }
            return match;
          }
        }
      ];
      
      accessibilityFixes.forEach(({ from, to }) => {
        const newContent = content.replace(from, to);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        this.fixes.push({
          file: relativePath,
          type: 'message-standardization',
          description: 'Fixed message colors, icons, and accessibility'
        });
      }
      
    } catch (error) {
      console.warn(`Warning: Could not fix ${relativePath}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('📊 Message Consistency Analysis Report');
    console.log('=====================================');
    
    // Summary statistics
    const totalFiles = new Set(this.messagePatterns.map(p => p.file)).size;
    const totalMessages = this.messagePatterns.reduce((sum, p) => sum + p.count, 0);
    const totalInconsistencies = this.inconsistencies.length;
    
    console.log(`Files analyzed: ${totalFiles}`);
    console.log(`Message patterns found: ${totalMessages}`);
    console.log(`Inconsistencies found: ${totalInconsistencies}`);
    
    // Message type breakdown
    console.log('\n📋 Message Types Found:');
    const typeBreakdown = {};
    this.messagePatterns.forEach(pattern => {
      if (!typeBreakdown[pattern.type]) {
        typeBreakdown[pattern.type] = 0;
      }
      typeBreakdown[pattern.type] += pattern.count;
    });
    
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      console.log(`${type}: ${count} instances`);
    });
    
    // Top inconsistencies
    console.log('\n⚠️  Top Inconsistencies:');
    const inconsistencyTypes = {};
    this.inconsistencies.forEach(inc => {
      if (!inconsistencyTypes[inc.type]) {
        inconsistencyTypes[inc.type] = [];
      }
      inconsistencyTypes[inc.type].push(inc);
    });
    
    Object.entries(inconsistencyTypes).forEach(([type, issues]) => {
      console.log(`${type}: ${issues.length} issues`);
      issues.slice(0, 3).forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.issue}`);
      });
      if (issues.length > 3) {
        console.log(`  ... and ${issues.length - 3} more`);
      }
    });
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'audit-reports', 'message-consistency-analysis.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      summary: {
        filesAnalyzed: totalFiles,
        messagePatterns: totalMessages,
        inconsistencies: totalInconsistencies,
        timestamp: new Date().toISOString()
      },
      patterns: this.messagePatterns,
      inconsistencies: this.inconsistencies,
      fixes: this.fixes,
      recommendations
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return totalInconsistencies === 0;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Based on inconsistencies found
    const hasColorIssues = this.inconsistencies.some(i => i.type === 'color-inconsistency');
    const hasPositionIssues = this.inconsistencies.some(i => i.type === 'positioning-inconsistency');
    const hasAccessibilityIssues = this.inconsistencies.some(i => i.type === 'accessibility-missing');
    
    if (hasColorIssues) {
      recommendations.push('Standardize message colors using semantic color classes (success, error, warning, info)');
    }
    
    if (hasPositionIssues) {
      recommendations.push('Use consistent positioning system for toasts and notifications');
    }
    
    if (hasAccessibilityIssues) {
      recommendations.push('Add proper ARIA attributes and roles to all message components');
    }
    
    recommendations.push('Implement the unified notification system component');
    recommendations.push('Use the message-system.css for consistent styling');
    recommendations.push('Standardize animation durations and easing functions');
    recommendations.push('Ensure all messages have proper dismiss functionality');
    
    return recommendations;
  }
}

// Main execution
function main() {
  const analyzer = new MessageConsistencyAnalyzer();
  
  // Analyze current state
  analyzer.analyze();
  
  // Ask if user wants to apply fixes
  console.log('\n🔧 Would you like to apply automatic fixes? (This will modify files)');
  console.log('Run with --fix flag to apply fixes automatically');
  
  if (process.argv.includes('--fix')) {
    analyzer.fixInconsistencies();
    
    console.log('\n✅ Fixes Applied:');
    if (analyzer.fixes.length === 0) {
      console.log('No fixes were needed or applied.');
    } else {
      analyzer.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.file} - ${fix.description}`);
      });
    }
  }
  
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { MessageConsistencyAnalyzer };