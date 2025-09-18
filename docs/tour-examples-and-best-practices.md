# Tour Examples and Best Practices

## Overview

This document provides practical examples and proven best practices for creating effective tours in the Postia SaaS platform. Learn from real-world implementations and avoid common pitfalls.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Content Writing Guidelines](#content-writing-guidelines)
3. [Complete Tour Examples](#complete-tour-examples)
4. [Advanced Patterns](#advanced-patterns)
5. [Performance Best Practices](#performance-best-practices)
6. [Accessibility Guidelines](#accessibility-guidelines)
7. [Testing Strategies](#testing-strategies)
8. [Common Pitfalls](#common-pitfalls)

## Design Principles

### 1. Progressive Disclosure

Show information gradually, building from basic to advanced concepts:

```json
{
  "id": "content-generation-progressive",
  "name": "Content Generation - Progressive",
  "steps": [
    {
      "element": "[data-testid='content-type-selector']",
      "title": "Choose Content Type",
      "description": "Start by selecting what type of content you want to create."
    },
    {
      "element": "[data-testid='topic-input']",
      "title": "Describe Your Topic",
      "description": "Now tell us what you want to create content about. Be specific for better results."
    },
    {
      "element": "[data-testid='advanced-options']",
      "title": "Advanced Options",
      "description": "For more control, expand these advanced settings to customize tone, length, and style."
    }
  ]
}
```

### 2. Context-Aware Guidance

Provide relevant information based on user's current situation:

```json
{
  "id": "contextual-campaign-tour",
  "conditions": [
    {
      "type": "page_path",
      "operator": "contains",
      "value": "/campaigns"
    },
    {
      "type": "user_property",
      "operator": "equals",
      "value": "has_active_campaigns"
    }
  ],
  "steps": [
    {
      "element": "[data-testid='campaign-list']",
      "title": "Your Active Campaigns",
      "description": "Here are your currently running campaigns. Click any campaign to view detailed analytics and make adjustments."
    }
  ]
}
```

### 3. Goal-Oriented Flow

Structure tours around user goals, not just features:

```json
{
  "id": "first-post-creation",
  "name": "Create Your First Post",
  "description": "Complete guide to creating and publishing your first social media post",
  "steps": [
    {
      "title": "Goal: Create Your First Post",
      "description": "Let's create and publish your first social media post together. This will take about 2 minutes."
    },
    {
      "title": "Step 1: Choose Platform",
      "description": "Select which social media platform you want to post to first."
    },
    {
      "title": "Step 2: Generate Content",
      "description": "Use AI to create engaging content for your audience."
    },
    {
      "title": "Step 3: Review & Publish",
      "description": "Review your post and publish it to your selected platform."
    }
  ]
}
```

## Content Writing Guidelines

### Tone and Voice

**✅ Do:**
- Use conversational, friendly tone
- Write in second person ("you")
- Be encouraging and supportive
- Use active voice

**❌ Don't:**
- Use technical jargon without explanation
- Write in passive voice
- Be overly formal or robotic
- Assume prior knowledge

### Title Guidelines

```json
// ✅ Good titles
{
  "title": "Content Generator"      // Clear, specific
  "title": "Save Your Work"        // Action-oriented
  "title": "Campaign Analytics"    // Descriptive
}

// ❌ Poor titles
{
  "title": "This Feature"         // Vague
  "title": "Click Here"           // Not descriptive
  "title": "Advanced Configuration Settings Panel" // Too long
}
```

### Description Best Practices

```json
// ✅ Good descriptions
{
  "description": "Generate engaging social media posts automatically using AI. This saves you hours of writing time while maintaining your brand voice."
}

// ❌ Poor descriptions
{
  "description": "This is the content generation feature." // Too basic
{
  "description": "Click this button to access the advanced artificial intelligence-powered content generation system that utilizes machine learning algorithms..." // Too verbose
}
```

### Accessibility in Content

```json
{
  "accessibility": {
    "ariaLabel": "Step 2 of 5: Content generation",
    "ariaDescription": "Learn how to generate social media content using AI",
    "announceOnFocus": "Step 2: Content generation. Generate engaging social media posts automatically using AI. This saves you hours of writing time while maintaining your brand voice."
  }
}
```

## Complete Tour Examples

### 1. Welcome Onboarding Tour

```json
{
  "id": "welcome-onboarding-complete",
  "name": "Welcome to Postia",
  "description": "Complete onboarding experience for new users",
  "category": "onboarding",
  "triggers": [
    {
      "type": "auto",
      "condition": "first_login",
      "delay": 2000,
      "priority": 1
    }
  ],
  "conditions": [
    {
      "type": "user_property",
      "operator": "equals",
      "value": "new_user"
    }
  ],
  "steps": [
    {
      "element": "body",
      "title": "¡Bienvenido a Postia!",
      "description": "Te ayudaremos a conocer las funcionalidades principales en solo 2 minutos. Puedes saltar este tour en cualquier momento.",
      "position": "auto",
      "showProgress": true,
      "accessibility": {
        "ariaLabel": "Bienvenida a Postia",
        "announceOnFocus": "Bienvenido a Postia. Este tour te ayudará a conocer las funcionalidades principales en solo 2 minutos."
      }
    },
    {
      "element": "nav[class*='bg-card']",
      "title": "Navegación Principal",
      "description": "Desde esta barra lateral puedes acceder a todas las funcionalidades: generación de contenido, campañas, clientes y más.",
      "position": "right",
      "showProgress": true,
      "accessibility": {
        "ariaLabel": "Navegación principal",
        "announceOnFocus": "Barra de navegación principal para acceder a todas las funcionalidades de Postia."
      }
    },
    {
      "element": "button[class*='justify-start']:has(div:contains('brandName'))",
      "title": "Selector de Cliente",
      "description": "Aquí cambias entre diferentes clientes. Cada cliente tiene su propia marca, colores y configuraciones.",
      "position": "bottom",
      "showProgress": true,
      "accessibility": {
        "ariaLabel": "Selector de cliente",
        "announceOnFocus": "Selector de cliente para cambiar entre diferentes cuentas y acceder a sus configuraciones personalizadas."
      }
    },
    {
      "element": "button:has(span:contains('Content Generation'))",
      "title": "Generación de Contenido",
      "description": "Crea posts automáticamente con IA. Solo describe tu tema y obtendrás contenido optimizado para cada red social.",
      "position": "right",
      "showProgress": true,
      "accessibility": {
        "ariaLabel": "Generación de contenido con IA",
        "announceOnFocus": "Generación automática de contenido usando inteligencia artificial para crear posts optimizados."
      }
    },
    {
      "element": "button:has(span:contains('Campaigns'))",
      "title": "Gestión de Campañas",
      "description": "Organiza y programa tus publicaciones. Planifica contenido, programa posts y analiza el rendimiento desde un solo lugar.",
      "position": "right",
      "showProgress": true,
      "accessibility": {
        "ariaLabel": "Gestión de campañas",
        "announceOnFocus": "Gestión y programación de campañas de marketing para planificar y analizar el rendimiento."
      }
    },
    {
      "element": "div[class*='border-t']:last-child",
      "title": "¡Listo para Empezar!",
      "description": "Ya conoces lo básico. Desde Configuración puedes personalizar tu experiencia y acceder a ayuda adicional cuando la necesites.",
      "position": "top",
      "showProgress": true,
      "accessibility": {
        "ariaLabel": "Tour completado",
        "announceOnFocus": "Tour completado. Ya conoces las funcionalidades básicas de Postia y estás listo para empezar."
      }
    }
  ],
  "metadata": {
    "version": "2.1.0",
    "author": "Postia UX Team",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 120
  }
}
```

### 2. Feature Discovery Tour

```json
{
  "id": "ai-content-generation-deep-dive",
  "name": "Master AI Content Generation",
  "description": "Advanced guide to creating high-quality content with AI",
  "category": "feature",
  "triggers": [
    {
      "type": "conditional",
      "condition": "content_generation_page_visited",
      "delay": 3000
    }
  ],
  "conditions": [
    {
      "type": "page_path",
      "operator": "contains",
      "value": "/content-generation"
    }
  ],
  "steps": [
    {
      "element": "[data-testid='content-type-grid']",
      "title": "Choose Your Content Type",
      "description": "Different content types work better for different goals. Posts for engagement, Stories for behind-the-scenes, Carousels for educational content.",
      "position": "top",
      "showProgress": true
    },
    {
      "element": "[data-testid='topic-input']",
      "title": "Describe Your Topic",
      "description": "Be specific! Instead of 'marketing tips', try 'email marketing tips for small restaurants'. Specific topics generate better content.",
      "position": "bottom",
      "showProgress": true
    },
    {
      "element": "[data-testid='tone-selector']",
      "title": "Set Your Tone",
      "description": "Match your brand voice. Professional for B2B, casual for lifestyle brands, or educational for how-to content.",
      "position": "left",
      "showProgress": true
    },
    {
      "element": "[data-testid='target-audience']",
      "title": "Define Your Audience",
      "description": "Who are you talking to? 'Small business owners' will get different content than 'fitness enthusiasts'. Be specific for better results.",
      "position": "right",
      "showProgress": true
    },
    {
      "element": "[data-testid='generate-button']",
      "title": "Generate Content",
      "description": "Click to generate your content. This usually takes 10-15 seconds. You'll get multiple variations to choose from.",
      "position": "top",
      "showProgress": true
    },
    {
      "element": "[data-testid='content-variations']",
      "title": "Review Variations",
      "description": "You'll see 3-4 different versions. Pick the one that best matches your style, or use elements from multiple versions.",
      "position": "auto",
      "showProgress": true
    },
    {
      "element": "[data-testid='edit-content']",
      "title": "Customize Your Content",
      "description": "Make it yours! Edit the text, adjust the tone, or add your own personal touch. The AI gives you a great starting point.",
      "position": "left",
      "showProgress": true
    },
    {
      "element": "[data-testid='save-to-campaign']",
      "title": "Save or Schedule",
      "description": "Save to a campaign for later, schedule for optimal posting times, or publish immediately. Your content, your timeline.",
      "position": "bottom",
      "showProgress": true
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "author": "Content Team",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 180
  }
}
```

### 3. Contextual Help Tour

```json
{
  "id": "campaign-management-help",
  "name": "Campaign Management Help",
  "description": "Quick help for managing your marketing campaigns",
  "category": "help",
  "triggers": [
    {
      "type": "conditional",
      "condition": "help_requested_on_campaigns_page",
      "delay": 500
    }
  ],
  "steps": [
    {
      "element": "[data-testid='create-campaign-button']",
      "title": "Create New Campaign",
      "description": "Start here to create a new marketing campaign. You can organize content by theme, client, or time period.",
      "position": "bottom"
    },
    {
      "element": "[data-testid='campaign-calendar']",
      "title": "Campaign Calendar",
      "description": "Visual overview of all your scheduled content. Drag and drop to reschedule, or click to edit individual posts.",
      "position": "top"
    },
    {
      "element": "[data-testid='campaign-analytics']",
      "title": "Performance Analytics",
      "description": "Track how your campaigns are performing. See engagement rates, reach, and which content works best.",
      "position": "left"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "author": "Support Team",
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "estimatedDuration": 60
  }
}
```

## Advanced Patterns

### 1. Multi-Step Workflows

For complex processes, break into logical chunks:

```json
{
  "id": "client-setup-workflow",
  "name": "Complete Client Setup",
  "description": "End-to-end client configuration workflow",
  "steps": [
    {
      "title": "Phase 1: Basic Information",
      "description": "First, let's set up the basic client information and branding."
    },
    {
      "element": "[data-testid='client-name-input']",
      "title": "Client Name",
      "description": "Enter the client's business name as it should appear in the system."
    },
    {
      "element": "[data-testid='brand-colors']",
      "title": "Brand Colors",
      "description": "Upload the client's brand colors. These will be used throughout their content and campaigns."
    },
    {
      "title": "Phase 2: Social Media Accounts",
      "description": "Now let's connect their social media accounts for publishing."
    },
    {
      "element": "[data-testid='connect-instagram']",
      "title": "Connect Instagram",
      "description": "Link their Instagram Business account to enable direct publishing."
    }
  ]
}
```

### 2. Conditional Branching

Show different content based on user choices:

```typescript
// Dynamic tour generation
const generateRoleBasedTour = (userRole: string) => {
  const baseTour = {
    id: `welcome-${userRole}`,
    name: `Welcome ${userRole}`,
    steps: [
      // Common steps for all users
      {
        element: "[data-testid='navigation']",
        title: "Navigation",
        description: "Your main navigation menu"
      }
    ]
  }
  
  // Add role-specific steps
  if (userRole === 'admin') {
    baseTour.steps.push({
      element: "[data-testid='admin-panel']",
      title: "Admin Panel",
      description: "Manage users, billing, and system settings from here"
    })
  } else if (userRole === 'editor') {
    baseTour.steps.push({
      element: "[data-testid='content-tools']",
      title: "Content Tools",
      description: "Your content creation and editing tools"
    })
  }
  
  return baseTour
}
```

### 3. Interactive Tutorials

Combine tours with actual interactions:

```json
{
  "id": "interactive-content-creation",
  "name": "Hands-on Content Creation",
  "steps": [
    {
      "element": "[data-testid='topic-input']",
      "title": "Try It: Enter a Topic",
      "description": "Type 'healthy breakfast ideas' in this field and press Enter. We'll generate real content together!",
      "customComponent": "InteractiveTutorialStep"
    },
    {
      "element": "[data-testid='generated-content']",
      "title": "Great! Review Your Content",
      "description": "See how the AI generated multiple variations? Click on different options to see how they compare.",
      "onBeforeHighlight": "waitForContentGeneration"
    }
  ]
}
```

### 4. Progressive Enhancement

Start simple, add complexity gradually:

```json
{
  "id": "content-generation-progressive",
  "name": "Content Generation - From Basic to Advanced",
  "steps": [
    {
      "title": "Basic: Quick Content",
      "description": "Let's start with the simplest way to create content - just enter a topic and generate."
    },
    {
      "element": "[data-testid='topic-input']",
      "title": "Enter Your Topic",
      "description": "Type anything you want to create content about."
    },
    {
      "element": "[data-testid='generate-basic']",
      "title": "Generate",
      "description": "Click to create content with default settings."
    },
    {
      "title": "Intermediate: Customize Your Content",
      "description": "Now let's add some customization to make the content more targeted."
    },
    {
      "element": "[data-testid='tone-selector']",
      "title": "Choose Tone",
      "description": "Select a tone that matches your brand voice."
    },
    {
      "element": "[data-testid='audience-selector']",
      "title": "Target Audience",
      "description": "Specify who you're creating content for."
    },
    {
      "title": "Advanced: Fine-tune Everything",
      "description": "For maximum control, use these advanced options."
    },
    {
      "element": "[data-testid='advanced-options']",
      "title": "Advanced Settings",
      "description": "Control length, style, call-to-action, and more."
    }
  ]
}
```

## Performance Best Practices

### 1. Lazy Loading Strategy

```typescript
// Tour configuration with lazy loading
const TOUR_LOADING_STRATEGY = {
  // Preload critical tours
  preload: ['welcome-tour', 'first-steps'],
  
  // Load on demand
  onDemand: ['advanced-features', 'admin-tools'],
  
  // Cache frequently used
  cache: ['help-tours', 'contextual-guides']
}

// Implementation
class TourPerformanceManager {
  private cache = new Map()
  private preloadPromises = new Map()
  
  async preloadCriticalTours() {
    const promises = TOUR_LOADING_STRATEGY.preload.map(tourId =>
      this.loadTour(tourId).catch(error => {
        console.warn(`Failed to preload ${tourId}:`, error)
      })
    )
    
    await Promise.allSettled(promises)
  }
  
  async loadTour(tourId: string) {
    // Check cache first
    if (this.cache.has(tourId)) {
      return this.cache.get(tourId)
    }
    
    // Check if already loading
    if (this.preloadPromises.has(tourId)) {
      return this.preloadPromises.get(tourId)
    }
    
    // Start loading
    const promise = import(`./configs/${tourId}.json`)
      .then(module => {
        const tour = module.default
        this.cache.set(tourId, tour)
        return tour
      })
      .finally(() => {
        this.preloadPromises.delete(tourId)
      })
    
    this.preloadPromises.set(tourId, promise)
    return promise
  }
}
```

### 2. Bundle Optimization

```typescript
// Webpack configuration for tour bundles
const tourBundleConfig = {
  splitChunks: {
    cacheGroups: {
      tourConfigs: {
        test: /[\\/]tour[\\/]configs[\\/]/,
        name: 'tour-configs',
        chunks: 'async',
        priority: 10
      },
      tourComponents: {
        test: /[\\/]onboarding[\\/]/,
        name: 'tour-components',
        chunks: 'all',
        priority: 5
      }
    }
  }
}

// Dynamic imports for tour categories
export const loadTourCategory = async (category: string) => {
  switch (category) {
    case 'onboarding':
      return import('./categories/onboarding-tours')
    case 'feature':
      return import('./categories/feature-tours')
    case 'help':
      return import('./categories/help-tours')
    default:
      throw new Error(`Unknown tour category: ${category}`)
  }
}
```

### 3. Memory Management

```typescript
// Automatic cleanup system
class TourMemoryManager {
  private activeTours = new Map()
  private cleanupTimers = new Map()
  private maxConcurrentTours = 1
  private tourTimeout = 30 * 60 * 1000 // 30 minutes
  
  startTour(tourId: string, config: TourConfig) {
    // Cleanup if at limit
    if (this.activeTours.size >= this.maxConcurrentTours) {
      this.cleanupOldestTour()
    }
    
    // Create tour instance
    const tour = new TourInstance(tourId, config)
    this.activeTours.set(tourId, tour)
    
    // Set cleanup timer
    const timer = setTimeout(() => {
      this.cleanupTour(tourId)
    }, this.tourTimeout)
    
    this.cleanupTimers.set(tourId, timer)
    
    return tour
  }
  
  cleanupTour(tourId: string) {
    const tour = this.activeTours.get(tourId)
    if (tour) {
      tour.destroy()
      this.activeTours.delete(tourId)
    }
    
    const timer = this.cleanupTimers.get(tourId)
    if (timer) {
      clearTimeout(timer)
      this.cleanupTimers.delete(tourId)
    }
  }
  
  cleanupOldestTour() {
    const oldestTourId = this.activeTours.keys().next().value
    if (oldestTourId) {
      this.cleanupTour(oldestTourId)
    }
  }
}
```

## Accessibility Guidelines

### 1. Screen Reader Support

```json
{
  "steps": [
    {
      "element": "[data-testid='content-generator']",
      "title": "Content Generator",
      "description": "Create social media posts using AI",
      "accessibility": {
        "ariaLabel": "Content generator tool, step 1 of 5",
        "ariaDescription": "Interactive tool for creating social media content using artificial intelligence",
        "announceOnFocus": "Content generator tool. Create engaging social media posts automatically using AI. This is step 1 of 5 in the tour."
      }
    }
  ]
}
```

### 2. Keyboard Navigation

```typescript
// Comprehensive keyboard support
const TourKeyboardHandler = {
  handleKeyDown: (event: KeyboardEvent, tourState: TourState) => {
    switch (event.key) {
      case 'Escape':
        tourState.closeTour()
        break
      case 'ArrowRight':
      case 'Space':
      case 'Enter':
        event.preventDefault()
        tourState.nextStep()
        break
      case 'ArrowLeft':
        event.preventDefault()
        tourState.previousStep()
        break
      case 'Home':
        event.preventDefault()
        tourState.goToStep(0)
        break
      case 'End':
        event.preventDefault()
        tourState.goToStep(tourState.totalSteps - 1)
        break
      case 'Tab':
        // Handle focus trap
        TourFocusManager.trapFocus(event, tourState.currentElement)
        break
    }
  }
}
```

### 3. High Contrast Support

```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  .tour-popover {
    background: Canvas;
    color: CanvasText;
    border: 2px solid CanvasText;
  }
  
  .tour-button {
    background: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonText;
  }
  
  .tour-button:hover {
    background: Highlight;
    color: HighlightText;
  }
  
  .tour-spotlight {
    outline: 3px solid Highlight;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tour-popover,
  .tour-spotlight {
    transition: none;
    animation: none;
  }
}
```

## Testing Strategies

### 1. Unit Testing Tours

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { TourProvider } from '@/components/onboarding/tour-provider'
import { useTour } from '@/hooks/use-tour'

describe('Tour System', () => {
  const TestComponent = () => {
    const { startTour, isActive, currentStep } = useTour()
    
    return (
      <div>
        <button onClick={() => startTour('test-tour')}>
          Start Tour
        </button>
        <div data-testid="tour-status">
          {isActive ? `Active: Step ${currentStep}` : 'Inactive'}
        </div>
      </div>
    )
  }
  
  it('should start and navigate tour correctly', async () => {
    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )
    
    // Start tour
    fireEvent.click(screen.getByText('Start Tour'))
    
    // Check tour is active
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Active: Step 0')
    
    // Navigate to next step
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    
    // Check step advanced
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Active: Step 1')
  })
  
  it('should handle accessibility correctly', () => {
    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )
    
    fireEvent.click(screen.getByText('Start Tour'))
    
    // Check ARIA attributes
    const tourElement = screen.getByRole('dialog')
    expect(tourElement).toHaveAttribute('aria-labelledby')
    expect(tourElement).toHaveAttribute('aria-describedby')
    
    // Check live region
    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toBeInTheDocument()
  })
})
```

### 2. Integration Testing

```typescript
// Playwright integration tests
import { test, expect } from '@playwright/test'

test.describe('Tour Integration', () => {
  test('welcome tour completes successfully', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Wait for tour to auto-start
    await expect(page.locator('[data-testid="tour-popover"]')).toBeVisible()
    
    // Check first step
    await expect(page.locator('[data-testid="tour-title"]')).toContainText('Bienvenido')
    
    // Navigate through all steps
    const totalSteps = 6
    for (let i = 0; i < totalSteps - 1; i++) {
      await page.click('[data-testid="tour-next-button"]')
      await page.waitForTimeout(500) // Wait for animations
    }
    
    // Check completion
    await expect(page.locator('[data-testid="tour-complete"]')).toBeVisible()
    
    // Verify tour state is cleaned up
    await expect(page.locator('[data-testid="tour-popover"]')).not.toBeVisible()
  })
  
  test('tour works with keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Start tour manually
    await page.click('[data-testid="help-button"]')
    await page.click('[data-testid="start-welcome-tour"]')
    
    // Navigate with keyboard
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-testid="tour-step-indicator"]')).toContainText('2 of')
    
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('[data-testid="tour-step-indicator"]')).toContainText('1 of')
    
    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="tour-popover"]')).not.toBeVisible()
  })
})
```

### 3. Visual Regression Testing

```typescript
// Visual testing with Playwright
test('tour visual consistency', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Start tour
  await page.click('[data-testid="start-tour-button"]')
  
  // Screenshot each step
  const totalSteps = 6
  for (let i = 0; i < totalSteps; i++) {
    await expect(page.locator('[data-testid="tour-popover"]')).toBeVisible()
    
    // Take screenshot
    await expect(page).toHaveScreenshot(`tour-step-${i + 1}.png`, {
      fullPage: true,
      animations: 'disabled'
    })
    
    // Go to next step (except last)
    if (i < totalSteps - 1) {
      await page.click('[data-testid="tour-next-button"]')
      await page.waitForTimeout(300)
    }
  }
})

// Test different themes
test('tour appearance in dark mode', async ({ page }) => {
  // Set dark mode
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/dashboard')
  
  await page.click('[data-testid="start-tour-button"]')
  
  await expect(page).toHaveScreenshot('tour-dark-mode.png', {
    fullPage: true
  })
})
```

## Common Pitfalls

### 1. Fragile Element Selectors

**❌ Avoid:**
```json
{
  "element": ".btn.btn-primary.ml-4.px-6.py-2.rounded-lg"
}
```

**✅ Use instead:**
```json
{
  "element": "[data-testid='submit-button']"
}
```

### 2. Information Overload

**❌ Too much information:**
```json
{
  "title": "Advanced AI-Powered Content Generation System",
  "description": "This sophisticated artificial intelligence system utilizes advanced machine learning algorithms to analyze your input parameters including topic, tone, target audience demographics, content length preferences, and brand voice guidelines to generate highly optimized, engaging social media content that resonates with your specific audience segments while maintaining consistency with your established brand identity and marketing objectives."
}
```

**✅ Concise and clear:**
```json
{
  "title": "Content Generator",
  "description": "Create engaging social media posts automatically using AI. Just describe your topic and we'll generate content that matches your brand voice."
}
```

### 3. Poor Timing

**❌ Bad timing:**
```json
{
  "triggers": [
    {
      "type": "auto",
      "delay": 0  // Too fast, user not ready
    }
  ]
}
```

**✅ Better timing:**
```json
{
  "triggers": [
    {
      "type": "auto",
      "condition": "user_idle_for_5_seconds",
      "delay": 2000  // Give user time to orient
    }
  ]
}
```

### 4. Ignoring Mobile Users

**❌ Desktop-only thinking:**
```json
{
  "element": ".sidebar-menu",
  "position": "right",
  "description": "Click on the sidebar menu"
}
```

**✅ Mobile-aware:**
```json
{
  "element": "[data-testid='mobile-menu-toggle'], .sidebar-menu",
  "position": "auto",
  "description": "Tap the menu button to open navigation"
}
```

### 5. No Error Handling

**❌ No fallbacks:**
```json
{
  "element": "#very-specific-dynamic-id-12345",
  "title": "Dynamic Element"
}
```

**✅ With fallbacks:**
```json
{
  "element": "[data-testid='target-element'], .fallback-class, .generic-selector",
  "title": "Target Element",
  "onBeforeHighlight": "checkElementExists"
}
```

---

## Summary

Creating effective tours requires:

1. **User-centered design** - Focus on user goals, not just features
2. **Progressive disclosure** - Start simple, add complexity gradually  
3. **Clear, concise content** - Write for your users, not for yourself
4. **Robust implementation** - Handle errors gracefully
5. **Thorough testing** - Test on real devices with real users
6. **Accessibility first** - Make tours usable by everyone
7. **Performance awareness** - Keep tours fast and responsive

Remember: A good tour feels like a helpful guide, not an interruption. Focus on providing value at each step and helping users achieve their goals efficiently.