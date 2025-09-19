#!/usr/bin/env node

/**
 * Comprehensive Style Audit Runner
 * 
 * Orchestrates all audit tools to provide a complete analysis of style issues
 * in the Postia SaaS application.
 */

const AccessibilityAuditor = require('./accessibility-audit');
const ContrastAnalyzer = require('./contrast-analyzer');
const SidebarLayoutAnalyzer = require('./sidebar-layout-analyzer');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        moderateIssues: 0,
        minorIssues: 0,
        auditTypes: []
      },
      audits: {},
      prioritizedIssues: [],
      recommendations: []
    };
  }

  async runAllAudits() {
    console.log('🔍 Starting Comprehensive Style Audit...');
    console.log('=====================================');
    
    const outputDir = './audit-reports';
    await fs.mkdir(outputDir, { recursive: true });
    
    try {
      // 1. Accessibility Audit
      console.log('\n1️⃣ Running Accessibility Audit...');
      const accessibilityAuditor = new AccessibilityAuditor();
      const accessibilityResults = await accessibilityAuditor.run();
      this.results.audits.accessibility = accessibilityResults;
      this.results.summary.auditTypes.push('accessibility');
      
      // 2. Contrast Analysis
      console.log('\n2️⃣ Running Contrast Analysis...');
      const contrastAnalyzer = new ContrastAnalyzer();
      const contrastResults = await contrastAnalyzer.run();
      this.results.audits.contrast = contrastResults;
      this.results.summary.auditTypes.push('contrast');
      
      // 3. Sidebar Layout Analysis
      console.log('\n3️⃣ Running Sidebar Layout Analysis...');
      const sidebarAnalyzer = new SidebarLayoutAnalyzer();
      const sidebarResults = await sidebarAnalyzer.run();
      this.results.audits.sidebar = sidebarResults;
      this.results.summary.auditTypes.push('sidebar');
      
      // 4. Generate Combined Report
      console.log('\n4️⃣ Generating Combined Reports...');
      await this.generateCombinedReports();
      
      console.log('\n🎉 Comprehensive audit completed successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Comprehensive audit failed:', error);
      throw error;
    }
  }

  async generateCombinedReports() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = './audit-reports';
    
    // Collect and prioritize all issues
    await this.collectAndPrioritizeIssues();
    
    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary();
    const summaryPath = path.join(outputDir, `executive-summary-${timestamp}.md`);
    await fs.writeFile(summaryPath, executiveSummary);
    
    // Generate implementation plan
    const implementationPlan = this.generateImplementationPlan();
    const planPath = path.join(outputDir, `implementation-plan-${timestamp}.md`);
    await fs.writeFile(planPath, implementationPlan);
    
    // Generate combined CSS fixes
    const combinedCSS = await this.generateCombinedCSSFixes();
    const cssPath = path.join(outputDir, `combined-style-fixes-${timestamp}.css`);
    await fs.writeFile(cssPath, combinedCSS);
    
    // Generate JSON report
    const jsonPath = path.join(outputDir, `comprehensive-audit-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));
    
    console.log('📄 Combined Reports Generated:');
    console.log(`  📋 Executive Summary: ${summaryPath}`);
    console.log(`  📝 Implementation Plan: ${planPath}`);
    console.log(`  🎨 Combined CSS Fixes: ${cssPath}`);
    console.log(`  📊 JSON Report: ${jsonPath}`);
    
    return {
      summary: summaryPath,
      plan: planPath,
      css: cssPath,
      json: jsonPath
    };
  }

  async collectAndPrioritizeIssues() {
    const allIssues = [];
    
    // Read accessibility audit results
    try {
      const accessibilityFiles = await fs.readdir('./audit-reports');
      const latestAccessibility = accessibilityFiles
        .filter(f => f.startsWith('accessibility-audit-') && f.endsWith('.json'))
        .sort()
        .pop();
      
      if (latestAccessibility) {
        const accessibilityData = JSON.parse(
          await fs.readFile(path.join('./audit-reports', latestAccessibility), 'utf8')
        );
        
        // Extract issues from accessibility audit
        accessibilityData.pages?.forEach(page => {
          page.axeResults?.violations?.forEach(violation => {
            allIssues.push({
              source: 'accessibility',
              page: page.name,
              type: violation.id,
              description: violation.description,
              severity: this.mapAxeSeverity(violation.impact),
              category: 'accessibility',
              details: violation,
              priority: this.calculatePriority('accessibility', violation.impact, violation.nodes?.length || 1)
            });
          });
          
          page.contrastIssues?.forEach(issue => {
            allIssues.push({
              source: 'accessibility',
              page: page.name,
              type: issue.type,
              description: issue.description,
              severity: issue.severity,
              category: 'contrast',
              details: issue,
              priority: this.calculatePriority('contrast', issue.severity, 1)
            });
          });
          
          page.layoutIssues?.forEach(issue => {
            allIssues.push({
              source: 'accessibility',
              page: page.name,
              type: issue.type,
              description: issue.description,
              severity: issue.severity,
              category: 'layout',
              details: issue,
              priority: this.calculatePriority('layout', issue.severity, 1)
            });
          });
        });
      }
    } catch (error) {
      console.warn('Could not read accessibility audit results:', error.message);
    }
    
    // Read contrast analysis results
    try {
      const contrastFiles = await fs.readdir('./audit-reports');
      const latestContrast = contrastFiles
        .filter(f => f.startsWith('contrast-analysis-') && f.endsWith('.json'))
        .sort()
        .pop();
      
      if (latestContrast) {
        const contrastData = JSON.parse(
          await fs.readFile(path.join('./audit-reports', latestContrast), 'utf8')
        );
        
        contrastData.violations?.forEach(violation => {
          allIssues.push({
            source: 'contrast',
            page: 'multiple',
            type: 'contrast-violation',
            description: `Low contrast: ${violation.contrastRatio}:1 ratio`,
            severity: violation.severity,
            category: 'contrast',
            details: violation,
            priority: this.calculatePriority('contrast', violation.severity, 1)
          });
        });
      }
    } catch (error) {
      console.warn('Could not read contrast analysis results:', error.message);
    }
    
    // Read sidebar layout results
    try {
      const sidebarFiles = await fs.readdir('./audit-reports');
      const latestSidebar = sidebarFiles
        .filter(f => f.startsWith('sidebar-layout-analysis-') && f.endsWith('.json'))
        .sort()
        .pop();
      
      if (latestSidebar) {
        const sidebarData = JSON.parse(
          await fs.readFile(path.join('./audit-reports', latestSidebar), 'utf8')
        );
        
        sidebarData.issues?.forEach(issue => {
          allIssues.push({
            source: 'sidebar',
            page: issue.page,
            type: issue.type,
            description: issue.description,
            severity: issue.severity,
            category: issue.category,
            details: issue,
            priority: this.calculatePriority('sidebar', issue.severity, 1)
          });
        });
      }
    } catch (error) {
      console.warn('Could not read sidebar layout results:', error.message);
    }
    
    // Sort by priority (higher number = higher priority)
    this.results.prioritizedIssues = allIssues.sort((a, b) => b.priority - a.priority);
    
    // Update summary
    this.results.summary.totalIssues = allIssues.length;
    this.results.summary.criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    this.results.summary.highIssues = allIssues.filter(i => i.severity === 'high').length;
    this.results.summary.moderateIssues = allIssues.filter(i => i.severity === 'moderate').length;
    this.results.summary.minorIssues = allIssues.filter(i => i.severity === 'minor').length;
  }

  mapAxeSeverity(axeImpact) {
    const mapping = {
      'critical': 'critical',
      'serious': 'high',
      'moderate': 'moderate',
      'minor': 'minor'
    };
    return mapping[axeImpact] || 'minor';
  }

  calculatePriority(source, severity, count) {
    const severityWeights = {
      'critical': 100,
      'high': 75,
      'moderate': 50,
      'minor': 25
    };
    
    const sourceWeights = {
      'accessibility': 1.2,
      'contrast': 1.1,
      'sidebar': 1.0
    };
    
    const baseScore = severityWeights[severity] || 25;
    const sourceMultiplier = sourceWeights[source] || 1.0;
    const countMultiplier = Math.min(count, 10) / 10; // Cap at 10 occurrences
    
    return Math.round(baseScore * sourceMultiplier * (1 + countMultiplier));
  }

  generateExecutiveSummary() {
    const topIssues = this.results.prioritizedIssues.slice(0, 10);
    const criticalIssues = this.results.prioritizedIssues.filter(i => i.severity === 'critical');
    
    return `# 📊 Executive Summary - Style Audit

**Generated:** ${this.results.timestamp}  
**Application:** Postia SaaS

## 🎯 Key Findings

The comprehensive style audit identified **${this.results.summary.totalIssues} issues** across accessibility, color contrast, and layout categories. Immediate attention is required for **${this.results.summary.criticalIssues} critical issues** that significantly impact user experience.

### Issue Breakdown

| Severity | Count | Percentage |
|----------|-------|------------|
| Critical | ${this.results.summary.criticalIssues} | ${((this.results.summary.criticalIssues / this.results.summary.totalIssues) * 100).toFixed(1)}% |
| High | ${this.results.summary.highIssues} | ${((this.results.summary.highIssues / this.results.summary.totalIssues) * 100).toFixed(1)}% |
| Moderate | ${this.results.summary.moderateIssues} | ${((this.results.summary.moderateIssues / this.results.summary.totalIssues) * 100).toFixed(1)}% |
| Minor | ${this.results.summary.minorIssues} | ${((this.results.summary.minorIssues / this.results.summary.totalIssues) * 100).toFixed(1)}% |

## 🚨 Top Priority Issues

${topIssues.map((issue, index) => `
### ${index + 1}. ${issue.type} (${issue.severity.toUpperCase()})

- **Source:** ${issue.source}
- **Page:** ${issue.page}
- **Description:** ${issue.description}
- **Priority Score:** ${issue.priority}
`).join('\n')}

## 🎨 Critical Accessibility Issues

${criticalIssues.length > 0 ? criticalIssues.map(issue => `
- **${issue.type}**: ${issue.description} (${issue.page})
`).join('\n') : 'No critical accessibility issues found.'}

## 📈 Impact Assessment

### User Experience Impact
- **High Impact:** ${this.results.summary.criticalIssues + this.results.summary.highIssues} issues affecting core usability
- **Medium Impact:** ${this.results.summary.moderateIssues} issues affecting user satisfaction
- **Low Impact:** ${this.results.summary.minorIssues} issues affecting polish and consistency

### Business Impact
- **Accessibility Compliance:** ${this.results.summary.criticalIssues > 0 ? '❌ Non-compliant' : '✅ Compliant'}
- **Brand Consistency:** ${this.results.summary.moderateIssues > 10 ? '⚠️ Needs improvement' : '✅ Good'}
- **User Retention Risk:** ${this.results.summary.criticalIssues > 5 ? '🔴 High' : this.results.summary.criticalIssues > 0 ? '🟡 Medium' : '🟢 Low'}

## 🔧 Recommended Actions

### Immediate (This Sprint)
1. Fix all critical accessibility violations
2. Resolve white-on-white text issues
3. Fix sidebar layout overlaps
4. Implement proper focus indicators

### Short Term (Next 2 Sprints)
1. Standardize color contrast across components
2. Align icons and text in navigation
3. Implement consistent spacing system
4. Improve responsive behavior

### Long Term (Next Quarter)
1. Establish comprehensive design system
2. Implement automated accessibility testing
3. Create style guide documentation
4. Set up continuous monitoring

## 💰 Estimated Effort

- **Critical Issues:** ~${Math.ceil(this.results.summary.criticalIssues * 2)} developer hours
- **High Priority:** ~${Math.ceil(this.results.summary.highIssues * 1.5)} developer hours
- **Total Estimated:** ~${Math.ceil((this.results.summary.criticalIssues * 2) + (this.results.summary.highIssues * 1.5) + (this.results.summary.moderateIssues * 1))} developer hours

## 🎯 Success Metrics

- **Target:** 0 critical accessibility violations
- **Target:** < 5 high priority issues
- **Target:** WCAG 2.1 AA compliance score > 95%
- **Target:** Consistent visual patterns across all components

---

*This summary is based on automated analysis. Manual testing and stakeholder review are recommended before implementation.*
`;
  }

  generateImplementationPlan() {
    const criticalIssues = this.results.prioritizedIssues.filter(i => i.severity === 'critical');
    const highIssues = this.results.prioritizedIssues.filter(i => i.severity === 'high');
    const moderateIssues = this.results.prioritizedIssues.filter(i => i.severity === 'moderate');
    
    return `# 📋 Implementation Plan - Style Fixes

**Generated:** ${this.results.timestamp}  
**Application:** Postia SaaS

## 🎯 Implementation Strategy

This plan prioritizes fixes based on user impact, accessibility compliance, and implementation effort. Issues are grouped into sprints for manageable implementation.

## 🚨 Sprint 1: Critical Fixes (Week 1)

**Goal:** Resolve all critical accessibility and usability issues

### Tasks

${criticalIssues.slice(0, 10).map((issue, index) => `
#### ${index + 1}. Fix ${issue.type}

- **Priority:** ${issue.priority}
- **Page:** ${issue.page}
- **Description:** ${issue.description}
- **Category:** ${issue.category}
- **Estimated Effort:** ${this.estimateEffort(issue)} hours
- **Acceptance Criteria:**
  - Issue no longer appears in automated tests
  - Manual testing confirms fix
  - No regression in related functionality

**Implementation Notes:**
\`\`\`
${this.generateImplementationNotes(issue)}
\`\`\`
`).join('\n')}

**Sprint 1 Total Effort:** ~${criticalIssues.slice(0, 10).reduce((total, issue) => total + this.estimateEffort(issue), 0)} hours

## ⚠️ Sprint 2: High Priority Fixes (Week 2)

**Goal:** Improve user experience and visual consistency

### Tasks

${highIssues.slice(0, 8).map((issue, index) => `
#### ${index + 1}. Fix ${issue.type}

- **Priority:** ${issue.priority}
- **Page:** ${issue.page}
- **Description:** ${issue.description}
- **Estimated Effort:** ${this.estimateEffort(issue)} hours
`).join('\n')}

**Sprint 2 Total Effort:** ~${highIssues.slice(0, 8).reduce((total, issue) => total + this.estimateEffort(issue), 0)} hours

## 📈 Sprint 3: Moderate Priority Fixes (Week 3)

**Goal:** Polish and consistency improvements

### Tasks

${moderateIssues.slice(0, 6).map((issue, index) => `
#### ${index + 1}. Fix ${issue.type}

- **Priority:** ${issue.priority}
- **Page:** ${issue.page}
- **Description:** ${issue.description}
- **Estimated Effort:** ${this.estimateEffort(issue)} hours
`).join('\n')}

**Sprint 3 Total Effort:** ~${moderateIssues.slice(0, 6).reduce((total, issue) => total + this.estimateEffort(issue), 0)} hours

## 🔧 Technical Implementation

### CSS Architecture Changes

1. **Create Design Token System**
   \`\`\`css
   :root {
     /* Color System */
     --color-text-primary: #1f2937;
     --color-text-secondary: #6b7280;
     --color-bg-primary: #ffffff;
     --color-bg-secondary: #f9fafb;
     
     /* Spacing System */
     --spacing-xs: 4px;
     --spacing-sm: 8px;
     --spacing-md: 16px;
     --spacing-lg: 24px;
     --spacing-xl: 32px;
     
     /* Focus System */
     --focus-ring: 2px solid #005fcc;
     --focus-offset: 2px;
   }
   \`\`\`

2. **Sidebar Layout System**
   \`\`\`css
   .sidebar {
     position: fixed;
     width: var(--sidebar-width, 280px);
     transition: transform 0.3s ease;
   }
   
   .main-content {
     margin-left: var(--sidebar-width, 280px);
     transition: margin-left 0.3s ease;
   }
   \`\`\`

3. **Accessibility Utilities**
   \`\`\`css
   .sr-only {
     position: absolute;
     width: 1px;
     height: 1px;
     padding: 0;
     margin: -1px;
     overflow: hidden;
     clip: rect(0, 0, 0, 0);
     white-space: nowrap;
     border: 0;
   }
   
   .focus-visible {
     outline: var(--focus-ring);
     outline-offset: var(--focus-offset);
   }
   \`\`\`

### Component Updates Required

1. **Navigation Components**
   - Update sidebar navigation alignment
   - Fix icon-text spacing
   - Implement proper focus states

2. **Form Components**
   - Fix placeholder text contrast
   - Add proper labels and descriptions
   - Implement error state styling

3. **Interactive Elements**
   - Ensure minimum touch target sizes
   - Add hover and focus states
   - Implement proper ARIA attributes

## 🧪 Testing Strategy

### Automated Testing

1. **Accessibility Testing**
   \`\`\`bash
   npm run test:accessibility
   \`\`\`

2. **Visual Regression Testing**
   \`\`\`bash
   npm run test:visual
   \`\`\`

3. **Contrast Analysis**
   \`\`\`bash
   node scripts/contrast-analyzer.js
   \`\`\`

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test escape key functionality

2. **Screen Reader Testing**
   - Test with NVDA/JAWS/VoiceOver
   - Verify proper announcements
   - Check heading structure

3. **Mobile Testing**
   - Test touch targets
   - Verify responsive behavior
   - Check sidebar functionality

## 📊 Progress Tracking

### Definition of Done

- [ ] Automated tests pass
- [ ] Manual accessibility testing complete
- [ ] Cross-browser testing complete
- [ ] Code review approved
- [ ] Documentation updated

### Success Metrics

- **Accessibility Score:** Target > 95%
- **Contrast Violations:** Target = 0
- **Layout Issues:** Target < 3
- **User Testing:** Target satisfaction > 4.5/5

## 🔄 Continuous Improvement

### Post-Implementation

1. **Monitor Metrics**
   - Set up automated accessibility monitoring
   - Track user feedback and support tickets
   - Monitor performance impact

2. **Documentation**
   - Update style guide
   - Create component documentation
   - Document accessibility patterns

3. **Team Training**
   - Accessibility best practices workshop
   - Design system usage training
   - Code review checklist updates

---

*This implementation plan should be reviewed and adjusted based on team capacity and business priorities.*
`;
  }

  estimateEffort(issue) {
    const baseEffort = {
      'critical': 3,
      'high': 2,
      'moderate': 1.5,
      'minor': 1
    };
    
    const categoryMultiplier = {
      'accessibility': 1.2,
      'contrast': 1.0,
      'layout': 1.3,
      'spacing': 0.8,
      'alignment': 0.9
    };
    
    const base = baseEffort[issue.severity] || 1;
    const multiplier = categoryMultiplier[issue.category] || 1;
    
    return Math.ceil(base * multiplier);
  }

  generateImplementationNotes(issue) {
    const notes = {
      'color-contrast': 'Update CSS color variables to meet WCAG AA standards (4.5:1 ratio)',
      'white-on-white': 'Change text color to ensure visibility against background',
      'sidebar-overlap': 'Adjust main content margin-left to match sidebar width',
      'icon-text-misalignment': 'Use flexbox with align-items: center for navigation items',
      'missing-focus-indicators': 'Add outline styles for :focus and :focus-visible states',
      'inconsistent-spacing': 'Apply design tokens for consistent padding/margins'
    };
    
    return notes[issue.type] || 'Review issue details and implement appropriate fix';
  }

  async generateCombinedCSSFixes() {
    const fixes = [];
    
    fixes.push(`/* Combined Style Fixes - Generated ${this.results.timestamp} */`);
    fixes.push('/* This file contains all CSS fixes identified by the comprehensive audit */');
    fixes.push('');
    
    // Read individual CSS fix files and combine them
    try {
      const auditFiles = await fs.readdir('./audit-reports');
      
      // Contrast fixes
      const contrastFile = auditFiles.find(f => f.startsWith('contrast-fixes-'));
      if (contrastFile) {
        const contrastCSS = await fs.readFile(path.join('./audit-reports', contrastFile), 'utf8');
        fixes.push('/* ===== CONTRAST FIXES ===== */');
        fixes.push(contrastCSS);
        fixes.push('');
      }
      
      // Sidebar fixes
      const sidebarFile = auditFiles.find(f => f.startsWith('sidebar-layout-fixes-'));
      if (sidebarFile) {
        const sidebarCSS = await fs.readFile(path.join('./audit-reports', sidebarFile), 'utf8');
        fixes.push('/* ===== SIDEBAR LAYOUT FIXES ===== */');
        fixes.push(sidebarCSS);
        fixes.push('');
      }
      
    } catch (error) {
      console.warn('Could not read individual CSS fix files:', error.message);
    }
    
    // Add general accessibility fixes
    fixes.push('/* ===== GENERAL ACCESSIBILITY FIXES ===== */');
    fixes.push('');
    fixes.push('/* Screen Reader Only Content */');
    fixes.push('.sr-only {');
    fixes.push('  position: absolute !important;');
    fixes.push('  width: 1px !important;');
    fixes.push('  height: 1px !important;');
    fixes.push('  padding: 0 !important;');
    fixes.push('  margin: -1px !important;');
    fixes.push('  overflow: hidden !important;');
    fixes.push('  clip: rect(0, 0, 0, 0) !important;');
    fixes.push('  white-space: nowrap !important;');
    fixes.push('  border: 0 !important;');
    fixes.push('}');
    fixes.push('');
    
    fixes.push('/* Skip Links */');
    fixes.push('.skip-link {');
    fixes.push('  position: absolute;');
    fixes.push('  top: -40px;');
    fixes.push('  left: 6px;');
    fixes.push('  background: #000;');
    fixes.push('  color: #fff;');
    fixes.push('  padding: 8px;');
    fixes.push('  text-decoration: none;');
    fixes.push('  z-index: 9999;');
    fixes.push('}');
    fixes.push('');
    fixes.push('.skip-link:focus {');
    fixes.push('  top: 6px;');
    fixes.push('}');
    fixes.push('');
    
    fixes.push('/* High Contrast Mode Support */');
    fixes.push('@media (prefers-contrast: high) {');
    fixes.push('  * {');
    fixes.push('    border-color: ButtonText !important;');
    fixes.push('  }');
    fixes.push('  ');
    fixes.push('  button, input, select, textarea {');
    fixes.push('    background: ButtonFace !important;');
    fixes.push('    color: ButtonText !important;');
    fixes.push('  }');
    fixes.push('}');
    fixes.push('');
    
    fixes.push('/* Reduced Motion Support */');
    fixes.push('@media (prefers-reduced-motion: reduce) {');
    fixes.push('  *, *::before, *::after {');
    fixes.push('    animation-duration: 0.01ms !important;');
    fixes.push('    animation-iteration-count: 1 !important;');
    fixes.push('    transition-duration: 0.01ms !important;');
    fixes.push('    scroll-behavior: auto !important;');
    fixes.push('  }');
    fixes.push('}');
    
    return fixes.join('\n');
  }

  printSummary() {
    console.log('\n📊 AUDIT SUMMARY');
    console.log('================');
    console.log(`Total Issues Found: ${this.results.summary.totalIssues}`);
    console.log(`Critical Issues: ${this.results.summary.criticalIssues}`);
    console.log(`High Priority: ${this.results.summary.highIssues}`);
    console.log(`Moderate Priority: ${this.results.summary.moderateIssues}`);
    console.log(`Minor Issues: ${this.results.summary.minorIssues}`);
    console.log('');
    console.log('Audit Types Completed:');
    this.results.summary.auditTypes.forEach(type => {
      console.log(`  ✅ ${type}`);
    });
    
    if (this.results.summary.criticalIssues > 0) {
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED');
      console.log(`${this.results.summary.criticalIssues} critical issues need immediate attention!`);
    }
    
    console.log('\n📄 Check the generated reports for detailed findings and implementation guidance.');
  }
}

// Run if executed directly
if (require.main === module) {
  const auditor = new ComprehensiveAuditor();
  auditor.runAllAudits().catch(console.error);
}

module.exports = ComprehensiveAuditor;