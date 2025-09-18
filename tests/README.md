# UI/UX Design System Testing Suite

This comprehensive testing suite ensures the quality, accessibility, and performance of our premium UI/UX design system. It includes visual regression testing, accessibility auditing, performance monitoring, and automated test execution.

## 🎯 Overview

Our testing strategy covers three critical areas:

1. **Visual Regression Testing** - Ensures UI consistency across updates
2. **Accessibility Testing** - Maintains WCAG 2.1 AA compliance
3. **Performance Testing** - Monitors load times, animations, and memory usage

## 📁 Test Structure

```
tests/
├── config/
│   └── test-config.ts          # Centralized test configuration
├── automation/
│   └── test-automation.ts      # Comprehensive automation suite
├── visual-regression.test.ts   # Basic visual regression tests
├── visual-regression-advanced.test.ts  # Advanced visual tests
├── accessibility.test.ts       # Comprehensive accessibility tests
├── performance.test.ts         # Performance and Core Web Vitals tests
└── README.md                   # This documentation
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:visual          # Visual regression tests
npm run test:accessibility   # Accessibility tests
npm run test:performance     # Performance tests
npm run test:automation      # Comprehensive automation suite

# Run Storybook tests
npm run test:storybook

# Update visual baselines
npm run test:update-snapshots
```

## 🔍 Visual Regression Testing

### Features

- **Multi-browser testing** (Chromium, Firefox, WebKit)
- **Responsive testing** across 7 different viewport sizes
- **Theme testing** (light/dark mode)
- **Interaction state testing** (hover, focus, active)
- **Component isolation** testing

### Configuration

Visual tests are configured in `tests/config/test-config.ts`:

```typescript
visual: {
  thresholds: {
    pixel: 100,      // Allow up to 100 pixel differences
    percent: 0.01    // Allow up to 1% difference
  },
  viewports: [
    { name: 'mobile-portrait', width: 375, height: 667 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'desktop-small', width: 1280, height: 720 },
    // ... more viewports
  ]
}
```

### Running Visual Tests

```bash
# Run basic visual regression tests
npx playwright test tests/visual-regression.test.ts

# Run advanced visual tests with all features
npx playwright test tests/visual-regression-advanced.test.ts

# Update baselines after intentional changes
npx playwright test --update-snapshots
```

## ♿ Accessibility Testing

### Standards Compliance

- **WCAG 2.1 AA** compliance (configurable to AAA)
- **Automated axe-core** integration
- **Keyboard navigation** testing
- **Screen reader** compatibility
- **Color contrast** verification
- **Touch target** size validation

### Key Features

- **Component-level auditing** for all UI components
- **Semantic HTML** structure validation
- **ARIA attributes** verification
- **Focus management** testing
- **High contrast mode** compatibility
- **Reduced motion** preference support

### Running Accessibility Tests

```bash
# Run comprehensive accessibility tests
npx playwright test tests/accessibility.test.ts

# Run with specific WCAG level
WCAG_LEVEL=AAA npx playwright test tests/accessibility.test.ts
```

### Accessibility Report

The tests generate detailed reports including:

- Violation count by component
- WCAG rule compliance scores
- Keyboard navigation results
- Color contrast measurements

## ⚡ Performance Testing

### Metrics Monitored

- **Core Web Vitals** (LCP, FID, CLS)
- **Load times** and render performance
- **Animation frame rates** (FPS)
- **Memory usage** monitoring
- **Bundle size** analysis
- **Network performance** under different conditions

### Performance Thresholds

```typescript
performance: {
  thresholds: {
    loadTime: 3000,           // 3 seconds max load time
    renderTime: 1000,         // 1 second max render time
    memoryUsage: 50 * 1024 * 1024, // 50MB max memory usage
    fps: 30,                  // 30 FPS minimum for animations
    bundleSize: 1024 * 1024   // 1MB max bundle size
  }
}
```

### Running Performance Tests

```bash
# Run performance tests
npx playwright test tests/performance.test.ts

# Run with network throttling
NETWORK_CONDITIONS=slow-3g npx playwright test tests/performance.test.ts
```

## 🤖 Test Automation

### Comprehensive Automation Suite

The automation suite (`tests/automation/test-automation.ts`) provides:

- **Integrated testing** of visual, accessibility, and performance
- **Automated reporting** with HTML and JSON outputs
- **CI/CD integration** with GitHub Actions
- **Parallel test execution** for faster results
- **Artifact generation** for debugging

### Running Automation Suite

```bash
# Run comprehensive automation
npm run test:automation

# Generate detailed reports
npx playwright test tests/automation/test-automation.ts --reporter=html
```

### Automation Reports

The automation suite generates:

- **HTML reports** with interactive results
- **JSON reports** for programmatic analysis
- **Screenshot galleries** for visual comparison
- **Performance metrics** dashboards

## 📊 Storybook Integration

### Test Runner Configuration

The Storybook test runner (`.storybook/test-runner.ts`) automatically:

- **Tests every story** for accessibility violations
- **Captures screenshots** for visual regression
- **Measures performance** metrics
- **Validates interactions** and states

### Features

- **Automatic story discovery** and testing
- **Accessibility injection** with axe-core
- **Visual regression** with jest-image-snapshot
- **Performance profiling** for each story
- **Theme testing** (light/dark mode)

### Running Storybook Tests

```bash
# Start Storybook and run tests
npm run storybook &
npm run test:storybook

# Run with specific configurations
VISUAL_TESTS=true PERFORMANCE_TESTS=true npm run test:storybook
```

## 🔧 Configuration

### Environment Variables

```bash
# Test execution
CI=true                    # Enable CI-specific configurations
VISUAL_TESTS=true         # Enable visual regression testing
PERFORMANCE_TESTS=true    # Enable performance testing
THEME_TESTS=true          # Enable theme testing
WCAG_LEVEL=AA            # Set accessibility compliance level

# Network conditions
NETWORK_CONDITIONS=fast-3g # Set network throttling

# Browser selection
BROWSER=chromium          # Specify browser for testing
```

### Custom Configuration

Create environment-specific configurations:

```typescript
import { getTestConfig, mergeTestConfig } from './tests/config/test-config';

// Get configuration for specific environment
const config = getTestConfig('production');

// Merge with custom overrides
const customConfig = mergeTestConfig(config, {
  visual: {
    thresholds: { percent: 0.005 } // Stricter visual thresholds
  }
});
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/visual-testing.yml` workflow provides:

- **Multi-browser testing** across different environments
- **Parallel execution** for faster feedback
- **Artifact collection** and storage
- **PR comments** with test results
- **Status checks** for branch protection

### Workflow Jobs

1. **Setup** - Install dependencies and build Storybook
2. **Visual Testing** - Run visual regression tests
3. **Accessibility Testing** - Run accessibility audits
4. **Performance Testing** - Run performance benchmarks
5. **Automation Suite** - Run comprehensive tests
6. **Storybook Tests** - Run Storybook test runner
7. **Report Generation** - Compile final results

### Triggering Tests

Tests run automatically on:

- **Push to main/develop** branches
- **Pull request** creation/updates
- **Daily schedule** (2 AM UTC)
- **Manual workflow dispatch**

## 📈 Monitoring and Reporting

### Test Reports

Generated reports include:

- **Visual regression** galleries with before/after comparisons
- **Accessibility** compliance scores and violation details
- **Performance** metrics and Core Web Vitals
- **Component coverage** and test execution summaries

### Report Locations

- **Local testing**: `test-results/` directory
- **CI artifacts**: GitHub Actions artifacts
- **GitHub Pages**: Published test reports (main branch)

### Metrics Tracking

Key metrics monitored:

- **Test coverage** percentage
- **Accessibility score** trends
- **Performance regression** detection
- **Visual change** frequency

## 🛠️ Troubleshooting

### Common Issues

#### Visual Test Failures

```bash
# Update baselines after intentional changes
npm run test:update-snapshots

# Check for animation timing issues
# Increase stabilization time in test-config.ts
```

#### Accessibility Violations

```bash
# Run with detailed reporting
npx playwright test tests/accessibility.test.ts --reporter=html

# Check specific WCAG rules
# Review axe-core documentation for rule details
```

#### Performance Issues

```bash
# Run with network throttling disabled
NETWORK_CONDITIONS=none npm run test:performance

# Check for memory leaks
# Review performance.test.ts memory usage tests
```

### Debug Mode

```bash
# Run tests in debug mode
npx playwright test --debug

# Run with headed browser
npx playwright test --headed

# Generate trace files
npx playwright test --trace on
```

## 📚 Best Practices

### Writing Tests

1. **Use data-testid** attributes for reliable element selection
2. **Wait for stability** before taking screenshots
3. **Test critical user paths** thoroughly
4. **Keep tests isolated** and independent
5. **Use meaningful test names** and descriptions

### Maintaining Tests

1. **Update baselines** regularly after intentional changes
2. **Review accessibility** violations promptly
3. **Monitor performance** trends over time
4. **Keep configuration** up to date with requirements
5. **Document test changes** in pull requests

### Performance Optimization

1. **Run tests in parallel** when possible
2. **Use appropriate timeouts** for different test types
3. **Cache dependencies** in CI/CD pipelines
4. **Optimize screenshot** sizes and quality
5. **Clean up artifacts** regularly

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Storybook Test Runner](https://storybook.js.org/docs/react/writing-tests/test-runner)

## 🤝 Contributing

When contributing to the test suite:

1. **Follow existing patterns** and conventions
2. **Add tests for new components** and features
3. **Update documentation** for configuration changes
4. **Test your changes** locally before submitting
5. **Include test results** in pull request descriptions

## 📄 License

This testing suite is part of the Postia SaaS project and follows the same licensing terms.