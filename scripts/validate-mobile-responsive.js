#!/usr/bin/env node

/**
 * Mobile Responsive Validation Script
 * Tests and validates mobile responsive fixes
 */

const fs = require('fs');
const path = require('path');

class MobileResponsiveValidator {
  constructor() {
    this.testResults = [];
    this.srcPath = path.join(__dirname, '..', 'src');
  }

  /**
   * Run all validation tests
   */
  async validate() {
    console.log('🧪 Validating mobile responsive fixes...\n');

    await this.validateResponsiveCSS();
    await this.validateComponentUpdates();
    await this.validateHorizontalScrollComponents();
    await this.validateTouchTargets();
    await this.validateTextScaling();

    this.generateValidationReport();
  }

  /**
   * Validate responsive CSS is properly imported and structured
   */
  async validateResponsiveCSS() {
    console.log('📱 Validating responsive CSS...');

    const tests = [
      {
        name: 'Responsive CSS file exists',
        test: () => fs.existsSync(path.join(this.srcPath, 'styles', 'responsive-fixes.css')),
        critical: true
      },
      {
        name: 'Responsive CSS imported in globals.css',
        test: () => {
          const globalsPath = path.join(this.srcPath, 'app', 'globals.css');
          if (!fs.existsSync(globalsPath)) return false;
          const content = fs.readFileSync(globalsPath, 'utf8');
          return content.includes('responsive-fixes.css');
        },
        critical: true
      },
      {
        name: 'Horizontal scroll classes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.horizontal-scroll') && 
                 content.includes('.table-scroll-wrapper') &&
                 content.includes('.card-grid-scroll');
        },
        critical: true
      },
      {
        name: 'Mobile modal classes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.mobile-modal-overlay') && 
                 content.includes('.mobile-modal-content');
        },
        critical: true
      },
      {
        name: 'Responsive text classes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.responsive-text-') && 
                 content.includes('clamp(');
        },
        critical: true
      },
      {
        name: 'Touch target classes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.touch-button') && 
                 content.includes('min-height: 48px');
        },
        critical: true
      }
    ];

    await this.runTests(tests, 'Responsive CSS');
  }

  /**
   * Validate component updates
   */
  async validateComponentUpdates() {
    console.log('🔧 Validating component updates...');

    const tests = [
      {
        name: 'Navigation sidebar has responsive classes',
        test: () => {
          const sidebarPath = path.join(this.srcPath, 'components', 'navigation', 'navigation-sidebar.tsx');
          if (!fs.existsSync(sidebarPath)) return false;
          const content = fs.readFileSync(sidebarPath, 'utf8');
          return content.includes('responsive-text-') || content.includes('touch-button');
        },
        critical: false
      },
      {
        name: 'Content card has responsive container',
        test: () => {
          const cardPath = path.join(this.srcPath, 'components', 'ui', 'content-card.tsx');
          if (!fs.existsSync(cardPath)) return false;
          const content = fs.readFileSync(cardPath, 'utf8');
          return content.includes('responsive-container');
        },
        critical: false
      },
      {
        name: 'Optimized image has responsive class',
        test: () => {
          const imagePath = path.join(this.srcPath, 'components', 'ui', 'optimized-image.tsx');
          if (!fs.existsSync(imagePath)) return false;
          const content = fs.readFileSync(imagePath, 'utf8');
          return content.includes('responsive-image');
        },
        critical: false
      }
    ];

    await this.runTests(tests, 'Component Updates');
  }

  /**
   * Validate horizontal scroll components
   */
  async validateHorizontalScrollComponents() {
    console.log('📊 Validating horizontal scroll components...');

    const tests = [
      {
        name: 'Horizontal scroll component exists',
        test: () => fs.existsSync(path.join(this.srcPath, 'components', 'ui', 'horizontal-scroll.tsx')),
        critical: true
      },
      {
        name: 'Horizontal scroll component exports correct functions',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'horizontal-scroll.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('HorizontalScrollWrapper') && 
                 content.includes('CardGridScroll') &&
                 content.includes('HorizontalScroll');
        },
        critical: true
      },
      {
        name: 'Horizontal scroll component uses proper CSS classes',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'horizontal-scroll.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('table-scroll-wrapper') && 
                 content.includes('card-grid-scroll') &&
                 content.includes('horizontal-scroll');
        },
        critical: true
      }
    ];

    await this.runTests(tests, 'Horizontal Scroll Components');
  }

  /**
   * Validate touch targets
   */
  async validateTouchTargets() {
    console.log('👆 Validating touch targets...');

    const tests = [
      {
        name: 'Touch button classes available in CSS',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.touch-button') && 
                 content.includes('min-height: 48px') &&
                 content.includes('min-width: 48px');
        },
        critical: true
      },
      {
        name: 'Touch input classes available',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.touch-input') && 
                 content.includes('font-size: 16px');
        },
        critical: true
      },
      {
        name: 'Mobile tap target classes available',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.mobile-tap-target');
        },
        critical: true
      }
    ];

    await this.runTests(tests, 'Touch Targets');
  }

  /**
   * Validate text scaling
   */
  async validateTextScaling() {
    console.log('📝 Validating text scaling...');

    const tests = [
      {
        name: 'Responsive text classes use clamp()',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('clamp(') && 
                 content.includes('responsive-text-base') &&
                 content.includes('responsive-text-sm');
        },
        critical: true
      },
      {
        name: 'Text scaling prevents zoom on iOS',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('font-size: 16px') && 
                 content.includes('mobile-form');
        },
        critical: true
      }
    ];

    await this.runTests(tests, 'Text Scaling');
  }

  /**
   * Run a set of tests
   */
  async runTests(tests, category) {
    for (const test of tests) {
      try {
        const result = test.test();
        const status = result ? 'PASS' : 'FAIL';
        const icon = result ? '✅' : (test.critical ? '❌' : '⚠️');
        
        console.log(`   ${icon} ${test.name}: ${status}`);
        
        this.testResults.push({
          category,
          name: test.name,
          status,
          critical: test.critical,
          passed: result
        });
      } catch (error) {
        console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
        this.testResults.push({
          category,
          name: test.name,
          status: 'ERROR',
          critical: test.critical,
          passed: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Generate validation report
   */
  generateValidationReport() {
    console.log('\n📋 Generating Validation Report...\n');

    const reportPath = path.join(__dirname, '..', 'audit-reports', 'mobile-responsive-validation.md');
    
    const timestamp = new Date().toISOString();
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = this.testResults.filter(t => !t.passed).length;
    const criticalFailures = this.testResults.filter(t => !t.passed && t.critical).length;

    let report = `# Mobile Responsive Validation Report

Generated: ${timestamp}

## Summary

- **Total Tests**: ${totalTests}
- **Passed**: ${passedTests}
- **Failed**: ${failedTests}
- **Critical Failures**: ${criticalFailures}
- **Success Rate**: ${Math.round((passedTests / totalTests) * 100)}%

## Test Results by Category

`;

    const categories = [...new Set(this.testResults.map(t => t.category))];
    
    for (const category of categories) {
      const categoryTests = this.testResults.filter(t => t.category === category);
      const categoryPassed = categoryTests.filter(t => t.passed).length;
      
      report += `### ${category} (${categoryPassed}/${categoryTests.length} passed)\n\n`;
      
      for (const test of categoryTests) {
        const icon = test.passed ? '✅' : (test.critical ? '❌' : '⚠️');
        report += `${icon} **${test.name}**: ${test.status}\n`;
        if (test.error) {
          report += `   Error: ${test.error}\n`;
        }
        report += '\n';
      }
    }

    if (criticalFailures > 0) {
      report += `## ⚠️ Critical Issues

The following critical tests failed and need immediate attention:

`;
      const criticalFails = this.testResults.filter(t => !t.passed && t.critical);
      for (const test of criticalFails) {
        report += `- **${test.name}** in ${test.category}\n`;
        if (test.error) {
          report += `  Error: ${test.error}\n`;
        }
      }
      report += '\n';
    }

    report += `## Next Steps

`;

    if (criticalFailures > 0) {
      report += `### 🚨 Immediate Actions Required
1. Fix critical failures listed above
2. Re-run validation after fixes
3. Test on actual mobile devices

`;
    }

    report += `### 📱 Mobile Testing Checklist
- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPhone 12 (390px width)
- [ ] Test on Android (360px width)
- [ ] Test on iPad (768px width)
- [ ] Test landscape orientation
- [ ] Test with 200% zoom
- [ ] Verify horizontal scrolling works
- [ ] Check touch targets are accessible
- [ ] Validate text remains readable
- [ ] Test form inputs don't trigger zoom

### 🔧 Implementation Verification
- [ ] All CSS classes are properly defined
- [ ] Components use responsive classes
- [ ] Horizontal scroll wrappers work correctly
- [ ] Mobile modals display properly
- [ ] Touch targets meet accessibility standards

### 🧪 Automated Testing
- [ ] Run Lighthouse mobile audit
- [ ] Test with screen readers on mobile
- [ ] Validate WCAG 2.1 AA compliance
- [ ] Check performance on mobile devices

`;

    fs.writeFileSync(reportPath, report);
    console.log(`✅ Report generated: ${reportPath}`);
    
    this.printSummary();
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const criticalFailures = this.testResults.filter(t => !t.passed && t.critical).length;
    
    console.log('\n📊 Validation Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (criticalFailures > 0) {
      console.log(`\n❌ ${criticalFailures} critical failures need immediate attention!`);
    } else {
      console.log('\n✅ All critical tests passed!');
    }
    
    console.log('\n🎯 Ready for mobile testing on actual devices');
  }
}

// Run the validator
if (require.main === module) {
  const validator = new MobileResponsiveValidator();
  validator.validate().catch(console.error);
}

module.exports = MobileResponsiveValidator;