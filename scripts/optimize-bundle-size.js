#!/usr/bin/env node

/**
 * Bundle Size Optimization Script
 * 
 * This script analyzes and optimizes the bundle size for the client management system,
 * focusing on reducing the impact of client-specific code on the overall application bundle.
 */

const fs = require('fs');
const path = require('path');

class BundleOptimizer {
  constructor() {
    this.srcDir = path.join(__dirname, '..', 'src');
    this.optimizations = [];
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Analyze component dependencies and suggest optimizations
   */
  analyzeComponentDependencies() {
    console.log('🔍 Analyzing component dependencies...');
    
    const componentDirs = [
      'components/navigation',
      'components/layouts',
      'components/ui',
      'components/providers',
      'app/dashboard',
    ];

    componentDirs.forEach(dir => {
      const fullPath = path.join(this.srcDir, dir);
      if (fs.existsSync(fullPath)) {
        this.analyzeDirectory(fullPath, dir);
      }
    });
  }

  /**
   * Analyze a directory for optimization opportunities
   */
  analyzeDirectory(dirPath, relativePath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    files.forEach(file => {
      if (file.isDirectory()) {
        this.analyzeDirectory(
          path.join(dirPath, file.name),
          path.join(relativePath, file.name)
        );
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        this.analyzeFile(path.join(dirPath, file.name), path.join(relativePath, file.name));
      }
    });
  }

  /**
   * Analyze individual file for optimization opportunities
   */
  analyzeFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for heavy imports
      this.checkHeavyImports(content, relativePath);
      
      // Check for client-specific code that could be lazy loaded
      this.checkLazyLoadingOpportunities(content, relativePath);
      
      // Check for unused dependencies
      this.checkUnusedDependencies(content, relativePath);
      
      // Check for code splitting opportunities
      this.checkCodeSplittingOpportunities(content, relativePath);
      
    } catch (error) {
      this.errors.push(`Error analyzing ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Check for heavy imports that could impact bundle size
   */
  checkHeavyImports(content, filePath) {
    const heavyImports = [
      { pattern: /import.*from ['"]react-dom['"]/, suggestion: 'Consider using React.lazy for components' },
      { pattern: /import.*from ['"]framer-motion['"]/, suggestion: 'Import specific components from framer-motion' },
      { pattern: /import.*from ['"]@radix-ui\/.*['"]/, suggestion: 'Use tree-shaking friendly imports' },
      { pattern: /import.*from ['"]lucide-react['"]/, suggestion: 'Import specific icons only' },
      { pattern: /import.*from ['"]recharts['"]/, suggestion: 'Consider lazy loading chart components' },
    ];

    heavyImports.forEach(({ pattern, suggestion }) => {
      if (pattern.test(content)) {
        this.optimizations.push({
          file: filePath,
          type: 'Heavy Import',
          suggestion,
          impact: 'Medium',
        });
      }
    });
  }

  /**
   * Check for lazy loading opportunities
   */
  checkLazyLoadingOpportunities(content, filePath) {
    // Check for client-specific components that could be lazy loaded
    const lazyLoadCandidates = [
      { pattern: /client.*dashboard/i, component: 'Client Dashboard' },
      { pattern: /admin.*dashboard/i, component: 'Admin Dashboard' },
      { pattern: /client.*theme/i, component: 'Client Theme Components' },
      { pattern: /campaign.*editor/i, component: 'Campaign Editor' },
      { pattern: /content.*generation/i, component: 'Content Generation Interface' },
    ];

    lazyLoadCandidates.forEach(({ pattern, component }) => {
      if (pattern.test(content) && !content.includes('React.lazy')) {
        this.optimizations.push({
          file: filePath,
          type: 'Lazy Loading',
          suggestion: `Consider lazy loading ${component} to reduce initial bundle size`,
          impact: 'High',
        });
      }
    });
  }

  /**
   * Check for unused dependencies
   */
  checkUnusedDependencies(content, filePath) {
    const imports = content.match(/import.*from ['"][^'"]+['"]/g) || [];
    const importedModules = imports.map(imp => {
      const match = imp.match(/from ['"]([^'"]+)['"]/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Check if imported modules are actually used
    importedModules.forEach(module => {
      const moduleUsage = new RegExp(module.split('/').pop(), 'g');
      const usageCount = (content.match(moduleUsage) || []).length;
      
      if (usageCount <= 1) { // Only the import statement
        this.warnings.push({
          file: filePath,
          type: 'Unused Import',
          message: `Module '${module}' may be unused`,
          impact: 'Low',
        });
      }
    });
  }

  /**
   * Check for code splitting opportunities
   */
  checkCodeSplittingOpportunities(content, filePath) {
    // Check for large components that could be split
    const componentSize = content.length;
    const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
    
    if (componentSize > 5000 && functionCount > 10) {
      this.optimizations.push({
        file: filePath,
        type: 'Code Splitting',
        suggestion: 'Consider splitting this large component into smaller, focused components',
        impact: 'Medium',
        details: `File size: ${componentSize} characters, Functions: ${functionCount}`,
      });
    }

    // Check for route-level components
    if (filePath.includes('app/') && filePath.includes('page.tsx')) {
      if (!content.includes('dynamic') && !content.includes('React.lazy')) {
        this.optimizations.push({
          file: filePath,
          type: 'Route Splitting',
          suggestion: 'Consider using dynamic imports for route-level components',
          impact: 'High',
        });
      }
    }
  }

  /**
   * Analyze CSS and styling impact
   */
  analyzeStylingImpact() {
    console.log('🎨 Analyzing styling impact...');
    
    const styleFiles = [
      'styles/globals.css',
      'styles/client-theme.css',
    ];

    styleFiles.forEach(file => {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for unused CSS
        this.checkUnusedCSS(content, file);
        
        // Check for CSS optimization opportunities
        this.checkCSSOptimizations(content, file);
      }
    });
  }

  /**
   * Check for unused CSS
   */
  checkUnusedCSS(content, filePath) {
    const cssRules = content.match(/\.[a-zA-Z][a-zA-Z0-9-_]*\s*{/g) || [];
    const uniqueClasses = [...new Set(cssRules.map(rule => rule.replace(/[{.\s]/g, '')))];
    
    if (uniqueClasses.length > 50) {
      this.optimizations.push({
        file: filePath,
        type: 'CSS Optimization',
        suggestion: 'Consider using CSS purging to remove unused styles',
        impact: 'Medium',
        details: `Found ${uniqueClasses.length} CSS classes`,
      });
    }
  }

  /**
   * Check for CSS optimization opportunities
   */
  checkCSSOptimizations(content, filePath) {
    // Check for client-specific CSS that could be loaded conditionally
    if (filePath.includes('client-theme') && content.length > 2000) {
      this.optimizations.push({
        file: filePath,
        type: 'CSS Code Splitting',
        suggestion: 'Consider loading client-specific themes dynamically',
        impact: 'High',
      });
    }

    // Check for duplicate CSS properties
    const properties = content.match(/[a-zA-Z-]+:\s*[^;]+;/g) || [];
    const duplicates = properties.filter((prop, index) => 
      properties.indexOf(prop) !== index
    );

    if (duplicates.length > 5) {
      this.optimizations.push({
        file: filePath,
        type: 'CSS Deduplication',
        suggestion: 'Consider using CSS variables to reduce duplication',
        impact: 'Low',
        details: `Found ${duplicates.length} duplicate properties`,
      });
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    console.log('📋 Generating optimization recommendations...');
    
    const recommendations = {
      immediate: this.optimizations.filter(opt => opt.impact === 'High'),
      shortTerm: this.optimizations.filter(opt => opt.impact === 'Medium'),
      longTerm: this.optimizations.filter(opt => opt.impact === 'Low'),
    };

    return recommendations;
  }

  /**
   * Create optimization implementation guide
   */
  createImplementationGuide(recommendations) {
    const guide = `# Bundle Size Optimization Guide

## Immediate Actions (High Impact)

${recommendations.immediate.map(opt => `
### ${opt.type} - ${opt.file}
**Suggestion:** ${opt.suggestion}
${opt.details ? `**Details:** ${opt.details}` : ''}

**Implementation:**
${this.getImplementationSteps(opt)}
`).join('\n')}

## Short-term Improvements (Medium Impact)

${recommendations.shortTerm.map(opt => `
### ${opt.type} - ${opt.file}
**Suggestion:** ${opt.suggestion}
${opt.details ? `**Details:** ${opt.details}` : ''}
`).join('\n')}

## Long-term Optimizations (Low Impact)

${recommendations.longTerm.map(opt => `
### ${opt.type} - ${opt.file}
**Suggestion:** ${opt.suggestion}
${opt.details ? `**Details:** ${opt.details}` : ''}
`).join('\n')}

## Warnings

${this.warnings.map(warning => `
- **${warning.type}** in ${warning.file}: ${warning.message}
`).join('\n')}

## Bundle Size Targets

- **Initial Bundle:** < 250KB gzipped
- **Client-specific Code:** < 50KB per client
- **Admin Dashboard:** < 100KB (lazy loaded)
- **Core Navigation:** < 30KB

## Monitoring

Use the following commands to monitor bundle size:

\`\`\`bash
# Analyze bundle size
npm run build
npm run analyze

# Monitor performance
npm run test:performance
\`\`\`
`;

    return guide;
  }

  /**
   * Get implementation steps for optimization
   */
  getImplementationSteps(optimization) {
    const steps = {
      'Lazy Loading': `
1. Wrap component with React.lazy()
2. Add Suspense boundary with loading fallback
3. Consider preloading on user interaction
4. Test loading states and error boundaries`,

      'Route Splitting': `
1. Use Next.js dynamic imports
2. Add loading component
3. Implement error boundaries
4. Test route transitions`,

      'Code Splitting': `
1. Extract reusable components
2. Create focused, single-responsibility components
3. Use composition over large monolithic components
4. Consider using React.memo for expensive components`,

      'CSS Code Splitting': `
1. Split CSS by feature/client
2. Use CSS-in-JS for dynamic themes
3. Implement CSS loading on demand
4. Consider critical CSS extraction`,

      'Heavy Import': `
1. Use tree-shaking friendly imports
2. Import only needed components/functions
3. Consider alternative lighter libraries
4. Use dynamic imports for heavy dependencies`,
    };

    return steps[optimization.type] || 'Review and implement based on suggestion.';
  }

  /**
   * Run the complete optimization analysis
   */
  async run() {
    console.log('🚀 Starting bundle size optimization analysis...\n');

    try {
      // Analyze components
      this.analyzeComponentDependencies();
      
      // Analyze styling
      this.analyzeStylingImpact();
      
      // Generate recommendations
      const recommendations = this.generateRecommendations();
      
      // Create implementation guide
      const guide = this.createImplementationGuide(recommendations);
      
      // Write results
      const outputPath = path.join(__dirname, '..', 'BUNDLE_OPTIMIZATION.md');
      fs.writeFileSync(outputPath, guide);
      
      // Print summary
      this.printSummary(recommendations);
      
      console.log(`\n📄 Detailed optimization guide written to: ${outputPath}`);
      
    } catch (error) {
      console.error('❌ Error during optimization analysis:', error.message);
      process.exit(1);
    }
  }

  /**
   * Print optimization summary
   */
  printSummary(recommendations) {
    console.log('\n📊 Optimization Summary:');
    console.log(`   High Impact: ${recommendations.immediate.length} items`);
    console.log(`   Medium Impact: ${recommendations.shortTerm.length} items`);
    console.log(`   Low Impact: ${recommendations.longTerm.length} items`);
    console.log(`   Warnings: ${this.warnings.length} items`);
    
    if (this.errors.length > 0) {
      console.log(`   Errors: ${this.errors.length} items`);
      this.errors.forEach(error => console.log(`     ⚠️  ${error}`));
    }

    // Priority recommendations
    if (recommendations.immediate.length > 0) {
      console.log('\n🔥 Priority Optimizations:');
      recommendations.immediate.slice(0, 3).forEach(opt => {
        console.log(`   • ${opt.type} in ${opt.file}`);
        console.log(`     ${opt.suggestion}`);
      });
    }

    // Estimated impact
    const totalOptimizations = recommendations.immediate.length + 
                              recommendations.shortTerm.length + 
                              recommendations.longTerm.length;
    
    if (totalOptimizations > 0) {
      const estimatedSavings = Math.min(totalOptimizations * 5, 50); // Rough estimate
      console.log(`\n💾 Estimated bundle size reduction: ~${estimatedSavings}KB`);
    }
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new BundleOptimizer();
  optimizer.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = BundleOptimizer;