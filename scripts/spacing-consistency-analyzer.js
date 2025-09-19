#!/usr/bin/env node

/**
 * Spacing Consistency Analyzer
 * Analyzes components for inconsistent spacing patterns and suggests fixes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  outputFile: path.join(__dirname, '../audit-reports/spacing-analysis.md'),
  componentsDir: path.join(__dirname, '../src/components'),
  stylesDir: path.join(__dirname, '../src/styles'),
  
  // Spacing patterns to look for
  spacingPatterns: {
    // Inconsistent padding patterns
    padding: [
      /padding:\s*(\d+)px/g,
      /padding-top:\s*(\d+)px/g,
      /padding-bottom:\s*(\d+)px/g,
      /padding-left:\s*(\d+)px/g,
      /padding-right:\s*(\d+)px/g,
      /p-\d+/g,
      /px-\d+/g,
      /py-\d+/g,
      /pt-\d+/g,
      /pb-\d+/g,
      /pl-\d+/g,
      /pr-\d+/g
    ],
    
    // Inconsistent margin patterns
    margin: [
      /margin:\s*(\d+)px/g,
      /margin-top:\s*(\d+)px/g,
      /margin-bottom:\s*(\d+)px/g,
      /margin-left:\s*(\d+)px/g,
      /margin-right:\s*(\d+)px/g,
      /m-\d+/g,
      /mx-\d+/g,
      /my-\d+/g,
      /mt-\d+/g,
      /mb-\d+/g,
      /ml-\d+/g,
      /mr-\d+/g
    ],
    
    // Gap patterns
    gap: [
      /gap:\s*(\d+)px/g,
      /gap-\d+/g,
      /space-x-\d+/g,
      /space-y-\d+/g
    ]
  },
  
  // Standard spacing values from design tokens (in px)
  standardSpacing: {
    'var(--space-0)': 0,
    'var(--space-px)': 1,
    'var(--space-0-5)': 2,
    'var(--space-1)': 4,
    'var(--space-1-5)': 6,
    'var(--space-2)': 8,
    'var(--space-2-5)': 10,
    'var(--space-3)': 12,
    'var(--space-3-5)': 14,
    'var(--space-4)': 16,
    'var(--space-5)': 20,
    'var(--space-6)': 24,
    'var(--space-7)': 28,
    'var(--space-8)': 32,
    'var(--space-9)': 36,
    'var(--space-10)': 40,
    'var(--space-11)': 44,
    'var(--space-12)': 48,
    'var(--space-14)': 56,
    'var(--space-16)': 64,
    'var(--space-20)': 80,
    'var(--space-24)': 96,
    'var(--space-28)': 112,
    'var(--space-32)': 128
  }
};

class SpacingAnalyzer {
  constructor() {
    this.issues = [];
    this.suggestions = [];
    this.stats = {
      filesAnalyzed: 0,
      issuesFound: 0,
      componentsWithIssues: 0
    };
  }

  /**
   * Main analysis function
   */
  async analyze() {
    console.log('🔍 Starting spacing consistency analysis...');
    
    try {
      // Analyze components
      await this.analyzeDirectory(CONFIG.componentsDir, 'components');
      
      // Analyze styles
      await this.analyzeDirectory(CONFIG.stylesDir, 'styles');
      
      // Generate report
      await this.generateReport();
      
      console.log(`✅ Analysis complete! Found ${this.stats.issuesFound} spacing issues in ${this.stats.componentsWithIssues} files.`);
      console.log(`📄 Report saved to: ${CONFIG.outputFile}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Analyze a directory recursively
   */
  async analyzeDirectory(dirPath, type) {
    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️  Directory not found: ${dirPath}`);
      return;
    }

    const files = this.getFilesRecursively(dirPath);
    const relevantFiles = files.filter(file => 
      file.endsWith('.tsx') || 
      file.endsWith('.ts') || 
      file.endsWith('.css') ||
      file.endsWith('.scss')
    );

    console.log(`📁 Analyzing ${relevantFiles.length} files in ${type}...`);

    for (const file of relevantFiles) {
      await this.analyzeFile(file, type);
    }
  }

  /**
   * Get all files recursively from a directory
   */
  getFilesRecursively(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!item.startsWith('.') && item !== 'node_modules' && item !== '__tests__') {
            traverse(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  /**
   * Analyze a single file for spacing issues
   */
  async analyzeFile(filePath, type) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(CONFIG.srcDir, filePath);
      
      this.stats.filesAnalyzed++;
      
      const fileIssues = [];
      
      // Check for inconsistent spacing patterns
      for (const [category, patterns] of Object.entries(CONFIG.spacingPatterns)) {
        for (const pattern of patterns) {
          const matches = [...content.matchAll(pattern)];
          
          if (matches.length > 0) {
            const spacingValues = this.extractSpacingValues(matches, pattern);
            const inconsistencies = this.findInconsistencies(spacingValues);
            
            if (inconsistencies.length > 0) {
              fileIssues.push({
                category,
                pattern: pattern.toString(),
                inconsistencies,
                matches: matches.length,
                lines: this.getLineNumbers(content, matches)
              });
            }
          }
        }
      }
      
      // Check for hardcoded pixel values
      const hardcodedPixels = this.findHardcodedPixels(content);
      if (hardcodedPixels.length > 0) {
        fileIssues.push({
          category: 'hardcoded-pixels',
          inconsistencies: hardcodedPixels,
          matches: hardcodedPixels.length
        });
      }
      
      // Check for missing spacing classes
      const missingSpacingClasses = this.findMissingSpacingClasses(content, filePath);
      if (missingSpacingClasses.length > 0) {
        fileIssues.push({
          category: 'missing-spacing-classes',
          suggestions: missingSpacingClasses
        });
      }
      
      if (fileIssues.length > 0) {
        this.issues.push({
          file: relativePath,
          type,
          issues: fileIssues
        });
        
        this.stats.componentsWithIssues++;
        this.stats.issuesFound += fileIssues.length;
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not analyze file ${filePath}:`, error.message);
    }
  }

  /**
   * Extract spacing values from regex matches
   */
  extractSpacingValues(matches, pattern) {
    return matches.map(match => {
      if (match[1]) {
        return parseInt(match[1]);
      }
      return match[0];
    });
  }

  /**
   * Find inconsistencies in spacing values
   */
  findInconsistencies(values) {
    const uniqueValues = [...new Set(values)];
    
    // If there are multiple different values, it might be inconsistent
    if (uniqueValues.length > 3) {
      return uniqueValues;
    }
    
    // Check if values don't follow 4px grid
    const nonGridValues = uniqueValues.filter(value => {
      if (typeof value === 'number') {
        return value % 4 !== 0;
      }
      return false;
    });
    
    return nonGridValues;
  }

  /**
   * Get line numbers for matches
   */
  getLineNumbers(content, matches) {
    const lines = content.split('\n');
    const lineNumbers = [];
    
    for (const match of matches) {
      const index = match.index;
      let lineNumber = 1;
      let currentIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (currentIndex + lines[i].length >= index) {
          lineNumbers.push(i + 1);
          break;
        }
        currentIndex += lines[i].length + 1; // +1 for newline
      }
    }
    
    return [...new Set(lineNumbers)];
  }

  /**
   * Find hardcoded pixel values that should use design tokens
   */
  findHardcodedPixels(content) {
    const pixelPattern = /(\d+)px/g;
    const matches = [...content.matchAll(pixelPattern)];
    
    const hardcodedValues = matches
      .map(match => parseInt(match[1]))
      .filter(value => {
        // Check if this value exists in our standard spacing
        const standardValues = Object.values(CONFIG.standardSpacing);
        return !standardValues.includes(value) && value <= 128; // Only flag reasonable spacing values
      });
    
    return [...new Set(hardcodedValues)];
  }

  /**
   * Find components that could benefit from spacing classes
   */
  findMissingSpacingClasses(content, filePath) {
    const suggestions = [];
    
    // Check for components that might need card spacing
    if (content.includes('Card') && !content.includes('card-spacing')) {
      suggestions.push('Consider using card-spacing-standard class for consistent card padding');
    }
    
    // Check for form components
    if ((content.includes('form') || content.includes('Form')) && !content.includes('form-spacing')) {
      suggestions.push('Consider using form-spacing-standard class for consistent form layout');
    }
    
    // Check for grid layouts
    if ((content.includes('grid') || content.includes('Grid')) && !content.includes('grid-spacing')) {
      suggestions.push('Consider using grid-spacing-standard class for consistent grid gaps');
    }
    
    // Check for navigation components
    if (content.includes('nav') && !content.includes('nav-item-spacing')) {
      suggestions.push('Consider using nav-item-spacing class for consistent navigation spacing');
    }
    
    return suggestions;
  }

  /**
   * Generate spacing suggestions based on pixel values
   */
  generateSpacingSuggestions(pixelValue) {
    const suggestions = [];
    
    // Find closest standard spacing value
    const standardValues = Object.entries(CONFIG.standardSpacing);
    let closest = null;
    let minDiff = Infinity;
    
    for (const [token, value] of standardValues) {
      const diff = Math.abs(value - pixelValue);
      if (diff < minDiff) {
        minDiff = diff;
        closest = { token, value, diff };
      }
    }
    
    if (closest && closest.diff <= 4) {
      suggestions.push(`Replace ${pixelValue}px with ${closest.token} (${closest.value}px)`);
    } else {
      // Suggest the closest multiple of 4
      const roundedValue = Math.round(pixelValue / 4) * 4;
      const matchingToken = standardValues.find(([, value]) => value === roundedValue);
      
      if (matchingToken) {
        suggestions.push(`Consider changing ${pixelValue}px to ${roundedValue}px and use ${matchingToken[0]}`);
      } else {
        suggestions.push(`Consider changing ${pixelValue}px to ${roundedValue}px (follows 4px grid)`);
      }
    }
    
    return suggestions;
  }

  /**
   * Generate the analysis report
   */
  async generateReport() {
    const reportContent = this.buildReportContent();
    
    // Ensure output directory exists
    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.outputFile, reportContent, 'utf8');
  }

  /**
   * Build the report content
   */
  buildReportContent() {
    const timestamp = new Date().toISOString();
    
    let content = `# Spacing Consistency Analysis Report

Generated: ${timestamp}

## Summary

- **Files Analyzed**: ${this.stats.filesAnalyzed}
- **Issues Found**: ${this.stats.issuesFound}
- **Components with Issues**: ${this.stats.componentsWithIssues}

## Analysis Results

`;

    if (this.issues.length === 0) {
      content += `✅ **No spacing consistency issues found!**

All components are using consistent spacing patterns.

`;
    } else {
      content += `### Issues by File

`;

      for (const fileIssue of this.issues) {
        content += `#### ${fileIssue.file}

**Type**: ${fileIssue.type}

`;

        for (const issue of fileIssue.issues) {
          content += `**${issue.category.toUpperCase()}**

`;

          if (issue.inconsistencies) {
            content += `- Found inconsistent values: ${issue.inconsistencies.join(', ')}
`;
            if (issue.lines) {
              content += `- Lines: ${issue.lines.join(', ')}
`;
            }
            
            // Generate suggestions for hardcoded pixels
            if (issue.category === 'hardcoded-pixels') {
              content += `- **Suggestions**:
`;
              for (const value of issue.inconsistencies) {
                const suggestions = this.generateSpacingSuggestions(value);
                for (const suggestion of suggestions) {
                  content += `  - ${suggestion}
`;
                }
              }
            }
          }
          
          if (issue.suggestions) {
            content += `- **Suggestions**:
`;
            for (const suggestion of issue.suggestions) {
              content += `  - ${suggestion}
`;
            }
          }
          
          content += `
`;
        }
      }
    }

    content += `## Spacing System Reference

### Available Spacing Classes

#### Padding Classes
- \`.spacing-p-xs\` - 4px padding
- \`.spacing-p-sm\` - 8px padding  
- \`.spacing-p-md\` - 16px padding
- \`.spacing-p-lg\` - 24px padding
- \`.spacing-p-xl\` - 32px padding

#### Margin Classes
- \`.spacing-m-xs\` - 4px margin
- \`.spacing-m-sm\` - 8px margin
- \`.spacing-m-md\` - 16px margin
- \`.spacing-m-lg\` - 24px margin
- \`.spacing-m-xl\` - 32px margin

#### Component-Specific Classes
- \`.card-spacing-standard\` - Standard card padding (24px)
- \`.form-spacing-standard\` - Standard form spacing
- \`.grid-spacing-standard\` - Standard grid gap (16px)
- \`.nav-item-spacing\` - Standard navigation item spacing

### Design Token Reference

`;

    for (const [token, value] of Object.entries(CONFIG.standardSpacing)) {
      content += `- \`${token}\` = ${value}px
`;
    }

    content += `

## Recommendations

### High Priority
1. Replace hardcoded pixel values with design tokens
2. Use component-specific spacing classes for consistency
3. Ensure all spacing follows the 4px grid system

### Medium Priority
1. Standardize spacing in similar components
2. Use utility classes for common spacing patterns
3. Add spacing classes to components missing them

### Low Priority
1. Consider responsive spacing adjustments
2. Review and optimize spacing for mobile devices
3. Add spacing debugging helpers during development

## Next Steps

1. **Fix Critical Issues**: Address hardcoded pixel values first
2. **Apply Spacing Classes**: Use the new spacing system classes
3. **Test Changes**: Verify visual consistency after changes
4. **Update Components**: Gradually migrate components to use standard spacing
5. **Monitor**: Set up linting rules to prevent future inconsistencies

---

*This report was generated by the Spacing Consistency Analyzer*
`;

    return content;
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new SpacingAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = SpacingAnalyzer;