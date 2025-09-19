#!/usr/bin/env node

/**
 * Form Consistency Validator
 * Validates that forms across the application use consistent styling and spacing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  outputFile: path.join(__dirname, '../audit-reports/form-consistency-report.md'),
  componentsDir: path.join(__dirname, '../src/components'),
  
  // Form patterns to validate
  formPatterns: {
    // Button consistency
    buttons: [
      /className.*btn-/g,
      /className.*button/g,
      /Button.*variant/g,
      /Button.*size/g
    ],
    
    // Input consistency  
    inputs: [
      /Input.*className/g,
      /input.*className/g,
      /type="text"/g,
      /type="email"/g,
      /type="password"/g
    ],
    
    // Form structure
    forms: [
      /<form/g,
      /onSubmit/g,
      /form-group/g,
      /form-field/g
    ],
    
    // Label consistency
    labels: [
      /<Label/g,
      /<label/g,
      /htmlFor/g
    ]
  },
  
  // Expected classes for consistency
  expectedClasses: {
    buttons: [
      'btn-standard',
      'btn-primary', 
      'btn-secondary',
      'btn-outline',
      'btn-ghost',
      'btn-destructive'
    ],
    inputs: [
      'input-standard',
      'input-sm',
      'input-lg'
    ],
    forms: [
      'form-container-standard',
      'form-group',
      'form-field',
      'form-actions'
    ],
    textareas: [
      'textarea-standard'
    ]
  }
};

class FormConsistencyValidator {
  constructor() {
    this.issues = [];
    this.stats = {
      filesAnalyzed: 0,
      formsFound: 0,
      buttonsFound: 0,
      inputsFound: 0,
      issuesFound: 0
    };
  }

  /**
   * Main validation function
   */
  async validate() {
    console.log('🔍 Starting form consistency validation...');
    
    try {
      // Analyze components
      await this.analyzeDirectory(CONFIG.componentsDir);
      
      // Generate report
      await this.generateReport();
      
      console.log(`✅ Validation complete! Analyzed ${this.stats.filesAnalyzed} files.`);
      console.log(`📊 Found ${this.stats.formsFound} forms, ${this.stats.buttonsFound} buttons, ${this.stats.inputsFound} inputs.`);
      console.log(`⚠️  Found ${this.stats.issuesFound} consistency issues.`);
      console.log(`📄 Report saved to: ${CONFIG.outputFile}`);
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Analyze a directory recursively
   */
  async analyzeDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️  Directory not found: ${dirPath}`);
      return;
    }

    const files = this.getFilesRecursively(dirPath);
    const relevantFiles = files.filter(file => 
      file.endsWith('.tsx') || file.endsWith('.ts')
    );

    console.log(`📁 Analyzing ${relevantFiles.length} component files...`);

    for (const file of relevantFiles) {
      await this.analyzeFile(file);
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
   * Analyze a single file for form consistency
   */
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(CONFIG.srcDir, filePath);
      
      this.stats.filesAnalyzed++;
      
      const fileIssues = [];
      
      // Check if file contains forms
      const hasForm = content.includes('<form') || content.includes('onSubmit');
      const hasButton = content.includes('Button') || content.includes('<button');
      const hasInput = content.includes('Input') || content.includes('<input');
      
      if (hasForm) this.stats.formsFound++;
      if (hasButton) this.stats.buttonsFound++;
      if (hasInput) this.stats.inputsFound++;
      
      // Only analyze files that have form elements
      if (!hasForm && !hasButton && !hasInput) {
        return;
      }
      
      // Check button consistency
      if (hasButton) {
        const buttonIssues = this.checkButtonConsistency(content);
        if (buttonIssues.length > 0) {
          fileIssues.push({
            category: 'button-consistency',
            issues: buttonIssues
          });
        }
      }
      
      // Check input consistency
      if (hasInput) {
        const inputIssues = this.checkInputConsistency(content);
        if (inputIssues.length > 0) {
          fileIssues.push({
            category: 'input-consistency',
            issues: inputIssues
          });
        }
      }
      
      // Check form structure
      if (hasForm) {
        const formIssues = this.checkFormStructure(content);
        if (formIssues.length > 0) {
          fileIssues.push({
            category: 'form-structure',
            issues: formIssues
          });
        }
      }
      
      // Check spacing consistency in forms
      const spacingIssues = this.checkFormSpacing(content);
      if (spacingIssues.length > 0) {
        fileIssues.push({
          category: 'form-spacing',
          issues: spacingIssues
        });
      }
      
      if (fileIssues.length > 0) {
        this.issues.push({
          file: relativePath,
          issues: fileIssues
        });
        
        this.stats.issuesFound += fileIssues.reduce((sum, issue) => sum + issue.issues.length, 0);
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not analyze file ${filePath}:`, error.message);
    }
  }

  /**
   * Check button consistency
   */
  checkButtonConsistency(content) {
    const issues = [];
    
    // Check for inconsistent button styling
    const buttonMatches = content.match(/<Button[^>]*>/g) || [];
    const buttonElements = content.match(/<button[^>]*>/g) || [];
    
    // Check if using old button classes instead of variants
    if (content.includes('btn-') && !content.includes('btn-standard')) {
      issues.push('Uses old button classes instead of standardized btn-standard classes');
    }
    
    // Check for inconsistent button sizes
    const sizeVariants = ['size="sm"', 'size="lg"', 'size="xl"'];
    const hasMultipleSizes = sizeVariants.filter(size => content.includes(size)).length > 2;
    
    if (hasMultipleSizes) {
      issues.push('Uses too many different button sizes - consider standardizing');
    }
    
    // Check for missing variant props
    for (const match of buttonMatches) {
      if (!match.includes('variant=') && !match.includes('className=')) {
        issues.push('Button without variant or className - may not follow design system');
      }
    }
    
    return issues;
  }

  /**
   * Check input consistency
   */
  checkInputConsistency(content) {
    const issues = [];
    
    // Check for inconsistent input styling
    const inputMatches = content.match(/<Input[^>]*>/g) || [];
    const inputElements = content.match(/<input[^>]*>/g) || [];
    
    // Check if using standardized input classes
    if ((inputMatches.length > 0 || inputElements.length > 0) && !content.includes('input-standard')) {
      issues.push('Inputs may not be using standardized input-standard class');
    }
    
    // Check for inconsistent input heights
    if (content.includes('h-8') || content.includes('h-12') || content.includes('h-14')) {
      if (!content.includes('input-sm') && !content.includes('input-lg')) {
        issues.push('Uses custom input heights instead of standardized size classes');
      }
    }
    
    // Check for missing labels
    const inputCount = inputMatches.length + inputElements.length;
    const labelCount = (content.match(/<Label/g) || []).length + (content.match(/<label/g) || []).length;
    
    if (inputCount > labelCount && inputCount > 1) {
      issues.push('Some inputs may be missing labels - check accessibility');
    }
    
    return issues;
  }

  /**
   * Check form structure
   */
  checkFormStructure(content) {
    const issues = [];
    
    // Check for form container classes
    if (content.includes('<form') && !content.includes('form-container')) {
      issues.push('Form missing standardized container class (form-container-standard)');
    }
    
    // Check for form group structure
    if (content.includes('Input') && !content.includes('form-group') && !content.includes('form-field')) {
      issues.push('Form inputs not wrapped in form-group or form-field for consistent spacing');
    }
    
    // Check for form actions
    if (content.includes('type="submit"') && !content.includes('form-actions')) {
      issues.push('Form submit buttons not wrapped in form-actions for consistent spacing');
    }
    
    return issues;
  }

  /**
   * Check form spacing consistency
   */
  checkFormSpacing(content) {
    const issues = [];
    
    // Check for hardcoded spacing in forms
    const hardcodedSpacing = [
      'mb-4', 'mb-6', 'mb-8', 'mt-4', 'mt-6', 'mt-8',
      'p-4', 'p-6', 'p-8', 'px-4', 'px-6', 'py-4', 'py-6'
    ];
    
    const foundHardcoded = hardcodedSpacing.filter(spacing => content.includes(spacing));
    
    if (foundHardcoded.length > 0) {
      issues.push(`Uses hardcoded spacing classes: ${foundHardcoded.join(', ')} - consider using form spacing classes`);
    }
    
    // Check for inconsistent gap usage
    if (content.includes('gap-') && !content.includes('form-actions')) {
      const gapMatches = content.match(/gap-\d+/g) || [];
      const uniqueGaps = [...new Set(gapMatches)];
      
      if (uniqueGaps.length > 2) {
        issues.push(`Uses multiple gap sizes: ${uniqueGaps.join(', ')} - consider standardizing`);
      }
    }
    
    return issues;
  }

  /**
   * Generate the validation report
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
    
    let content = `# Form Consistency Validation Report

Generated: ${timestamp}

## Summary

- **Files Analyzed**: ${this.stats.filesAnalyzed}
- **Forms Found**: ${this.stats.formsFound}
- **Buttons Found**: ${this.stats.buttonsFound}
- **Inputs Found**: ${this.stats.inputsFound}
- **Issues Found**: ${this.stats.issuesFound}

## Validation Results

`;

    if (this.issues.length === 0) {
      content += `✅ **No form consistency issues found!**

All forms are using consistent styling and spacing patterns.

`;
    } else {
      content += `### Issues by File

`;

      for (const fileIssue of this.issues) {
        content += `#### ${fileIssue.file}

`;

        for (const issue of fileIssue.issues) {
          content += `**${issue.category.toUpperCase().replace('-', ' ')}**

`;

          for (const issueText of issue.issues) {
            content += `- ${issueText}
`;
          }
          
          content += `
`;
        }
      }
    }

    content += `## Form System Reference

### Standardized Classes

#### Form Containers
- \`.form-container-standard\` - Standard form container (max-width: 32rem)
- \`.form-container-wide\` - Wide form container (max-width: 48rem)
- \`.form-container-full\` - Full width form container

#### Form Fields
- \`.form-group\` - Standard form group with consistent spacing
- \`.form-field\` - Vertical form field layout
- \`.form-field-horizontal\` - Horizontal form field layout
- \`.form-actions\` - Form button container with consistent spacing

#### Input Classes
- \`.input-standard\` - Standard input styling
- \`.input-sm\` - Small input (32px height)
- \`.input-lg\` - Large input (48px height)
- \`.textarea-standard\` - Standard textarea styling

#### Button Classes
- \`.btn-standard\` - Base button styling
- \`.btn-primary\` - Primary button variant
- \`.btn-secondary\` - Secondary button variant
- \`.btn-outline\` - Outline button variant
- \`.btn-ghost\` - Ghost button variant
- \`.btn-destructive\` - Destructive button variant

### Size Variants
- \`.btn-sm\` - Small button (36px height)
- \`.btn-lg\` - Large button (48px height)
- \`.btn-xl\` - Extra large button (56px height)

## Recommendations

### High Priority
1. **Standardize Button Styling**: Use btn-standard base class with appropriate variants
2. **Consistent Input Styling**: Apply input-standard class to all inputs
3. **Form Structure**: Wrap forms in appropriate container classes
4. **Form Spacing**: Use form-group and form-actions for consistent spacing

### Medium Priority
1. **Label Consistency**: Ensure all inputs have proper labels
2. **Size Standardization**: Limit button and input size variants
3. **Spacing Classes**: Replace hardcoded spacing with form spacing classes

### Low Priority
1. **Accessibility**: Add proper ARIA labels and descriptions
2. **Validation States**: Implement consistent error and success states
3. **Mobile Optimization**: Ensure forms work well on mobile devices

## Next Steps

1. **Update Components**: Apply standardized classes to existing forms
2. **Create Form Templates**: Build reusable form components
3. **Add Validation**: Implement consistent form validation
4. **Test Accessibility**: Ensure all forms meet WCAG guidelines
5. **Monitor Compliance**: Set up linting rules for form consistency

---

*This report was generated by the Form Consistency Validator*
`;

    return content;
  }
}

// Run the validator
if (require.main === module) {
  const validator = new FormConsistencyValidator();
  validator.validate().catch(console.error);
}

module.exports = FormConsistencyValidator;