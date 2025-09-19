#!/usr/bin/env node

/**
 * Mobile Responsive Issues Analyzer
 * Identifies and documents mobile responsive problems in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MobileResponsiveAnalyzer {
  constructor() {
    this.issues = [];
    this.srcPath = path.join(__dirname, '..', 'src');
    this.componentsPath = path.join(this.srcPath, 'components');
    this.stylesPath = path.join(this.srcPath, 'styles');
  }

  /**
   * Main analysis function
   */
  async analyze() {
    console.log('🔍 Analyzing mobile responsive issues...\n');

    // Analyze different types of issues
    await this.analyzeOverflowIssues();
    await this.analyzeTextSizeIssues();
    await this.analyzeTableScrollIssues();
    await this.analyzeModalIssues();
    await this.analyzeTouchTargetIssues();
    await this.analyzeViewportIssues();

    // Generate report
    this.generateReport();
  }

  /**
   * Analyze elements that might overflow on mobile
   */
  async analyzeOverflowIssues() {
    console.log('📱 Analyzing overflow issues...');
    
    const patterns = [
      { pattern: /width:\s*\d+px/, issue: 'Fixed width that may overflow on mobile' },
      { pattern: /min-width:\s*\d+px/, issue: 'Fixed min-width that may cause horizontal scroll' },
      { pattern: /flex-shrink:\s*0/, issue: 'Flex item that won\'t shrink on mobile' },
      { pattern: /white-space:\s*nowrap/, issue: 'Text that won\'t wrap on mobile' },
      { pattern: /overflow-x:\s*visible/, issue: 'Horizontal overflow not handled' },
    ];

    await this.analyzePatterns(patterns, 'Overflow Issues');
  }

  /**
   * Analyze text size issues
   */
  async analyzeTextSizeIssues() {
    console.log('📝 Analyzing text size issues...');
    
    const patterns = [
      { pattern: /font-size:\s*[0-9.]+px/, issue: 'Fixed font size that may be too small on mobile' },
      { pattern: /text-\w*-xs/, issue: 'Extra small text that may be hard to read on mobile' },
      { pattern: /text-\w*-sm/, issue: 'Small text that should be checked for mobile readability' },
    ];

    await this.analyzePatterns(patterns, 'Text Size Issues');
  }

  /**
   * Analyze table scroll issues
   */
  async analyzeTableScrollIssues() {
    console.log('📊 Analyzing table scroll issues...');
    
    const patterns = [
      { pattern: /<table/g, issue: 'Table without horizontal scroll wrapper' },
      { pattern: /table-fixed/, issue: 'Fixed table layout that may not be responsive' },
      { pattern: /grid-cols-\d+/, issue: 'Grid with fixed columns that may overflow on mobile' },
    ];

    await this.analyzePatterns(patterns, 'Table and Grid Issues');
  }

  /**
   * Analyze modal and popup issues
   */
  async analyzeModalIssues() {
    console.log('🪟 Analyzing modal and popup issues...');
    
    const patterns = [
      { pattern: /position:\s*fixed/, issue: 'Fixed positioned element that may need mobile optimization' },
      { pattern: /position:\s*absolute/, issue: 'Absolute positioned element that may need mobile optimization' },
      { pattern: /z-index:\s*\d+/, issue: 'Z-index that may need mobile stacking context review' },
      { pattern: /max-width:\s*\d+px/, issue: 'Fixed max-width that may be too wide for mobile' },
    ];

    await this.analyzePatterns(patterns, 'Modal and Popup Issues');
  }

  /**
   * Analyze touch target issues
   */
  async analyzeTouchTargetIssues() {
    console.log('👆 Analyzing touch target issues...');
    
    const patterns = [
      { pattern: /height:\s*[1-3]\d*px/, issue: 'Small height that may not meet touch target requirements' },
      { pattern: /width:\s*[1-3]\d*px/, issue: 'Small width that may not meet touch target requirements' },
      { pattern: /padding:\s*[0-5]px/, issue: 'Small padding that may make touch targets too small' },
    ];

    await this.analyzePatterns(patterns, 'Touch Target Issues');
  }

  /**
   * Analyze viewport and layout issues
   */
  async analyzeViewportIssues() {
    console.log('📐 Analyzing viewport issues...');
    
    const patterns = [
      { pattern: /100vw/, issue: 'Viewport width usage that may cause horizontal scroll' },
      { pattern: /100vh/, issue: 'Viewport height usage that may not work well on mobile browsers' },
      { pattern: /calc\([^)]*vw[^)]*\)/, issue: 'Viewport width calculation that may need mobile adjustment' },
    ];

    await this.analyzePatterns(patterns, 'Viewport Issues');
  }

  /**
   * Analyze patterns in files
   */
  async analyzePatterns(patterns, category) {
    const files = this.getAllFiles([this.componentsPath, this.stylesPath]);
    
    for (const file of files) {
      if (!this.isRelevantFile(file)) continue;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { pattern, issue } of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            this.issues.push({
              category,
              file: path.relative(process.cwd(), file),
              issue,
              matches: matches.length,
              pattern: pattern.toString(),
              severity: this.getSeverity(issue)
            });
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read file ${file}`);
      }
    }
  }

  /**
   * Get all files recursively
   */
  getAllFiles(dirs) {
    let files = [];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files = files.concat(this.getAllFiles([fullPath]));
        } else {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  /**
   * Check if file is relevant for analysis
   */
  isRelevantFile(file) {
    const ext = path.extname(file);
    return ['.tsx', '.ts', '.css', '.scss', '.js', '.jsx'].includes(ext) &&
           !file.includes('node_modules') &&
           !file.includes('.test.') &&
           !file.includes('.spec.');
  }

  /**
   * Get severity level for an issue
   */
  getSeverity(issue) {
    if (issue.includes('overflow') || issue.includes('scroll')) return 'high';
    if (issue.includes('touch target') || issue.includes('small')) return 'high';
    if (issue.includes('text') || issue.includes('font')) return 'medium';
    if (issue.includes('viewport') || issue.includes('fixed')) return 'medium';
    return 'low';
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📋 Generating Mobile Responsive Issues Report...\n');

    const reportPath = path.join(__dirname, '..', 'audit-reports', 'mobile-responsive-issues.md');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = this.buildReport();
    fs.writeFileSync(reportPath, report);

    console.log(`✅ Report generated: ${reportPath}`);
    this.printSummary();
  }

  /**
   * Build the markdown report
   */
  buildReport() {
    const timestamp = new Date().toISOString();
    const totalIssues = this.issues.length;
    const highSeverity = this.issues.filter(i => i.severity === 'high').length;
    const mediumSeverity = this.issues.filter(i => i.severity === 'medium').length;
    const lowSeverity = this.issues.filter(i => i.severity === 'low').length;

    let report = `# Mobile Responsive Issues Analysis Report

Generated: ${timestamp}

## Summary

- **Total Issues Found**: ${totalIssues}
- **High Severity**: ${highSeverity}
- **Medium Severity**: ${mediumSeverity}
- **Low Severity**: ${lowSeverity}

## Issues by Category

`;

    // Group issues by category
    const categories = [...new Set(this.issues.map(i => i.category))];
    
    for (const category of categories) {
      const categoryIssues = this.issues.filter(i => i.category === category);
      
      report += `### ${category} (${categoryIssues.length} issues)\n\n`;
      
      for (const issue of categoryIssues) {
        report += `#### ${issue.severity.toUpperCase()}: ${issue.issue}\n`;
        report += `- **File**: \`${issue.file}\`\n`;
        report += `- **Matches**: ${issue.matches}\n`;
        report += `- **Pattern**: \`${issue.pattern}\`\n\n`;
      }
    }

    report += `## Recommended Actions

### High Priority (${highSeverity} issues)
1. **Overflow Issues**: Implement horizontal scroll containers for wide content
2. **Touch Targets**: Ensure all interactive elements meet 44px minimum size
3. **Text Wrapping**: Fix nowrap text that may overflow on mobile

### Medium Priority (${mediumSeverity} issues)
1. **Text Sizes**: Implement responsive typography with clamp() functions
2. **Viewport Units**: Review and fix viewport width/height usage
3. **Fixed Positioning**: Optimize modals and popups for mobile

### Low Priority (${lowSeverity} issues)
1. **General Layout**: Review and optimize remaining layout issues
2. **Performance**: Optimize animations and transitions for mobile

## Implementation Plan

### Phase 1: Critical Fixes
- [ ] Add horizontal scroll to tables and wide content
- [ ] Fix text overflow issues
- [ ] Ensure minimum touch target sizes

### Phase 2: Layout Optimization
- [ ] Implement responsive typography
- [ ] Optimize modals for mobile screens
- [ ] Fix viewport unit issues

### Phase 3: Enhancement
- [ ] Add mobile-specific interactions
- [ ] Optimize performance for mobile devices
- [ ] Test across different screen sizes

## Testing Checklist

- [ ] Test on iPhone SE (375px width)
- [ ] Test on standard mobile (414px width)
- [ ] Test on tablet (768px width)
- [ ] Test landscape orientation
- [ ] Test with zoom up to 200%
- [ ] Verify touch targets are accessible
- [ ] Check horizontal scrolling is smooth
- [ ] Validate text remains readable

`;

    return report;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const totalIssues = this.issues.length;
    const highSeverity = this.issues.filter(i => i.severity === 'high').length;
    
    console.log('\n📊 Analysis Summary:');
    console.log(`   Total Issues: ${totalIssues}`);
    console.log(`   High Severity: ${highSeverity}`);
    console.log(`   Medium Severity: ${this.issues.filter(i => i.severity === 'medium').length}`);
    console.log(`   Low Severity: ${this.issues.filter(i => i.severity === 'low').length}`);
    
    if (highSeverity > 0) {
      console.log('\n⚠️  High severity issues found that need immediate attention!');
    }
    
    console.log('\n✨ Next steps:');
    console.log('   1. Review the generated report');
    console.log('   2. Implement responsive fixes CSS');
    console.log('   3. Update components with mobile-friendly classes');
    console.log('   4. Test on various mobile devices');
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new MobileResponsiveAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = MobileResponsiveAnalyzer;