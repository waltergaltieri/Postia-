#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Icon Standardization Validation Script
 * Validates that icon standardization has been properly implemented
 */

class IconStandardizationValidator {
  constructor() {
    this.results = {
      iconSystemImplemented: false,
      iconComponentCreated: false,
      cssSystemIncluded: false,
      standardSizesUsed: 0,
      nonStandardSizesFound: 0,
      missingIconSizes: 0,
      colorStandardization: 0,
      alignmentIssues: 0,
      totalIconsAnalyzed: 0,
      files: []
    };
    
    this.standardSizes = ['h-3 w-3', 'h-4 w-4', 'h-5 w-5', 'h-6 w-6', 'h-8 w-8'];
    this.standardColors = [
      'text-foreground',
      'text-muted-foreground', 
      'text-primary',
      'text-secondary-foreground',
      'text-success-600',
      'text-error-600',
      'text-warning-600',
      'text-info-600',
      'text-white',
      'text-inherit'
    ];
  }

  validate() {
    console.log('🔍 Validating icon standardization implementation...\n');
    
    // Check if Icon component exists
    this.validateIconComponent();
    
    // Check if CSS system is included
    this.validateCSSSystem();
    
    // Analyze icon usage in components
    this.analyzeIconUsage();
    
    // Generate validation report
    this.generateReport();
  }

  validateIconComponent() {
    const iconComponentPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'icon.tsx');
    
    if (fs.existsSync(iconComponentPath)) {
      this.results.iconComponentCreated = true;
      console.log('✅ Icon component created');
      
      const content = fs.readFileSync(iconComponentPath, 'utf8');
      
      // Check for key features
      const features = [
        { name: 'Size variants', pattern: /size:\s*\{[^}]*xs.*sm.*md.*lg.*xl/s },
        { name: 'Color variants', pattern: /variant:\s*\{[^}]*primary.*secondary.*success.*error/s },
        { name: 'Context mappings', pattern: /ICON_CONTEXTS/ },
        { name: 'Status colors', pattern: /STATUS_COLORS/ },
        { name: 'Semantic icons', pattern: /SEMANTIC_ICONS/ }
      ];
      
      features.forEach(feature => {
        if (feature.pattern.test(content)) {
          console.log(`  ✅ ${feature.name} implemented`);
        } else {
          console.log(`  ⚠️  ${feature.name} missing or incomplete`);
        }
      });
    } else {
      console.log('❌ Icon component not found');
    }
  }

  validateCSSSystem() {
    const cssSystemPath = path.join(__dirname, '..', 'src', 'styles', 'icon-system.css');
    const globalCSSPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
    
    if (fs.existsSync(cssSystemPath)) {
      console.log('✅ Icon system CSS created');
      
      const content = fs.readFileSync(cssSystemPath, 'utf8');
      
      // Check for key CSS features
      const cssFeatures = [
        { name: 'Size variables', pattern: /--icon-xs.*--icon-sm.*--icon-md/s },
        { name: 'Alignment utilities', pattern: /icon-text-container/ },
        { name: 'Context styles', pattern: /nav-icon.*btn-icon.*status-icon/s },
        { name: 'State styles', pattern: /icon-hover.*icon-loading.*icon-disabled/s },
        { name: 'Responsive adjustments', pattern: /@media.*max-width.*768px/s }
      ];
      
      cssFeatures.forEach(feature => {
        if (feature.pattern.test(content)) {
          console.log(`  ✅ ${feature.name} implemented`);
        } else {
          console.log(`  ⚠️  ${feature.name} missing`);
        }
      });
    } else {
      console.log('❌ Icon system CSS not found');
    }
    
    // Check if CSS is included in globals
    if (fs.existsSync(globalCSSPath)) {
      const globalContent = fs.readFileSync(globalCSSPath, 'utf8');
      if (globalContent.includes('icon-system.css')) {
        this.results.cssSystemIncluded = true;
        console.log('✅ Icon system CSS included in globals');
      } else {
        console.log('⚠️  Icon system CSS not included in globals.css');
      }
    }
  }

  analyzeIconUsage() {
    console.log('\n📊 Analyzing icon usage patterns...');
    
    const srcPath = path.join(__dirname, '..', 'src');
    this.analyzeDirectory(srcPath);
    
    console.log(`\nIcon Usage Analysis:`);
    console.log(`Total icons analyzed: ${this.results.totalIconsAnalyzed}`);
    console.log(`Standard sizes used: ${this.results.standardSizesUsed}`);
    console.log(`Non-standard sizes: ${this.results.nonStandardSizesFound}`);
    console.log(`Missing sizes: ${this.results.missingIconSizes}`);
    console.log(`Standardized colors: ${this.results.colorStandardization}`);
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
      
      // Find Lucide icon usage
      const iconRegex = /<([A-Z][a-zA-Z]*)\s+([^>]*?)>/g;
      let match;
      let fileResults = {
        path: relativePath,
        icons: 0,
        standardSizes: 0,
        nonStandardSizes: 0,
        missingSizes: 0,
        standardColors: 0,
        issues: []
      };
      
      while ((match = iconRegex.exec(content)) !== null) {
        const iconName = match[1];
        const attributes = match[2];
        
        // Check if this is likely a Lucide icon
        if (!this.isLikelyLucideIcon(iconName, content)) continue;
        
        fileResults.icons++;
        this.results.totalIconsAnalyzed++;
        
        // Check size
        const sizeMatch = attributes.match(/className\s*=\s*["']([^"']*h-\d+[^"']*)["']/);
        if (sizeMatch) {
          const className = sizeMatch[1];
          const sizeClass = className.match(/h-(\d+)(?:\s+w-\d+)?/);
          
          if (sizeClass) {
            const size = `h-${sizeClass[1]} w-${sizeClass[1]}`;
            if (this.standardSizes.includes(size)) {
              fileResults.standardSizes++;
              this.results.standardSizesUsed++;
            } else {
              fileResults.nonStandardSizes++;
              this.results.nonStandardSizesFound++;
              fileResults.issues.push(`Non-standard size: ${size} for ${iconName}`);
            }
          }
          
          // Check color
          const colorMatch = className.match(/text-([^\s]+)/);
          if (colorMatch) {
            const color = `text-${colorMatch[1]}`;
            if (this.standardColors.includes(color)) {
              fileResults.standardColors++;
              this.results.colorStandardization++;
            }
          }
        } else {
          fileResults.missingSizes++;
          this.results.missingIconSizes++;
          fileResults.issues.push(`Missing size specification for ${iconName}`);
        }
      }
      
      if (fileResults.icons > 0) {
        this.results.files.push(fileResults);
      }
      
    } catch (error) {
      console.warn(`Warning: Could not analyze ${relativePath}: ${error.message}`);
    }
  }

  isLikelyLucideIcon(iconName, content) {
    const importRegex = new RegExp(`import\\s*\\{[^}]*\\b${iconName}\\b[^}]*\\}\\s*from\\s*['"]lucide-react['"]`);
    return importRegex.test(content);
  }

  generateReport() {
    console.log('\n📋 Icon Standardization Report');
    console.log('================================');
    
    // Overall score calculation
    const totalChecks = 5; // Icon component, CSS system, usage patterns, etc.
    let passedChecks = 0;
    
    if (this.results.iconComponentCreated) passedChecks++;
    if (this.results.cssSystemIncluded) passedChecks++;
    if (this.results.standardSizesUsed > this.results.nonStandardSizesFound) passedChecks++;
    if (this.results.missingIconSizes < this.results.totalIconsAnalyzed * 0.1) passedChecks++; // Less than 10% missing
    if (this.results.colorStandardization > 0) passedChecks++;
    
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`Overall Score: ${score}%`);
    console.log(`Status: ${score >= 80 ? '✅ GOOD' : score >= 60 ? '⚠️  NEEDS IMPROVEMENT' : '❌ POOR'}`);
    
    console.log('\nImplementation Status:');
    console.log(`Icon Component: ${this.results.iconComponentCreated ? '✅' : '❌'}`);
    console.log(`CSS System: ${this.results.cssSystemIncluded ? '✅' : '❌'}`);
    
    console.log('\nUsage Statistics:');
    console.log(`Total Icons: ${this.results.totalIconsAnalyzed}`);
    console.log(`Standard Sizes: ${this.results.standardSizesUsed} (${Math.round(this.results.standardSizesUsed / this.results.totalIconsAnalyzed * 100)}%)`);
    console.log(`Non-Standard Sizes: ${this.results.nonStandardSizesFound}`);
    console.log(`Missing Sizes: ${this.results.missingIconSizes}`);
    console.log(`Standardized Colors: ${this.results.colorStandardization}`);
    
    // Top files with issues
    const filesWithIssues = this.results.files
      .filter(f => f.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 10);
    
    if (filesWithIssues.length > 0) {
      console.log('\nFiles with Most Issues:');
      filesWithIssues.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path} (${file.issues.length} issues)`);
        file.issues.slice(0, 3).forEach(issue => {
          console.log(`   - ${issue}`);
        });
        if (file.issues.length > 3) {
          console.log(`   ... and ${file.issues.length - 3} more`);
        }
      });
    }
    
    console.log('\nRecommendations:');
    
    if (!this.results.iconComponentCreated) {
      console.log('• Create the Icon component with standardized sizes and variants');
    }
    
    if (!this.results.cssSystemIncluded) {
      console.log('• Include icon-system.css in your global styles');
    }
    
    if (this.results.nonStandardSizesFound > 0) {
      console.log(`• Fix ${this.results.nonStandardSizesFound} non-standard icon sizes`);
    }
    
    if (this.results.missingIconSizes > 0) {
      console.log(`• Add size specifications to ${this.results.missingIconSizes} icons`);
    }
    
    if (score >= 80) {
      console.log('• Great job! Icon standardization is well implemented');
    } else {
      console.log('• Continue improving icon consistency across the application');
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'audit-reports', 'icon-standardization-validation.json');
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
    
    if (!this.results.iconComponentCreated) {
      recommendations.push({
        priority: 'high',
        category: 'component',
        description: 'Create standardized Icon component',
        action: 'Implement Icon component with size variants, color variants, and context-aware sizing'
      });
    }
    
    if (this.results.nonStandardSizesFound > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'sizing',
        description: 'Standardize icon sizes',
        action: `Replace ${this.results.nonStandardSizesFound} non-standard icon sizes with standard sizes (h-3, h-4, h-5, h-6, h-8)`
      });
    }
    
    if (this.results.missingIconSizes > 0) {
      recommendations.push({
        priority: 'high',
        category: 'sizing',
        description: 'Add missing size specifications',
        action: `Add explicit size classes to ${this.results.missingIconSizes} icons`
      });
    }
    
    recommendations.push({
      priority: 'low',
      category: 'enhancement',
      description: 'Implement semantic icon usage',
      action: 'Use semantic icon names and context-aware sizing for better maintainability'
    });
    
    return recommendations;
  }
}

// Main execution
function main() {
  const validator = new IconStandardizationValidator();
  const success = validator.validate();
  
  return success ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { IconStandardizationValidator };