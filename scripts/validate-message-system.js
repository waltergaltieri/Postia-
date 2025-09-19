#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Message System Validation Script
 * Validates the implementation of the unified message and notification system
 */

class MessageSystemValidator {
  constructor() {
    this.results = {
      notificationSystemImplemented: false,
      messageSystemCSSIncluded: false,
      toastSystemUpdated: false,
      alertSystemUpdated: false,
      colorStandardization: 0,
      positioningConsistency: 0,
      accessibilityCompliance: 0,
      totalMessagesAnalyzed: 0,
      files: []
    };
    
    this.standardColors = [
      'success', 'error', 'warning', 'info',
      'bg-success-', 'bg-error-', 'bg-warning-', 'bg-info-',
      'text-success-', 'text-error-', 'text-warning-', 'text-info-',
      'border-success-', 'border-error-', 'border-warning-', 'border-info-'
    ];
    
    this.standardPositions = [
      'top-right', 'top-left', 'bottom-right', 'bottom-left', 
      'top-center', 'bottom-center'
    ];
  }

  validate() {
    console.log('🔍 Validating message system implementation...\n');
    
    // Check if notification system component exists
    this.validateNotificationSystem();
    
    // Check if message system CSS is included
    this.validateMessageSystemCSS();
    
    // Validate existing toast and alert systems
    this.validateExistingSystems();
    
    // Analyze message usage patterns
    this.analyzeMessageUsage();
    
    // Generate validation report
    this.generateReport();
  }

  validateNotificationSystem() {
    const notificationSystemPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'notification-system.tsx');
    
    if (fs.existsSync(notificationSystemPath)) {
      this.results.notificationSystemImplemented = true;
      console.log('✅ Notification system component created');
      
      const content = fs.readFileSync(notificationSystemPath, 'utf8');
      
      // Check for key features
      const features = [
        { name: 'Notification types', pattern: /NotificationType.*=.*"success".*"error".*"warning".*"info"/s },
        { name: 'Position system', pattern: /NotificationPosition.*=.*"top-right".*"bottom-left"/s },
        { name: 'Size variants', pattern: /NotificationSize.*=.*"sm".*"md".*"lg"/s },
        { name: 'Animation system', pattern: /notificationVariants.*initial.*animate.*exit/s },
        { name: 'Context provider', pattern: /NotificationProvider.*NotificationContext/s },
        { name: 'Hooks', pattern: /useNotifications.*useNotify/s }
      ];
      
      features.forEach(feature => {
        if (feature.pattern.test(content)) {
          console.log(`  ✅ ${feature.name} implemented`);
        } else {
          console.log(`  ⚠️  ${feature.name} missing or incomplete`);
        }
      });
    } else {
      console.log('❌ Notification system component not found');
    }
  }

  validateMessageSystemCSS() {
    const messageSystemCSSPath = path.join(__dirname, '..', 'src', 'styles', 'message-system.css');
    const globalCSSPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
    
    if (fs.existsSync(messageSystemCSSPath)) {
      console.log('✅ Message system CSS created');
      
      const content = fs.readFileSync(messageSystemCSSPath, 'utf8');
      
      // Check for key CSS features
      const cssFeatures = [
        { name: 'Color variables', pattern: /--message-success-bg.*--message-error-bg/s },
        { name: 'Message base styles', pattern: /\.message-base.*display.*flex/s },
        { name: 'Type variants', pattern: /\.message-success.*\.message-error.*\.message-warning/s },
        { name: 'Toast positioning', pattern: /\.toast-container.*position.*fixed/s },
        { name: 'Dark mode support', pattern: /@media.*prefers-color-scheme.*dark/s },
        { name: 'Accessibility features', pattern: /\.message-sr-only.*@media.*prefers-contrast/s },
        { name: 'Responsive design', pattern: /@media.*max-width.*768px/s }
      ];
      
      cssFeatures.forEach(feature => {
        if (feature.pattern.test(content)) {
          console.log(`  ✅ ${feature.name} implemented`);
        } else {
          console.log(`  ⚠️  ${feature.name} missing`);
        }
      });
    } else {
      console.log('❌ Message system CSS not found');
    }
    
    // Check if CSS is included in globals
    if (fs.existsSync(globalCSSPath)) {
      const globalContent = fs.readFileSync(globalCSSPath, 'utf8');
      if (globalContent.includes('message-system.css')) {
        this.results.messageSystemCSSIncluded = true;
        console.log('✅ Message system CSS included in globals');
      } else {
        console.log('⚠️  Message system CSS not included in globals.css');
      }
    }
  }

  validateExistingSystems() {
    console.log('\n📊 Validating existing message systems...');
    
    // Check toast system
    const toastPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'toast.tsx');
    if (fs.existsSync(toastPath)) {
      const content = fs.readFileSync(toastPath, 'utf8');
      
      // Check for standardized colors
      const hasStandardColors = this.standardColors.some(color => content.includes(color));
      if (hasStandardColors) {
        this.results.toastSystemUpdated = true;
        console.log('✅ Toast system uses standardized colors');
      } else {
        console.log('⚠️  Toast system needs color standardization');
      }
    }
    
    // Check alert system
    const alertPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'alert-dialog.tsx');
    if (fs.existsSync(alertPath)) {
      const content = fs.readFileSync(alertPath, 'utf8');
      
      // Check for standardized colors
      const hasStandardColors = this.standardColors.some(color => content.includes(color));
      if (hasStandardColors) {
        this.results.alertSystemUpdated = true;
        console.log('✅ Alert system uses standardized colors');
      } else {
        console.log('⚠️  Alert system needs color standardization');
      }
    }
  }

  analyzeMessageUsage() {
    console.log('\n📈 Analyzing message usage patterns...');
    
    const srcPath = path.join(__dirname, '..', 'src');
    this.analyzeDirectory(srcPath);
    
    console.log(`\nMessage Usage Analysis:`);
    console.log(`Total messages analyzed: ${this.results.totalMessagesAnalyzed}`);
    console.log(`Standardized colors: ${this.results.colorStandardization}`);
    console.log(`Consistent positioning: ${this.results.positioningConsistency}`);
    console.log(`Accessibility compliant: ${this.results.accessibilityCompliance}`);
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
      
      let fileResults = {
        path: relativePath,
        messages: 0,
        standardColors: 0,
        consistentPositioning: 0,
        accessibilityFeatures: 0,
        issues: []
      };
      
      // Find message patterns
      const messagePatterns = [
        /toast\s*\(/gi,
        /alert/gi,
        /notification/gi,
        /message/gi
      ];
      
      messagePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          fileResults.messages += matches.length;
          this.results.totalMessagesAnalyzed += matches.length;
        }
      });
      
      if (fileResults.messages === 0) return;
      
      // Check color standardization
      this.standardColors.forEach(color => {
        if (content.includes(color)) {
          fileResults.standardColors++;
          this.results.colorStandardization++;
        }
      });
      
      // Check positioning consistency
      this.standardPositions.forEach(position => {
        if (content.includes(position)) {
          fileResults.consistentPositioning++;
          this.results.positioningConsistency++;
        }
      });
      
      // Check accessibility features
      const accessibilityPatterns = [
        /role\s*=\s*["']alert["']/gi,
        /aria-live/gi,
        /aria-label/gi,
        /sr-only/gi
      ];
      
      accessibilityPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          fileResults.accessibilityFeatures += matches.length;
          this.results.accessibilityCompliance += matches.length;
        }
      });
      
      // Check for issues
      const nonStandardColors = content.match(/(?:bg|text|border)-(?:green|red|yellow|blue)-\d+/g);
      if (nonStandardColors) {
        fileResults.issues.push(`Non-standard colors: ${nonStandardColors.slice(0, 3).join(', ')}`);
      }
      
      const customPositioning = content.match(/(?:top|bottom|left|right):\s*\d+px/g);
      if (customPositioning) {
        fileResults.issues.push(`Custom positioning: ${customPositioning.slice(0, 2).join(', ')}`);
      }
      
      if (fileResults.messages > 0) {
        this.results.files.push(fileResults);
      }
      
    } catch (error) {
      console.warn(`Warning: Could not analyze ${relativePath}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📋 Message System Validation Report');
    console.log('===================================');
    
    // Overall score calculation
    const totalChecks = 7;
    let passedChecks = 0;
    
    if (this.results.notificationSystemImplemented) passedChecks++;
    if (this.results.messageSystemCSSIncluded) passedChecks++;
    if (this.results.toastSystemUpdated) passedChecks++;
    if (this.results.alertSystemUpdated) passedChecks++;
    if (this.results.colorStandardization > this.results.totalMessagesAnalyzed * 0.8) passedChecks++;
    if (this.results.positioningConsistency > 0) passedChecks++;
    if (this.results.accessibilityCompliance > this.results.totalMessagesAnalyzed * 0.5) passedChecks++;
    
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`Overall Score: ${score}%`);
    console.log(`Status: ${score >= 80 ? '✅ EXCELLENT' : score >= 60 ? '⚠️  GOOD' : '❌ NEEDS IMPROVEMENT'}`);
    
    console.log('\nImplementation Status:');
    console.log(`Notification System: ${this.results.notificationSystemImplemented ? '✅' : '❌'}`);
    console.log(`Message System CSS: ${this.results.messageSystemCSSIncluded ? '✅' : '❌'}`);
    console.log(`Toast System Updated: ${this.results.toastSystemUpdated ? '✅' : '❌'}`);
    console.log(`Alert System Updated: ${this.results.alertSystemUpdated ? '✅' : '❌'}`);
    
    console.log('\nUsage Statistics:');
    console.log(`Total Messages: ${this.results.totalMessagesAnalyzed}`);
    console.log(`Standardized Colors: ${this.results.colorStandardization} (${Math.round(this.results.colorStandardization / Math.max(this.results.totalMessagesAnalyzed, 1) * 100)}%)`);
    console.log(`Consistent Positioning: ${this.results.positioningConsistency}`);
    console.log(`Accessibility Features: ${this.results.accessibilityCompliance} (${Math.round(this.results.accessibilityCompliance / Math.max(this.results.totalMessagesAnalyzed, 1) * 100)}%)`);
    
    // Top files with issues
    const filesWithIssues = this.results.files
      .filter(f => f.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 10);
    
    if (filesWithIssues.length > 0) {
      console.log('\nFiles with Issues:');
      filesWithIssues.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path} (${file.issues.length} issues)`);
        file.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      });
    }
    
    console.log('\nRecommendations:');
    
    if (!this.results.notificationSystemImplemented) {
      console.log('• Implement the unified notification system component');
    }
    
    if (!this.results.messageSystemCSSIncluded) {
      console.log('• Include message-system.css in your global styles');
    }
    
    if (this.results.colorStandardization < this.results.totalMessagesAnalyzed * 0.8) {
      console.log('• Continue standardizing message colors across components');
    }
    
    if (this.results.accessibilityCompliance < this.results.totalMessagesAnalyzed * 0.5) {
      console.log('• Add more accessibility features to message components');
    }
    
    if (score >= 80) {
      console.log('• Excellent! Message system is well standardized');
    } else {
      console.log('• Continue improving message consistency and accessibility');
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'audit-reports', 'message-system-validation.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify({
      score,
      timestamp: new Date().toISOString(),
      results: this.results,
      recommendations: this.generateDetailedRecommendations()
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return score >= 80;
  }

  generateDetailedRecommendations() {
    const recommendations = [];
    
    if (!this.results.notificationSystemImplemented) {
      recommendations.push({
        priority: 'high',
        category: 'component',
        description: 'Implement unified notification system',
        action: 'Create NotificationProvider and use notification hooks throughout the app'
      });
    }
    
    if (this.results.colorStandardization < this.results.totalMessagesAnalyzed * 0.8) {
      recommendations.push({
        priority: 'medium',
        category: 'styling',
        description: 'Standardize message colors',
        action: 'Replace non-standard color classes with semantic color classes'
      });
    }
    
    if (this.results.accessibilityCompliance < this.results.totalMessagesAnalyzed * 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'accessibility',
        description: 'Improve message accessibility',
        action: 'Add ARIA attributes, roles, and screen reader support to all messages'
      });
    }
    
    recommendations.push({
      priority: 'low',
      category: 'enhancement',
      description: 'Implement consistent animations',
      action: 'Use standardized animation durations and easing functions for all messages'
    });
    
    return recommendations;
  }
}

// Main execution
function main() {
  const validator = new MessageSystemValidator();
  const success = validator.validate();
  
  return success ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { MessageSystemValidator };