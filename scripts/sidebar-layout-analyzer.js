#!/usr/bin/env node

/**
 * Sidebar Layout Analysis Tool
 * 
 * Specialized tool for analyzing sidebar layout issues in the Postia SaaS application.
 * Focuses on alignment, spacing, and responsive behavior problems.
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class SidebarLayoutAnalyzer {
  constructor() {
    this.browser = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        pagesAnalyzed: 0,
        totalIssues: 0,
        alignmentIssues: 0,
        spacingIssues: 0,
        responsiveIssues: 0,
        overlapIssues: 0
      },
      issues: [],
      screenshots: [],
      recommendations: []
    };
  }

  async analyzeSidebarLayout(url, pageName) {
    console.log(`📐 Analyzing sidebar layout for: ${pageName}`);
    
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Take initial screenshot
      const screenshotPath = path.join('./audit-reports', `sidebar-${pageName}-desktop.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      this.results.screenshots.push({
        page: pageName,
        viewport: 'desktop',
        path: screenshotPath
      });
      
      // Analyze desktop layout
      const desktopIssues = await this.analyzeDesktopSidebar(page, pageName);
      
      // Test mobile layout
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      
      const mobileScreenshotPath = path.join('./audit-reports', `sidebar-${pageName}-mobile.png`);
      await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
      this.results.screenshots.push({
        page: pageName,
        viewport: 'mobile',
        path: mobileScreenshotPath
      });
      
      const mobileIssues = await this.analyzeMobileSidebar(page, pageName);
      
      // Test tablet layout
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(1000);
      
      const tabletScreenshotPath = path.join('./audit-reports', `sidebar-${pageName}-tablet.png`);
      await page.screenshot({ path: tabletScreenshotPath, fullPage: true });
      this.results.screenshots.push({
        page: pageName,
        viewport: 'tablet',
        path: tabletScreenshotPath
      });
      
      const tabletIssues = await this.analyzeTabletSidebar(page, pageName);
      
      // Combine all issues
      const allIssues = [...desktopIssues, ...mobileIssues, ...tabletIssues];
      this.results.issues.push(...allIssues);
      
      // Update summary
      this.results.summary.pagesAnalyzed++;
      this.results.summary.totalIssues += allIssues.length;
      this.results.summary.alignmentIssues += allIssues.filter(i => i.category === 'alignment').length;
      this.results.summary.spacingIssues += allIssues.filter(i => i.category === 'spacing').length;
      this.results.summary.responsiveIssues += allIssues.filter(i => i.category === 'responsive').length;
      this.results.summary.overlapIssues += allIssues.filter(i => i.category === 'overlap').length;
      
      console.log(`  ✅ Found ${allIssues.length} layout issues`);
      
    } catch (error) {
      console.error(`  ❌ Error analyzing ${pageName}:`, error.message);
    } finally {
      await context.close();
    }
  }

  async analyzeDesktopSidebar(page, pageName) {
    return await page.evaluate((pageName) => {
      const issues = [];
      
      // Find sidebar element
      const sidebar = document.querySelector('[class*="sidebar"], nav[role="navigation"], [data-testid="sidebar"]') ||
                    document.querySelector('nav') ||
                    document.querySelector('[class*="navigation"]');
      
      if (!sidebar) {
        issues.push({
          page: pageName,
          viewport: 'desktop',
          category: 'structure',
          severity: 'high',
          type: 'missing-sidebar',
          description: 'No sidebar element found',
          element: 'sidebar',
          details: {}
        });
        return issues;
      }
      
      const sidebarRect = sidebar.getBoundingClientRect();
      const sidebarStyles = window.getComputedStyle(sidebar);
      
      // Find main content area
      const mainContent = document.querySelector('main, [role="main"], [class*="main"]') ||
                         document.querySelector('[class*="content"]');
      
      if (mainContent) {
        const mainRect = mainContent.getBoundingClientRect();
        const mainStyles = window.getComputedStyle(mainContent);
        
        // Check for overlap
        if (sidebarRect.right > mainRect.left && sidebarRect.left < mainRect.right) {
          const overlapWidth = Math.min(sidebarRect.right, mainRect.right) - Math.max(sidebarRect.left, mainRect.left);
          if (overlapWidth > 10) { // 10px tolerance
            issues.push({
              page: pageName,
              viewport: 'desktop',
              category: 'overlap',
              severity: 'high',
              type: 'sidebar-main-overlap',
              description: `Sidebar overlaps main content by ${overlapWidth}px`,
              element: 'sidebar + main',
              details: {
                overlapWidth,
                sidebarRight: sidebarRect.right,
                mainLeft: mainRect.left,
                sidebarWidth: sidebarRect.width,
                mainMarginLeft: mainStyles.marginLeft
              }
            });
          }
        }
        
        // Check if main content has appropriate margin
        const expectedMargin = sidebarRect.width;
        const actualMargin = parseFloat(mainStyles.marginLeft) || 0;
        const marginDiff = Math.abs(expectedMargin - actualMargin);
        
        if (marginDiff > 20) { // 20px tolerance
          issues.push({
            page: pageName,
            viewport: 'desktop',
            category: 'spacing',
            severity: 'moderate',
            type: 'incorrect-main-margin',
            description: `Main content margin (${actualMargin}px) doesn't match sidebar width (${expectedMargin}px)`,
            element: 'main',
            details: {
              expectedMargin,
              actualMargin,
              difference: marginDiff,
              sidebarWidth: sidebarRect.width
            }
          });
        }
      }
      
      // Analyze navigation items alignment
      const navItems = sidebar.querySelectorAll('button, a, [role="button"], [role="link"]');
      const alignmentIssues = [];
      
      navItems.forEach((item, index) => {
        const icon = item.querySelector('svg, [class*="icon"], img');
        const text = item.querySelector('span:not([class*="icon"]), [class*="text"]') ||
                    Array.from(item.childNodes).find(node => 
                      node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                    );
        
        if (icon && text) {
          const iconRect = icon.getBoundingClientRect();
          const textRect = text.getBoundingClientRect ? text.getBoundingClientRect() : 
                          item.getBoundingClientRect();
          
          // Check vertical alignment
          const iconCenter = iconRect.top + iconRect.height / 2;
          const textCenter = textRect.top + textRect.height / 2;
          const alignmentDiff = Math.abs(iconCenter - textCenter);
          
          if (alignmentDiff > 3) { // 3px tolerance
            alignmentIssues.push({
              itemIndex: index,
              alignmentDifference: alignmentDiff,
              iconCenter,
              textCenter,
              iconRect: {
                top: iconRect.top,
                left: iconRect.left,
                width: iconRect.width,
                height: iconRect.height
              },
              textRect: {
                top: textRect.top,
                left: textRect.left,
                width: textRect.width,
                height: textRect.height
              }
            });
          }
          
          // Check horizontal spacing
          const horizontalGap = textRect.left - iconRect.right;
          if (horizontalGap < 8 || horizontalGap > 20) { // Expected 8-20px gap
            issues.push({
              page: pageName,
              viewport: 'desktop',
              category: 'spacing',
              severity: 'minor',
              type: 'icon-text-spacing',
              description: `Inconsistent spacing between icon and text in nav item ${index + 1}`,
              element: `nav-item-${index}`,
              details: {
                actualGap: horizontalGap,
                expectedRange: '8-20px',
                itemIndex: index
              }
            });
          }
        }
        
        // Check item padding consistency
        const itemStyles = window.getComputedStyle(item);
        const padding = itemStyles.padding;
        const paddingTop = parseFloat(itemStyles.paddingTop);
        const paddingBottom = parseFloat(itemStyles.paddingBottom);
        const paddingLeft = parseFloat(itemStyles.paddingLeft);
        const paddingRight = parseFloat(itemStyles.paddingRight);
        
        // Store for consistency check
        if (!window.navItemPaddings) window.navItemPaddings = [];
        window.navItemPaddings.push({
          index,
          padding,
          paddingTop,
          paddingBottom,
          paddingLeft,
          paddingRight
        });
      });
      
      // Add alignment issues
      if (alignmentIssues.length > 0) {
        issues.push({
          page: pageName,
          viewport: 'desktop',
          category: 'alignment',
          severity: 'moderate',
          type: 'icon-text-misalignment',
          description: `${alignmentIssues.length} navigation items have misaligned icons and text`,
          element: 'nav-items',
          details: {
            affectedItems: alignmentIssues.length,
            items: alignmentIssues
          }
        });
      }
      
      // Check padding consistency
      if (window.navItemPaddings && window.navItemPaddings.length > 1) {
        const uniquePaddings = [...new Set(window.navItemPaddings.map(p => p.padding))];
        if (uniquePaddings.length > 2) { // Allow for 2 different padding styles (e.g., normal and active)
          issues.push({
            page: pageName,
            viewport: 'desktop',
            category: 'spacing',
            severity: 'minor',
            type: 'inconsistent-nav-padding',
            description: `Navigation items have ${uniquePaddings.length} different padding values`,
            element: 'nav-items',
            details: {
              uniquePaddings,
              totalItems: window.navItemPaddings.length,
              paddingVariations: window.navItemPaddings
            }
          });
        }
      }
      
      // Check sidebar width and positioning
      const sidebarPosition = sidebarStyles.position;
      const sidebarLeft = parseFloat(sidebarStyles.left) || 0;
      const sidebarTop = parseFloat(sidebarStyles.top) || 0;
      
      if (sidebarPosition === 'fixed' || sidebarPosition === 'absolute') {
        if (sidebarLeft !== 0) {
          issues.push({
            page: pageName,
            viewport: 'desktop',
            category: 'positioning',
            severity: 'minor',
            type: 'sidebar-positioning',
            description: `Sidebar left position is ${sidebarLeft}px instead of 0`,
            element: 'sidebar',
            details: {
              position: sidebarPosition,
              left: sidebarLeft,
              top: sidebarTop,
              expected: { left: 0 }
            }
          });
        }
      }
      
      // Check for transition smoothness
      const transition = sidebarStyles.transition;
      if (!transition || transition === 'none') {
        issues.push({
          page: pageName,
          viewport: 'desktop',
          category: 'animation',
          severity: 'minor',
          type: 'missing-transitions',
          description: 'Sidebar lacks smooth transitions for state changes',
          element: 'sidebar',
          details: {
            currentTransition: transition || 'none',
            recommended: 'width 0.3s ease, transform 0.3s ease'
          }
        });
      }
      
      return issues;
    }, pageName);
  }

  async analyzeMobileSidebar(page, pageName) {
    return await page.evaluate((pageName) => {
      const issues = [];
      
      // Check if sidebar is properly hidden/transformed on mobile
      const sidebar = document.querySelector('[class*="sidebar"], nav[role="navigation"], [data-testid="sidebar"]') ||
                    document.querySelector('nav');
      
      if (sidebar) {
        const sidebarRect = sidebar.getBoundingClientRect();
        const sidebarStyles = window.getComputedStyle(sidebar);
        const viewportWidth = window.innerWidth;
        
        // Check if sidebar is visible when it shouldn't be
        if (viewportWidth < 768 && sidebarRect.width > 0 && sidebarStyles.display !== 'none') {
          const transform = sidebarStyles.transform;
          const left = parseFloat(sidebarStyles.left) || 0;
          
          // Sidebar should be hidden via transform or negative left position
          const isHidden = transform.includes('translateX(-') || left < -sidebarRect.width + 50;
          
          if (!isHidden) {
            issues.push({
              page: pageName,
              viewport: 'mobile',
              category: 'responsive',
              severity: 'high',
              type: 'sidebar-not-hidden-mobile',
              description: 'Sidebar is visible on mobile when it should be hidden',
              element: 'sidebar',
              details: {
                sidebarWidth: sidebarRect.width,
                viewportWidth,
                transform,
                left,
                display: sidebarStyles.display
              }
            });
          }
        }
        
        // Check for mobile navigation alternative
        const mobileNav = document.querySelector('[class*="mobile"], [data-testid*="mobile"]') ||
                         document.querySelector('[class*="hamburger"], [class*="menu-button"]');
        
        if (viewportWidth < 768 && !mobileNav) {
          issues.push({
            page: pageName,
            viewport: 'mobile',
            category: 'responsive',
            severity: 'high',
            type: 'missing-mobile-navigation',
            description: 'No mobile navigation alternative found',
            element: 'mobile-nav',
            details: {
              viewportWidth,
              sidebarVisible: sidebarRect.width > 0
            }
          });
        }
      }
      
      // Check for touch target sizes
      const interactiveElements = document.querySelectorAll('button, a, [role="button"], [role="link"]');
      interactiveElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const minTouchTarget = 44; // WCAG recommendation
        
        if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
          issues.push({
            page: pageName,
            viewport: 'mobile',
            category: 'responsive',
            severity: 'moderate',
            type: 'small-touch-target',
            description: `Interactive element ${index + 1} is smaller than recommended touch target size`,
            element: `interactive-${index}`,
            details: {
              actualSize: { width: rect.width, height: rect.height },
              recommendedSize: { width: minTouchTarget, height: minTouchTarget },
              elementType: element.tagName.toLowerCase()
            }
          });
        }
      });
      
      return issues;
    }, pageName);
  }

  async analyzeTabletSidebar(page, pageName) {
    return await page.evaluate((pageName) => {
      const issues = [];
      
      const sidebar = document.querySelector('[class*="sidebar"], nav[role="navigation"], [data-testid="sidebar"]') ||
                    document.querySelector('nav');
      
      if (sidebar) {
        const sidebarRect = sidebar.getBoundingClientRect();
        const sidebarStyles = window.getComputedStyle(sidebar);
        const viewportWidth = window.innerWidth;
        
        // Check tablet-specific behavior
        if (viewportWidth >= 768 && viewportWidth < 1024) {
          // Sidebar should be appropriately sized for tablet
          const expectedWidth = viewportWidth * 0.25; // Roughly 25% of viewport
          const actualWidth = sidebarRect.width;
          
          if (actualWidth > viewportWidth * 0.4) { // Too wide
            issues.push({
              page: pageName,
              viewport: 'tablet',
              category: 'responsive',
              severity: 'moderate',
              type: 'sidebar-too-wide-tablet',
              description: `Sidebar is too wide for tablet viewport (${actualWidth}px)`,
              element: 'sidebar',
              details: {
                actualWidth,
                viewportWidth,
                percentage: (actualWidth / viewportWidth * 100).toFixed(1),
                recommendedMaxWidth: viewportWidth * 0.4
              }
            });
          }
          
          // Check if content is properly adjusted
          const mainContent = document.querySelector('main, [role="main"], [class*="main"]');
          if (mainContent) {
            const mainRect = mainContent.getBoundingClientRect();
            const availableWidth = viewportWidth - actualWidth;
            
            if (mainRect.width > availableWidth * 1.1) { // 10% tolerance
              issues.push({
                page: pageName,
                viewport: 'tablet',
                category: 'responsive',
                severity: 'moderate',
                type: 'content-overflow-tablet',
                description: 'Main content overflows available space on tablet',
                element: 'main',
                details: {
                  mainWidth: mainRect.width,
                  availableWidth,
                  sidebarWidth: actualWidth,
                  viewportWidth
                }
              });
            }
          }
        }
      }
      
      return issues;
    }, pageName);
  }

  async generateLayoutReport() {
    // Generate recommendations
    this.generateRecommendations();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = './audit-reports';
    await fs.mkdir(outputDir, { recursive: true });
    
    // JSON report
    const jsonPath = path.join(outputDir, `sidebar-layout-analysis-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));
    
    // Markdown report
    const markdownReport = this.generateMarkdownReport();
    const markdownPath = path.join(outputDir, `sidebar-layout-analysis-${timestamp}.md`);
    await fs.writeFile(markdownPath, markdownReport);
    
    // CSS fixes
    const cssFixesPath = path.join(outputDir, `sidebar-layout-fixes-${timestamp}.css`);
    const cssFixes = this.generateCSSFixes();
    await fs.writeFile(cssFixesPath, cssFixes);
    
    return {
      json: jsonPath,
      markdown: markdownPath,
      cssFixes: cssFixesPath
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Group issues by category
    const alignmentIssues = this.results.issues.filter(i => i.category === 'alignment');
    const spacingIssues = this.results.issues.filter(i => i.category === 'spacing');
    const responsiveIssues = this.results.issues.filter(i => i.category === 'responsive');
    const overlapIssues = this.results.issues.filter(i => i.category === 'overlap');
    
    if (overlapIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        title: 'Fix Sidebar Content Overlap',
        description: `${overlapIssues.length} pages have sidebar overlapping main content`,
        action: 'Adjust main content margins and sidebar positioning',
        cssChanges: [
          'main { margin-left: var(--sidebar-width); }',
          '.sidebar { position: fixed; left: 0; }'
        ]
      });
    }
    
    if (alignmentIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fix Icon-Text Alignment',
        description: `${alignmentIssues.length} navigation items have misaligned icons and text`,
        action: 'Use flexbox with align-items: center for navigation items',
        cssChanges: [
          '.nav-item { display: flex; align-items: center; }',
          '.nav-item svg { margin-right: 12px; }'
        ]
      });
    }
    
    if (responsiveIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Responsive Behavior',
        description: `${responsiveIssues.length} responsive layout issues found`,
        action: 'Implement proper mobile navigation and touch targets',
        cssChanges: [
          '@media (max-width: 768px) { .sidebar { transform: translateX(-100%); } }',
          '.touch-target { min-width: 44px; min-height: 44px; }'
        ]
      });
    }
    
    if (spacingIssues.length > 0) {
      recommendations.push({
        priority: 'moderate',
        title: 'Standardize Spacing',
        description: `${spacingIssues.length} spacing inconsistencies found`,
        action: 'Apply consistent padding and margins using design tokens',
        cssChanges: [
          ':root { --nav-item-padding: 12px 16px; }',
          '.nav-item { padding: var(--nav-item-padding); }'
        ]
      });
    }
    
    this.results.recommendations = recommendations;
  }

  generateMarkdownReport() {
    return `# 📐 Sidebar Layout Analysis Report

**Generated:** ${this.results.timestamp}  
**Application:** Postia SaaS

## 📊 Summary

| Metric | Count |
|--------|-------|
| Pages Analyzed | ${this.results.summary.pagesAnalyzed} |
| Total Issues | ${this.results.summary.totalIssues} |
| Alignment Issues | ${this.results.summary.alignmentIssues} |
| Spacing Issues | ${this.results.summary.spacingIssues} |
| Responsive Issues | ${this.results.summary.responsiveIssues} |
| Overlap Issues | ${this.results.summary.overlapIssues} |

## 🖼️ Screenshots

${this.results.screenshots.map(screenshot => `
### ${screenshot.page} - ${screenshot.viewport}
![${screenshot.page} ${screenshot.viewport}](${screenshot.path})
`).join('\n')}

## 🚨 Critical Issues

${this.results.issues.filter(i => i.severity === 'high' || i.severity === 'critical').map(issue => `
### ${issue.type} (${issue.severity.toUpperCase()})

**Page:** ${issue.page} (${issue.viewport})  
**Category:** ${issue.category}  
**Description:** ${issue.description}  
**Element:** ${issue.element}

**Details:**
\`\`\`json
${JSON.stringify(issue.details, null, 2)}
\`\`\`
`).join('\n')}

## ⚠️ Moderate Issues

${this.results.issues.filter(i => i.severity === 'moderate').slice(0, 10).map(issue => `
### ${issue.type}

**Page:** ${issue.page} (${issue.viewport})  
**Description:** ${issue.description}  
**Element:** ${issue.element}
`).join('\n')}

## 🔧 Recommendations

${this.results.recommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()})

${rec.description}

**Action:** ${rec.action}

**CSS Changes:**
\`\`\`css
${rec.cssChanges.join('\n')}
\`\`\`
`).join('\n')}

## 📋 Implementation Checklist

### Critical Fixes

- [ ] Fix sidebar-main content overlap
- [ ] Ensure sidebar is properly hidden on mobile
- [ ] Add mobile navigation alternative
- [ ] Fix touch target sizes for mobile

### High Priority

- [ ] Align icons and text in navigation items
- [ ] Standardize navigation item spacing
- [ ] Implement smooth transitions
- [ ] Test responsive behavior across breakpoints

### Moderate Priority

- [ ] Standardize padding across navigation items
- [ ] Optimize sidebar width for tablet
- [ ] Add proper focus indicators
- [ ] Improve animation performance

## 🎯 Success Criteria

- **Target:** 0 overlap issues between sidebar and main content
- **Target:** All navigation items properly aligned (< 3px variance)
- **Target:** Consistent spacing throughout navigation
- **Target:** Proper responsive behavior on all devices
- **Target:** Touch targets ≥ 44px on mobile

## 🔍 Testing Instructions

1. **Desktop Testing:**
   - Verify sidebar doesn't overlap main content
   - Check icon-text alignment in navigation
   - Test sidebar collapse/expand functionality

2. **Mobile Testing:**
   - Confirm sidebar is hidden by default
   - Test mobile navigation functionality
   - Verify touch target sizes

3. **Tablet Testing:**
   - Check sidebar width is appropriate
   - Verify content doesn't overflow
   - Test orientation changes

---

*This analysis was performed using automated layout detection. Manual testing across different devices is recommended for comprehensive validation.*
`;
  }

  generateCSSFixes() {
    const fixes = [];
    
    fixes.push(`/* Sidebar Layout Fixes - Generated ${this.results.timestamp} */`);
    fixes.push('');
    
    // CSS Custom Properties
    fixes.push('/* Design Tokens */');
    fixes.push(':root {');
    fixes.push('  --sidebar-width: 280px;');
    fixes.push('  --sidebar-collapsed-width: 80px;');
    fixes.push('  --nav-item-padding: 12px 16px;');
    fixes.push('  --nav-item-gap: 12px;');
    fixes.push('  --transition-duration: 0.3s;');
    fixes.push('  --transition-easing: cubic-bezier(0.4, 0, 0.2, 1);');
    fixes.push('}');
    fixes.push('');
    
    // Sidebar Base Styles
    fixes.push('/* Sidebar Base Styles */');
    fixes.push('.sidebar, [class*="sidebar"], nav[role="navigation"] {');
    fixes.push('  position: fixed;');
    fixes.push('  top: 0;');
    fixes.push('  left: 0;');
    fixes.push('  width: var(--sidebar-width);');
    fixes.push('  height: 100vh;');
    fixes.push('  z-index: 1000;');
    fixes.push('  transition: width var(--transition-duration) var(--transition-easing),');
    fixes.push('              transform var(--transition-duration) var(--transition-easing);');
    fixes.push('}');
    fixes.push('');
    
    // Main Content Adjustment
    fixes.push('/* Main Content Layout */');
    fixes.push('main, [role="main"], .main-content {');
    fixes.push('  margin-left: var(--sidebar-width);');
    fixes.push('  transition: margin-left var(--transition-duration) var(--transition-easing);');
    fixes.push('  min-height: 100vh;');
    fixes.push('}');
    fixes.push('');
    
    // Navigation Items
    fixes.push('/* Navigation Items */');
    fixes.push('.nav-item, .sidebar button, .sidebar a {');
    fixes.push('  display: flex;');
    fixes.push('  align-items: center;');
    fixes.push('  padding: var(--nav-item-padding);');
    fixes.push('  gap: var(--nav-item-gap);');
    fixes.push('  width: 100%;');
    fixes.push('  text-align: left;');
    fixes.push('  border: none;');
    fixes.push('  background: transparent;');
    fixes.push('  transition: background-color 0.2s ease;');
    fixes.push('}');
    fixes.push('');
    
    // Icon Alignment
    fixes.push('/* Icon Alignment */');
    fixes.push('.nav-item svg, .nav-item [class*="icon"] {');
    fixes.push('  flex-shrink: 0;');
    fixes.push('  width: 20px;');
    fixes.push('  height: 20px;');
    fixes.push('}');
    fixes.push('');
    
    // Collapsed State
    fixes.push('/* Collapsed Sidebar */');
    fixes.push('.sidebar.collapsed, .sidebar[data-collapsed="true"] {');
    fixes.push('  width: var(--sidebar-collapsed-width);');
    fixes.push('}');
    fixes.push('');
    fixes.push('.sidebar.collapsed + main,');
    fixes.push('.sidebar[data-collapsed="true"] + main {');
    fixes.push('  margin-left: var(--sidebar-collapsed-width);');
    fixes.push('}');
    fixes.push('');
    
    // Mobile Responsive
    fixes.push('/* Mobile Responsive */');
    fixes.push('@media (max-width: 768px) {');
    fixes.push('  .sidebar, [class*="sidebar"], nav[role="navigation"] {');
    fixes.push('    transform: translateX(-100%);');
    fixes.push('    width: var(--sidebar-width);');
    fixes.push('  }');
    fixes.push('  ');
    fixes.push('  .sidebar.open, .sidebar[data-open="true"] {');
    fixes.push('    transform: translateX(0);');
    fixes.push('  }');
    fixes.push('  ');
    fixes.push('  main, [role="main"], .main-content {');
    fixes.push('    margin-left: 0;');
    fixes.push('  }');
    fixes.push('  ');
    fixes.push('  /* Touch Targets */');
    fixes.push('  .nav-item, .sidebar button, .sidebar a {');
    fixes.push('    min-height: 44px;');
    fixes.push('    padding: 12px 16px;');
    fixes.push('  }');
    fixes.push('}');
    fixes.push('');
    
    // Tablet Responsive
    fixes.push('/* Tablet Responsive */');
    fixes.push('@media (min-width: 768px) and (max-width: 1024px) {');
    fixes.push('  .sidebar, [class*="sidebar"], nav[role="navigation"] {');
    fixes.push('    width: min(var(--sidebar-width), 35vw);');
    fixes.push('  }');
    fixes.push('  ');
    fixes.push('  main, [role="main"], .main-content {');
    fixes.push('    margin-left: min(var(--sidebar-width), 35vw);');
    fixes.push('  }');
    fixes.push('}');
    fixes.push('');
    
    // Focus States
    fixes.push('/* Focus States */');
    fixes.push('.nav-item:focus, .sidebar button:focus, .sidebar a:focus {');
    fixes.push('  outline: 2px solid #005fcc;');
    fixes.push('  outline-offset: -2px;');
    fixes.push('  background-color: rgba(0, 95, 204, 0.1);');
    fixes.push('}');
    fixes.push('');
    
    // Hover States
    fixes.push('/* Hover States */');
    fixes.push('.nav-item:hover, .sidebar button:hover, .sidebar a:hover {');
    fixes.push('  background-color: rgba(0, 0, 0, 0.05);');
    fixes.push('}');
    fixes.push('');
    
    // Active States
    fixes.push('/* Active States */');
    fixes.push('.nav-item.active, .nav-item[aria-current="page"] {');
    fixes.push('  background-color: rgba(0, 95, 204, 0.1);');
    fixes.push('  border-right: 3px solid #005fcc;');
    fixes.push('}');
    fixes.push('');
    
    // Overlay for Mobile
    fixes.push('/* Mobile Overlay */');
    fixes.push('@media (max-width: 768px) {');
    fixes.push('  .sidebar-overlay {');
    fixes.push('    position: fixed;');
    fixes.push('    top: 0;');
    fixes.push('    left: 0;');
    fixes.push('    width: 100vw;');
    fixes.push('    height: 100vh;');
    fixes.push('    background-color: rgba(0, 0, 0, 0.5);');
    fixes.push('    z-index: 999;');
    fixes.push('    opacity: 0;');
    fixes.push('    visibility: hidden;');
    fixes.push('    transition: opacity var(--transition-duration) ease,');
    fixes.push('                visibility var(--transition-duration) ease;');
    fixes.push('  }');
    fixes.push('  ');
    fixes.push('  .sidebar-overlay.active {');
    fixes.push('    opacity: 1;');
    fixes.push('    visibility: visible;');
    fixes.push('  }');
    fixes.push('}');
    
    return fixes.join('\n');
  }

  async run() {
    try {
      console.log('📐 Starting Sidebar Layout Analysis...');
      
      this.browser = await chromium.launch({ headless: true });
      
      // Create output directory
      await fs.mkdir('./audit-reports', { recursive: true });
      
      const pages = [
        { url: 'http://localhost:3000/dashboard', name: 'dashboard' },
        { url: 'http://localhost:3000/dashboard/content', name: 'content' },
        { url: 'http://localhost:3000/dashboard/campaigns', name: 'campaigns' },
        { url: 'http://localhost:3000/dashboard/clients', name: 'clients' }
      ];
      
      for (const page of pages) {
        await this.analyzeSidebarLayout(page.url, page.name);
      }
      
      const reports = await this.generateLayoutReport();
      
      console.log('\n🎉 Sidebar layout analysis completed!');
      console.log('\n📊 Summary:');
      console.log(`  Pages Analyzed: ${this.results.summary.pagesAnalyzed}`);
      console.log(`  Total Issues: ${this.results.summary.totalIssues}`);
      console.log(`  Critical/High: ${this.results.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length}`);
      console.log(`  Screenshots: ${this.results.screenshots.length}`);
      
      console.log('\n📄 Reports Generated:');
      console.log(`  📊 JSON: ${reports.json}`);
      console.log(`  📝 Markdown: ${reports.markdown}`);
      console.log(`  🎨 CSS Fixes: ${reports.cssFixes}`);
      
      return reports;
      
    } catch (error) {
      console.error('❌ Sidebar layout analysis failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const analyzer = new SidebarLayoutAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = SidebarLayoutAnalyzer;