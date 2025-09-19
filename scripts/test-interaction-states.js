#!/usr/bin/env node

/**
 * Interaction States Testing Script
 * Tests hover, disabled, selection, and loading states
 */

const fs = require('fs');
const path = require('path');

class InteractionStatesTester {
  constructor() {
    this.results = {
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      issues: [],
      recommendations: []
    };
    
    this.stateClasses = {
      hover: [
        'hover-subtle', 'hover-normal', 'hover-prominent', 'hover-lift', 
        'hover-slide', 'btn-hover-enhanced', 'card-hover-interactive', 
        'nav-item-hover', 'badge-hover', 'icon-btn-hover'
      ],
      disabled: [
        'disabled', 'disabled-enhanced', 'btn-disabled', 'input-disabled', 
        'card-disabled', 'interactive-disabled'
      ],
      selection: [
        'selected', 'selected-with-check', 'multi-selected', 'card-selected', 
        'nav-selected', 'tab-selected', 'badge-selected', 'interactive-selected'
      ],
      loading: [
        'loading', 'btn-loading', 'card-loading', 'input-loading', 'interactive-loading'
      ]
    };
  }

  async runTests() {
    console.log('🧪 Testing interaction states implementation...\n');
    
    await this.testCSSImplementation();
    await this.testComponentIntegration();
    await this.testAccessibilityCompliance();
    await this.testResponsiveStates();
    
    this.generateTestReport();
  }

  async testCSSImplementation() {
    console.log('🎨 Testing CSS implementation...');
    
    try {
      const cssPath = path.join(process.cwd(), 'src', 'styles', 'interaction-states.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Test hover states
      this.testStateGroup('hover', this.stateClasses.hover, cssContent);
      
      // Test disabled states
      this.testStateGroup('disabled', this.stateClasses.disabled, cssContent);
      
      // Test selection states
      this.testStateGroup('selection', this.stateClasses.selection, cssContent);
      
      // Test loading states
      this.testStateGroup('loading', this.stateClasses.loading, cssContent);
      
      // Test animations
      this.testAnimations(cssContent);
      
      // Test media queries
      this.testMediaQueries(cssContent);
      
    } catch (error) {
      this.results.testsFailed++;
      this.results.issues.push({
        type: 'CSS Test Error',
        message: `Could not test CSS implementation: ${error.message}`,
        severity: 'high'
      });
      console.log('❌ CSS implementation test failed');
    }
  }

  testStateGroup(groupName, classes, cssContent) {
    console.log(`  📋 Testing ${groupName} states...`);
    
    let groupPassed = 0;
    let groupTotal = classes.length;
    
    classes.forEach(className => {
      this.results.testsRun++;
      
      if (cssContent.includes(`.${className}`)) {
        this.results.testsPassed++;
        groupPassed++;
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing CSS Class',
          message: `CSS class .${className} not found`,
          severity: 'medium',
          group: groupName
        });
      }
    });
    
    const successRate = (groupPassed / groupTotal * 100).toFixed(1);
    const statusIcon = successRate >= 90 ? '✅' : successRate >= 70 ? '⚠️' : '❌';
    console.log(`    ${statusIcon} ${groupName}: ${groupPassed}/${groupTotal} classes (${successRate}%)`);
  }

  testAnimations(cssContent) {
    console.log('  🎬 Testing animations...');
    
    const requiredAnimations = [
      'loading-shimmer',
      'loading-spin'
    ];
    
    let animationsPassed = 0;
    
    requiredAnimations.forEach(animation => {
      this.results.testsRun++;
      
      if (cssContent.includes(`@keyframes ${animation}`)) {
        this.results.testsPassed++;
        animationsPassed++;
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Animation',
          message: `Animation @keyframes ${animation} not found`,
          severity: 'medium'
        });
      }
    });
    
    const successRate = (animationsPassed / requiredAnimations.length * 100).toFixed(1);
    const statusIcon = successRate >= 90 ? '✅' : '⚠️';
    console.log(`    ${statusIcon} Animations: ${animationsPassed}/${requiredAnimations.length} (${successRate}%)`);
  }

  testMediaQueries(cssContent) {
    console.log('  📱 Testing media queries...');
    
    const requiredMediaQueries = [
      '@media (prefers-contrast: high)',
      '@media (prefers-reduced-motion: reduce)',
      '@media (hover: none) and (pointer: coarse)'
    ];
    
    let queriesPassed = 0;
    
    requiredMediaQueries.forEach(query => {
      this.results.testsRun++;
      
      if (cssContent.includes(query)) {
        this.results.testsPassed++;
        queriesPassed++;
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Media Query',
          message: `Media query "${query}" not found`,
          severity: 'medium'
        });
      }
    });
    
    const successRate = (queriesPassed / requiredMediaQueries.length * 100).toFixed(1);
    const statusIcon = successRate >= 90 ? '✅' : '⚠️';
    console.log(`    ${statusIcon} Media Queries: ${queriesPassed}/${requiredMediaQueries.length} (${successRate}%)`);
  }

  async testComponentIntegration() {
    console.log('\n🧩 Testing component integration...');
    
    const componentsToTest = [
      { path: 'src/components/ui/button.tsx', name: 'Button' },
      { path: 'src/components/ui/card.tsx', name: 'Card' },
      { path: 'src/components/ui/badge.tsx', name: 'Badge' }
    ];
    
    for (const component of componentsToTest) {
      await this.testComponentStates(component);
    }
  }

  async testComponentStates(component) {
    try {
      const fullPath = path.join(process.cwd(), component.path);
      if (!fs.existsSync(fullPath)) {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Component',
          message: `Component file not found: ${component.path}`,
          severity: 'high'
        });
        return;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`  📄 Testing ${component.name}...`);
      
      // Test state props
      const stateProps = ['disabled', 'selected', 'loading'];
      let propsPassed = 0;
      
      stateProps.forEach(prop => {
        this.results.testsRun++;
        
        if (content.includes(`${prop}?:`) || content.includes(`${prop}:`)) {
          this.results.testsPassed++;
          propsPassed++;
        } else {
          this.results.testsFailed++;
          this.results.issues.push({
            type: 'Missing State Prop',
            message: `${component.name} missing ${prop} prop`,
            severity: 'medium',
            component: component.name
          });
        }
      });
      
      // Test accessibility attributes
      const accessibilityAttrs = ['aria-disabled', 'aria-selected', 'aria-busy'];
      let attrsPassed = 0;
      
      accessibilityAttrs.forEach(attr => {
        this.results.testsRun++;
        
        if (content.includes(attr)) {
          this.results.testsPassed++;
          attrsPassed++;
        } else {
          this.results.testsFailed++;
          this.results.issues.push({
            type: 'Missing Accessibility Attribute',
            message: `${component.name} missing ${attr} attribute`,
            severity: 'medium',
            component: component.name
          });
        }
      });
      
      // Test state classes
      let classesPassed = 0;
      const expectedClasses = ['interactive-element', 'disabled-enhanced', 'selected'];
      
      expectedClasses.forEach(cls => {
        this.results.testsRun++;
        
        if (content.includes(cls)) {
          this.results.testsPassed++;
          classesPassed++;
        } else {
          this.results.testsFailed++;
          this.results.issues.push({
            type: 'Missing State Class',
            message: `${component.name} missing ${cls} class usage`,
            severity: 'low',
            component: component.name
          });
        }
      });
      
      const totalTests = stateProps.length + accessibilityAttrs.length + expectedClasses.length;
      const totalPassed = propsPassed + attrsPassed + classesPassed;
      const successRate = (totalPassed / totalTests * 100).toFixed(1);
      const statusIcon = successRate >= 80 ? '✅' : successRate >= 60 ? '⚠️' : '❌';
      
      console.log(`    ${statusIcon} ${component.name}: ${totalPassed}/${totalTests} tests passed (${successRate}%)`);
      
    } catch (error) {
      this.results.testsFailed++;
      this.results.issues.push({
        type: 'Component Test Error',
        message: `Could not test ${component.name}: ${error.message}`,
        severity: 'high'
      });
      console.log(`    ❌ ${component.name} test failed`);
    }
  }

  async testAccessibilityCompliance() {
    console.log('\n♿ Testing accessibility compliance...');
    
    try {
      const cssPath = path.join(process.cwd(), 'src', 'styles', 'interaction-states.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Test focus-visible support
      this.results.testsRun++;
      if (cssContent.includes(':focus-visible')) {
        this.results.testsPassed++;
        console.log('  ✅ Focus-visible support implemented');
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Accessibility Feature',
          message: 'Focus-visible support not implemented',
          severity: 'high'
        });
        console.log('  ❌ Focus-visible support missing');
      }
      
      // Test high contrast mode
      this.results.testsRun++;
      if (cssContent.includes('@media (prefers-contrast: high)')) {
        this.results.testsPassed++;
        console.log('  ✅ High contrast mode support implemented');
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Accessibility Feature',
          message: 'High contrast mode support not implemented',
          severity: 'medium'
        });
        console.log('  ⚠️  High contrast mode support missing');
      }
      
      // Test reduced motion
      this.results.testsRun++;
      if (cssContent.includes('@media (prefers-reduced-motion: reduce)')) {
        this.results.testsPassed++;
        console.log('  ✅ Reduced motion support implemented');
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Accessibility Feature',
          message: 'Reduced motion support not implemented',
          severity: 'medium'
        });
        console.log('  ⚠️  Reduced motion support missing');
      }
      
    } catch (error) {
      this.results.testsFailed++;
      this.results.issues.push({
        type: 'Accessibility Test Error',
        message: `Could not test accessibility compliance: ${error.message}`,
        severity: 'high'
      });
      console.log('  ❌ Accessibility compliance test failed');
    }
  }

  async testResponsiveStates() {
    console.log('\n📱 Testing responsive states...');
    
    try {
      const cssPath = path.join(process.cwd(), 'src', 'styles', 'interaction-states.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Test touch device optimizations
      this.results.testsRun++;
      if (cssContent.includes('@media (hover: none) and (pointer: coarse)')) {
        this.results.testsPassed++;
        console.log('  ✅ Touch device optimizations implemented');
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Responsive Feature',
          message: 'Touch device optimizations not implemented',
          severity: 'medium'
        });
        console.log('  ⚠️  Touch device optimizations missing');
      }
      
      // Test mobile-specific states
      this.results.testsRun++;
      if (cssContent.includes('active:') && cssContent.includes('transform: scale(0.95)')) {
        this.results.testsPassed++;
        console.log('  ✅ Mobile active states implemented');
      } else {
        this.results.testsFailed++;
        this.results.issues.push({
          type: 'Missing Responsive Feature',
          message: 'Mobile active states not properly implemented',
          severity: 'low'
        });
        console.log('  ⚠️  Mobile active states could be improved');
      }
      
    } catch (error) {
      this.results.testsFailed++;
      this.results.issues.push({
        type: 'Responsive Test Error',
        message: `Could not test responsive states: ${error.message}`,
        severity: 'high'
      });
      console.log('  ❌ Responsive states test failed');
    }
  }

  generateTestReport() {
    console.log('\n📊 INTERACTION STATES TEST REPORT');
    console.log('==================================\n');
    
    const successRate = this.results.testsRun > 0 
      ? (this.results.testsPassed / this.results.testsRun * 100).toFixed(1) 
      : 0;
    
    console.log(`🧪 Tests Run: ${this.results.testsRun}`);
    console.log(`✅ Tests Passed: ${this.results.testsPassed}`);
    console.log(`❌ Tests Failed: ${this.results.testsFailed}`);
    console.log(`🎯 Success Rate: ${successRate}%\n`);
    
    // Group issues by type
    const issuesByType = {};
    this.results.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    // Show issues by type
    Object.entries(issuesByType).forEach(([type, issues]) => {
      console.log(`${this.getSeverityIcon(issues[0].severity)} ${type.toUpperCase()}`);
      console.log('='.repeat(type.length + 2));
      issues.forEach(issue => {
        console.log(`  • ${issue.message}`);
        if (issue.component) console.log(`    Component: ${issue.component}`);
        if (issue.group) console.log(`    Group: ${issue.group}`);
      });
      console.log('');
    });
    
    // Generate recommendations
    this.generateRecommendations();
    
    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS');
      console.log('==================\n');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title}`);
        console.log(`   ${rec.description}`);
        if (rec.action) console.log(`   Action: ${rec.action}`);
        console.log('');
      });
    }
    
    // Overall assessment
    console.log('🎯 OVERALL ASSESSMENT');
    console.log('=====================\n');
    
    if (successRate >= 95) {
      console.log('🟢 EXCELLENT: Interaction states are comprehensively implemented.');
    } else if (successRate >= 85) {
      console.log('🟡 VERY GOOD: Interaction states are well implemented with minor gaps.');
    } else if (successRate >= 70) {
      console.log('🟠 GOOD: Interaction states are mostly implemented but need improvements.');
    } else if (successRate >= 50) {
      console.log('🔴 FAIR: Interaction states need significant work.');
    } else {
      console.log('🔴 POOR: Interaction states implementation is incomplete.');
    }
    
    this.saveTestReport();
  }

  getSeverityIcon(severity) {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    // High severity issues
    const highSeverityIssues = this.results.issues.filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      recommendations.push({
        title: 'Fix Critical Issues',
        description: `Address ${highSeverityIssues.length} high-severity issues immediately.`,
        action: 'Review and fix all high-severity issues listed above'
      });
    }
    
    // Missing state classes
    const missingClasses = this.results.issues.filter(i => i.type === 'Missing CSS Class');
    if (missingClasses.length > 0) {
      recommendations.push({
        title: 'Complete CSS Implementation',
        description: `Add ${missingClasses.length} missing CSS classes for complete state coverage.`,
        action: 'Implement all missing CSS classes in interaction-states.css'
      });
    }
    
    // Component integration
    const componentIssues = this.results.issues.filter(i => i.component);
    if (componentIssues.length > 0) {
      recommendations.push({
        title: 'Enhance Component Integration',
        description: 'Improve component integration with state management.',
        action: 'Add missing props, attributes, and classes to components'
      });
    }
    
    // Accessibility
    const accessibilityIssues = this.results.issues.filter(i => i.type.includes('Accessibility'));
    if (accessibilityIssues.length > 0) {
      recommendations.push({
        title: 'Improve Accessibility',
        description: 'Enhance accessibility features for better inclusive design.',
        action: 'Implement missing accessibility features and attributes'
      });
    }
    
    // Always recommend testing
    recommendations.push({
      title: 'Comprehensive Testing',
      description: 'Test all interaction states across different devices and scenarios.',
      action: 'Perform manual testing on desktop, tablet, and mobile devices'
    });
    
    this.results.recommendations = recommendations;
  }

  saveTestReport() {
    const reportPath = path.join(process.cwd(), 'audit-reports', 'interaction-states-test.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        testsRun: this.results.testsRun,
        testsPassed: this.results.testsPassed,
        testsFailed: this.results.testsFailed,
        successRate: this.results.testsRun > 0 
          ? (this.results.testsPassed / this.results.testsRun * 100).toFixed(1)
          : 0
      },
      issues: this.results.issues,
      recommendations: this.results.recommendations
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Detailed test report saved to: ${reportPath}\n`);
  }
}

// Run the tests
if (require.main === module) {
  const tester = new InteractionStatesTester();
  tester.runTests().catch(console.error);
}

module.exports = InteractionStatesTester;