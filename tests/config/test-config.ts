/**
 * Comprehensive Test Configuration for UI/UX Design System
 * Centralizes all testing parameters and thresholds
 */

export interface TestConfig {
  visual: VisualTestConfig;
  accessibility: AccessibilityTestConfig;
  performance: PerformanceTestConfig;
  automation: AutomationTestConfig;
}

export interface VisualTestConfig {
  // Screenshot comparison thresholds
  thresholds: {
    pixel: number;        // Pixel difference threshold
    percent: number;      // Percentage difference threshold
  };
  
  // Viewport configurations for responsive testing
  viewports: Array<{
    name: string;
    width: number;
    height: number;
  }>;
  
  // Animation and transition settings
  animations: {
    disabled: boolean;
    stabilizationTime: number; // ms to wait after interactions
  };
  
  // Screenshot settings
  screenshots: {
    fullPage: boolean;
    quality: number;
    type: 'png' | 'jpeg';
  };
}

export interface AccessibilityTestConfig {
  // WCAG compliance level
  wcagLevel: 'A' | 'AA' | 'AAA';
  
  // Axe-core rules configuration
  rules: Array<{
    id: string;
    enabled: boolean;
    options?: any;
  }>;
  
  // Tags to include in testing
  tags: string[];
  
  // Color contrast requirements
  colorContrast: {
    normal: number;     // Minimum contrast ratio for normal text
    large: number;      // Minimum contrast ratio for large text
    enhanced: number;   // Enhanced contrast ratio (AAA)
  };
  
  // Touch target requirements
  touchTargets: {
    minSize: number;    // Minimum touch target size in pixels
    spacing: number;    // Minimum spacing between targets
  };
}

export interface PerformanceTestConfig {
  // Performance thresholds
  thresholds: {
    loadTime: number;           // Maximum load time in ms
    renderTime: number;         // Maximum render time in ms
    memoryUsage: number;        // Maximum memory usage in bytes
    fps: number;                // Minimum FPS for animations
    bundleSize: number;         // Maximum bundle size in bytes
  };
  
  // Core Web Vitals thresholds
  webVitals: {
    lcp: number;    // Largest Contentful Paint (ms)
    fid: number;    // First Input Delay (ms)
    cls: number;    // Cumulative Layout Shift
  };
  
  // Network conditions for testing
  networkConditions: Array<{
    name: string;
    downloadThroughput: number;
    uploadThroughput: number;
    latency: number;
  }>;
}

export interface AutomationTestConfig {
  // Test execution settings
  execution: {
    parallel: boolean;
    retries: number;
    timeout: number;
  };
  
  // Reporting configuration
  reporting: {
    formats: Array<'json' | 'html' | 'junit' | 'allure'>;
    outputDir: string;
    includeScreenshots: boolean;
    includeVideos: boolean;
  };
  
  // CI/CD integration
  ci: {
    failOnAccessibilityViolations: boolean;
    failOnVisualRegressions: boolean;
    failOnPerformanceThresholds: boolean;
    generateArtifacts: boolean;
  };
}

// Default configuration
export const defaultTestConfig: TestConfig = {
  visual: {
    thresholds: {
      pixel: 100,      // Allow up to 100 pixel differences
      percent: 0.01    // Allow up to 1% difference
    },
    
    viewports: [
      { name: 'mobile-portrait', width: 375, height: 667 },
      { name: 'mobile-landscape', width: 667, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-small', width: 1280, height: 720 },
      { name: 'desktop-large', width: 1920, height: 1080 },
      { name: 'desktop-ultrawide', width: 2560, height: 1440 }
    ],
    
    animations: {
      disabled: true,
      stabilizationTime: 500
    },
    
    screenshots: {
      fullPage: false,
      quality: 90,
      type: 'png'
    }
  },
  
  accessibility: {
    wcagLevel: 'AA',
    
    rules: [
      // Core WCAG 2.1 AA rules
      { id: 'color-contrast', enabled: true },
      { id: 'color-contrast-enhanced', enabled: false }, // AAA level
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
      
      // Premium component specific rules
      { id: 'focus-visible', enabled: true },
      { id: 'target-size', enabled: true },
      { id: 'motion-reduced', enabled: true },
      
      // Form accessibility
      { id: 'form-field-multiple-labels', enabled: true },
      { id: 'input-button-name', enabled: true },
      { id: 'input-image-alt', enabled: true },
      
      // Navigation accessibility
      { id: 'bypass', enabled: true },
      { id: 'landmark-one-main', enabled: true },
      { id: 'page-has-heading-one', enabled: true },
      
      // Content accessibility
      { id: 'document-title', enabled: true },
      { id: 'html-has-lang', enabled: true },
      { id: 'html-lang-valid', enabled: true }
    ],
    
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
    
    colorContrast: {
      normal: 4.5,    // WCAG AA for normal text
      large: 3.0,     // WCAG AA for large text
      enhanced: 7.0   // WCAG AAA
    },
    
    touchTargets: {
      minSize: 44,    // 44x44px minimum (WCAG AAA)
      spacing: 8      // 8px minimum spacing
    }
  },
  
  performance: {
    thresholds: {
      loadTime: 3000,           // 3 seconds max load time
      renderTime: 1000,         // 1 second max render time
      memoryUsage: 50 * 1024 * 1024, // 50MB max memory usage
      fps: 30,                  // 30 FPS minimum for animations
      bundleSize: 1024 * 1024   // 1MB max bundle size
    },
    
    webVitals: {
      lcp: 2500,  // Good LCP threshold
      fid: 100,   // Good FID threshold
      cls: 0.1    // Good CLS threshold
    },
    
    networkConditions: [
      {
        name: 'fast-3g',
        downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
        uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
        latency: 150
      },
      {
        name: 'slow-3g',
        downloadThroughput: 500 * 1024 / 8,         // 500 Kbps
        uploadThroughput: 500 * 1024 / 8,           // 500 Kbps
        latency: 400
      }
    ]
  },
  
  automation: {
    execution: {
      parallel: true,
      retries: 2,
      timeout: 30000
    },
    
    reporting: {
      formats: ['json', 'html', 'junit'],
      outputDir: 'test-results',
      includeScreenshots: true,
      includeVideos: false
    },
    
    ci: {
      failOnAccessibilityViolations: true,
      failOnVisualRegressions: true,
      failOnPerformanceThresholds: true,
      generateArtifacts: true
    }
  }
};

// Environment-specific configurations
export const testConfigs = {
  development: {
    ...defaultTestConfig,
    visual: {
      ...defaultTestConfig.visual,
      thresholds: {
        pixel: 200,
        percent: 0.02  // More lenient in development
      }
    },
    automation: {
      ...defaultTestConfig.automation,
      ci: {
        ...defaultTestConfig.automation.ci,
        failOnVisualRegressions: false // Don't fail on visual changes in dev
      }
    }
  },
  
  staging: {
    ...defaultTestConfig,
    accessibility: {
      ...defaultTestConfig.accessibility,
      wcagLevel: 'AAA' as const, // Stricter in staging
      rules: defaultTestConfig.accessibility.rules.map(rule => 
        rule.id === 'color-contrast-enhanced' 
          ? { ...rule, enabled: true }
          : rule
      )
    }
  },
  
  production: defaultTestConfig,
  
  ci: {
    ...defaultTestConfig,
    visual: {
      ...defaultTestConfig.visual,
      animations: {
        disabled: true,
        stabilizationTime: 1000 // More time in CI for stability
      }
    },
    automation: {
      ...defaultTestConfig.automation,
      execution: {
        parallel: false, // Sequential in CI for stability
        retries: 3,      // More retries in CI
        timeout: 60000   // Longer timeout in CI
      }
    }
  }
};

// Utility functions
export function getTestConfig(environment: keyof typeof testConfigs = 'development'): TestConfig {
  return testConfigs[environment] || defaultTestConfig;
}

export function mergeTestConfig(base: TestConfig, overrides: Partial<TestConfig>): TestConfig {
  return {
    visual: { ...base.visual, ...overrides.visual },
    accessibility: { ...base.accessibility, ...overrides.accessibility },
    performance: { ...base.performance, ...overrides.performance },
    automation: { ...base.automation, ...overrides.automation }
  };
}

// Component-specific configurations
export const componentTestConfigs = {
  'ui-button': {
    visual: {
      viewports: ['mobile-portrait', 'desktop-small'], // Focus on key viewports
      interactions: ['hover', 'focus', 'active', 'disabled']
    },
    accessibility: {
      criticalRules: ['button-name', 'color-contrast', 'focus-visible']
    },
    performance: {
      maxRenderTime: 100 // Buttons should render very quickly
    }
  },
  
  'ui-card': {
    visual: {
      viewports: ['mobile-portrait', 'tablet-portrait', 'desktop-small'],
      interactions: ['hover', 'selected']
    },
    accessibility: {
      criticalRules: ['aria-roles', 'heading-order', 'color-contrast']
    },
    performance: {
      maxRenderTime: 300 // Cards can be more complex
    }
  },
  
  'ui-contentcard': {
    visual: {
      viewports: ['mobile-portrait', 'tablet-portrait', 'desktop-small'],
      interactions: ['hover', 'selected'],
      waitForImages: true
    },
    accessibility: {
      criticalRules: ['image-alt', 'aria-roles', 'color-contrast']
    },
    performance: {
      maxRenderTime: 500, // Content cards may have images
      maxMemoryUsage: 10 * 1024 * 1024 // 10MB for image content
    }
  },
  
  'design-system': {
    visual: {
      viewports: ['desktop-small', 'desktop-large'],
      fullPage: true
    },
    accessibility: {
      criticalRules: ['heading-order', 'color-contrast', 'color-contrast-enhanced']
    },
    performance: {
      maxRenderTime: 1000 // Design system showcase can be complex
    }
  }
};

export function getComponentTestConfig(componentId: string) {
  return componentTestConfigs[componentId as keyof typeof componentTestConfigs] || {};
}