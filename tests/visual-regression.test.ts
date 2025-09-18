import { test, expect } from '@playwright/test';

// Configuración base para tests visuales
test.describe('Visual Regression Tests', () => {
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
      `
    });
  });

  test('Button component visual regression', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-button--all-variants');
    
    // Esperar a que el componente se cargue completamente
    await page.waitForSelector('[data-testid="button"], button', { timeout: 5000 });
    
    // Tomar screenshot y comparar
    await expect(page).toHaveScreenshot('button-all-variants.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 400 }
    });
  });

  test('Card component visual regression', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-card--card-grid');
    
    await page.waitForSelector('[data-testid="card"], .card', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('card-grid.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
  });

  test('Badge component visual regression', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-badge--all-variants');
    
    await page.waitForSelector('[data-testid="badge"], .badge', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('badge-all-variants.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 600, height: 200 }
    });
  });

  test('ContentCard component visual regression', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-contentcard--content-grid');
    
    await page.waitForSelector('[data-testid="content-card"], .content-card', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('content-card-grid.png', {
      fullPage: true
    });
  });

  test('Design System color palette', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=design-system-overview--color-palette');
    
    await page.waitForSelector('h2', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('color-palette.png', {
      fullPage: true
    });
  });

  test('Design System typography', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=design-system-overview--typography');
    
    await page.waitForSelector('h1', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('typography.png', {
      fullPage: true
    });
  });
});

// Tests de responsive design
test.describe('Responsive Visual Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'large-desktop', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`Button responsive - ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:6006/iframe.html?id=ui-button--all-variants');
      
      await page.waitForSelector('button', { timeout: 5000 });
      
      await expect(page).toHaveScreenshot(`button-${name}.png`, {
        fullPage: false,
        clip: { x: 0, y: 0, width: Math.min(width, 800), height: 400 }
      });
    });

    test(`Card responsive - ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:6006/iframe.html?id=ui-card--card-grid');
      
      await page.waitForSelector('.card, [data-testid="card"]', { timeout: 5000 });
      
      await expect(page).toHaveScreenshot(`card-grid-${name}.png`, {
        fullPage: true
      });
    });
  });
});

// Tests de interacciones
test.describe('Interaction Visual Tests', () => {
  test('Button hover states', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-button--premium');
    
    const button = page.locator('button').first();
    await button.waitFor({ timeout: 5000 });
    
    // Estado normal
    await expect(page).toHaveScreenshot('button-normal.png', {
      clip: { x: 0, y: 0, width: 200, height: 100 }
    });
    
    // Estado hover
    await button.hover();
    await page.waitForTimeout(300); // Esperar animación
    await expect(page).toHaveScreenshot('button-hover.png', {
      clip: { x: 0, y: 0, width: 200, height: 100 }
    });
  });

  test('Card hover effects', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-card--with-hover-effects');
    
    const card = page.locator('.card, [data-testid="card"]').first();
    await card.waitFor({ timeout: 5000 });
    
    // Estado normal
    await expect(page).toHaveScreenshot('card-normal.png', {
      clip: { x: 0, y: 0, width: 400, height: 300 }
    });
    
    // Estado hover
    await card.hover();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('card-hover.png', {
      clip: { x: 0, y: 0, width: 400, height: 300 }
    });
  });
});

// Tests de temas (light/dark)
test.describe('Theme Visual Tests', () => {
  test('Components in light theme', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=design-system-overview--component-showcase');
    
    // Asegurar tema claro
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    
    await page.waitForSelector('button', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('components-light-theme.png', {
      fullPage: true
    });
  });

  test('Components in dark theme', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=design-system-overview--component-showcase');
    
    // Activar tema oscuro
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await page.waitForSelector('button', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('components-dark-theme.png', {
      fullPage: true
    });
  });
});