import { test, expect } from '@playwright/test';

// Configuración avanzada para tests visuales
test.describe('Advanced Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport consistente
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
    
    // Esperar a que las fuentes se carguen
    await page.waitForLoadState('networkidle');
  });

  // Tests de componentes individuales con múltiples estados
  test('Button component - all states and variants', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-button--all-variants');
    
    // Esperar a que todos los botones se rendericen
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(500); // Tiempo adicional para estabilización
    
    // Screenshot del estado inicial
    await expect(page).toHaveScreenshot('button-all-states.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 },
      animations: 'disabled'
    });
    
    // Test de estados hover individuales
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      await buttons[i].hover();
      await page.waitForTimeout(200);
      
      await expect(page).toHaveScreenshot(`button-hover-state-${i}.png`, {
        clip: { x: 0, y: 0, width: 1200, height: 800 },
        animations: 'disabled'
      });
    }
  });

  test('Card component - layout variations', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-card--card-grid');
    
    await page.waitForSelector('.card, [data-testid="card"]', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Screenshot del grid completo
    await expect(page).toHaveScreenshot('card-grid-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test de hover en cards individuales
    const cards = await page.locator('.card, [data-testid="card"]').all();
    if (cards.length > 0) {
      await cards[0].hover();
      await page.waitForTimeout(200);
      
      await expect(page).toHaveScreenshot('card-hover-effect.png', {
        clip: { x: 0, y: 0, width: 400, height: 300 },
        animations: 'disabled'
      });
    }
  });

  test('ContentCard component - content variations', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-contentcard--content-grid');
    
    await page.waitForSelector('.content-card, [data-testid="content-card"]', { timeout: 10000 });
    
    // Esperar a que las imágenes se carguen
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).every(img => img.complete);
    }, { timeout: 15000 });
    
    await expect(page).toHaveScreenshot('content-card-variations.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Badge component - all variants and sizes', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-badge--all-variants');
    
    await page.waitForSelector('.badge, [data-testid="badge"]', { timeout: 10000 });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('badge-all-variants.png', {
      clip: { x: 0, y: 0, width: 800, height: 400 },
      animations: 'disabled'
    });
  });

  test('Design System - color palette consistency', async ({ page }) => {
    await page.goto('/iframe.html?id=design-system-overview--color-palette');
    
    await page.waitForSelector('h2', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('design-system-colors.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Design System - typography scale', async ({ page }) => {
    await page.goto('/iframe.html?id=design-system-overview--typography');
    
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('design-system-typography.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

// Tests de responsive design con múltiples breakpoints
test.describe('Responsive Visual Regression', () => {
  const breakpoints = [
    { name: 'mobile-portrait', width: 375, height: 667 },
    { name: 'mobile-landscape', width: 667, height: 375 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'desktop-small', width: 1280, height: 720 },
    { name: 'desktop-large', width: 1920, height: 1080 },
  ];

  breakpoints.forEach(({ name, width, height }) => {
    test(`Button responsive design - ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/iframe.html?id=ui-button--all-variants');
      
      await page.waitForSelector('button', { timeout: 10000 });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`button-responsive-${name}.png`, {
        fullPage: false,
        clip: { x: 0, y: 0, width: Math.min(width, 1200), height: Math.min(height, 800) },
        animations: 'disabled'
      });
    });

    test(`Card grid responsive - ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/iframe.html?id=ui-card--card-grid');
      
      await page.waitForSelector('.card, [data-testid="card"]', { timeout: 10000 });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`card-grid-responsive-${name}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(`ContentCard responsive - ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/iframe.html?id=ui-contentcard--instagram-post');
      
      await page.waitForSelector('.content-card, [data-testid="content-card"]', { timeout: 10000 });
      
      // Esperar imágenes en móvil puede tomar más tiempo
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).every(img => img.complete);
      }, { timeout: 20000 });
      
      await expect(page).toHaveScreenshot(`content-card-responsive-${name}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });
});

// Tests de temas (light/dark mode)
test.describe('Theme Visual Regression', () => {
  const themes = ['light', 'dark'];
  
  themes.forEach((theme) => {
    test.beforeEach(async ({ page }) => {
      // Configurar tema antes de cada test
      await page.addInitScript((themeMode) => {
        if (themeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, theme);
    });

    test(`Button component - ${theme} theme`, async ({ page }) => {
      await page.goto('/iframe.html?id=ui-button--all-variants');
      
      await page.waitForSelector('button', { timeout: 10000 });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`button-${theme}-theme.png`, {
        clip: { x: 0, y: 0, width: 1200, height: 800 },
        animations: 'disabled'
      });
    });

    test(`Card component - ${theme} theme`, async ({ page }) => {
      await page.goto('/iframe.html?id=ui-card--default');
      
      await page.waitForSelector('.card, [data-testid="card"]', { timeout: 10000 });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`card-${theme}-theme.png`, {
        clip: { x: 0, y: 0, width: 600, height: 400 },
        animations: 'disabled'
      });
    });

    test(`Badge component - ${theme} theme`, async ({ page }) => {
      await page.goto('/iframe.html?id=ui-badge--all-variants');
      
      await page.waitForSelector('.badge, [data-testid="badge"]', { timeout: 10000 });
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot(`badge-${theme}-theme.png`, {
        clip: { x: 0, y: 0, width: 800, height: 400 },
        animations: 'disabled'
      });
    });

    test(`ContentCard component - ${theme} theme`, async ({ page }) => {
      await page.goto('/iframe.html?id=ui-contentcard--instagram-post');
      
      await page.waitForSelector('.content-card, [data-testid="content-card"]', { timeout: 10000 });
      
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).every(img => img.complete);
      }, { timeout: 15000 });
      
      await expect(page).toHaveScreenshot(`content-card-${theme}-theme.png`, {
        clip: { x: 0, y: 0, width: 400, height: 500 },
        animations: 'disabled'
      });
    });

    test(`Design System showcase - ${theme} theme`, async ({ page }) => {
      await page.goto('/iframe.html?id=design-system-overview--component-showcase');
      
      await page.waitForSelector('button', { timeout: 10000 });
      await page.waitForTimeout(1000); // Más tiempo para componentes complejos
      
      await expect(page).toHaveScreenshot(`design-system-showcase-${theme}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });
});

// Tests de interacciones complejas
test.describe('Interaction State Visual Tests', () => {
  test('Button loading states progression', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-button--loading');
    
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Estado inicial
    await expect(page).toHaveScreenshot('button-loading-initial.png', {
      clip: { x: 0, y: 0, width: 300, height: 100 },
      animations: 'disabled'
    });
    
    // Simular click para activar loading
    const button = page.locator('button').first();
    await button.click();
    await page.waitForTimeout(200);
    
    await expect(page).toHaveScreenshot('button-loading-active.png', {
      clip: { x: 0, y: 0, width: 300, height: 100 },
      animations: 'disabled'
    });
  });

  test('Card selection states', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-card--selectable');
    
    const card = page.locator('.card, [data-testid="card"]').first();
    await card.waitFor({ timeout: 10000 });
    
    // Estado normal
    await expect(page).toHaveScreenshot('card-selection-normal.png', {
      clip: { x: 0, y: 0, width: 400, height: 300 },
      animations: 'disabled'
    });
    
    // Estado seleccionado
    await card.click();
    await page.waitForTimeout(200);
    
    await expect(page).toHaveScreenshot('card-selection-selected.png', {
      clip: { x: 0, y: 0, width: 400, height: 300 },
      animations: 'disabled'
    });
  });

  test('Form validation states', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-input--with-validation');
    
    await page.waitForSelector('input', { timeout: 10000 });
    
    // Estado inicial
    await expect(page).toHaveScreenshot('input-validation-initial.png', {
      clip: { x: 0, y: 0, width: 400, height: 200 },
      animations: 'disabled'
    });
    
    // Estado de error
    const input = page.locator('input').first();
    await input.fill('invalid-email');
    await input.blur();
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('input-validation-error.png', {
      clip: { x: 0, y: 0, width: 400, height: 200 },
      animations: 'disabled'
    });
    
    // Estado válido
    await input.fill('valid@email.com');
    await input.blur();
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('input-validation-success.png', {
      clip: { x: 0, y: 0, width: 400, height: 200 },
      animations: 'disabled'
    });
  });
});

// Tests de componentes complejos
test.describe('Complex Component Visual Tests', () => {
  test('Navigation sidebar states', async ({ page }) => {
    await page.goto('/iframe.html?id=navigation-sidebar--default');
    
    await page.waitForSelector('[data-testid="sidebar"], .sidebar', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Estado expandido
    await expect(page).toHaveScreenshot('sidebar-expanded.png', {
      clip: { x: 0, y: 0, width: 300, height: 600 },
      animations: 'disabled'
    });
    
    // Estado colapsado
    const collapseButton = page.locator('[data-testid="collapse-button"], button[aria-label*="collapse"]').first();
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('sidebar-collapsed.png', {
        clip: { x: 0, y: 0, width: 100, height: 600 },
        animations: 'disabled'
      });
    }
  });

  test('Content grid with filters', async ({ page }) => {
    await page.goto('/iframe.html?id=dashboard-content-grid--with-filters');
    
    await page.waitForSelector('.content-grid, [data-testid="content-grid"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Estado inicial con todos los filtros
    await expect(page).toHaveScreenshot('content-grid-all-filters.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Aplicar filtro específico
    const filterButton = page.locator('[data-testid="filter-button"], .filter-button').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('content-grid-filtered.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('AI generation workflow', async ({ page }) => {
    await page.goto('/iframe.html?id=content-ai-generation-workflow--default');
    
    await page.waitForSelector('.workflow, [data-testid="workflow"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('ai-workflow-initial.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Calendar view with events', async ({ page }) => {
    await page.goto('/iframe.html?id=calendar-calendar-view--with-events');
    
    await page.waitForSelector('.calendar, [data-testid="calendar"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('calendar-with-events.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});