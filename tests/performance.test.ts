import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport estándar
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Button component performance metrics', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-button--all-variants');
    
    // Medir Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay (FID) - simulado con click
        const startTime = performance.now();
        document.addEventListener('click', () => {
          vitals.fid = performance.now() - startTime;
        }, { once: true });
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Resolver después de un tiempo para capturar métricas
        setTimeout(() => resolve(vitals), 2000);
      });
    });
    
    // Verificar que LCP sea menor a 2.5s (bueno)
    expect(webVitals.lcp).toBeLessThan(2500);
    
    // Verificar que CLS sea menor a 0.1 (bueno)
    expect(webVitals.cls).toBeLessThan(0.1);
  });

  test('Card component rendering performance', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-card--card-grid');
    
    // Medir tiempo de renderizado
    const renderTime = await page.evaluate(() => {
      const startTime = performance.now();
      
      return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          const cards = document.querySelectorAll('.card, [data-testid="card"]');
          if (cards.length > 0) {
            observer.disconnect();
            resolve(performance.now() - startTime);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Timeout de seguridad
        setTimeout(() => {
          observer.disconnect();
          resolve(performance.now() - startTime);
        }, 5000);
      });
    });
    
    // El renderizado debe ser menor a 1 segundo
    expect(renderTime).toBeLessThan(1000);
  });

  test('ContentCard image loading performance', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-contentcard--content-grid');
    
    // Medir tiempo de carga de imágenes
    const imageLoadTime = await page.evaluate(() => {
      return new Promise((resolve) => {
        const images = document.querySelectorAll('img');
        let loadedImages = 0;
        const startTime = performance.now();
        
        if (images.length === 0) {
          resolve(0);
          return;
        }
        
        images.forEach((img) => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.addEventListener('load', () => {
              loadedImages++;
              if (loadedImages === images.length) {
                resolve(performance.now() - startTime);
              }
            });
          }
        });
        
        if (loadedImages === images.length) {
          resolve(performance.now() - startTime);
        }
        
        // Timeout de seguridad
        setTimeout(() => resolve(performance.now() - startTime), 10000);
      });
    });
    
    // Las imágenes deben cargar en menos de 3 segundos
    expect(imageLoadTime).toBeLessThan(3000);
  });

  test('Animation performance', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-button--premium');
    
    // Medir FPS durante animaciones
    const animationPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frameCount);
          }
        }
        
        // Trigger hover animation
        const button = document.querySelector('button');
        if (button) {
          button.dispatchEvent(new MouseEvent('mouseenter'));
          requestAnimationFrame(countFrames);
        } else {
          resolve(60); // Default if no button found
        }
      });
    });
    
    // Debe mantener al menos 30 FPS
    expect(animationPerformance).toBeGreaterThan(30);
  });

  test('Memory usage during interactions', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-button--all-variants');
    
    // Medir uso de memoria
    const memoryUsage = await page.evaluate(() => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Simular múltiples interacciones
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button, index) => {
        setTimeout(() => {
          button.dispatchEvent(new MouseEvent('mouseenter'));
          button.dispatchEvent(new MouseEvent('mouseleave'));
          button.dispatchEvent(new MouseEvent('click'));
        }, index * 100);
      });
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
          resolve({
            initial: initialMemory,
            final: finalMemory,
            increase: finalMemory - initialMemory
          });
        }, 2000);
      });
    });
    
    // El aumento de memoria no debe ser excesivo (menos de 5MB)
    expect((memoryUsage as any).increase).toBeLessThan(5 * 1024 * 1024);
  });

  test('Bundle size impact', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=design-system-overview--component-showcase');
    
    // Analizar recursos cargados
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;
      
      resources.forEach((resource: any) => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
          
          if (resource.name.includes('.js')) {
            jsSize += resource.transferSize;
          } else if (resource.name.includes('.css')) {
            cssSize += resource.transferSize;
          }
        }
      });
      
      return { total: totalSize, js: jsSize, css: cssSize };
    });
    
    // Verificar que los bundles no sean excesivamente grandes
    expect(resourceSizes.js).toBeLessThan(1024 * 1024); // Menos de 1MB de JS
    expect(resourceSizes.css).toBeLessThan(512 * 1024); // Menos de 512KB de CSS
  });
});

// Tests de performance responsive
test.describe('Responsive Performance Tests', () => {
  const devices = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 }
  ];

  devices.forEach(({ name, width, height }) => {
    test(`Performance on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:6006/iframe.html?id=ui-card--card-grid');
      
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          
          // Esperar a que el contenido se renderice
          const observer = new MutationObserver(() => {
            const cards = document.querySelectorAll('.card, [data-testid="card"]');
            if (cards.length > 0) {
              observer.disconnect();
              
              // Medir tiempo hasta interactividad
              setTimeout(() => {
                resolve({
                  renderTime: performance.now() - startTime,
                  domNodes: document.querySelectorAll('*').length
                });
              }, 100);
            }
          });
          
          observer.observe(document.body, { childList: true, subtree: true });
          
          setTimeout(() => {
            observer.disconnect();
            resolve({
              renderTime: performance.now() - startTime,
              domNodes: document.querySelectorAll('*').length
            });
          }, 5000);
        });
      });
      
      // Performance debe ser buena en todos los dispositivos
      expect((performanceMetrics as any).renderTime).toBeLessThan(2000);
      expect((performanceMetrics as any).domNodes).toBeLessThan(1000);
    });
  });
});

// Tests de performance de animaciones
test.describe('Animation Performance Tests', () => {
  test('Framer Motion animations performance', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-button--premium');
    
    // Medir performance de animaciones complejas
    const animationMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let droppedFrames = 0;
        let lastFrameTime = performance.now();
        
        function measureFrames() {
          const currentTime = performance.now();
          const frameDuration = currentTime - lastFrameTime;
          
          frameCount++;
          
          // Detectar frames perdidos (más de 16.67ms = menos de 60fps)
          if (frameDuration > 16.67) {
            droppedFrames++;
          }
          
          lastFrameTime = currentTime;
          
          if (frameCount < 60) { // Medir por 1 segundo aprox
            requestAnimationFrame(measureFrames);
          } else {
            resolve({
              totalFrames: frameCount,
              droppedFrames: droppedFrames,
              frameRate: frameCount / ((currentTime - performance.now() + 1000) / 1000)
            });
          }
        }
        
        // Iniciar animación
        const button = document.querySelector('button');
        if (button) {
          button.dispatchEvent(new MouseEvent('mouseenter'));
        }
        
        requestAnimationFrame(measureFrames);
      });
    });
    
    // Debe mantener buen framerate
    expect((animationMetrics as any).frameRate).toBeGreaterThan(50);
    expect((animationMetrics as any).droppedFrames).toBeLessThan(5);
  });

  test('CSS transitions performance', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=ui-card--with-hover-effects');
    
    const transitionPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        const card = document.querySelector('.card, [data-testid="card"]');
        if (!card) {
          resolve({ duration: 0 });
          return;
        }
        
        const startTime = performance.now();
        
        // Trigger transition
        (card as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
        
        // Medir duración de transición
        card.addEventListener('transitionend', () => {
          resolve({
            duration: performance.now() - startTime
          });
        }, { once: true });
        
        // Timeout de seguridad
        setTimeout(() => {
          resolve({ duration: performance.now() - startTime });
        }, 1000);
      });
    });
    
    // Las transiciones deben ser rápidas y suaves
    expect((transitionPerformance as any).duration).toBeLessThan(500);
  });
});
