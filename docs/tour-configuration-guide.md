# Tour Configuration Guide

## Overview

This guide provides comprehensive instructions for creating, configuring, and managing tours in the Postia SaaS onboarding system. The tour system uses Driver.js with custom React components and TypeScript for type safety and validation.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Tour Structure](#tour-structure)
3. [Configuration Schema](#configuration-schema)
4. [Creating New Tours](#creating-new-tours)
5. [Best Practices](#best-practices)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [Examples](#examples)

## Quick Start

### Creating Your First Tour

1. **Create a tour configuration file** in `src/lib/tour/configs/`:
```json
{
  "id": "my-first-tour",
  "name": "My First Tour",
  "description": "A simple introduction tour",
  "category": "feature",
  "triggers": [
    {
      "type": "manual"
    }
  ],
  "steps": [
    {
      "element": "#welcome-button",
      "title": "Welcome!",
      "description": "Click this button to get started",
      "position": "bottom"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "author": "Your Name",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 30
  }
}
```

2. **Load and start the tour** in your component:
```typescript
import { useTour } from '@/hooks/use-tour'

function MyComponent() {
  const { startTour } = useTour()
  
  const handleStartTour = () => {
    startTour('my-first-tour')
  }
  
  return (
    <button onClick={handleStartTour}>
      Start Tour
    </button>
  )
}
```

## Tour Structure

### Core Components

```
Tour System
├── TourProvider          # Context provider for tour state
├── DriverWrapper         # Driver.js integration wrapper
├── TourControls          # Navigation controls (Next, Previous, Skip)
├── TourPopover          # Custom popover component
├── TourSpotlight        # Spotlight overlay component
└── Tour Hooks           # React hooks for tour management
```

### File Organization

```
src/
├── lib/tour/
│   ├── configs/         # Tour configuration JSON files
│   ├── tour-config.ts   # Configuration loader and validation
│   ├── tour-engine.ts   # Core tour engine
│   └── tour-analytics.ts # Analytics and tracking
├── components/onboarding/
│   ├── tour-provider.tsx
│   ├── driver-wrapper.tsx
│   └── tour-*.tsx       # Tour UI components
├── hooks/
│   ├── use-tour.ts      # Main tour hook
│   ├── use-tour-progress.ts
│   └── use-contextual-tours.ts
└── types/tour.ts        # TypeScript definitions
```

## Configuration Schema

### TourDefinition

```typescript
interface TourDefinition {
  id: string                    // Unique identifier
  name: string                  // Display name
  description: string           // Tour description
  category: TourCategory        // Tour category
  triggers: TourTrigger[]       // When to show the tour
  conditions?: TourCondition[]  // Conditional logic
  steps: TourStep[]            // Tour steps
  metadata: TourMetadata       // Version and author info
}
```

### TourStep

```typescript
interface TourStep {
  element: string | HTMLElement     // CSS selector or DOM element
  title: string                     // Step title
  description: string               // Step description
  position?: Position               // Popover position
  showButtons?: boolean             // Show navigation buttons
  showProgress?: boolean            // Show progress indicator
  onBeforeHighlight?: () => void    // Before step callback
  onHighlight?: () => void          // Step highlight callback
  onDeselect?: () => void          // Step deselect callback
  customComponent?: React.Component // Custom step component
  accessibility?: AccessibilityConfig // A11y configuration
}
```

### Position Options

- `'top'` - Above the element
- `'bottom'` - Below the element
- `'left'` - To the left of the element
- `'right'` - To the right of the element
- `'auto'` - Automatically positioned (default)

### Tour Categories

- `'onboarding'` - First-time user tours
- `'feature'` - Feature-specific tours
- `'contextual'` - Context-aware tours
- `'help'` - Help and support tours

### Trigger Types

- `'manual'` - Started by user action
- `'auto'` - Automatically triggered
- `'conditional'` - Based on conditions
- `'scheduled'` - Time-based triggers

## Creating New Tours

### Step 1: Plan Your Tour

Before creating a tour, consider:

- **Target audience**: Who will use this tour?
- **Learning objectives**: What should users learn?
- **User flow**: What's the logical sequence?
- **Context**: When and where will this tour appear?

### Step 2: Create Configuration File

Create a JSON file in `src/lib/tour/configs/`:

```json
{
  "id": "feature-discovery-tour",
  "name": "Feature Discovery",
  "description": "Discover advanced features in Postia",
  "category": "feature",
  "triggers": [
    {
      "type": "conditional",
      "condition": "unused_features_detected",
      "delay": 5000,
      "priority": 2
    }
  ],
  "conditions": [
    {
      "type": "user_property",
      "operator": "equals",
      "value": "experienced_user"
    }
  ],
  "steps": [
    {
      "element": "[data-testid='advanced-settings']",
      "title": "Advanced Settings",
      "description": "Access powerful configuration options here",
      "position": "left",
      "showProgress": true,
      "accessibility": {
        "ariaLabel": "Advanced settings tour step",
        "ariaDescription": "Learn about advanced configuration options",
        "announceOnFocus": "Advanced settings allow you to customize your experience"
      }
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "author": "Product Team",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 120
  }
}
```

### Step 3: Validate Configuration

Use the validation utilities to ensure your configuration is correct:

```typescript
import { TourConfigLoader } from '@/lib/tour/tour-config'

// Validate your configuration
const validation = TourConfigLoader.validateConfig(yourTourConfig)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

### Step 4: Test Your Tour

1. **Load the tour** in development:
```typescript
const { startTour } = useTour()
startTour('your-tour-id')
```

2. **Test all steps** to ensure:
   - Elements are correctly targeted
   - Descriptions are clear and helpful
   - Navigation works smoothly
   - Accessibility features function properly

### Step 5: Register Tour

Add your tour to the tour registry:

```typescript
// In src/lib/tour/tour-registry.ts
export const TOUR_REGISTRY = {
  // ... existing tours
  'feature-discovery-tour': {
    configPath: '/tours/feature-discovery-tour.json',
    category: 'feature',
    preload: false
  }
}
```

## Best Practices

### Element Selection

#### ✅ Good Practices

```json
{
  "element": "[data-testid='user-menu']",
  "title": "User Menu",
  "description": "Access your account settings and preferences"
}
```

- Use `data-testid` attributes for stable selectors
- Prefer semantic selectors over styling classes
- Test selectors in different screen sizes

#### ❌ Avoid

```json
{
  "element": ".btn.btn-primary.ml-4",
  "title": "Button",
  "description": "Click this button"
}
```

- Don't rely on styling classes
- Avoid overly specific selectors
- Don't use generic descriptions

### Content Writing

#### Titles
- Keep titles short (2-4 words)
- Use action-oriented language
- Be specific about the feature

#### Descriptions
- Explain the "why" not just the "what"
- Use conversational tone
- Include benefits to the user
- Keep under 100 characters when possible

#### Examples

```json
{
  "title": "Content Generator",
  "description": "Create engaging social media posts automatically using AI. Save hours of writing time while maintaining your brand voice."
}
```

### Accessibility

Always include accessibility configuration:

```json
{
  "accessibility": {
    "ariaLabel": "Step 1: Navigation overview",
    "ariaDescription": "Introduction to the main navigation system",
    "announceOnFocus": "Welcome to the navigation tour. This step shows you how to access different sections of the application."
  }
}
```

### Performance

- **Lazy load** tour configurations
- **Preload** critical tours (onboarding)
- **Cache** frequently used tours
- **Minimize** tour bundle size

```typescript
// Lazy loading example
const loadTour = async (tourId: string) => {
  const config = await import(`./configs/${tourId}.json`)
  return TourConfigLoader.loadTourConfig(tourId, config.default)
}
```

### Mobile Optimization

Create mobile-specific variations:

```json
{
  "id": "welcome-tour-mobile",
  "name": "Welcome Tour (Mobile)",
  "description": "Mobile-optimized welcome tour",
  "conditions": [
    {
      "type": "user_property",
      "operator": "equals",
      "value": "mobile_device"
    }
  ],
  "steps": [
    {
      "element": "[data-testid='mobile-menu-toggle']",
      "title": "Menu",
      "description": "Tap here to open the navigation menu",
      "position": "bottom"
    }
  ]
}
```

## Advanced Features

### Conditional Logic

Use conditions to show tours based on user context:

```json
{
  "conditions": [
    {
      "type": "user_role",
      "operator": "equals",
      "value": "admin"
    },
    {
      "type": "client_selected",
      "operator": "exists",
      "value": true
    },
    {
      "type": "page_path",
      "operator": "contains",
      "value": "/dashboard"
    }
  ]
}
```

### Custom Components

Create custom step components for complex interactions:

```typescript
// Custom step component
interface CustomStepProps extends TourStepProps {
  // Additional props
}

const CustomTourStep: React.FC<CustomStepProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onClose
}) => {
  return (
    <div className="custom-tour-step">
      <h3>{step.title}</h3>
      <p>{step.description}</p>
      {/* Custom interactive elements */}
      <InteractiveDemo />
      <TourControls
        onNext={onNext}
        onPrevious={onPrevious}
        onSkip={onSkip}
        onClose={onClose}
      />
    </div>
  )
}

// Use in tour configuration
{
  "element": "#demo-area",
  "title": "Interactive Demo",
  "description": "Try the feature yourself",
  "customComponent": "CustomTourStep"
}
```

### Dynamic Content

Generate tour content dynamically:

```typescript
const generateWelcomeTour = (user: User, client: Client) => {
  return {
    id: `welcome-${user.id}`,
    name: `Welcome ${user.name}`,
    description: `Personalized tour for ${client.name}`,
    steps: [
      {
        element: '[data-testid="client-logo"]',
        title: `${client.name} Dashboard`,
        description: `Welcome to ${client.name}'s dashboard. Here you can manage all campaigns and content for this client.`
      }
    ]
  }
}
```

### Analytics Integration

Track tour performance:

```typescript
// In your tour configuration
{
  "steps": [
    {
      "element": "#feature-button",
      "title": "New Feature",
      "description": "Try our latest feature",
      "onHighlight": () => {
        analytics.track('tour_step_viewed', {
          tourId: 'feature-tour',
          stepIndex: 0,
          feature: 'new-feature'
        })
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### Element Not Found

**Problem**: Tour step fails because element doesn't exist

**Solutions**:
1. Check element selector accuracy
2. Ensure element is rendered before tour starts
3. Add conditional logic to skip missing elements
4. Use fallback selectors

```json
{
  "element": "[data-testid='primary-button'], .btn-primary, button:first-child",
  "title": "Action Button",
  "description": "Click here to proceed"
}
```

#### Tour Not Starting

**Problem**: Tour doesn't start when expected

**Debugging steps**:
1. Check tour conditions are met
2. Verify trigger configuration
3. Ensure tour is properly registered
4. Check for JavaScript errors

```typescript
// Debug tour loading
const debugTour = async (tourId: string) => {
  try {
    const tour = await TourConfigLoader.loadTourConfigFromFile(tourId, `/tours/${tourId}.json`)
    console.log('Tour loaded successfully:', tour)
    
    const validation = TourConfigLoader.validateConfig(tour)
    console.log('Validation result:', validation)
  } catch (error) {
    console.error('Tour loading failed:', error)
  }
}
```

#### Positioning Issues

**Problem**: Tour popover appears in wrong position

**Solutions**:
1. Use `position: "auto"` for automatic positioning
2. Test on different screen sizes
3. Adjust popover positioning manually
4. Consider mobile-specific positioning

```json
{
  "element": "#sidebar-button",
  "position": "auto",
  "title": "Sidebar Toggle",
  "description": "Open or close the sidebar navigation"
}
```

#### Performance Issues

**Problem**: Tours load slowly or impact performance

**Solutions**:
1. Implement lazy loading for tour configurations
2. Preload only essential tours
3. Use code splitting for tour bundles
4. Optimize tour assets (images, animations)

```typescript
// Lazy loading implementation
const TourLoader = {
  async loadTour(tourId: string) {
    const { default: config } = await import(`./configs/${tourId}.json`)
    return TourConfigLoader.loadTourConfig(tourId, config)
  }
}
```

### Validation Errors

#### Schema Validation

Common validation errors and fixes:

```typescript
// Error: "Tour ID is required"
// Fix: Ensure id field is present and not empty
{
  "id": "my-tour", // ✅ Required
  "name": "My Tour"
}

// Error: "At least one step is required"
// Fix: Add steps array with at least one step
{
  "steps": [
    {
      "element": "#element",
      "title": "Title",
      "description": "Description"
    }
  ]
}

// Error: "Invalid hex color"
// Fix: Use proper hex color format
{
  "clientBranding": {
    "primaryColor": "#FF0000", // ✅ Valid hex
    "secondaryColor": "red"    // ❌ Invalid
  }
}
```

### Accessibility Issues

#### Screen Reader Support

Ensure proper ARIA labels:

```json
{
  "accessibility": {
    "ariaLabel": "Tour step 1 of 5",
    "ariaDescription": "Introduction to the dashboard navigation",
    "announceOnFocus": "Welcome to the dashboard tour. This step introduces the main navigation elements."
  }
}
```

#### Keyboard Navigation

Test keyboard navigation:
- Tab to navigate between elements
- Enter to activate buttons
- Escape to close tour
- Arrow keys for step navigation

#### High Contrast Mode

Ensure tours work in high contrast mode:

```css
/* High contrast styles */
@media (prefers-contrast: high) {
  .tour-popover {
    border: 2px solid;
    background: Canvas;
    color: CanvasText;
  }
}
```

### Testing Tours

#### Unit Testing

```typescript
import { render, screen } from '@testing-library/react'
import { TourProvider } from '@/components/onboarding/tour-provider'
import { useTour } from '@/hooks/use-tour'

describe('Tour System', () => {
  it('should start tour correctly', () => {
    const TestComponent = () => {
      const { startTour, isActive } = useTour()
      
      return (
        <div>
          <button onClick={() => startTour('test-tour')}>
            Start Tour
          </button>
          {isActive && <div>Tour is active</div>}
        </div>
      )
    }
    
    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )
    
    // Test tour functionality
  })
})
```

#### Integration Testing

```typescript
// Playwright test
test('welcome tour completes successfully', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Wait for tour to start
  await expect(page.locator('[data-testid="tour-popover"]')).toBeVisible()
  
  // Navigate through all steps
  const nextButton = page.locator('[data-testid="tour-next"]')
  
  for (let i = 0; i < 5; i++) {
    await nextButton.click()
    await page.waitForTimeout(500)
  }
  
  // Verify completion
  await expect(page.locator('[data-testid="tour-complete"]')).toBeVisible()
})
```

## Examples

### Basic Feature Tour

```json
{
  "id": "content-generation-tour",
  "name": "Content Generation Tour",
  "description": "Learn how to generate content with AI",
  "category": "feature",
  "triggers": [
    {
      "type": "manual"
    }
  ],
  "steps": [
    {
      "element": "[data-testid='content-type-selector']",
      "title": "Choose Content Type",
      "description": "Select the type of content you want to generate: post, story, or carousel.",
      "position": "bottom",
      "showProgress": true
    },
    {
      "element": "[data-testid='topic-input']",
      "title": "Enter Topic",
      "description": "Describe what you want to create content about. Be specific for better results.",
      "position": "top",
      "showProgress": true
    },
    {
      "element": "[data-testid='generate-button']",
      "title": "Generate Content",
      "description": "Click to generate your content. This usually takes 10-15 seconds.",
      "position": "left",
      "showProgress": true
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "author": "Product Team",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 90
  }
}
```

### Conditional Admin Tour

```json
{
  "id": "admin-features-tour",
  "name": "Admin Features",
  "description": "Advanced features for administrators",
  "category": "feature",
  "triggers": [
    {
      "type": "conditional",
      "condition": "admin_panel_accessed",
      "delay": 2000
    }
  ],
  "conditions": [
    {
      "type": "user_role",
      "operator": "equals",
      "value": "admin"
    }
  ],
  "steps": [
    {
      "element": "[data-testid='user-management']",
      "title": "User Management",
      "description": "Manage team members, roles, and permissions from here.",
      "position": "right"
    },
    {
      "element": "[data-testid='billing-settings']",
      "title": "Billing Settings",
      "description": "Configure subscription, billing, and usage limits.",
      "position": "left"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "author": "Admin Team",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 60
  }
}
```

### Mobile-Optimized Tour

```json
{
  "id": "mobile-navigation-tour",
  "name": "Mobile Navigation",
  "description": "Navigate Postia on mobile devices",
  "category": "onboarding",
  "triggers": [
    {
      "type": "auto",
      "condition": "mobile_first_visit",
      "delay": 1000
    }
  ],
  "conditions": [
    {
      "type": "user_property",
      "operator": "equals",
      "value": "mobile_device"
    }
  ],
  "steps": [
    {
      "element": "[data-testid='mobile-menu-toggle']",
      "title": "Menu",
      "description": "Tap to open the main menu and access all features.",
      "position": "bottom",
      "showProgress": true
    },
    {
      "element": "[data-testid='mobile-client-selector']",
      "title": "Switch Clients",
      "description": "Swipe or tap to switch between different client accounts.",
      "position": "top",
      "showProgress": true
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "author": "Mobile Team",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 45
  }
}
```

---

## Next Steps

1. **Review existing tours** in `src/lib/tour/configs/`
2. **Create your first tour** following this guide
3. **Test thoroughly** on different devices and browsers
4. **Gather user feedback** and iterate
5. **Monitor analytics** to optimize tour effectiveness

For additional help, check the [troubleshooting section](#troubleshooting) or reach out to the development team.