#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Icon Inconsistency Fix Script
 * Automatically fixes common icon inconsistencies based on context
 */

class IconFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
    
    // Context-based size mappings
    this.contextSizes = {
      // Navigation contexts
      'navigation-sidebar': 'h-5 w-5',
      'navigation-breadcrumb': 'h-4 w-4',
      'navigation-tabs': 'h-4 w-4',
      'navigation-dropdown': 'h-4 w-4',
      
      // Button contexts
      'button-small': 'h-3 w-3',
      'button-default': 'h-4 w-4',
      'button-large': 'h-5 w-5',
      'button-icon': 'h-5 w-5',
      
      // Status contexts
      'status-indicator': 'h-3 w-3',
      'status-badge': 'h-3 w-3',
      'status-notification': 'h-4 w-4',
      'status-alert': 'h-5 w-5',
      
      // Content contexts
      'content-inline': 'h-4 w-4',
      'content-card': 'h-5 w-5',
      'content-hero': 'h-8 w-8',
      'content-empty': 'h-8 w-8',
      
      // Form contexts
      'form-input': 'h-4 w-4',
      'form-label': 'h-3 w-3',
      'form-validation': 'h-4 w-4',
    };
    
    // Standard size hierarchy
    this.standardSizes = ['h-3 w-3', 'h-4 w-4', 'h-5 w-5', 'h-6 w-6', 'h-8 w-8'];
    
    // Icon-specific size preferences (for commonly used icons)
    this.iconSizePreferences = {
      'CheckCircle': 'h-5 w-5',
      'XCircle': 'h-5 w-5',
      'AlertTriangle': 'h-5 w-5',
      'Info': 'h-5 w-5',
      'Eye': 'h-4 w-4',
      'EyeOff': 'h-4 w-4',
      'Search': 'h-4 w-4',
      'Filter': 'h-4 w-4',
      'Plus': 'h-4 w-4',
      'Minus': 'h-4 w-4',
      'Edit': 'h-4 w-4',
      'Trash2': 'h-4 w-4',
      'Download': 'h-4 w-4',
      'Upload': 'h-4 w-4',
      'ChevronLeft': 'h-4 w-4',
      'ChevronRight': 'h-4 w-4',
      'ChevronUp': 'h-4 w-4',
      'ChevronDown': 'h-4 w-4',
      'Home': 'h-5 w-5',
      'Users': 'h-5 w-5',
      'Settings': 'h-5 w-5',
      'Calendar': 'h-5 w-5',
      'Sparkles': 'h-5 w-5',
      'Zap': 'h-5 w-5',
    };
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
      
      // Fix 1: Add missing size specifications
      content = this.addMissingSizes(content, relativePath);
      if (content !== originalContent) hasChanges = true;
      
      // Fix 2: Standardize inconsistent sizes
      const sizeFixedContent = this.standardizeSizes(content, relativePath);
      if (sizeFixedContent !== content) {
        content = sizeFixedContent;
        hasChanges = true;
      }
      
      // Fix 3: Fix icon alignment issues
      const alignmentFixedContent = this.fixIconAlignment(content, relativePath);
      if (alignmentFixedContent !== content) {
        content = alignmentFixedContent;
        hasChanges = true;
      }
      
      // Fix 4: Add semantic color classes
      const colorFixedContent = this.standardizeColors(content, relativePath);
      if (colorFixedContent !== content) {
        content = colorFixedContent;
        hasChanges = true;
      }
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        this.fixes.push({
          file: relativePath,
          type: 'icon-standardization',
          description: 'Fixed icon sizes, alignment, and colors'
        });
      }
      
    } catch (error) {
      this.errors.push({
        file: relativePath,
        error: error.message
      });
    }
  }

  addMissingSizes(content, filePath) {
    // Find icons without size specifications
    const iconRegex = /<([A-Z][a-zA-Z]*)\s+([^>]*?)>/g;
    let match;
    let newContent = content;
    
    while ((match = iconRegex.exec(content)) !== null) {
      const iconName = match[1];
      const attributes = match[2];
      const fullMatch = match[0];
      
      // Check if this is likely a Lucide icon (starts with capital letter)
      if (!this.isLikelyLucideIcon(iconName, content)) continue;
      
      // Check if size is already specified
      if (attributes.includes('className') && (attributes.includes('h-') || attributes.includes('w-'))) {
        continue;
      }
      
      // Determine appropriate size
      const context = this.determineIconContext(fullMatch, content, filePath);
      const appropriateSize = this.getAppropriateSize(iconName, context);
      
      // Add size to className or create className
      let newAttributes = attributes;
      const classNameMatch = attributes.match(/className\s*=\s*["']([^"']*)["']/);
      
      if (classNameMatch) {
        const existingClasses = classNameMatch[1];
        const newClasses = `${existingClasses} ${appropriateSize}`.trim();
        newAttributes = attributes.replace(
          /className\s*=\s*["'][^"']*["']/,
          `className="${newClasses}"`
        );
      } else {
        newAttributes = `className="${appropriateSize}" ${attributes}`.trim();
      }
      
      const newIconTag = `<${iconName} ${newAttributes}>`;
      newContent = newContent.replace(fullMatch, newIconTag);
    }
    
    return newContent;
  }

  standardizeSizes(content, filePath) {
    // Find icons with non-standard sizes and fix them
    const iconRegex = /<([A-Z][a-zA-Z]*)\s+([^>]*className\s*=\s*["']([^"']*?)["'][^>]*)>/g;
    let match;
    let newContent = content;
    
    while ((match = iconRegex.exec(content)) !== null) {
      const iconName = match[1];
      const attributes = match[2];
      const className = match[3];
      const fullMatch = match[0];
      
      if (!this.isLikelyLucideIcon(iconName, content)) continue;
      
      // Extract current size
      const sizeMatch = className.match(/h-(\d+)(?:\s+w-\d+)?/);
      if (!sizeMatch) continue;
      
      const currentSize = `h-${sizeMatch[1]} w-${sizeMatch[1]}`;
      
      // Check if size is non-standard
      if (!this.standardSizes.includes(currentSize)) {
        const context = this.determineIconContext(fullMatch, content, filePath);
        const standardSize = this.getStandardSize(currentSize, iconName, context);
        
        if (standardSize !== currentSize) {
          const newClassName = className
            .replace(/h-\d+/g, standardSize.split(' ')[0])
            .replace(/w-\d+/g, standardSize.split(' ')[1]);
          
          const newAttributes = attributes.replace(
            /className\s*=\s*["'][^"']*["']/,
            `className="${newClassName}"`
          );
          
          const newIconTag = `<${iconName} ${newAttributes}>`;
          newContent = newContent.replace(fullMatch, newIconTag);
        }
      }
    }
    
    return newContent;
  }

  fixIconAlignment(content, filePath) {
    let newContent = content;
    
    // Fix common alignment patterns
    const alignmentFixes = [
      // Fix icons in buttons without proper spacing
      {
        pattern: /(<[A-Z][a-zA-Z]*[^>]*>)\s*([^<\s][^<]*)/g,
        replacement: (match, icon, text) => {
          if (this.isInButtonContext(match, content)) {
            return `${icon} <span>${text.trim()}</span>`;
          }
          return match;
        }
      },
      
      // Fix icons in navigation items
      {
        pattern: /(<div[^>]*nav[^>]*>)\s*(<[A-Z][a-zA-Z]*[^>]*>)\s*([^<]+)/g,
        replacement: '$1<div class="icon-text-container">$2<span>$3</span></div>'
      }
    ];
    
    alignmentFixes.forEach(fix => {
      if (typeof fix.replacement === 'function') {
        newContent = newContent.replace(fix.pattern, fix.replacement);
      } else {
        newContent = newContent.replace(fix.pattern, fix.replacement);
      }
    });
    
    return newContent;
  }

  standardizeColors(content, filePath) {
    let newContent = content;
    
    // Standardize status icon colors
    const statusColorMappings = {
      'text-green-500': 'text-success-600',
      'text-green-600': 'text-success-600',
      'text-emerald-600': 'text-success-600',
      'text-red-500': 'text-error-600',
      'text-red-600': 'text-error-600',
      'text-yellow-500': 'text-warning-600',
      'text-yellow-600': 'text-warning-600',
      'text-amber-500': 'text-warning-600',
      'text-blue-500': 'text-info-600',
      'text-blue-600': 'text-info-600',
      'text-gray-400': 'text-muted-foreground',
      'text-gray-500': 'text-muted-foreground',
    };
    
    Object.entries(statusColorMappings).forEach(([oldColor, newColor]) => {
      const regex = new RegExp(`\\b${oldColor}\\b`, 'g');
      newContent = newContent.replace(regex, newColor);
    });
    
    return newContent;
  }

  isLikelyLucideIcon(iconName, content) {
    // Check if the icon is imported from lucide-react
    const importRegex = new RegExp(`import\\s*\\{[^}]*\\b${iconName}\\b[^}]*\\}\\s*from\\s*['"]lucide-react['"]`);
    return importRegex.test(content);
  }

  determineIconContext(iconMatch, content, filePath) {
    // Analyze surrounding context to determine appropriate size
    const contextPatterns = [
      { pattern: /sidebar|nav-item/i, context: 'navigation-sidebar' },
      { pattern: /breadcrumb/i, context: 'navigation-breadcrumb' },
      { pattern: /tab/i, context: 'navigation-tabs' },
      { pattern: /dropdown/i, context: 'navigation-dropdown' },
      { pattern: /btn-sm|button.*small/i, context: 'button-small' },
      { pattern: /btn-lg|button.*large/i, context: 'button-large' },
      { pattern: /btn|button/i, context: 'button-default' },
      { pattern: /badge/i, context: 'status-badge' },
      { pattern: /alert|notification/i, context: 'status-alert' },
      { pattern: /card-header/i, context: 'content-card' },
      { pattern: /hero|empty-state/i, context: 'content-hero' },
      { pattern: /form|input/i, context: 'form-input' },
    ];
    
    for (const { pattern, context } of contextPatterns) {
      if (pattern.test(content.substring(Math.max(0, content.indexOf(iconMatch) - 200), 
                                       content.indexOf(iconMatch) + 200))) {
        return context;
      }
    }
    
    // Default context based on file path
    if (filePath.includes('/navigation/')) return 'navigation-sidebar';
    if (filePath.includes('/ui/button')) return 'button-default';
    if (filePath.includes('/ui/')) return 'content-inline';
    
    return 'default';
  }

  getAppropriateSize(iconName, context) {
    // First check context-specific size
    if (this.contextSizes[context]) {
      return this.contextSizes[context];
    }
    
    // Then check icon-specific preferences
    if (this.iconSizePreferences[iconName]) {
      return this.iconSizePreferences[iconName];
    }
    
    // Default to medium size
    return 'h-4 w-4';
  }

  getStandardSize(currentSize, iconName, context) {
    // Map non-standard sizes to standard ones
    const sizeMap = {
      'h-1 w-1': 'h-3 w-3',
      'h-2 w-2': 'h-3 w-3',
      'h-7 w-7': 'h-6 w-6',
      'h-9 w-9': 'h-8 w-8',
      'h-10 w-10': 'h-8 w-8',
      'h-12 w-12': 'h-8 w-8',
      'h-16 w-16': 'h-8 w-8',
    };
    
    if (sizeMap[currentSize]) {
      return sizeMap[currentSize];
    }
    
    // If already standard, return as is
    if (this.standardSizes.includes(currentSize)) {
      return currentSize;
    }
    
    // Extract numeric size and find closest standard
    const sizeMatch = currentSize.match(/h-(\d+)/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size <= 3) return 'h-3 w-3';
      if (size <= 4) return 'h-4 w-4';
      if (size <= 5) return 'h-5 w-5';
      if (size <= 6) return 'h-6 w-6';
      return 'h-8 w-8';
    }
    
    return 'h-4 w-4'; // Default fallback
  }

  isInButtonContext(iconMatch, content) {
    const iconIndex = content.indexOf(iconMatch);
    const contextBefore = content.substring(Math.max(0, iconIndex - 100), iconIndex);
    const contextAfter = content.substring(iconIndex, iconIndex + 100);
    
    return /button|btn/i.test(contextBefore + contextAfter);
  }

  generateReport() {
    return {
      summary: {
        filesProcessed: this.fixes.length + this.errors.length,
        filesFixed: this.fixes.length,
        errors: this.errors.length
      },
      fixes: this.fixes,
      errors: this.errors,
      recommendations: [
        'Import the new Icon component from @/components/ui/icon',
        'Use semantic icon names from SEMANTIC_ICONS when possible',
        'Apply context-specific sizing using the context prop',
        'Use StatusIcon for status indicators',
        'Include icon-system.css in your global styles'
      ]
    };
  }
}

// Main execution
function main() {
  console.log('🔧 Fixing icon inconsistencies...\n');
  
  const fixer = new IconFixer();
  const srcPath = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Source directory not found:', srcPath);
    process.exit(1);
  }
  
  fixer.fixDirectory(srcPath);
  const report = fixer.generateReport();
  
  // Write report
  const reportPath = path.join(__dirname, '..', 'audit-reports', 'icon-fixes-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('🎯 Icon Fix Summary');
  console.log('===================');
  console.log(`Files processed: ${report.summary.filesProcessed}`);
  console.log(`Files fixed: ${report.summary.filesFixed}`);
  console.log(`Errors: ${report.summary.errors}`);
  
  if (report.fixes.length > 0) {
    console.log('\n✅ Files Fixed:');
    report.fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.file} - ${fix.description}`);
    });
  }
  
  if (report.errors.length > 0) {
    console.log('\n❌ Errors:');
    report.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.file} - ${error.error}`);
    });
  }
  
  console.log('\n💡 Next Steps:');
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report.errors.length > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { IconFixer };