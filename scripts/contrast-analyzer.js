#!/usr/bin/env node

/**
 * Color Contrast Analysis Tool
 * 
 * Specialized tool for analyzing color contrast issues in the Postia SaaS application.
 * Uses advanced color analysis techniques to identify problematic color combinations.
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class ContrastAnalyzer {
  constructor() {
    this.browser = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalElements: 0,
        contrastViolations: 0,
        wcagAAFailures: 0,
        wcagAAAFailures: 0,
        invisibleTextElements: 0
      },
      violations: [],
      recommendations: []
    };
  }

  // Convert RGB to relative luminance
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio between two colors
  getContrastRatio(color1, color2) {
    const l1 = this.getLuminance(...color1);
    const l2 = this.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Parse RGB color string to array
  parseRGB(rgbString) {
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return null;
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }

  // Convert RGB to hex
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Determine if contrast meets WCAG standards
  meetsWCAG(ratio, level = 'AA', size = 'normal') {
    if (level === 'AA') {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    } else if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    }
    return false;
  }

  // Suggest better color alternatives
  suggestBetterColors(foreground, background, targetRatio = 4.5) {
    const [fr, fg, fb] = foreground;
    const [br, bg, bb] = background;
    
    const suggestions = [];
    
    // Try darkening the foreground
    for (let factor = 0.1; factor <= 0.9; factor += 0.1) {
      const newFg = [
        Math.round(fr * factor),
        Math.round(fg * factor),
        Math.round(fb * factor)
      ];
      const ratio = this.getContrastRatio(newFg, background);
      if (ratio >= targetRatio) {
        suggestions.push({
          type: 'darken-foreground',
          color: this.rgbToHex(...newFg),
          ratio: ratio.toFixed(2),
          factor: factor.toFixed(1)
        });
        break;
      }
    }
    
    // Try lightening the foreground
    for (let factor = 1.1; factor <= 2.0; factor += 0.1) {
      const newFg = [
        Math.min(255, Math.round(fr * factor)),
        Math.min(255, Math.round(fg * factor)),
        Math.min(255, Math.round(fb * factor))
      ];
      const ratio = this.getContrastRatio(newFg, background);
      if (ratio >= targetRatio) {
        suggestions.push({
          type: 'lighten-foreground',
          color: this.rgbToHex(...newFg),
          ratio: ratio.toFixed(2),
          factor: factor.toFixed(1)
        });
        break;
      }
    }
    
    // Try darkening the background
    for (let factor = 0.1; factor <= 0.9; factor += 0.1) {
      const newBg = [
        Math.round(br * factor),
        Math.round(bg * factor),
        Math.round(bb * factor)
      ];
      const ratio = this.getContrastRatio(foreground, newBg);
      if (ratio >= targetRatio) {
        suggestions.push({
          type: 'darken-background',
          color: this.rgbToHex(...newBg),
          ratio: ratio.toFixed(2),
          factor: factor.toFixed(1)
        });
        break;
      }
    }
    
    // Try lightening the background
    for (let factor = 1.1; factor <= 2.0; factor += 0.1) {
      const newBg = [
        Math.min(255, Math.round(br * factor)),
        Math.min(255, Math.round(bg * factor)),
        Math.min(255, Math.round(bb * factor))
      ];
      const ratio = this.getContrastRatio(foreground, newBg);
      if (ratio >= targetRatio) {
        suggestions.push({
          type: 'lighten-background',
          color: this.rgbToHex(...newBg),
          ratio: ratio.toFixed(2),
          factor: factor.toFixed(1)
        });
        break;
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  async analyzePageContrast(url) {
    console.log(`🎨 Analyzing contrast for: ${url}`);
    
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('*');
        let elementCount = 0;
        
        // Helper functions (duplicated in browser context)
        const getLuminance = (r, g, b) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const getContrastRatio = (color1, color2) => {
          const l1 = getLuminance(...color1);
          const l2 = getLuminance(...color2);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        };
        
        const parseRGB = (rgbString) => {
          const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
          if (!match) return null;
          return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        };
        
        const rgbToHex = (r, g, b) => {
          return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };
        
        const meetsWCAG = (ratio, level = 'AA', size = 'normal') => {
          if (level === 'AA') {
            return size === 'large' ? ratio >= 3 : ratio >= 4.5;
          } else if (level === 'AAA') {
            return size === 'large' ? ratio >= 4.5 : ratio >= 7;
          }
          return false;
        };
        
        const isLargeText = (element) => {
          const style = window.getComputedStyle(element);
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = style.fontWeight;
          
          // Large text is 18pt+ or 14pt+ bold (roughly 24px+ or 19px+ bold)
          return fontSize >= 24 || (fontSize >= 19 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        };
        
        const getElementSelector = (element) => {
          if (element.id) return `#${element.id}`;
          if (element.className) {
            const classes = element.className.split(' ').filter(c => c.length > 0);
            if (classes.length > 0) return `${element.tagName.toLowerCase()}.${classes[0]}`;
          }
          return element.tagName.toLowerCase();
        };
        
        elements.forEach((element, index) => {
          if (index > 500) return; // Limit analysis to first 500 elements
          
          const textContent = element.textContent?.trim();
          if (!textContent || textContent.length === 0) return;
          
          // Skip if element is not visible
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          
          elementCount++;
          
          const style = window.getComputedStyle(element);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          // Get parent background if current is transparent
          let bgColor = backgroundColor;
          let parent = element.parentElement;
          while (parent && (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')) {
            bgColor = window.getComputedStyle(parent).backgroundColor;
            parent = parent.parentElement;
          }
          
          // Default to white if no background found
          if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
            bgColor = 'rgb(255, 255, 255)';
          }
          
          const foregroundRGB = parseRGB(color);
          const backgroundRGB = parseRGB(bgColor);
          
          if (!foregroundRGB || !backgroundRGB) return;
          
          const contrastRatio = getContrastRatio(foregroundRGB, backgroundRGB);
          const isLarge = isLargeText(element);
          const meetsAA = meetsWCAG(contrastRatio, 'AA', isLarge ? 'large' : 'normal');
          const meetsAAA = meetsWCAG(contrastRatio, 'AAA', isLarge ? 'large' : 'normal');
          
          // Check for specific problematic combinations
          const isWhiteOnWhite = foregroundRGB.every(c => c > 240) && backgroundRGB.every(c => c > 240);
          const isBlackOnBlack = foregroundRGB.every(c => c < 15) && backgroundRGB.every(c => c < 15);
          const isIdentical = foregroundRGB.every((c, i) => Math.abs(c - backgroundRGB[i]) < 5);
          
          if (!meetsAA || isWhiteOnWhite || isBlackOnBlack || isIdentical) {
            issues.push({
              element: getElementSelector(element),
              text: textContent.substring(0, 100),
              foreground: {
                rgb: foregroundRGB,
                hex: rgbToHex(...foregroundRGB)
              },
              background: {
                rgb: backgroundRGB,
                hex: rgbToHex(...backgroundRGB)
              },
              contrastRatio: parseFloat(contrastRatio.toFixed(2)),
              isLargeText: isLarge,
              meetsWCAG_AA: meetsAA,
              meetsWCAG_AAA: meetsAAA,
              severity: isWhiteOnWhite || isBlackOnBlack || isIdentical ? 'critical' : 
                       !meetsAA ? 'high' : 'moderate',
              issues: {
                whiteOnWhite: isWhiteOnWhite,
                blackOnBlack: isBlackOnBlack,
                identical: isIdentical,
                lowContrast: !meetsAA
              },
              position: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              }
            });
          }
        });
        
        return { issues, elementCount };
      });
      
      // Add suggestions for each issue
      contrastIssues.issues.forEach(issue => {
        issue.suggestions = this.suggestBetterColors(
          issue.foreground.rgb,
          issue.background.rgb,
          issue.isLargeText ? 3 : 4.5
        );
      });
      
      this.results.summary.totalElements += contrastIssues.elementCount;
      this.results.violations.push(...contrastIssues.issues);
      
      console.log(`  ✅ Found ${contrastIssues.issues.length} contrast issues in ${contrastIssues.elementCount} elements`);
      
    } catch (error) {
      console.error(`  ❌ Error analyzing ${url}:`, error.message);
    } finally {
      await context.close();
    }
  }

  async generateContrastReport() {
    // Update summary statistics
    this.results.summary.contrastViolations = this.results.violations.length;
    this.results.summary.wcagAAFailures = this.results.violations.filter(v => !v.meetsWCAG_AA).length;
    this.results.summary.wcagAAAFailures = this.results.violations.filter(v => !v.meetsWCAG_AAA).length;
    this.results.summary.invisibleTextElements = this.results.violations.filter(v => 
      v.issues.whiteOnWhite || v.issues.blackOnBlack || v.issues.identical
    ).length;
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Create reports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = './audit-reports';
    await fs.mkdir(outputDir, { recursive: true });
    
    // JSON report
    const jsonPath = path.join(outputDir, `contrast-analysis-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));
    
    // Markdown report
    const markdownReport = this.generateMarkdownReport();
    const markdownPath = path.join(outputDir, `contrast-analysis-${timestamp}.md`);
    await fs.writeFile(markdownPath, markdownReport);
    
    // CSS fixes file
    const cssFixesPath = path.join(outputDir, `contrast-fixes-${timestamp}.css`);
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
    
    // Group violations by severity
    const critical = this.results.violations.filter(v => v.severity === 'critical');
    const high = this.results.violations.filter(v => v.severity === 'high');
    
    if (critical.length > 0) {
      recommendations.push({
        priority: 'critical',
        title: 'Fix Invisible Text Elements',
        description: `${critical.length} elements have invisible or nearly invisible text`,
        action: 'Update CSS to ensure proper color contrast',
        elements: critical.map(v => v.element).slice(0, 10)
      });
    }
    
    if (high.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Low Contrast Text',
        description: `${high.length} elements fail WCAG AA contrast requirements`,
        action: 'Adjust text or background colors to meet 4.5:1 ratio',
        elements: high.map(v => v.element).slice(0, 10)
      });
    }
    
    // Color palette recommendations
    const commonColors = {};
    this.results.violations.forEach(v => {
      const key = `${v.foreground.hex}-${v.background.hex}`;
      commonColors[key] = (commonColors[key] || 0) + 1;
    });
    
    const mostProblematic = Object.entries(commonColors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (mostProblematic.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Update Color Palette',
        description: 'Most problematic color combinations that appear frequently',
        action: 'Create new color variables with proper contrast ratios',
        colorCombinations: mostProblematic.map(([colors, count]) => ({
          colors,
          occurrences: count
        }))
      });
    }
    
    this.results.recommendations = recommendations;
  }

  generateMarkdownReport() {
    return `# 🎨 Color Contrast Analysis Report

**Generated:** ${this.results.timestamp}  
**Application:** Postia SaaS

## 📊 Summary

| Metric | Count |
|--------|-------|
| Total Elements Analyzed | ${this.results.summary.totalElements} |
| Contrast Violations | ${this.results.summary.contrastViolations} |
| WCAG AA Failures | ${this.results.summary.wcagAAFailures} |
| WCAG AAA Failures | ${this.results.summary.wcagAAAFailures} |
| Invisible Text Elements | ${this.results.summary.invisibleTextElements} |

## 🚨 Critical Issues

${this.results.violations.filter(v => v.severity === 'critical').map(violation => `
### ${violation.element}

- **Text:** "${violation.text}"
- **Foreground:** ${violation.foreground.hex} (RGB: ${violation.foreground.rgb.join(', ')})
- **Background:** ${violation.background.hex} (RGB: ${violation.background.rgb.join(', ')})
- **Contrast Ratio:** ${violation.contrastRatio}:1
- **Issues:** ${Object.entries(violation.issues).filter(([,v]) => v).map(([k]) => k).join(', ')}

**Suggested Fixes:**
${violation.suggestions.map(s => `- ${s.type}: ${s.color} (ratio: ${s.ratio}:1)`).join('\n')}
`).join('\n')}

## ⚠️ High Priority Issues

${this.results.violations.filter(v => v.severity === 'high').slice(0, 10).map(violation => `
### ${violation.element}

- **Contrast Ratio:** ${violation.contrastRatio}:1 ${violation.meetsWCAG_AA ? '✅' : '❌'} WCAG AA
- **Colors:** ${violation.foreground.hex} on ${violation.background.hex}
- **Large Text:** ${violation.isLargeText ? 'Yes' : 'No'}

**Best Fix:** ${violation.suggestions[0] ? `${violation.suggestions[0].type} to ${violation.suggestions[0].color}` : 'Manual adjustment needed'}
`).join('\n')}

## 🔧 Recommendations

${this.results.recommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()})

${rec.description}

**Action:** ${rec.action}

${rec.elements ? `**Affected Elements:**\n${rec.elements.map(e => `- ${e}`).join('\n')}` : ''}

${rec.colorCombinations ? `**Problematic Color Combinations:**\n${rec.colorCombinations.map(c => `- ${c.colors} (${c.occurrences} occurrences)`).join('\n')}` : ''}
`).join('\n')}

## 📋 Implementation Checklist

### Immediate Actions (Critical)

- [ ] Fix white-on-white text elements
- [ ] Fix black-on-black text elements  
- [ ] Fix identical foreground/background colors
- [ ] Test with screen readers

### Short Term (High Priority)

- [ ] Update primary text colors to meet WCAG AA
- [ ] Adjust button text contrast
- [ ] Fix form input placeholder colors
- [ ] Update link colors and states

### Medium Term

- [ ] Create comprehensive color palette with contrast ratios
- [ ] Document color usage guidelines
- [ ] Set up automated contrast testing
- [ ] Train team on accessibility color requirements

## 🎯 Success Criteria

- **Target:** 0 critical contrast violations
- **Target:** All text meets WCAG AA (4.5:1 ratio)
- **Target:** Large text meets WCAG AA (3:1 ratio)
- **Target:** Interactive elements have clear focus indicators

---

*This analysis was performed using automated tools. Manual testing with users who have visual impairments is recommended for comprehensive accessibility validation.*
`;
  }

  generateCSSFixes() {
    const fixes = [];
    
    fixes.push(`/* Color Contrast Fixes - Generated ${this.results.timestamp} */`);
    fixes.push('');
    
    // Generate CSS custom properties for better colors
    fixes.push('/* Improved Color Palette */');
    fixes.push(':root {');
    
    // Collect unique problematic colors and suggest fixes
    const colorFixes = new Map();
    
    this.results.violations.forEach(violation => {
      if (violation.suggestions.length > 0) {
        const bestSuggestion = violation.suggestions[0];
        const originalColor = violation.foreground.hex;
        
        if (!colorFixes.has(originalColor)) {
          colorFixes.set(originalColor, bestSuggestion.color);
        }
      }
    });
    
    colorFixes.forEach((newColor, originalColor) => {
      const varName = `--text-${originalColor.replace('#', '').toLowerCase()}`;
      fixes.push(`  ${varName}: ${newColor}; /* was ${originalColor} */`);
    });
    
    fixes.push('}');
    fixes.push('');
    
    // Generate specific element fixes
    fixes.push('/* Element-Specific Fixes */');
    
    const elementFixes = new Map();
    this.results.violations.forEach(violation => {
      if (!elementFixes.has(violation.element) && violation.suggestions.length > 0) {
        elementFixes.set(violation.element, violation.suggestions[0]);
      }
    });
    
    elementFixes.forEach((suggestion, element) => {
      fixes.push(`${element} {`);
      if (suggestion.type.includes('foreground')) {
        fixes.push(`  color: ${suggestion.color} !important;`);
      } else {
        fixes.push(`  background-color: ${suggestion.color} !important;`);
      }
      fixes.push(`  /* Contrast ratio: ${suggestion.ratio}:1 */`);
      fixes.push('}');
      fixes.push('');
    });
    
    // Add focus indicator fixes
    fixes.push('/* Focus Indicator Improvements */');
    fixes.push('*:focus {');
    fixes.push('  outline: 2px solid #005fcc !important;');
    fixes.push('  outline-offset: 2px !important;');
    fixes.push('}');
    fixes.push('');
    
    fixes.push('/* Placeholder Text Fixes */');
    fixes.push('input::placeholder, textarea::placeholder {');
    fixes.push('  color: #6b7280 !important; /* Ensures 4.5:1 contrast on white */');
    fixes.push('  opacity: 1 !important;');
    fixes.push('}');
    
    return fixes.join('\n');
  }

  async run() {
    try {
      console.log('🎨 Starting Color Contrast Analysis...');
      
      this.browser = await chromium.launch({ headless: true });
      
      const urls = [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/dashboard/content',
        'http://localhost:3000/dashboard/campaigns',
        'http://localhost:3000/dashboard/clients'
      ];
      
      for (const url of urls) {
        await this.analyzePageContrast(url);
      }
      
      const reports = await this.generateContrastReport();
      
      console.log('\n🎉 Contrast analysis completed!');
      console.log('\n📊 Summary:');
      console.log(`  Elements Analyzed: ${this.results.summary.totalElements}`);
      console.log(`  Contrast Violations: ${this.results.summary.contrastViolations}`);
      console.log(`  Critical Issues: ${this.results.violations.filter(v => v.severity === 'critical').length}`);
      console.log(`  High Priority: ${this.results.violations.filter(v => v.severity === 'high').length}`);
      
      console.log('\n📄 Reports Generated:');
      console.log(`  📊 JSON: ${reports.json}`);
      console.log(`  📝 Markdown: ${reports.markdown}`);
      console.log(`  🎨 CSS Fixes: ${reports.cssFixes}`);
      
      return reports;
      
    } catch (error) {
      console.error('❌ Contrast analysis failed:', error);
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
  const analyzer = new ContrastAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = ContrastAnalyzer;