#!/usr/bin/env node

/**
 * Modal and Popup Responsive Validation Script
 * Tests and validates modal and popup responsive fixes
 */

const fs = require('fs');
const path = require('path');

class ModalResponsiveValidator {
  constructor() {
    this.testResults = [];
    this.srcPath = path.join(__dirname, '..', 'src');
  }

  /**
   * Run all modal responsive validation tests
   */
  async validate() {
    console.log('🪟 Validating modal and popup responsive fixes...\n');

    await this.validateModalResponsiveCSS();
    await this.validateResponsiveModalComponents();
    await this.validateDropdownComponents();
    await this.validateTooltipComponents();
    await this.validateMobileOptimizations();
    await this.validateTouchAccessibility();

    this.generateValidationReport();
  }

  /**
   * Validate modal responsive CSS
   */
  async validateModalResponsiveCSS() {
    console.log('📱 Validating modal responsive CSS...');

    const tests = [
      {
        name: 'Modal responsive CSS file exists',
        test: () => fs.existsSync(path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css')),
        critical: true
      },
      {
        name: 'Modal responsive CSS imported in globals.css',
        test: () => {
          const globalsPath = path.join(this.srcPath, 'app', 'globals.css');
          if (!fs.existsSync(globalsPath)) return false;
          const content = fs.readFileSync(globalsPath, 'utf8');
          return content.includes('modal-responsive-fixes.css');
        },
        critical: true
      },
      {
        name: 'Mobile modal classes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.modal-overlay-responsive') && 
                 content.includes('.modal-content-responsive') &&
                 content.includes('.modal-header-mobile');
        },
        critical: true
      },
      {
        name: 'Mobile dropdown classes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.dropdown-content-responsive') && 
                 content.includes('.dropdown-item-mobile');
        },
        critical: true
      },
      {
        name: 'Mobile tooltip classes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.tooltip-content-responsive') && 
                 content.includes('.tooltip-mobile');
        },
        critical: true
      },
      {
        name: 'Safe area insets handled',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('env(safe-area-inset-top)') && 
                 content.includes('env(safe-area-inset-bottom)');
        },
        critical: true
      }
    ];

    await this.runTests(tests, 'Modal Responsive CSS');
  }

  /**
   * Validate responsive modal components
   */
  async validateResponsiveModalComponents() {
    console.log('🔧 Validating responsive modal components...');

    const tests = [
      {
        name: 'Responsive modal component exists',
        test: () => fs.existsSync(path.join(this.srcPath, 'components', 'ui', 'responsive-modal.tsx')),
        critical: true
      },
      {
        name: 'Responsive modal exports correct components',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-modal.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('ResponsiveModal') && 
                 content.includes('ResponsiveModalContent') &&
                 content.includes('useResponsiveModal');
        },
        critical: true
      },
      {
        name: 'Mobile detection hook implemented',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-modal.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('useIsMobile') && 
                 content.includes('window.innerWidth < 768');
        },
        critical: true
      },
      {
        name: 'Mobile-specific animations implemented',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-modal.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('getModalVariants') && 
                 content.includes('y: "100%"');
        },
        critical: true
      },
      {
        name: 'Responsive confirmation modal available',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-modal.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('ResponsiveConfirmationModal');
        },
        critical: false
      }
    ];

    await this.runTests(tests, 'Responsive Modal Components');
  }

  /**
   * Validate dropdown components
   */
  async validateDropdownComponents() {
    console.log('📊 Validating responsive dropdown components...');

    const tests = [
      {
        name: 'Responsive dropdown component exists',
        test: () => fs.existsSync(path.join(this.srcPath, 'components', 'ui', 'responsive-dropdown.tsx')),
        critical: true
      },
      {
        name: 'Responsive dropdown exports correct components',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-dropdown.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('ResponsiveDropdownMenu') && 
                 content.includes('ResponsiveDropdownMenuContent') &&
                 content.includes('useResponsiveDropdown');
        },
        critical: true
      },
      {
        name: 'Mobile dropdown animations implemented',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-dropdown.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('getDropdownVariants') && 
                 content.includes('mobile-dropdown');
        },
        critical: true
      },
      {
        name: 'Mobile dropdown handle implemented',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-dropdown.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('dropdown-handle-mobile');
        },
        critical: false
      }
    ];

    await this.runTests(tests, 'Responsive Dropdown Components');
  }

  /**
   * Validate tooltip components
   */
  async validateTooltipComponents() {
    console.log('💬 Validating responsive tooltip components...');

    const tests = [
      {
        name: 'Responsive tooltip component exists',
        test: () => fs.existsSync(path.join(this.srcPath, 'components', 'ui', 'responsive-tooltip.tsx')),
        critical: true
      },
      {
        name: 'Responsive tooltip exports correct components',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-tooltip.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('ResponsiveTooltip') && 
                 content.includes('QuickTooltip') &&
                 content.includes('RichTooltip');
        },
        critical: true
      },
      {
        name: 'Mobile tooltip hiding option available',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-tooltip.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('hideOnMobile');
        },
        critical: true
      },
      {
        name: 'Mobile tooltip positioning implemented',
        test: () => {
          const componentPath = path.join(this.srcPath, 'components', 'ui', 'responsive-tooltip.tsx');
          if (!fs.existsSync(componentPath)) return false;
          const content = fs.readFileSync(componentPath, 'utf8');
          return content.includes('mobilePosition') && 
                 content.includes('fixed-bottom');
        },
        critical: false
      }
    ];

    await this.runTests(tests, 'Responsive Tooltip Components');
  }

  /**
   * Validate mobile optimizations
   */
  async validateMobileOptimizations() {
    console.log('📱 Validating mobile optimizations...');

    const tests = [
      {
        name: 'Mobile modal fullscreen option available',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('modal-fullscreen-mobile');
        },
        critical: true
      },
      {
        name: 'Mobile modal slide-up animation implemented',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('border-radius: 1rem 1rem 0 0');
        },
        critical: true
      },
      {
        name: 'Mobile dropdown bottom positioning implemented',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('position: fixed') && 
                 content.includes('bottom: 0');
        },
        critical: true
      },
      {
        name: 'Backdrop blur implemented',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('backdrop-filter: blur') || 
                 content.includes('-webkit-backdrop-filter: blur');
        },
        critical: false
      }
    ];

    await this.runTests(tests, 'Mobile Optimizations');
  }

  /**
   * Validate touch accessibility
   */
  async validateTouchAccessibility() {
    console.log('👆 Validating touch accessibility...');

    const tests = [
      {
        name: 'Touch-friendly button sizes defined',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('min-height: 44px') || 
                 content.includes('min-height: 48px');
        },
        critical: true
      },
      {
        name: 'Touch interactive class available',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('.touch-interactive');
        },
        critical: true
      },
      {
        name: 'Enhanced focus states for mobile',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('outline: 3px solid') && 
                 content.includes('@media (max-width: 768px)');
        },
        critical: true
      },
      {
        name: 'Reduced motion support implemented',
        test: () => {
          const cssPath = path.join(this.srcPath, 'styles', 'modal-responsive-fixes.css');
          if (!fs.existsSync(cssPath)) return false;
          const content = fs.readFileSync(cssPath, 'utf8');
          return content.includes('@media (prefers-reduced-motion: reduce)');
        },
        critical: false
      }
    ];

    await this.runTests(tests, 'Touch Accessibility');
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
    console.log('\n📋 Generating Modal Responsive Validation Report...\n');

    const reportPath = path.join(__dirname, '..', 'audit-reports', 'modal-responsive-validation.md');
    
    const timestamp = new Date().toISOString();
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = this.testResults.filter(t => !t.passed).length;
    const criticalFailures = this.testResults.filter(t => !t.passed && t.critical).length;

    let report = `# Modal and Popup Responsive Validation Report

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

    report += `## Mobile Testing Checklist

### 📱 Modal Testing
- [ ] Modals slide up from bottom on mobile
- [ ] Modals use full width on mobile
- [ ] Close buttons are touch-friendly (44px minimum)
- [ ] Safe area insets are respected
- [ ] Backdrop blur works on mobile browsers
- [ ] Fullscreen option works on small screens

### 📊 Dropdown Testing  
- [ ] Dropdowns appear at bottom on mobile
- [ ] Dropdown items are touch-friendly
- [ ] Mobile handle appears for better UX
- [ ] Scrolling works smoothly in long dropdowns
- [ ] Keyboard navigation works

### 💬 Tooltip Testing
- [ ] Tooltips can be hidden on mobile
- [ ] Rich tooltips position correctly
- [ ] Touch delay is removed on mobile
- [ ] Fixed bottom positioning works
- [ ] Content wraps properly

### 👆 Touch Accessibility
- [ ] All interactive elements meet 44px minimum
- [ ] Focus states are visible on mobile
- [ ] Tap targets don't overlap
- [ ] Gestures work as expected
- [ ] Screen reader compatibility

### 🎨 Visual Testing
- [ ] Animations are smooth on mobile
- [ ] No layout shifts during transitions
- [ ] Content doesn't overflow
- [ ] Colors have sufficient contrast
- [ ] Typography scales appropriately

## Implementation Examples

### Using Responsive Modal
\`\`\`tsx
import { ResponsiveModal, ResponsiveModalContent } from '@/components/ui/responsive-modal';

<ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
  <ResponsiveModalContent size="md" fullscreenOnMobile>
    {/* Modal content */}
  </ResponsiveModalContent>
</ResponsiveModal>
\`\`\`

### Using Responsive Dropdown
\`\`\`tsx
import { ResponsiveDropdownMenu, ResponsiveDropdownMenuContent } from '@/components/ui/responsive-dropdown';

<ResponsiveDropdownMenu>
  <ResponsiveDropdownMenuTrigger>Open</ResponsiveDropdownMenuTrigger>
  <ResponsiveDropdownMenuContent>
    {/* Dropdown items */}
  </ResponsiveDropdownMenuContent>
</ResponsiveDropdownMenu>
\`\`\`

### Using Responsive Tooltip
\`\`\`tsx
import { QuickTooltip } from '@/components/ui/responsive-tooltip';

<QuickTooltip text="Help text" hideOnMobile>
  <Button>Hover me</Button>
</QuickTooltip>
\`\`\`

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
    
    console.log('\n📊 Modal Responsive Validation Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (criticalFailures > 0) {
      console.log(`\n❌ ${criticalFailures} critical failures need immediate attention!`);
    } else {
      console.log('\n✅ All critical tests passed!');
    }
    
    console.log('\n🎯 Ready for modal and popup testing on mobile devices');
  }
}

// Run the validator
if (require.main === module) {
  const validator = new ModalResponsiveValidator();
  validator.validate().catch(console.error);
}

module.exports = ModalResponsiveValidator;