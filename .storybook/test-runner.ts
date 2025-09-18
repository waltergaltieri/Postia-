import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Extender Jest con comparación de imágenes
expect.extend({ toMatchImageSnapshot });

const config: TestRunnerConfig = {
  setup() {
    // Configuración global antes de ejecutar tests
    console.log('Setting up Storybook test runner with enhanced automation...');
  },
  
  async preVisit(page, context) {
    // Configurar página para tests consistentes
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Deshabilitar animaciones para screenshots consistentes
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        
        /* Asegurar fuentes consistentes */
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      `
    });
    
    // Inyectar axe-core para tests de accesibilidad
    await injectAxe(page);
    
    // Esperar a que el contenido se estabilice
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  },
  
  async postVisit(page, context) {
    const storyContext = context;
    const storyId = storyContext.id;
    const storyTitle = storyContext.title;
    
    try {
      // 1. Tests de Accesibilidad
      await configureAxe(page, {
        rules: [
          // WCAG 2.1 AA Core Rules
          { id: 'color-contrast', enabled: true },
          { id: 'color-contrast-enhanced', enabled: true }, // AAA level
          { id: 'heading-order', enabled: true },
          { id: 'label', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'link-name', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'aria-roles', enabled: true },
          { id: 'aria-valid-attr', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'focus-order-semantics', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          
          // Reglas específicas para componentes premium
          { id: 'focus-visible', enabled: true },
          { id: 'target-size', enabled: true }, // Touch targets
          { id: 'motion-reduced', enabled: true }, // Respeto por preferencias de movimiento
        ],
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
      });

      // Ejecutar audit de accesibilidad
      await checkA11y(page, '#storybook-root', {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
        rules: {
          // Reglas personalizadas para nuestro design system
          'color-contrast': { enabled: true },
          'focus-visible': { enabled: true },
          'target-size': { enabled: true }
        }
      });

      // 2. Tests de Regresión Visual
      if (process.env.VISUAL_TESTS === 'true') {
        // Screenshot principal
        const screenshot = await page.screenshot({
          fullPage: false,
          clip: { x: 0, y: 0, width: 1200, height: 800 }
        });
        
        expect(screenshot).toMatchImageSnapshot({
          customSnapshotIdentifier: `${storyId}-main`,
          failureThreshold: 0.01,
          failureThresholdType: 'percent'
        });

        // Screenshots responsive si es un componente base
        if (storyTitle.includes('UI/') || storyTitle.includes('Design System/')) {
          const viewports = [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 }
          ];

          for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.waitForTimeout(300);
            
            const responsiveScreenshot = await page.screenshot({
              fullPage: false
            });
            
            expect(responsiveScreenshot).toMatchImageSnapshot({
              customSnapshotIdentifier: `${storyId}-${viewport.name}`,
              failureThreshold: 0.02,
              failureThresholdType: 'percent'
            });
          }
          
          // Resetear viewport
          await page.setViewportSize({ width: 1280, height: 720 });
        }
      }

      // 3. Tests de Performance
      if (process.env.PERFORMANCE_TESTS === 'true') {
        // Medir tiempo de renderizado
        const renderTime = await page.evaluate(() => {
          return performance.now();
        });

        // Medir uso de memoria si está disponible
        const memoryUsage = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        // Verificar que el renderizado sea rápido
        expect(renderTime).toBeLessThan(2000);
        
        // Verificar que el uso de memoria sea razonable (menos de 50MB)
        if (memoryUsage > 0) {
          expect(memoryUsage).toBeLessThan(50 * 1024 * 1024);
        }
      }

      // 4. Tests de Interactividad
      const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
      
      if (interactiveElements > 0) {
        // Verificar que los elementos interactivos son focuseables
        const firstInteractive = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
        
        if (await firstInteractive.isVisible()) {
          await firstInteractive.focus();
          const isFocused = await firstInteractive.evaluate(el => document.activeElement === el);
          expect(isFocused).toBeTruthy();
        }
      }

      // 5. Tests de Temas (si aplica)
      if (storyTitle.includes('Design System/') || process.env.THEME_TESTS === 'true') {
        // Test modo oscuro
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });
        
        await page.waitForTimeout(200);
        
        // Verificar que el modo oscuro no rompe la accesibilidad
        await checkA11y(page, '#storybook-root', {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        // Remover modo oscuro
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
        });
      }

    } catch (error) {
      console.error(`Test failed for story ${storyId}:`, error);
      throw error;
    }
  },
  
  // Configuración de tags para ejecutar tests específicos
  tags: {
    include: ['test', 'accessibility', 'visual'],
    exclude: ['skip-test', 'manual-only'],
    skip: ['broken', 'wip'],
  },
  
  // Configuración de timeouts
  getHttpHeaders: async (url) => {
    return {
      'Accept-Language': 'en-US,en;q=0.9'
    };
  }
};

export default config;