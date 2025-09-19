#!/usr/bin/env node

/**
 * Comprehensive Accessibility Audit Script
 * 
 * This script performs automated accessibility auditing using axe-core
 * and generates detailed reports for the Postia SaaS application.
 */

const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const AUDIT_CONFIG = {
  baseUrl: 'http://localhost:3000',
  outputDir: './audit-reports',
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  
  // Pages to audit
  pages: [
    { name: 'Homepage', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Dashboard-Content', url: '/dashboard/content' },
    { name: 'Dashboard-Campaigns', url: '/dashboard/campaigns' },
    { name: 'Dashboard-Clients', url: '/dashboard/clients' },
    { name: 'Dashboard-Settings', url: '/dashboard/settings' }
  ],
  
  // Accessibility rules configuration
  rules: {
    // WCAG 2.1 AA Core Rules
    'color-contrast': { enabled: true, priority: 'critical' },
    'color-contrast-enhanced': { enabled: true, priority: 'high' },
    'heading-order': { enabled: true, priority: 'high' },
    'label': { enabled: true, priority: 'critical' },
    'button-name': { enabled: true, priority: 'critical' },
    'link-name': { enabled: true, priority: 'critical' },
    'image-alt': { enabled: true, priority: 'critical' },
    'aria-roles': { enabled: true, priority: 'high' },
    'aria-valid-attr': { enabled: true, priority: 'high' },
    'aria-required-attr': { enabled: true, priority: 'high' },
    'focus-order-semantics': { enabled: true, priority: 'high' },
    'keyboard-navigation': { enabled: true, priority: 'high' },
    'landmark-one-main': { enabled: true, priority: 'moderate' },
    'page-has-heading-one': { enabled: true, priority: 'moderate' },
    'region': { enabled: true, priority: 'moderate' }
  },
  
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
};

class AccessibilityAuditor {
  constructor() {
    this.browser = null;
    this.results = {
      timestamp: AUDIT_CONFIG.timestamp,
      summary: {
        totalPages: 0,
        totalViolations: 0,
        criticalIssues: 0,
        highIssues: 0,
        moderateIssues: 0,
        minorIssues: 0
      },
      pages: [],
      contrastIssues: [],
      layoutIssues: [],
      consistencyIssues: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Accessibility Auditor...');
    
    // Create output directory
    await fs.mkdir(AUDIT_CONFIG.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    console.log('✅ Browser launched successfully');
  }

  async auditPage(pageConfig) {
    console.log(`🔍 Auditing: ${pageConfig.name} (${pageConfig.url})`);
    
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate to page
      await page.goto(`${AUDIT_CONFIG.baseUrl}${pageConfig.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);
      
      // Run axe-core audit
      const axeResults = await new AxeBuilder({ page })
        .withTags(AUDIT_CONFIG.tags)
        .analyze();
      
      // Analyze layout issues
      const layoutIssues = await this.analyzeLayoutIssues(page);
      
      // Analyze contrast issues
      const contrastIssues = await this.analyzeContrastIssues(page);
      
      // Analyze consistency issues
      const consistencyIssues = await this.analyzeConsistencyIssues(page);
      
      // Take screenshot
      const screenshotPath = path.join(AUDIT_CONFIG.outputDir, `${pageConfig.name}-screenshot.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      const pageResult = {
        name: pageConfig.name,
        url: pageConfig.url,
        timestamp: new Date().toISOString(),
        screenshot: screenshotPath,
        axeResults: {
          violations: axeResults.violations,
          passes: axeResults.passes.length,
          incomplete: axeResults.incomplete.length,
          inapplicable: axeResults.inapplicable.length
        },
        layoutIssues,
        contrastIssues,
        consistencyIssues,
        summary: this.summarizePageResults(axeResults, layoutIssues, contrastIssues, consistencyIssues)
      };
      
      this.results.pages.push(pageResult);
      this.updateGlobalSummary(pageResult);
      
      console.log(`✅ Completed audit for ${pageConfig.name}: ${axeResults.violations.length} violations found`);
      
    } catch (error) {
      console.error(`❌ Error auditing ${pageConfig.name}:`, error.message);
      
      this.results.pages.push({
        name: pageConfig.name,
        url: pageConfig.url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await context.close();
    }
  }

  async analyzeLayoutIssues(page) {
    console.log('  📐 Analyzing layout issues...');
    
    const layoutIssues = [];
    
    try {
      // Check for sidebar alignment issues
      const sidebarIssues = await page.evaluate(() => {
        const issues = [];
        const sidebar = document.querySelector('[class*="sidebar"], nav[role="navigation"]');
        
        if (sidebar) {
          const sidebarRect = sidebar.getBoundingClientRect();
          const mainContent = document.querySelector('main, [role="main"]');
          
          if (mainContent) {
            const mainRect = mainContent.getBoundingClientRect();
            
            // Check for overlap
            if (sidebarRect.right > mainRect.left && sidebarRect.left < mainRect.right) {
              issues.push({
                type: 'sidebar-overlap',
                description: 'Sidebar overlaps with main content',
                severity: 'high',
                element: 'sidebar',
                details: {
                  sidebarRight: sidebarRect.right,
                  mainLeft: mainRect.left
                }
              });
            }
          }
          
          // Check for icon alignment in sidebar
          const navItems = sidebar.querySelectorAll('button, a');
          navItems.forEach((item, index) => {
            const icon = item.querySelector('svg, [class*="icon"]');
            const text = item.querySelector('span:not([class*="icon"])');
            
            if (icon && text) {
              const iconRect = icon.getBoundingClientRect();
              const textRect = text.getBoundingClientRect();
              
              // Check vertical alignment
              const iconCenter = iconRect.top + iconRect.height / 2;
              const textCenter = textRect.top + textRect.height / 2;
              const alignmentDiff = Math.abs(iconCenter - textCenter);
              
              if (alignmentDiff > 3) { // 3px tolerance
                issues.push({
                  type: 'icon-text-misalignment',
                  description: `Icon and text misaligned in navigation item ${index + 1}`,
                  severity: 'moderate',
                  element: `nav-item-${index}`,
                  details: {
                    alignmentDifference: alignmentDiff,
                    iconCenter,
                    textCenter
                  }
                });
              }
            }
          });
        }
        
        return issues;
      });
      
      layoutIssues.push(...sidebarIssues);
      
      // Check for responsive issues
      const responsiveIssues = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          // Check for horizontal overflow
          if (rect.right > viewportWidth) {
            issues.push({
              type: 'horizontal-overflow',
              description: `Element extends beyond viewport`,
              severity: 'moderate',
              element: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : ''),
              details: {
                elementRight: rect.right,
                viewportWidth,
                overflow: rect.right - viewportWidth
              }
            });
          }
        });
        
        return issues.slice(0, 10); // Limit to first 10 issues
      });
      
      layoutIssues.push(...responsiveIssues);
      
    } catch (error) {
      console.error('    ❌ Error analyzing layout:', error.message);
    }
    
    return layoutIssues;
  }

  async analyzeContrastIssues(page) {
    console.log('  🎨 Analyzing contrast issues...');
    
    const contrastIssues = [];
    
    try {
      const contrastProblems = await page.evaluate(() => {
        const issues = [];
        
        // Helper function to get computed color
        const getComputedColor = (element, property) => {
          const style = window.getComputedStyle(element);
          return style.getPropertyValue(property);
        };
        
        // Helper function to convert RGB to hex
        const rgbToHex = (rgb) => {
          const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (!match) return rgb;
          
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          
          return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };
        
        // Check all text elements
        const textElements = document.querySelectorAll('*');
        
        textElements.forEach((el, index) => {
          if (index > 100) return; // Limit to first 100 elements
          
          const textContent = el.textContent?.trim();
          if (!textContent || textContent.length === 0) return;
          
          const color = getComputedColor(el, 'color');
          const backgroundColor = getComputedColor(el, 'background-color');
          
          // Check for white text on white background
          if (color.includes('255, 255, 255') && backgroundColor.includes('255, 255, 255')) {
            issues.push({
              type: 'white-on-white',
              description: 'White text on white background detected',
              severity: 'critical',
              element: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : ''),
              details: {
                color: rgbToHex(color),
                backgroundColor: rgbToHex(backgroundColor),
                text: textContent.substring(0, 50)
              }
            });
          }
          
          // Check for very low contrast (same or similar colors)
          if (color === backgroundColor) {
            issues.push({
              type: 'identical-colors',
              description: 'Text and background have identical colors',
              severity: 'critical',
              element: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : ''),
              details: {
                color: rgbToHex(color),
                backgroundColor: rgbToHex(backgroundColor),
                text: textContent.substring(0, 50)
              }
            });
          }
        });
        
        // Check placeholder text specifically
        const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
        inputs.forEach((input, index) => {
          const placeholder = input.getAttribute('placeholder');
          if (placeholder) {
            const style = window.getComputedStyle(input, '::placeholder');
            const placeholderColor = style.color;
            const backgroundColor = window.getComputedStyle(input).backgroundColor;
            
            if (placeholderColor.includes('255, 255, 255') && backgroundColor.includes('255, 255, 255')) {
              issues.push({
                type: 'invisible-placeholder',
                description: 'Placeholder text is invisible',
                severity: 'high',
                element: `input-${index}`,
                details: {
                  placeholder,
                  color: rgbToHex(placeholderColor),
                  backgroundColor: rgbToHex(backgroundColor)
                }
              });
            }
          }
        });
        
        return issues;
      });
      
      contrastIssues.push(...contrastProblems);
      
    } catch (error) {
      console.error('    ❌ Error analyzing contrast:', error.message);
    }
    
    return contrastIssues;
  }

  async analyzeConsistencyIssues(page) {
    console.log('  🔄 Analyzing consistency issues...');
    
    const consistencyIssues = [];
    
    try {
      const consistencyProblems = await page.evaluate(() => {
        const issues = [];
        
        // Check button consistency
        const buttons = document.querySelectorAll('button');
        const buttonStyles = [];
        
        buttons.forEach((button, index) => {
          const style = window.getComputedStyle(button);
          buttonStyles.push({
            index,
            height: style.height,
            padding: style.padding,
            fontSize: style.fontSize,
            borderRadius: style.borderRadius,
            backgroundColor: style.backgroundColor,
            color: style.color
          });
        });
        
        // Group buttons by similar appearance
        const buttonGroups = {};
        buttonStyles.forEach(style => {
          const key = `${style.height}-${style.padding}-${style.fontSize}`;
          if (!buttonGroups[key]) buttonGroups[key] = [];
          buttonGroups[key].push(style);
        });
        
        // Check for inconsistencies within groups
        Object.entries(buttonGroups).forEach(([key, group]) => {
          if (group.length > 1) {
            const colors = [...new Set(group.map(s => s.backgroundColor))];
            const borderRadii = [...new Set(group.map(s => s.borderRadius))];
            
            if (colors.length > 2) {
              issues.push({
                type: 'button-color-inconsistency',
                description: `Similar buttons have inconsistent colors`,
                severity: 'moderate',
                element: 'buttons',
                details: {
                  groupSize: group.length,
                  colors: colors.length,
                  affectedButtons: group.map(g => g.index)
                }
              });
            }
            
            if (borderRadii.length > 1) {
              issues.push({
                type: 'button-radius-inconsistency',
                description: `Similar buttons have inconsistent border radius`,
                severity: 'minor',
                element: 'buttons',
                details: {
                  groupSize: group.length,
                  borderRadii: borderRadii.length,
                  affectedButtons: group.map(g => g.index)
                }
              });
            }
          }
        });
        
        // Check spacing consistency
        const cards = document.querySelectorAll('[class*="card"], .card');
        const cardSpacing = [];
        
        cards.forEach((card, index) => {
          const style = window.getComputedStyle(card);
          cardSpacing.push({
            index,
            padding: style.padding,
            margin: style.margin,
            gap: style.gap
          });
        });
        
        if (cardSpacing.length > 1) {
          const paddings = [...new Set(cardSpacing.map(s => s.padding))];
          const margins = [...new Set(cardSpacing.map(s => s.margin))];
          
          if (paddings.length > 2) {
            issues.push({
              type: 'card-padding-inconsistency',
              description: `Cards have inconsistent padding`,
              severity: 'moderate',
              element: 'cards',
              details: {
                totalCards: cardSpacing.length,
                uniquePaddings: paddings.length,
                paddings
              }
            });
          }
          
          if (margins.length > 2) {
            issues.push({
              type: 'card-margin-inconsistency',
              description: `Cards have inconsistent margins`,
              severity: 'minor',
              element: 'cards',
              details: {
                totalCards: cardSpacing.length,
                uniqueMargins: margins.length,
                margins
              }
            });
          }
        }
        
        return issues;
      });
      
      consistencyIssues.push(...consistencyProblems);
      
    } catch (error) {
      console.error('    ❌ Error analyzing consistency:', error.message);
    }
    
    return consistencyIssues;
  }

  summarizePageResults(axeResults, layoutIssues, contrastIssues, consistencyIssues) {
    const summary = {
      axeViolations: axeResults.violations.length,
      layoutIssues: layoutIssues.length,
      contrastIssues: contrastIssues.length,
      consistencyIssues: consistencyIssues.length,
      totalIssues: 0,
      severityBreakdown: {
        critical: 0,
        high: 0,
        moderate: 0,
        minor: 0
      }
    };
    
    // Count axe violations by impact
    axeResults.violations.forEach(violation => {
      const impact = violation.impact || 'minor';
      if (impact === 'critical') summary.severityBreakdown.critical++;
      else if (impact === 'serious') summary.severityBreakdown.high++;
      else if (impact === 'moderate') summary.severityBreakdown.moderate++;
      else summary.severityBreakdown.minor++;
    });
    
    // Count custom issues by severity
    [...layoutIssues, ...contrastIssues, ...consistencyIssues].forEach(issue => {
      summary.severityBreakdown[issue.severity]++;
    });
    
    summary.totalIssues = Object.values(summary.severityBreakdown).reduce((a, b) => a + b, 0);
    
    return summary;
  }

  updateGlobalSummary(pageResult) {
    this.results.summary.totalPages++;
    this.results.summary.totalViolations += pageResult.summary.totalIssues;
    this.results.summary.criticalIssues += pageResult.summary.severityBreakdown.critical;
    this.results.summary.highIssues += pageResult.summary.severityBreakdown.high;
    this.results.summary.moderateIssues += pageResult.summary.severityBreakdown.moderate;
    this.results.summary.minorIssues += pageResult.summary.severityBreakdown.minor;
    
    // Collect issues by type
    this.results.contrastIssues.push(...pageResult.contrastIssues);
    this.results.layoutIssues.push(...pageResult.layoutIssues);
    this.results.consistencyIssues.push(...pageResult.consistencyIssues);
  }

  async generateReports() {
    console.log('📊 Generating audit reports...');
    
    // Generate JSON report
    const jsonReport = path.join(AUDIT_CONFIG.outputDir, `accessibility-audit-${AUDIT_CONFIG.timestamp}.json`);
    await fs.writeFile(jsonReport, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = await this.generateHTMLReport();
    const htmlReportPath = path.join(AUDIT_CONFIG.outputDir, `accessibility-audit-${AUDIT_CONFIG.timestamp}.html`);
    await fs.writeFile(htmlReportPath, htmlReport);
    
    // Generate markdown summary
    const markdownReport = await this.generateMarkdownReport();
    const markdownReportPath = path.join(AUDIT_CONFIG.outputDir, `accessibility-audit-${AUDIT_CONFIG.timestamp}.md`);
    await fs.writeFile(markdownReportPath, markdownReport);
    
    console.log('✅ Reports generated:');
    console.log(`  📄 JSON: ${jsonReport}`);
    console.log(`  🌐 HTML: ${htmlReportPath}`);
    console.log(`  📝 Markdown: ${markdownReportPath}`);
    
    return {
      json: jsonReport,
      html: htmlReportPath,
      markdown: markdownReportPath
    };
  }

  async generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report - ${this.results.timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1f2937; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; }
        .summary-card h3 { margin: 0 0 10px 0; color: #374151; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #2563eb; }
        .severity-critical { border-left-color: #dc2626; }
        .severity-critical .number { color: #dc2626; }
        .severity-high { border-left-color: #ea580c; }
        .severity-high .number { color: #ea580c; }
        .severity-moderate { border-left-color: #d97706; }
        .severity-moderate .number { color: #d97706; }
        .severity-minor { border-left-color: #65a30d; }
        .severity-minor .number { color: #65a30d; }
        .page-results { margin: 30px 0; }
        .page-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin: 15px 0; padding: 20px; }
        .page-card h3 { margin: 0 0 15px 0; color: #1f2937; }
        .issue-list { margin: 15px 0; }
        .issue { background: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .issue-critical { border-left: 4px solid #dc2626; }
        .issue-high { border-left: 4px solid #ea580c; }
        .issue-moderate { border-left: 4px solid #d97706; }
        .issue-minor { border-left: 4px solid #65a30d; }
        .issue-title { font-weight: bold; color: #374151; margin-bottom: 5px; }
        .issue-description { color: #6b7280; margin-bottom: 10px; }
        .issue-details { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .screenshot { max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Accessibility Audit Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        <p><strong>Application:</strong> Postia SaaS</p>
        
        <h2>📊 Summary</h2>
        <div class="summary">
            <div class="summary-card">
                <h3>Total Pages Audited</h3>
                <div class="number">${this.results.summary.totalPages}</div>
            </div>
            <div class="summary-card">
                <h3>Total Issues Found</h3>
                <div class="number">${this.results.summary.totalViolations}</div>
            </div>
            <div class="summary-card severity-critical">
                <h3>Critical Issues</h3>
                <div class="number">${this.results.summary.criticalIssues}</div>
            </div>
            <div class="summary-card severity-high">
                <h3>High Priority</h3>
                <div class="number">${this.results.summary.highIssues}</div>
            </div>
            <div class="summary-card severity-moderate">
                <h3>Moderate Priority</h3>
                <div class="number">${this.results.summary.moderateIssues}</div>
            </div>
            <div class="summary-card severity-minor">
                <h3>Minor Issues</h3>
                <div class="number">${this.results.summary.minorIssues}</div>
            </div>
        </div>
        
        <h2>📄 Page Results</h2>
        <div class="page-results">
            ${this.results.pages.map(page => `
                <div class="page-card">
                    <h3>${page.name} - ${page.url}</h3>
                    ${page.error ? `<p style="color: #dc2626;"><strong>Error:</strong> ${page.error}</p>` : `
                        <p><strong>Total Issues:</strong> ${page.summary?.totalIssues || 0}</p>
                        
                        ${page.contrastIssues?.length > 0 ? `
                            <h4>🎨 Contrast Issues</h4>
                            <div class="issue-list">
                                ${page.contrastIssues.map(issue => `
                                    <div class="issue issue-${issue.severity}">
                                        <div class="issue-title">${issue.type}</div>
                                        <div class="issue-description">${issue.description}</div>
                                        <div class="issue-details">${JSON.stringify(issue.details, null, 2)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${page.layoutIssues?.length > 0 ? `
                            <h4>📐 Layout Issues</h4>
                            <div class="issue-list">
                                ${page.layoutIssues.map(issue => `
                                    <div class="issue issue-${issue.severity}">
                                        <div class="issue-title">${issue.type}</div>
                                        <div class="issue-description">${issue.description}</div>
                                        <div class="issue-details">${JSON.stringify(issue.details, null, 2)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${page.consistencyIssues?.length > 0 ? `
                            <h4>🔄 Consistency Issues</h4>
                            <div class="issue-list">
                                ${page.consistencyIssues.map(issue => `
                                    <div class="issue issue-${issue.severity}">
                                        <div class="issue-title">${issue.type}</div>
                                        <div class="issue-description">${issue.description}</div>
                                        <div class="issue-details">${JSON.stringify(issue.details, null, 2)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${page.axeResults?.violations?.length > 0 ? `
                            <h4>⚠️ Axe-core Violations</h4>
                            <div class="issue-list">
                                ${page.axeResults.violations.map(violation => `
                                    <div class="issue issue-${violation.impact || 'minor'}">
                                        <div class="issue-title">${violation.id}</div>
                                        <div class="issue-description">${violation.description}</div>
                                        <div class="issue-details">
                                            <strong>Help:</strong> ${violation.help}<br>
                                            <strong>Impact:</strong> ${violation.impact}<br>
                                            <strong>Nodes:</strong> ${violation.nodes.length}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    `}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;
  }

  async generateMarkdownReport() {
    return `# 🔍 Accessibility Audit Report

**Generated:** ${this.results.timestamp}  
**Application:** Postia SaaS

## 📊 Executive Summary

| Metric | Count |
|--------|-------|
| Total Pages Audited | ${this.results.summary.totalPages} |
| Total Issues Found | ${this.results.summary.totalViolations} |
| Critical Issues | ${this.results.summary.criticalIssues} |
| High Priority Issues | ${this.results.summary.highIssues} |
| Moderate Priority Issues | ${this.results.summary.moderateIssues} |
| Minor Issues | ${this.results.summary.minorIssues} |

## 🎯 Key Findings

### Critical Issues Requiring Immediate Attention

${this.results.contrastIssues.filter(issue => issue.severity === 'critical').map(issue => 
`- **${issue.type}**: ${issue.description}
  - Element: \`${issue.element}\`
  - Details: ${JSON.stringify(issue.details, null, 2)}`
).join('\n\n')}

### Layout Issues

${this.results.layoutIssues.filter(issue => issue.severity === 'high' || issue.severity === 'critical').map(issue => 
`- **${issue.type}**: ${issue.description}
  - Severity: ${issue.severity}
  - Element: \`${issue.element}\`
  - Details: ${JSON.stringify(issue.details, null, 2)}`
).join('\n\n')}

### Consistency Issues

${this.results.consistencyIssues.map(issue => 
`- **${issue.type}**: ${issue.description}
  - Severity: ${issue.severity}
  - Element: \`${issue.element}\`
  - Details: ${JSON.stringify(issue.details, null, 2)}`
).join('\n\n')}

## 📄 Detailed Page Results

${this.results.pages.map(page => `
### ${page.name} - \`${page.url}\`

${page.error ? `**Error:** ${page.error}` : `
**Summary:** ${page.summary?.totalIssues || 0} total issues found

${page.summary ? `
- Critical: ${page.summary.severityBreakdown.critical}
- High: ${page.summary.severityBreakdown.high}
- Moderate: ${page.summary.severityBreakdown.moderate}
- Minor: ${page.summary.severityBreakdown.minor}
` : ''}

${page.contrastIssues?.length > 0 ? `
#### 🎨 Contrast Issues
${page.contrastIssues.map(issue => `- **${issue.type}**: ${issue.description}`).join('\n')}
` : ''}

${page.layoutIssues?.length > 0 ? `
#### 📐 Layout Issues
${page.layoutIssues.map(issue => `- **${issue.type}**: ${issue.description}`).join('\n')}
` : ''}

${page.consistencyIssues?.length > 0 ? `
#### 🔄 Consistency Issues
${page.consistencyIssues.map(issue => `- **${issue.type}**: ${issue.description}`).join('\n')}
` : ''}
`}
`).join('\n')}

## 🔧 Recommended Actions

### Immediate (Critical & High Priority)

1. **Fix White-on-White Text Issues**
   - Review all text elements for proper contrast
   - Update CSS color variables to ensure visibility
   - Test with color contrast analyzers

2. **Resolve Sidebar Layout Problems**
   - Fix icon-text alignment using flexbox
   - Prevent content overlap with proper margins
   - Ensure responsive behavior on all screen sizes

3. **Improve Focus Indicators**
   - Add visible focus outlines for keyboard navigation
   - Ensure focus indicators meet WCAG contrast requirements
   - Test keyboard navigation flow

### Short Term (Moderate Priority)

1. **Standardize Component Spacing**
   - Create consistent spacing system (4px base unit)
   - Apply uniform padding/margins to similar components
   - Update design tokens and CSS variables

2. **Unify Button Styles**
   - Standardize button heights, padding, and border radius
   - Ensure consistent hover and active states
   - Apply uniform color scheme

### Long Term (Minor Priority)

1. **Implement Design System**
   - Create comprehensive style guide
   - Document component patterns and usage
   - Set up automated style consistency checks

2. **Enhance Responsive Design**
   - Improve mobile experience
   - Optimize touch target sizes
   - Test across various devices and screen sizes

## 📈 Success Metrics

- **Target:** 0 critical accessibility violations
- **Target:** < 5 high priority issues per page
- **Target:** WCAG 2.1 AA compliance score > 95%
- **Target:** Consistent visual patterns across all components

---

*This report was generated automatically using axe-core and custom analysis tools. For questions or clarifications, please review the detailed JSON report.*
`;
  }

  async run() {
    try {
      await this.initialize();
      
      console.log(`🔍 Starting audit of ${AUDIT_CONFIG.pages.length} pages...`);
      
      for (const pageConfig of AUDIT_CONFIG.pages) {
        await this.auditPage(pageConfig);
      }
      
      const reports = await this.generateReports();
      
      console.log('\n🎉 Audit completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`  Total Pages: ${this.results.summary.totalPages}`);
      console.log(`  Total Issues: ${this.results.summary.totalViolations}`);
      console.log(`  Critical: ${this.results.summary.criticalIssues}`);
      console.log(`  High: ${this.results.summary.highIssues}`);
      console.log(`  Moderate: ${this.results.summary.moderateIssues}`);
      console.log(`  Minor: ${this.results.summary.minorIssues}`);
      
      return reports;
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new AccessibilityAuditor();
  auditor.run().catch(console.error);
}

module.exports = AccessibilityAuditor;