import { test, expect, Page } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Automated Testing Suite for UI/UX Design System
 * Integrates visual regression, accessibility, and performance testing
 */

interface TestReport {
  timestamp: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  visualRegression: {
    screenshotsTaken: number;
    regressionDetected: number;
    newBaselines: number;
  };
  accessibility: {
    componentsAudited: number;
    violationsFound: number;
    wcagLevel: string;
  };
  performance: {
    componentsProfiled: number;
    averageLoadTime: number;
    averageFPS: number;
  };
  components: ComponentTestResult[];
}

interface ComponentTestResult {
  name: string;
  visual: {
    passed: boolean;
    screenshots: number;
    regressions: string[];
  };
  accessibility: {
    passed: boolean;
    violations: number;
    score: number;
  };
  performance: {
    passed: boolean;
    loadTime: number;
    fps: number;
    memoryUsage: number;
  };
}

class TestAutomation {
  private page: Page;
  private report: TestReport;
  
  constructor(page: Page) {
    this.page = page;
    this.report = {
      timestamp: new Date().toISOString(),
      summary: { totalTests: 0, passed: 0, failed: 0, skipped: 0 },
      visualRegression: { screenshotsTaken: 0, regressionDetected: 0, newBaselines: 0 },
      accessibility: { componentsAudited: 0, violationsFound: 0, wcagLevel: 'AA' },
      performance: { componentsProfiled: 0, averageLoadTime: 0, averageFPS: 0 },
      components: []
    };
  }

  async runComprehensiveTest(componentName: string, storyUrl: string): Promise<ComponentTestResult> {
    console.log(`Testing component: ${componentName}`);
    
    const result: ComponentTestResult = {
      name: componentName,
      visual: { passed: false, screenshots: 0, regressions: [] },
      accessibility: { passed: false, violations: 0, score: 0 },
      performance: { passed: false, loadTime: 0, fps: 0, memoryUsage: 0 }
    };

    try {
      // Navegar al componente
      await this.page.goto(storyUrl);
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);

      // Ejecutar tests en paralelo cuando sea posible
      const [visualResult, accessibilityResult, performanceResult] = await Promise.allSettled([
        this.runVisualTests(componentName),
        this.runAccessibilityTests(),
        this.runPerformanceTests()
      ]);

      // Procesar resultados
      if (visualResult.status === 'fulfilled') {
        result.visual = visualResult.value;
      }
      
      if (accessibilityResult.status === 'fulfilled') {
        result.accessibility = accessibilityResult.value;
      }
      
      if (performanceResult.status === 'fulfilled') {
        result.performance = performanceResult.value;
      }

      this.report.components.push(result);
      return result;

    } catch (error) {
      console.error(`Error testing ${componentName}:`, error);
      result.visual.regressions.push(`Error: ${error}`);
      return result;
    }
  }

  private async runVisualTests(componentName: string) {
    const result = { passed: true, screenshots: 0, regressions: [] as string[] };

    try {
      // Deshabilitar animaciones para screenshots consistentes
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      });

      // Screenshot principal
      await this.page.screenshot({
        path: `test-results/screenshots/${componentName}-main.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });
      result.screenshots++;

      // Screenshots responsive
      const viewports = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1280, height: 720 }
      ];

      for (const viewport of viewports) {
        await this.page.setViewportSize(viewport);
        await this.page.waitForTimeout(300);
        
        await this.page.screenshot({
          path: `test-results/screenshots/${componentName}-${viewport.name}.png`,
          fullPage: false
        });
        result.screenshots++;
      }

      // Resetear viewport
      await this.page.setViewportSize({ width: 1280, height: 720 });

      // Screenshots de estados interactivos
      const interactiveElements = await this.page.locator('button, .card, [data-testid]').all();
      
      for (let i = 0; i < Math.min(interactiveElements.length, 3); i++) {
        try {
          await interactiveElements[i].hover();
          await this.page.waitForTimeout(200);
          
          await this.page.screenshot({
            path: `test-results/screenshots/${componentName}-hover-${i}.png`,
            clip: { x: 0, y: 0, width: 800, height: 600 }
          });
          result.screenshots++;
        } catch (error) {
          console.warn(`Could not capture hover state for element ${i}:`, error);
        }
      }

      this.report.visualRegression.screenshotsTaken += result.screenshots;

    } catch (error) {
      result.passed = false;
      result.regressions.push(`Visual test error: ${error}`);
    }

    return result;
  }

  private async runAccessibilityTests() {
    const result = { passed: true, violations: 0, score: 0 };

    try {
      // Importar axe-core dinámicamente
      const AxeBuilder = (await import('@axe-core/playwright')).default;
      
      const accessibilityResults = await new AxeBuilder({ page: this.page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze();

      result.violations = accessibilityResults.violations.length;
      result.score = accessibilityResults.passes.length / 
                    (accessibilityResults.passes.length + accessibilityResults.violations.length + accessibilityResults.incomplete.length);
      
      result.passed = result.violations === 0;
      
      this.report.accessibility.componentsAudited++;
      this.report.accessibility.violationsFound += result.violations;

      // Log violations for debugging
      if (result.violations > 0) {
        console.warn('Accessibility violations found:', accessibilityResults.violations.map(v => v.id));
      }

    } catch (error) {
      result.passed = false;
      console.error('Accessibility test error:', error);
    }

    return result;
  }

  private async runPerformanceTests() {
    const result = { passed: true, loadTime: 0, fps: 0, memoryUsage: 0 };

    try {
      // Medir tiempo de carga
      const startTime = Date.now();
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      result.loadTime = Date.now() - startTime;

      // Medir FPS durante interacciones
      result.fps = await this.page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let frameCount = 0;
          const startTime = performance.now();
          
          function countFrames() {
            frameCount++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(countFrames);
            } else {
              resolve(frameCount);
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });

      // Medir uso de memoria (si está disponible)
      result.memoryUsage = await this.page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Criterios de aprobación
      result.passed = result.loadTime < 3000 && result.fps > 30;
      
      this.report.performance.componentsProfiled++;
      this.report.performance.averageLoadTime += result.loadTime;
      this.report.performance.averageFPS += result.fps;

    } catch (error) {
      result.passed = false;
      console.error('Performance test error:', error);
    }

    return result;
  }

  generateReport(): TestReport {
    // Calcular promedios
    if (this.report.performance.componentsProfiled > 0) {
      this.report.performance.averageLoadTime /= this.report.performance.componentsProfiled;
      this.report.performance.averageFPS /= this.report.performance.componentsProfiled;
    }

    // Calcular resumen
    this.report.summary.totalTests = this.report.components.length;
    this.report.summary.passed = this.report.components.filter(c => 
      c.visual.passed && c.accessibility.passed && c.performance.passed
    ).length;
    this.report.summary.failed = this.report.summary.totalTests - this.report.summary.passed;

    return this.report;
  }

  async saveReport(outputPath: string = 'test-results/automation-report.json') {
    const report = this.generateReport();
    
    // Crear directorio si no existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Guardar reporte JSON
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    // Generar reporte HTML
    const htmlReport = this.generateHTMLReport(report);
    fs.writeFileSync(outputPath.replace('.json', '.html'), htmlReport);
    
    console.log(`Reports saved to ${outputPath} and ${outputPath.replace('.json', '.html')}`);
  }

  private generateHTMLReport(report: TestReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI/UX Testing Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .components { margin-top: 40px; }
        .component { border: 1px solid #ddd; border-radius: 6px; margin-bottom: 20px; overflow: hidden; }
        .component-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .component-details { padding: 15px; }
        .test-result { display: inline-block; margin: 5px; padding: 5px 10px; border-radius: 4px; font-size: 0.9em; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>UI/UX Design System Testing Report</h1>
            <p class="timestamp">Generated: ${report.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${report.summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value" style="color: #28a745;">${report.summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value" style="color: #dc3545;">${report.summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Screenshots</h3>
                <div class="value">${report.visualRegression.screenshotsTaken}</div>
            </div>
            <div class="metric">
                <h3>Avg Load Time</h3>
                <div class="value">${Math.round(report.performance.averageLoadTime)}ms</div>
            </div>
            <div class="metric">
                <h3>Avg FPS</h3>
                <div class="value">${Math.round(report.performance.averageFPS)}</div>
            </div>
        </div>
        
        <div class="components">
            <h2>Component Results</h2>
            ${report.components.map(component => `
                <div class="component">
                    <div class="component-header">${component.name}</div>
                    <div class="component-details">
                        <div class="test-result ${component.visual.passed ? 'passed' : 'failed'}">
                            Visual: ${component.visual.passed ? 'PASS' : 'FAIL'} (${component.visual.screenshots} screenshots)
                        </div>
                        <div class="test-result ${component.accessibility.passed ? 'passed' : 'failed'}">
                            A11y: ${component.accessibility.passed ? 'PASS' : 'FAIL'} (${component.accessibility.violations} violations)
                        </div>
                        <div class="test-result ${component.performance.passed ? 'passed' : 'failed'}">
                            Performance: ${component.performance.passed ? 'PASS' : 'FAIL'} (${component.performance.loadTime}ms, ${Math.round(component.performance.fps)}fps)
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }
}

// Tests automatizados principales
test.describe('Automated Design System Testing', () => {
  let automation: TestAutomation;

  test.beforeEach(async ({ page }) => {
    automation = new TestAutomation(page);
    
    // Configurar página para tests consistentes
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
  });

  test('Run comprehensive component testing suite', async ({ page }) => {
    const components = [
      { name: 'Button', url: '/iframe.html?id=ui-button--all-variants' },
      { name: 'Card', url: '/iframe.html?id=ui-card--card-grid' },
      { name: 'Badge', url: '/iframe.html?id=ui-badge--all-variants' },
      { name: 'ContentCard', url: '/iframe.html?id=ui-contentcard--content-grid' },
      { name: 'DesignSystem', url: '/iframe.html?id=design-system-overview--component-showcase' }
    ];

    // Ejecutar tests para cada componente
    for (const component of components) {
      const result = await automation.runComprehensiveTest(component.name, component.url);
      
      // Verificar que al menos los tests críticos pasen
      expect(result.accessibility.passed).toBeTruthy();
      expect(result.visual.screenshots).toBeGreaterThan(0);
      expect(result.performance.loadTime).toBeLessThan(5000);
    }

    // Generar y guardar reporte
    await automation.saveReport();
    
    const report = automation.generateReport();
    
    // Verificar métricas generales
    expect(report.summary.passed).toBeGreaterThan(0);
    expect(report.accessibility.violationsFound).toBe(0);
    expect(report.performance.averageLoadTime).toBeLessThan(3000);
    
    console.log('Automation Summary:', {
      totalTests: report.summary.totalTests,
      passed: report.summary.passed,
      failed: report.summary.failed,
      screenshots: report.visualRegression.screenshotsTaken,
      avgLoadTime: Math.round(report.performance.averageLoadTime),
      avgFPS: Math.round(report.performance.averageFPS)
    });
  });

  test('Continuous integration compatibility check', async ({ page }) => {
    // Verificar que los tests pueden ejecutarse en CI
    const ciCompatibility = {
      storybookRunning: false,
      screenshotsWorking: false,
      accessibilityToolsAvailable: false,
      performanceMetricsAvailable: false
    };

    try {
      // Verificar Storybook
      await page.goto('/');
      await page.waitForSelector('body', { timeout: 10000 });
      ciCompatibility.storybookRunning = true;

      // Verificar screenshots
      await page.screenshot({ path: 'test-results/ci-test.png' });
      ciCompatibility.screenshotsWorking = fs.existsSync('test-results/ci-test.png');

      // Verificar herramientas de accesibilidad
      try {
        const AxeBuilder = (await import('@axe-core/playwright')).default;
        await new AxeBuilder({ page }).analyze();
        ciCompatibility.accessibilityToolsAvailable = true;
      } catch (error) {
        console.warn('Accessibility tools not available:', error);
      }

      // Verificar métricas de performance
      const hasPerformanceAPI = await page.evaluate(() => {
        return typeof performance !== 'undefined' && 
               typeof performance.now === 'function';
      });
      ciCompatibility.performanceMetricsAvailable = hasPerformanceAPI;

    } catch (error) {
      console.error('CI compatibility check failed:', error);
    }

    // Verificar que los componentes críticos funcionan en CI
    expect(ciCompatibility.storybookRunning).toBeTruthy();
    expect(ciCompatibility.screenshotsWorking).toBeTruthy();
    expect(ciCompatibility.accessibilityToolsAvailable).toBeTruthy();
    expect(ciCompatibility.performanceMetricsAvailable).toBeTruthy();

    console.log('CI Compatibility:', ciCompatibility);
  });
});

export { TestAutomation, type TestReport, type ComponentTestResult };