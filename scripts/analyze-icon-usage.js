#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Icon Usage Analysis Script
 * Analyzes all icon usage patterns in the codebase to identify inconsistencies
 */

class IconAnalyzer {
  constructor() {
    this.iconUsage = new Map();
    this.iconSizes = new Set();
    this.iconColors = new Set();
    this.iconContexts = new Map();
    this.inconsistencies = [];
  }

  analyzeDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        // Skip node_modules and other irrelevant directories
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
      
      // Find lucide-react imports
      const lucideImports = this.extractLucideImports(content);
      
      // Find icon usage patterns
      const iconUsages = this.extractIconUsages(content, lucideImports);
      
      // Analyze each usage
      iconUsages.forEach(usage => {
        this.recordIconUsage(usage, relativePath);
      });
      
    } catch (error) {
      console.warn(`Warning: Could not analyze ${relativePath}: ${error.message}`);
    }
  }

  extractLucideImports(content) {
    const imports = new Set();
    
    // Match import statements from lucide-react
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importList = match[1];
      const icons = importList.split(',').map(icon => icon.trim());
      icons.forEach(icon => imports.add(icon));
    }
    
    return imports;
  }

  extractIconUsages(content, lucideImports) {
    const usages = [];
    
    lucideImports.forEach(iconName => {
      // Find all usages of this icon
      const usageRegex = new RegExp(`<${iconName}([^>]*)>`, 'g');
      let match;
      
      while ((match = usageRegex.exec(content)) !== null) {
        const attributes = match[1];
        const usage = {
          iconName,
          attributes: attributes.trim(),
          fullMatch: match[0]
        };
        
        // Extract size information
        const sizeMatch = attributes.match(/className\s*=\s*["']([^"']*h-\d+[^"']*)["']/);
        if (sizeMatch) {
          const sizeClass = sizeMatch[1].match(/h-(\d+)/);
          if (sizeClass) {
            usage.size = `h-${sizeClass[1]}`;
          }
        }
        
        // Extract color information
        const colorMatch = attributes.match(/className\s*=\s*["']([^"']*text-[^"'\s]+[^"']*)["']/);
        if (colorMatch) {
          const colorClass = colorMatch[1].match(/text-([^\s]+)/);
          if (colorClass) {
            usage.color = `text-${colorClass[1]}`;
          }
        }
        
        usages.push(usage);
      }
    });
    
    return usages;
  }

  recordIconUsage(usage, filePath) {
    const { iconName, size, color, attributes } = usage;
    
    // Record icon usage
    if (!this.iconUsage.has(iconName)) {
      this.iconUsage.set(iconName, []);
    }
    this.iconUsage.get(iconName).push({
      filePath,
      size,
      color,
      attributes,
      fullMatch: usage.fullMatch
    });
    
    // Record sizes and colors
    if (size) this.iconSizes.add(size);
    if (color) this.iconColors.add(color);
    
    // Record context (component type)
    const context = this.determineContext(filePath);
    if (!this.iconContexts.has(context)) {
      this.iconContexts.set(context, new Set());
    }
    this.iconContexts.get(context).add(iconName);
  }

  determineContext(filePath) {
    if (filePath.includes('/ui/')) return 'ui-component';
    if (filePath.includes('/navigation/')) return 'navigation';
    if (filePath.includes('/dashboard/')) return 'dashboard';
    if (filePath.includes('/auth/')) return 'auth';
    if (filePath.includes('/components/')) return 'component';
    return 'other';
  }

  analyzeInconsistencies() {
    // Check for size inconsistencies
    this.iconUsage.forEach((usages, iconName) => {
      const sizes = new Set(usages.map(u => u.size).filter(Boolean));
      if (sizes.size > 3) { // More than 3 different sizes for same icon
        this.inconsistencies.push({
          type: 'size-inconsistency',
          icon: iconName,
          issue: `Icon ${iconName} used with ${sizes.size} different sizes: ${Array.from(sizes).join(', ')}`,
          usages: usages.length
        });
      }
    });
    
    // Check for missing size specifications
    this.iconUsage.forEach((usages, iconName) => {
      const missingSizes = usages.filter(u => !u.size);
      if (missingSizes.length > 0) {
        this.inconsistencies.push({
          type: 'missing-size',
          icon: iconName,
          issue: `Icon ${iconName} missing size specification in ${missingSizes.length} places`,
          examples: missingSizes.slice(0, 3).map(u => u.filePath)
        });
      }
    });
    
    // Check for context-specific inconsistencies
    this.iconContexts.forEach((icons, context) => {
      const iconSizeMap = new Map();
      
      icons.forEach(iconName => {
        const contextUsages = this.iconUsage.get(iconName)?.filter(u => 
          this.determineContext(u.filePath) === context
        ) || [];
        
        const sizes = new Set(contextUsages.map(u => u.size).filter(Boolean));
        if (sizes.size > 1) {
          iconSizeMap.set(iconName, sizes);
        }
      });
      
      if (iconSizeMap.size > 0) {
        this.inconsistencies.push({
          type: 'context-inconsistency',
          context,
          issue: `Icons in ${context} context have inconsistent sizes`,
          details: Array.from(iconSizeMap.entries()).map(([icon, sizes]) => 
            `${icon}: ${Array.from(sizes).join(', ')}`
          )
        });
      }
    });
  }

  generateReport() {
    this.analyzeInconsistencies();
    
    const report = {
      summary: {
        totalIcons: this.iconUsage.size,
        totalUsages: Array.from(this.iconUsage.values()).reduce((sum, usages) => sum + usages.length, 0),
        uniqueSizes: this.iconSizes.size,
        uniqueColors: this.iconColors.size,
        contexts: this.iconContexts.size,
        inconsistencies: this.inconsistencies.length
      },
      
      iconInventory: Array.from(this.iconUsage.entries()).map(([iconName, usages]) => ({
        name: iconName,
        usageCount: usages.length,
        sizes: [...new Set(usages.map(u => u.size).filter(Boolean))],
        colors: [...new Set(usages.map(u => u.color).filter(Boolean))],
        contexts: [...new Set(usages.map(u => this.determineContext(u.filePath)))]
      })).sort((a, b) => b.usageCount - a.usageCount),
      
      sizeAnalysis: {
        allSizes: Array.from(this.iconSizes).sort(),
        recommendedSizes: ['h-3', 'h-4', 'h-5', 'h-6', 'h-8'],
        nonStandardSizes: Array.from(this.iconSizes).filter(size => 
          !['h-3', 'h-4', 'h-5', 'h-6', 'h-8'].includes(size)
        )
      },
      
      colorAnalysis: {
        allColors: Array.from(this.iconColors).sort(),
        commonColors: Array.from(this.iconColors).filter(color =>
          ['text-foreground', 'text-muted-foreground', 'text-primary', 'text-white'].includes(color)
        )
      },
      
      contextAnalysis: Array.from(this.iconContexts.entries()).map(([context, icons]) => ({
        context,
        iconCount: icons.size,
        icons: Array.from(icons).sort()
      })),
      
      inconsistencies: this.inconsistencies,
      
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Size standardization
    if (this.iconSizes.size > 5) {
      recommendations.push({
        type: 'size-standardization',
        priority: 'high',
        description: 'Standardize icon sizes to a consistent scale',
        action: 'Create icon size system with h-3, h-4, h-5, h-6, h-8 as standard sizes'
      });
    }
    
    // Color standardization
    if (this.iconColors.size > 8) {
      recommendations.push({
        type: 'color-standardization',
        priority: 'medium',
        description: 'Reduce color variations for better consistency',
        action: 'Define semantic color classes for icons (primary, secondary, muted, etc.)'
      });
    }
    
    // Context-specific standards
    this.inconsistencies.forEach(inconsistency => {
      if (inconsistency.type === 'context-inconsistency') {
        recommendations.push({
          type: 'context-standards',
          priority: 'medium',
          description: `Standardize icon sizes within ${inconsistency.context} context`,
          action: `Define consistent icon size for ${inconsistency.context} components`
        });
      }
    });
    
    // Missing specifications
    const missingSizeCount = this.inconsistencies.filter(i => i.type === 'missing-size').length;
    if (missingSizeCount > 0) {
      recommendations.push({
        type: 'missing-specifications',
        priority: 'high',
        description: `${missingSizeCount} icons missing size specifications`,
        action: 'Add explicit size classes to all icon usages'
      });
    }
    
    return recommendations;
  }
}

// Main execution
function main() {
  console.log('🔍 Analyzing icon usage patterns...\n');
  
  const analyzer = new IconAnalyzer();
  const srcPath = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Source directory not found:', srcPath);
    process.exit(1);
  }
  
  analyzer.analyzeDirectory(srcPath);
  const report = analyzer.generateReport();
  
  // Write detailed report
  const reportPath = path.join(__dirname, '..', 'audit-reports', 'icon-usage-analysis.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate summary
  console.log('📊 Icon Usage Analysis Summary');
  console.log('================================');
  console.log(`Total unique icons: ${report.summary.totalIcons}`);
  console.log(`Total icon usages: ${report.summary.totalUsages}`);
  console.log(`Unique sizes found: ${report.summary.uniqueSizes}`);
  console.log(`Unique colors found: ${report.summary.uniqueColors}`);
  console.log(`Inconsistencies found: ${report.summary.inconsistencies}`);
  
  console.log('\n📈 Most Used Icons:');
  report.iconInventory.slice(0, 10).forEach((icon, index) => {
    console.log(`${index + 1}. ${icon.name} (${icon.usageCount} uses)`);
  });
  
  console.log('\n📏 Size Analysis:');
  console.log(`Standard sizes: ${report.sizeAnalysis.recommendedSizes.join(', ')}`);
  if (report.sizeAnalysis.nonStandardSizes.length > 0) {
    console.log(`Non-standard sizes: ${report.sizeAnalysis.nonStandardSizes.join(', ')}`);
  }
  
  console.log('\n⚠️  Inconsistencies:');
  if (report.inconsistencies.length === 0) {
    console.log('✅ No major inconsistencies found!');
  } else {
    report.inconsistencies.slice(0, 5).forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issue}`);
    });
    if (report.inconsistencies.length > 5) {
      console.log(`... and ${report.inconsistencies.length - 5} more issues`);
    }
  }
  
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
    console.log(`   Action: ${rec.action}`);
  });
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report.inconsistencies.length === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { IconAnalyzer };