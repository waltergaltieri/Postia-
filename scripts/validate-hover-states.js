#!/usr/bin/env node

/**
 * Hover States Validation Script
 * Validates that hover states are properly implemented and consistent
 */

const fs = require('fs');
const path = require('path');

class HoverStateValidator {
  constructor() {
    this.results = {
      validationsPassed: 0,
      validationsFailed: 0,
      warnings: [],
      errors: [],
      recommendations: []
    };
    
    this.requiredHoverClasses = [
      'hover-subtle',
      'hover-normal', 
      'hover-prominent',
      'hover-lift',
      'hover-slide',
      'nav-item-hover',
      'btn-hover-enhanced',
      'card-hover-interactive',
      'interactive-element'
    ];
    
    this.componentHoverRequirements = {
      'Button': ['interactive-element', 'btn-hover-enhanced'],
      'Card': ['hover-subtle', 'hover-normal', 'hover-prominent'],
      'Badge': ['badge-hover', 'interactive-element'],
      'navigation': ['nav-item-hover', 'interactive-element']
    };
  }

  async validateProject() {
    console.log('🔍 Validating hover states implementation...\n');
    
    // Check if interaction-states.css is imported
    await this.validateStyleImports();
    
    // Check component implementations
    await this.validateComponentHoverStates();
    
    // Check CSS consistency
    await this.validateCSSConsistency();
    
    // Check accessibility compliance
    await this.validateAccessibilityCompliance();
    
    this.generateValidationReport();
  }

  async validateStyleImports() {
    console.log('📋 Checking style imports...');
    
    try {
      const globalsPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf8');
      
      if (globalsContent.includes("@import '../styles/interaction-states.css'")) {
        this.results.validationsPassed++;
        console.log('✅ interaction-states.css is properly imported');
      } else {
        this.results.validationsFailed++;
        this.results.errors.push({
          type: 'Missing Import',
          message: 'interaction-states.css is not imported in globals.css',
          file: 'src/app/globals.css',
          severity: 'high'
        });
        console.log('❌ interaction-states.css is not imported');
      }
      
      // Check if the file exists
      const interactionStatesPath = path.join(process.cwd(), 'src', 'styles', 'interaction-states.css');
      if (fs.existsSync(interactionStatesPath)) {
        this.results.validationsPassed++;
        console.log('✅ interaction-states.css file exists');
      } else {
        this.results.validationsFailed++;
        this.results.errors.push({
          type: 'Missing File',
          message: 'interaction-states.css file does not exist',
          file: 'src/styles/interaction-states.css',
          severity: 'high'
        });
        console.log('❌ interaction-states.css file does not exist');
      }
      
    } catch (error) {
      this.results.validationsFailed++;
      this.results.errors.push({
        type: 'File Read Error',
        message: `Could not read globals.css: ${error.message}`,
        file: 'src/app/globals.css',
        severity: 'high'
      });
      console.log('❌ Could not validate style imports');
    }
  }

  async validateComponentHoverStates() {
    console.log('\n🎯 Validating component hover states...');
    
    const componentsToCheck = [
      'src/components/ui/button.tsx',
      'src/components/ui/card.tsx',
      'src/components/ui/badge.tsx',
      'src/components/navigation/navigation-sidebar.tsx'
    ];
    
    for (const componentPath of componentsToCheck) {
      await this.validateComponentFile(componentPath);
    }
  }

  async validateComponentFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        this.results.warnings.push({
          type: 'Missing Component',
          message: `Component file not found: ${filePath}`,
          file: filePath,
          severity: 'medium'
        });
        return;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const componentName = path.basename(filePath, '.tsx');
      
      console.log(`  📄 Checking ${componentName}...`);
      
      // Check for interactive-element class
      if (content.includes('interactive-element')) {
        this.results.validationsPassed++;
        console.log(`    ✅ ${componentName} has interactive-element class`);
      } else {
        this.results.warnings.push({
          type: 'Missing Interactive Class',
          message: `${componentName} should include 'interactive-element' class`,
          file: filePath,
          severity: 'medium'
        });
        console.log(`    ⚠️  ${componentName} missing interactive-element class`);
      }
      
      // Check for hover state classes
      const hoverClasses = this.requiredHoverClasses.filter(cls => content.includes(cls));
      if (hoverClasses.length > 0) {
        this.results.validationsPassed++;
        console.log(`    ✅ ${componentName} has hover classes: ${hoverClasses.join(', ')}`);
      } else {
        this.results.warnings.push({
          type: 'Missing Hover Classes',
          message: `${componentName} should include hover state classes`,
          file: filePath,
          severity: 'medium'
        });
        console.log(`    ⚠️  ${componentName} missing hover state classes`);
      }
      
      // Check for accessibility attributes
      const hasAriaDisabled = content.includes('aria-disabled');
      const hasFocusVisible = content.includes('focus-visible') || content.includes(':focus-visible');
      
      if (hasAriaDisabled && hasFocusVisible) {
        this.results.validationsPassed++;
        console.log(`    ✅ ${componentName} has accessibility attributes`);
      } else {
        this.results.warnings.push({
          type: 'Missing Accessibility',
          message: `${componentName} should include aria-disabled and focus-visible support`,
          file: filePath,
          severity: 'medium'
        });
        console.log(`    ⚠️  ${componentName} missing accessibility attributes`);
      }
      
    } catch (error) {
      this.results.validationsFailed++;
      this.results.errors.push({
        type: 'Component Validation Error',
        message: `Could not validate ${filePath}: ${error.message}`,
        file: filePath,
        severity: 'high'
      });
      console.log(`    ❌ Could not validate ${filePath}`);
    }
  }

  async validateCSSConsistency() {
    console.log('\n🎨 Validating CSS consistency...');
    
    try {
      const interactionStatesPath = path.join(process.cwd(), 'src', 'styles', 'interaction-states.css');
      if (!fs.existsSync(interactionStatesPath)) {
        console.log('❌ Cannot validate CSS consistency - interaction-states.css not found');
        return;
      }
      
      const content = fs.readFileSync(interactionStatesPath, 'utf8');
      
      // Check for required CSS custom properties
      const requiredProperties = [
        '--hover-scale-subtle',
        '--hover-scale-normal',
        '--hover-scale-prominent',
        '--transition-hover',
        '--transition-focus',
        '--transition-active'
      ];
      
      let propertiesFound = 0;
      requiredProperties.forEach(prop => {
        if (content.includes(prop)) {
          propertiesFound++;
        }
      });
      
      if (propertiesFound === requiredProperties.length) {
        this.results.validationsPassed++;
        console.log('✅ All required CSS custom properties are defined');
      } else {
        this.results.warnings.push({
          type: 'Missing CSS Properties',
          message: `Missing ${requiredProperties.length - propertiesFound} CSS custom properties`,
          file: 'src/styles/interaction-states.css',
          severity: 'medium'
        });
        console.log(`⚠️  Missing ${requiredProperties.length - propertiesFound} CSS custom properties`);
      }
      
      // Check for hover state classes
      let classesFound = 0;
      this.requiredHoverClasses.forEach(cls => {
        if (content.includes(`.${cls}`)) {
          classesFound++;
        }
      });
      
      if (classesFound === this.requiredHoverClasses.length) {
        this.results.validationsPassed++;
        console.log('✅ All required hover state classes are defined');
      } else {
        this.results.warnings.push({
          type: 'Missing Hover Classes',
          message: `Missing ${this.requiredHoverClasses.length - classesFound} hover state classes`,
          file: 'src/styles/interaction-states.css',
          severity: 'medium'
        });
        console.log(`⚠️  Missing ${this.requiredHoverClasses.length - classesFound} hover state classes`);
      }
      
    } catch (error) {
      this.results.validationsFailed++;
      this.results.errors.push({
        type: 'CSS Validation Error',
        message: `Could not validate CSS consistency: ${error.message}`,
        file: 'src/styles/interaction-states.css',
        severity: 'high'
      });
      console.log('❌ Could not validate CSS consistency');
    }
  }

  async validateAccessibilityCompliance() {
    console.log('\n♿ Validating accessibility compliance...');
    
    try {
      const interactionStatesPath = path.join(process.cwd(), 'src', 'styles', 'interaction-states.css');
      if (!fs.existsSync(interactionStatesPath)) {
        console.log('❌ Cannot validate accessibility - interaction-states.css not found');
        return;
      }
      
      const content = fs.readFileSync(interactionStatesPath, 'utf8');
      
      // Check for high contrast mode support
      if (content.includes('@media (prefers-contrast: high)')) {
        this.results.validationsPassed++;
        console.log('✅ High contrast mode support is implemented');
      } else {
        this.results.warnings.push({
          type: 'Missing Accessibility Feature',
          message: 'High contrast mode support is not implemented',
          file: 'src/styles/interaction-states.css',
          severity: 'medium'
        });
        console.log('⚠️  High contrast mode support is missing');
      }
      
      // Check for reduced motion support
      if (content.includes('@media (prefers-reduced-motion: reduce)')) {
        this.results.validationsPassed++;
        console.log('✅ Reduced motion support is implemented');
      } else {
        this.results.warnings.push({
          type: 'Missing Accessibility Feature',
          message: 'Reduced motion support is not implemented',
          file: 'src/styles/interaction-states.css',
          severity: 'medium'
        });
        console.log('⚠️  Reduced motion support is missing');
      }
      
      // Check for touch device optimizations
      if (content.includes('@media (hover: none) and (pointer: coarse)')) {
        this.results.validationsPassed++;
        console.log('✅ Touch device optimizations are implemented');
      } else {
        this.results.warnings.push({
          type: 'Missing Accessibility Feature',
          message: 'Touch device optimizations are not implemented',
          file: 'src/styles/interaction-states.css',
          severity: 'medium'
        });
        console.log('⚠️  Touch device optimizations are missing');
      }
      
      // Check for focus-visible support
      if (content.includes(':focus-visible')) {
        this.results.validationsPassed++;
        console.log('✅ Focus-visible support is implemented');
      } else {
        this.results.warnings.push({
          type: 'Missing Accessibility Feature',
          message: 'Focus-visible support is not properly implemented',
          file: 'src/styles/interaction-states.css',
          severity: 'high'
        });
        console.log('❌ Focus-visible support is missing');
      }
      
    } catch (error) {
      this.results.validationsFailed++;
      this.results.errors.push({
        type: 'Accessibility Validation Error',
        message: `Could not validate accessibility compliance: ${error.message}`,
        file: 'src/styles/interaction-states.css',
        severity: 'high'
      });
      console.log('❌ Could not validate accessibility compliance');
    }
  }

  generateValidationReport() {
    console.log('\n📊 HOVER STATES VALIDATION REPORT');
    console.log('==================================\n');
    
    const totalValidations = this.results.validationsPassed + this.results.validationsFailed;
    const successRate = totalValidations > 0 ? (this.results.validationsPassed / totalValidations * 100).toFixed(1) : 0;
    
    console.log(`✅ Validations Passed: ${this.results.validationsPassed}`);
    console.log(`❌ Validations Failed: ${this.results.validationsFailed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`🎯 Success Rate: ${successRate}%\n`);
    
    // Show errors
    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS');
      console.log('=========\n');
      this.results.errors.forEach((error, index) => {
        const severityIcon = error.severity === 'high' ? '🔴' : '🟡';
        console.log(`${severityIcon} ${error.type}: ${error.message}`);
        console.log(`   File: ${error.file}\n`);
      });
    }
    
    // Show warnings
    if (this.results.warnings.length > 0) {
      console.log('⚠️  WARNINGS');
      console.log('============\n');
      this.results.warnings.forEach((warning, index) => {
        const severityIcon = warning.severity === 'high' ? '🔴' : warning.severity === 'medium' ? '🟡' : '🟢';
        console.log(`${severityIcon} ${warning.type}: ${warning.message}`);
        console.log(`   File: ${warning.file}\n`);
      });
    }
    
    // Generate recommendations
    this.generateRecommendations();
    
    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS');
      console.log('==================\n');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title}`);
        console.log(`   ${rec.description}`);
        if (rec.action) {
          console.log(`   Action: ${rec.action}`);
        }
        console.log('');
      });
    }
    
    // Overall assessment
    console.log('🎯 OVERALL ASSESSMENT');
    console.log('=====================\n');
    
    if (successRate >= 90) {
      console.log('🟢 EXCELLENT: Hover states are well implemented with minimal issues.');
    } else if (successRate >= 75) {
      console.log('🟡 GOOD: Hover states are mostly implemented but need some improvements.');
    } else if (successRate >= 50) {
      console.log('🟠 FAIR: Hover states need significant improvements.');
    } else {
      console.log('🔴 POOR: Hover states implementation needs major work.');
    }
    
    // Save detailed report
    this.saveValidationReport();
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.errors.length > 0) {
      recommendations.push({
        title: 'Fix Critical Errors',
        description: 'Address all high-severity errors before proceeding with other improvements.',
        action: 'Review and fix each error listed above'
      });
    }
    
    if (this.results.warnings.filter(w => w.type === 'Missing Interactive Class').length > 0) {
      recommendations.push({
        title: 'Add Interactive Element Classes',
        description: 'Ensure all interactive components include the "interactive-element" base class.',
        action: 'Add "interactive-element" class to button, card, and navigation components'
      });
    }
    
    if (this.results.warnings.filter(w => w.type === 'Missing Hover Classes').length > 0) {
      recommendations.push({
        title: 'Implement Hover State Classes',
        description: 'Add appropriate hover state classes to enhance user interaction feedback.',
        action: 'Apply hover-subtle, hover-normal, or hover-prominent classes as appropriate'
      });
    }
    
    if (this.results.warnings.filter(w => w.type === 'Missing Accessibility Feature').length > 0) {
      recommendations.push({
        title: 'Enhance Accessibility Support',
        description: 'Implement missing accessibility features for better inclusive design.',
        action: 'Add high contrast mode, reduced motion, and touch device support'
      });
    }
    
    recommendations.push({
      title: 'Test Across Devices',
      description: 'Validate hover states work correctly on desktop, tablet, and mobile devices.',
      action: 'Test hover effects on different screen sizes and input methods'
    });
    
    recommendations.push({
      title: 'Performance Optimization',
      description: 'Ensure hover animations are performant and do not cause layout shifts.',
      action: 'Use transform and opacity for animations, avoid changing layout properties'
    });
    
    this.results.recommendations = recommendations;
  }

  saveValidationReport() {
    const reportPath = path.join(process.cwd(), 'audit-reports', 'hover-states-validation.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        validationsPassed: this.results.validationsPassed,
        validationsFailed: this.results.validationsFailed,
        warningsCount: this.results.warnings.length,
        errorsCount: this.results.errors.length,
        successRate: this.results.validationsPassed + this.results.validationsFailed > 0 
          ? (this.results.validationsPassed / (this.results.validationsPassed + this.results.validationsFailed) * 100).toFixed(1)
          : 0
      },
      errors: this.results.errors,
      warnings: this.results.warnings,
      recommendations: this.results.recommendations
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Detailed validation report saved to: ${reportPath}\n`);
  }
}

// Run the validation
if (require.main === module) {
  const validator = new HoverStateValidator();
  validator.validateProject().catch(console.error);
}

module.exports = HoverStateValidator;