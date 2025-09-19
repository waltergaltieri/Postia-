#!/usr/bin/env node

/**
 * Hover States Analysis Script
 * Analyzes the codebase to identify interactive elements that need hover states
 */

const fs = require('fs');
const path = require('path');

class HoverStateAnalyzer {
  constructor() {
    this.results = {
      componentsAnalyzed: 0,
      interactiveElements: [],
      missingHoverStates: [],
      existingHoverStates: [],
      recommendations: []
    };
    
    this.interactiveSelectors = [
      'button',
      '[role="button"]',
      'a',
      'input[type="button"]',
      'input[type="submit"]',
      '.btn',
      '.card',
      '.nav-item',
      '.dropdown-item',
      '.tab',
      '.badge',
      '.link'
    ];
    
    this.hoverPatterns = [
      /hover:/g,
      /:hover/g,
      /onMouseEnter/g,
      /onMouseLeave/g,
      /hover-/g,
      /\.hover/g
    ];
  }

  async analyzeProject() {
    console.log('🔍 Analyzing hover states in the project...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    await this.analyzeDirectory(srcDir);
    
    this.generateRecommendations();
    this.generateReport();
  }

  async analyzeDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          await this.analyzeDirectory(fullPath);
        } else if (entry.isFile() && this.shouldAnalyzeFile(entry.name)) {
          await this.analyzeFile(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not analyze directory ${dirPath}:`, error.message);
    }
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', '__tests__'];
    return skipDirs.includes(dirName);
  }

  shouldAnalyzeFile(fileName) {
    const extensions = ['.tsx', '.jsx', '.ts', '.js', '.css', '.scss'];
    return extensions.some(ext => fileName.endsWith(ext));
  }

  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      this.results.componentsAnalyzed++;
      
      // Check for interactive elements
      const interactiveElements = this.findInteractiveElements(content, relativePath);
      this.results.interactiveElements.push(...interactiveElements);
      
      // Check for existing hover states
      const existingHovers = this.findExistingHoverStates(content, relativePath);
      this.results.existingHoverStates.push(...existingHovers);
      
      // Identify missing hover states
      const missingHovers = this.identifyMissingHoverStates(content, relativePath);
      this.results.missingHoverStates.push(...missingHovers);
      
    } catch (error) {
      console.warn(`Warning: Could not analyze file ${filePath}:`, error.message);
    }
  }

  findInteractiveElements(content, filePath) {
    const elements = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      this.interactiveSelectors.forEach(selector => {
        if (line.includes(selector) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          elements.push({
            file: filePath,
            line: index + 1,
            element: selector,
            context: line.trim(),
            hasHover: this.lineHasHover(line)
          });
        }
      });
    });
    
    return elements;
  }

  findExistingHoverStates(content, filePath) {
    const hovers = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      this.hoverPatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          hovers.push({
            file: filePath,
            line: index + 1,
            pattern: pattern.source,
            context: line.trim()
          });
        }
      });
    });
    
    return hovers;
  }

  identifyMissingHoverStates(content, filePath) {
    const missing = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Look for buttons without hover states
      if ((line.includes('<button') || line.includes('Button')) && 
          !this.lineHasHover(line) && 
          !line.trim().startsWith('//')) {
        missing.push({
          file: filePath,
          line: index + 1,
          element: 'button',
          issue: 'Missing hover state',
          context: line.trim(),
          severity: 'medium'
        });
      }
      
      // Look for cards without hover states
      if ((line.includes('card') || line.includes('Card')) && 
          line.includes('className') &&
          !this.lineHasHover(line) && 
          !line.trim().startsWith('//')) {
        missing.push({
          file: filePath,
          line: index + 1,
          element: 'card',
          issue: 'Potentially missing interactive hover state',
          context: line.trim(),
          severity: 'low'
        });
      }
      
      // Look for navigation items without hover states
      if ((line.includes('nav-item') || line.includes('navigation')) && 
          !this.lineHasHover(line) && 
          !line.trim().startsWith('//')) {
        missing.push({
          file: filePath,
          line: index + 1,
          element: 'navigation',
          issue: 'Missing navigation hover state',
          context: line.trim(),
          severity: 'medium'
        });
      }
    });
    
    return missing;
  }

  lineHasHover(line) {
    return this.hoverPatterns.some(pattern => pattern.test(line));
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze missing hover states by severity
    const criticalMissing = this.results.missingHoverStates.filter(item => item.severity === 'high');
    const mediumMissing = this.results.missingHoverStates.filter(item => item.severity === 'medium');
    const lowMissing = this.results.missingHoverStates.filter(item => item.severity === 'low');
    
    if (criticalMissing.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Critical Interactive Elements',
        description: `${criticalMissing.length} critical interactive elements missing hover states`,
        action: 'Add hover states immediately for accessibility and usability'
      });
    }
    
    if (mediumMissing.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Interactive Elements',
        description: `${mediumMissing.length} interactive elements could benefit from hover states`,
        action: 'Add consistent hover states using the new interaction-states.css system'
      });
    }
    
    if (lowMissing.length > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Enhancement Opportunities',
        description: `${lowMissing.length} elements could have enhanced hover states`,
        action: 'Consider adding subtle hover effects for better user experience'
      });
    }
    
    // Component-specific recommendations
    const componentTypes = {};
    this.results.missingHoverStates.forEach(item => {
      componentTypes[item.element] = (componentTypes[item.element] || 0) + 1;
    });
    
    Object.entries(componentTypes).forEach(([element, count]) => {
      if (count > 3) {
        recommendations.push({
          priority: 'MEDIUM',
          category: `${element.charAt(0).toUpperCase() + element.slice(1)} Components`,
          description: `${count} ${element} elements need consistent hover states`,
          action: `Apply .${element}-hover class or create component-specific hover styles`
        });
      }
    });
    
    this.results.recommendations = recommendations;
  }

  generateReport() {
    console.log('📊 HOVER STATES ANALYSIS REPORT');
    console.log('================================\n');
    
    console.log(`📁 Components Analyzed: ${this.results.componentsAnalyzed}`);
    console.log(`🎯 Interactive Elements Found: ${this.results.interactiveElements.length}`);
    console.log(`✅ Existing Hover States: ${this.results.existingHoverStates.length}`);
    console.log(`❌ Missing Hover States: ${this.results.missingHoverStates.length}\n`);
    
    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('🎯 RECOMMENDATIONS');
      console.log('==================\n');
      
      this.results.recommendations.forEach((rec, index) => {
        const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`${priorityIcon} ${rec.priority} - ${rec.category}`);
        console.log(`   ${rec.description}`);
        console.log(`   Action: ${rec.action}\n`);
      });
    }
    
    // Missing hover states details
    if (this.results.missingHoverStates.length > 0) {
      console.log('❌ MISSING HOVER STATES DETAILS');
      console.log('===============================\n');
      
      const groupedByFile = {};
      this.results.missingHoverStates.forEach(item => {
        if (!groupedByFile[item.file]) {
          groupedByFile[item.file] = [];
        }
        groupedByFile[item.file].push(item);
      });
      
      Object.entries(groupedByFile).forEach(([file, items]) => {
        console.log(`📄 ${file}`);
        items.forEach(item => {
          const severityIcon = item.severity === 'high' ? '🔴' : item.severity === 'medium' ? '🟡' : '🟢';
          console.log(`   ${severityIcon} Line ${item.line}: ${item.issue}`);
          console.log(`      ${item.context.substring(0, 80)}${item.context.length > 80 ? '...' : ''}`);
        });
        console.log('');
      });
    }
    
    // Implementation suggestions
    console.log('💡 IMPLEMENTATION SUGGESTIONS');
    console.log('=============================\n');
    
    console.log('1. Apply hover classes from interaction-states.css:');
    console.log('   - .hover-normal for primary interactive elements');
    console.log('   - .hover-subtle for secondary elements');
    console.log('   - .hover-prominent for call-to-action elements');
    console.log('   - .nav-item-hover for navigation items\n');
    
    console.log('2. Update component variants to include hover states:');
    console.log('   - Button components: Add hover variants');
    console.log('   - Card components: Add interactive prop with hover');
    console.log('   - Navigation components: Ensure consistent hover feedback\n');
    
    console.log('3. Test hover states across different devices:');
    console.log('   - Desktop: Full hover effects');
    console.log('   - Touch devices: Active states only');
    console.log('   - High contrast mode: Enhanced outlines\n');
    
    // Save detailed report
    this.saveDetailedReport();
  }

  saveDetailedReport() {
    const reportPath = path.join(process.cwd(), 'audit-reports', 'hover-states-analysis.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        componentsAnalyzed: this.results.componentsAnalyzed,
        interactiveElements: this.results.interactiveElements.length,
        existingHoverStates: this.results.existingHoverStates.length,
        missingHoverStates: this.results.missingHoverStates.length
      },
      recommendations: this.results.recommendations,
      details: {
        interactiveElements: this.results.interactiveElements,
        existingHoverStates: this.results.existingHoverStates,
        missingHoverStates: this.results.missingHoverStates
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Detailed report saved to: ${reportPath}\n`);
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new HoverStateAnalyzer();
  analyzer.analyzeProject().catch(console.error);
}

module.exports = HoverStateAnalyzer;