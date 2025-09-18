# Tour Troubleshooting Guide

## Overview

This guide helps you diagnose and fix common issues with the Postia SaaS tour system. It covers everything from configuration errors to runtime problems and performance issues.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Configuration Issues](#configuration-issues)
3. [Runtime Problems](#runtime-problems)
4. [Performance Issues](#performance-issues)
5. [Accessibility Problems](#accessibility-problems)
6. [Mobile-Specific Issues](#mobile-specific-issues)
7. [Development Tools](#development-tools)
8. [Common Error Messages](#common-error-messages)

## Quick Diagnostics

### Tour System Health Check

Run this diagnostic script to check your tour system:

```typescript
import { TourConfigLoader } from '@/lib/tour/tour-config'
import { TourHealthCheck } from '@/lib/tour/tour-health-check'

// Quick system check
async function diagnoseTourSystem() {
  console.log('🔍 Running tour system diagnostics...')
  
  // Check tour loader
  const stats = TourConfigLoader.getStats()
  console.log('📊 Tour Stats:', stats)
  
  // Health check
  const healthCheck = await TourHealthCheck.runFullCheck()
  console.log('🏥 Health Check:', healthCheck)
  
  // List available tours
  const tours = TourConfigLoader.getAllTourConfigs()
  console.log('📋 Available Tours:', Array.from(tours.keys()))
}

// Run in browser console
diagnoseTourSystem()
```

### Browser Console Commands

Use these commands in your browser's developer console:

```javascript
// Check if tour system is loaded
window.__TOUR_DEBUG__ = true

// Get current tour state
console.log('Current tour:', window.__TOUR_STATE__)

// List all registered tours
console.log('Registered tours:', Object.keys(window.__TOUR_REGISTRY__))

// Force start a tour
window.__START_TOUR__('welcome-tour')

// Stop current tour
window.__STOP_TOUR__()
```

## Configuration Issues

### Invalid JSON Configuration

**Problem**: Tour configuration file has syntax errors

**Symptoms**:
- Tour fails to load
- Console error: "Unexpected token in JSON"
- Tour doesn't appear in registry

**Solution**:
1. Validate JSON syntax using online validator
2. Check for common issues:
   - Missing commas
   - Trailing commas
   - Unescaped quotes
   - Missing brackets

```json
// ❌ Invalid JSON
{
  "id": "my-tour",
  "name": "My Tour",
  "steps": [
    {
      "element": "#button",
      "title": "Button",
      "description": "Click this button", // ❌ Trailing comma
    }
  ] // ❌ Missing comma
  "metadata": {
    "version": "1.0.0"
  }
}

// ✅ Valid JSON
{
  "id": "my-tour",
  "name": "My Tour",
  "steps": [
    {
      "element": "#button",
      "title": "Button",
      "description": "Click this button"
    }
  ],
  "metadata": {
    "version": "1.0.0"
  }
}
```

### Schema Validation Errors

**Problem**: Configuration doesn't match required schema

**Common Errors**:

```typescript
// Missing required fields
{
  "name": "My Tour", // ❌ Missing 'id'
  "steps": []        // ❌ Empty steps array
}

// Invalid field values
{
  "id": "",          // ❌ Empty string
  "category": "invalid", // ❌ Not in enum
  "triggers": []     // ❌ Empty triggers array
}

// Invalid step configuration
{
  "steps": [
    {
      "element": "",   // ❌ Empty selector
      "title": "",     // ❌ Empty title
      "position": "middle" // ❌ Invalid position
    }
  ]
}
```

**Solution**: Use validation utility:

```typescript
import { TourConfigLoader } from '@/lib/tour/tour-config'

const validation = TourConfigLoader.validateConfig(yourConfig)
if (!validation.isValid) {
  console.error('Validation errors:')
  validation.errors?.forEach(error => console.error('- ' + error))
}
```

### Element Selector Issues

**Problem**: CSS selectors don't match elements

**Common Issues**:

```json
// ❌ Problematic selectors
{
  "element": ".btn.primary.large",     // Too specific, fragile
  "element": "div > span:nth-child(3)", // Position-dependent
  "element": "#dynamic-id-123",        // Dynamic IDs
  "element": "[style*='color: red']"   // Style-dependent
}

// ✅ Better selectors
{
  "element": "[data-testid='submit-button']", // Stable test ID
  "element": "button[type='submit']",         // Semantic selector
  "element": "[aria-label='Save changes']",   // Accessible selector
  "element": ".tour-target-save-btn"          // Tour-specific class
}
```

**Debugging Selector Issues**:

```javascript
// Test selector in console
const element = document.querySelector('[data-testid="my-element"]')
console.log('Element found:', element)

// Check if element is visible
const isVisible = element && element.offsetParent !== null
console.log('Element visible:', isVisible)

// Get element position
if (element) {
  const rect = element.getBoundingClientRect()
  console.log('Element position:', rect)
}
```

## Runtime Problems

### Tour Not Starting

**Problem**: Tour doesn't start when expected

**Debugging Steps**:

1. **Check tour registration**:
```typescript
import { TourRegistry } from '@/lib/tour/tour-registry'

// Verify tour is registered
const isRegistered = TourRegistry.isTourRegistered('my-tour')
console.log('Tour registered:', isRegistered)
```

2. **Check trigger conditions**:
```typescript
import { TourConditionEvaluator } from '@/lib/tour/tour-condition-evaluator'

// Test conditions
const tour = await TourConfigLoader.loadTourConfig('my-tour', config)
const conditionsMet = TourConditionEvaluator.evaluateConditions(
  tour.conditions || [],
  userContext
)
console.log('Conditions met:', conditionsMet)
```

3. **Check user context**:
```typescript
// Verify user context
console.log('User role:', userContext.role)
console.log('Current page:', window.location.pathname)
console.log('Client selected:', userContext.selectedClient)
```

### Elements Not Found During Tour

**Problem**: Tour step fails because target element doesn't exist

**Error Recovery**:

```typescript
// Automatic error recovery
const errorRecoveryStrategy = {
  onElementNotFound: (selector: string) => {
    console.warn(`Element not found: ${selector}`)
    
    // Try alternative selectors
    const alternatives = [
      selector.replace('[data-testid=', '[data-test='),
      selector.replace('-', '_'),
      selector + ', ' + selector.replace('#', '.')
    ]
    
    for (const alt of alternatives) {
      if (document.querySelector(alt)) {
        console.log(`Found alternative: ${alt}`)
        return alt
      }
    }
    
    // Skip step if no alternatives found
    return null
  }
}
```

**Prevention**:

```typescript
// Wait for elements before starting tour
async function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector)
    if (element) {
      resolve(element)
      return
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

// Use before starting tour
const element = await waitForElement('[data-testid="target-element"]')
if (element) {
  startTour('my-tour')
} else {
  console.warn('Target element not found, skipping tour')
}
```

### Tour State Inconsistencies

**Problem**: Tour state becomes inconsistent or corrupted

**Symptoms**:
- Tour appears to be active but no UI shows
- Navigation buttons don't work
- Progress indicator shows wrong values

**Solution**:

```typescript
// Reset tour state
import { useTour } from '@/hooks/use-tour'

function TourDebugPanel() {
  const { 
    currentTour, 
    currentStep, 
    totalSteps, 
    isActive,
    stopTour 
  } = useTour()
  
  const resetTourState = () => {
    // Force stop current tour
    stopTour()
    
    // Clear any cached state
    localStorage.removeItem('tour-progress')
    sessionStorage.removeItem('active-tour')
    
    // Reload page if necessary
    if (isActive) {
      window.location.reload()
    }
  }
  
  return (
    <div className="tour-debug-panel">
      <h3>Tour Debug Info</h3>
      <p>Active: {isActive ? 'Yes' : 'No'}</p>
      <p>Current Tour: {currentTour || 'None'}</p>
      <p>Step: {currentStep} / {totalSteps}</p>
      <button onClick={resetTourState}>Reset Tour State</button>
    </div>
  )
}
```

## Performance Issues

### Slow Tour Loading

**Problem**: Tours take too long to load or start

**Causes & Solutions**:

1. **Large configuration files**:
```typescript
// ❌ Large monolithic config
{
  "steps": [
    // 50+ steps with complex configurations
  ]
}

// ✅ Split into smaller tours
{
  "id": "onboarding-part-1",
  "steps": [
    // 5-10 focused steps
  ]
}
```

2. **Synchronous loading**:
```typescript
// ❌ Synchronous loading
const config = require('./tour-config.json')

// ✅ Async loading with caching
const loadTourConfig = async (tourId: string) => {
  const cached = tourCache.get(tourId)
  if (cached) return cached
  
  const config = await import(`./configs/${tourId}.json`)
  tourCache.set(tourId, config.default)
  return config.default
}
```

3. **Missing preloading**:
```typescript
// Preload critical tours
const CRITICAL_TOURS = ['welcome-tour', 'first-steps-tour']

async function preloadCriticalTours() {
  const promises = CRITICAL_TOURS.map(tourId => 
    TourConfigLoader.loadTourConfigFromFile(tourId, `/tours/${tourId}.json`)
  )
  
  await Promise.allSettled(promises)
  console.log('Critical tours preloaded')
}

// Call during app initialization
preloadCriticalTours()
```

### Memory Leaks

**Problem**: Tours consume too much memory or don't clean up properly

**Detection**:
```typescript
// Monitor memory usage
function monitorTourMemory() {
  const stats = TourConfigLoader.getStats()
  console.log('Tours in memory:', stats.cached)
  
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
    })
  }
}

// Run periodically
setInterval(monitorTourMemory, 30000)
```

**Prevention**:
```typescript
// Proper cleanup
class TourManager {
  private tours = new Map()
  private cleanupTimers = new Map()
  
  startTour(tourId: string) {
    // Clean up previous tour
    this.stopTour(tourId)
    
    // Start new tour
    const tour = new TourInstance(tourId)
    this.tours.set(tourId, tour)
    
    // Auto cleanup after 30 minutes
    const timer = setTimeout(() => {
      this.stopTour(tourId)
    }, 30 * 60 * 1000)
    
    this.cleanupTimers.set(tourId, timer)
  }
  
  stopTour(tourId: string) {
    const tour = this.tours.get(tourId)
    if (tour) {
      tour.destroy()
      this.tours.delete(tourId)
    }
    
    const timer = this.cleanupTimers.get(tourId)
    if (timer) {
      clearTimeout(timer)
      this.cleanupTimers.delete(tourId)
    }
  }
}
```

## Accessibility Problems

### Screen Reader Issues

**Problem**: Tours don't work properly with screen readers

**Common Issues**:
- Missing ARIA labels
- No live region announcements
- Poor focus management

**Solutions**:

```typescript
// Proper ARIA implementation
const TourStep = ({ step, isActive }: TourStepProps) => {
  const announceRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isActive && announceRef.current) {
      // Announce step to screen readers
      announceRef.current.textContent = 
        `${step.accessibility?.announceOnFocus || step.description}`
    }
  }, [isActive, step])
  
  return (
    <div
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      aria-live="polite"
    >
      <div
        ref={announceRef}
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
      />
      
      <h2 id="tour-title">{step.title}</h2>
      <p id="tour-description">{step.description}</p>
      
      {/* Navigation controls with proper labels */}
      <button
        aria-label={`Next step, ${currentStep + 1} of ${totalSteps}`}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  )
}
```

### Keyboard Navigation Problems

**Problem**: Tours can't be navigated with keyboard

**Testing**:
```typescript
// Test keyboard navigation
function testKeyboardNavigation() {
  const tour = document.querySelector('[data-tour-active]')
  if (!tour) return
  
  // Test Tab navigation
  const focusableElements = tour.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  console.log('Focusable elements:', focusableElements.length)
  
  // Test keyboard shortcuts
  const shortcuts = ['Escape', 'ArrowLeft', 'ArrowRight', 'Enter']
  shortcuts.forEach(key => {
    console.log(`Testing ${key} key...`)
    tour.dispatchEvent(new KeyboardEvent('keydown', { key }))
  })
}
```

**Implementation**:
```typescript
// Keyboard event handler
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      onClose()
      break
    case 'ArrowLeft':
      onPrevious()
      break
    case 'ArrowRight':
    case 'Enter':
      onNext()
      break
    case 'Tab':
      // Trap focus within tour
      trapFocus(event)
      break
  }
}

// Focus trap implementation
const trapFocus = (event: KeyboardEvent) => {
  const focusableElements = getFocusableElements()
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      lastElement.focus()
      event.preventDefault()
    }
  } else {
    if (document.activeElement === lastElement) {
      firstElement.focus()
      event.preventDefault()
    }
  }
}
```

## Mobile-Specific Issues

### Touch Interaction Problems

**Problem**: Tours don't work well on touch devices

**Solutions**:

```typescript
// Touch-friendly tour controls
const MobileTourControls = ({ onNext, onPrevious, onSkip }: Props) => {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      onNext()
    } else if (isRightSwipe) {
      onPrevious()
    }
  }
  
  return (
    <div
      className="mobile-tour-controls"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Touch-friendly buttons */}
      <button className="touch-button" onClick={onPrevious}>
        ← Previous
      </button>
      <button className="touch-button primary" onClick={onNext}>
        Next →
      </button>
      <button className="touch-button secondary" onClick={onSkip}>
        Skip Tour
      </button>
    </div>
  )
}
```

### Viewport Issues

**Problem**: Tours don't position correctly on mobile

**Solutions**:

```css
/* Mobile-specific tour styles */
@media (max-width: 768px) {
  .tour-popover {
    /* Full width on mobile */
    width: calc(100vw - 32px);
    max-width: none;
    
    /* Fixed positioning */
    position: fixed;
    bottom: 16px;
    left: 16px;
    right: 16px;
    
    /* Ensure visibility */
    z-index: 9999;
  }
  
  .tour-spotlight {
    /* Adjust spotlight for mobile */
    border-radius: 8px;
  }
  
  .tour-controls {
    /* Larger touch targets */
    button {
      min-height: 44px;
      min-width: 44px;
      font-size: 16px;
    }
  }
}
```

## Development Tools

### Tour Debug Panel

Create a debug panel for development:

```typescript
import React, { useState } from 'react'
import { useTour } from '@/hooks/use-tour'
import { TourConfigLoader } from '@/lib/tour/tour-config'

export const TourDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { currentTour, currentStep, totalSteps, isActive, startTour, stopTour } = useTour()
  const [availableTours, setAvailableTours] = useState<string[]>([])
  
  useEffect(() => {
    const tours = Array.from(TourConfigLoader.getAllTourConfigs().keys())
    setAvailableTours(tours)
  }, [])
  
  if (!isOpen) {
    return (
      <button
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded"
        onClick={() => setIsOpen(true)}
      >
        🔧 Tour Debug
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg p-4 rounded max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Tour Debug Panel</h3>
        <button onClick={() => setIsOpen(false)}>✕</button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Status:</strong> {isActive ? 'Active' : 'Inactive'}
        </div>
        <div>
          <strong>Current Tour:</strong> {currentTour || 'None'}
        </div>
        <div>
          <strong>Step:</strong> {currentStep} / {totalSteps}
        </div>
        
        <div className="border-t pt-2">
          <strong>Available Tours:</strong>
          <div className="max-h-32 overflow-y-auto">
            {availableTours.map(tourId => (
              <button
                key={tourId}
                className="block w-full text-left p-1 hover:bg-gray-100 text-xs"
                onClick={() => startTour(tourId)}
              >
                {tourId}
              </button>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-2 space-x-2">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
            onClick={stopTour}
          >
            Stop Tour
          </button>
          <button
            className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
            onClick={() => {
              localStorage.clear()
              sessionStorage.clear()
              window.location.reload()
            }}
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Console Debugging Commands

Add these to your development environment:

```typescript
// Add to window object in development
if (process.env.NODE_ENV === 'development') {
  window.__TOUR_DEBUG__ = {
    // Get current state
    getState: () => ({
      active: tourState.isActive,
      currentTour: tourState.currentTour,
      step: tourState.currentStep
    }),
    
    // List all tours
    listTours: () => {
      const tours = TourConfigLoader.getAllTourConfigs()
      console.table(Array.from(tours.entries()).map(([id, config]) => ({
        id,
        name: config.name,
        category: config.category,
        steps: config.steps.length
      })))
    },
    
    // Start any tour
    startTour: (tourId: string) => {
      console.log(`Starting tour: ${tourId}`)
      startTour(tourId)
    },
    
    // Validate tour config
    validateTour: (tourId: string) => {
      const tour = TourConfigLoader.getTourConfig(tourId)
      if (!tour) {
        console.error(`Tour not found: ${tourId}`)
        return
      }
      
      const validation = TourConfigLoader.validateConfig(tour)
      console.log('Validation result:', validation)
    },
    
    // Test element selectors
    testSelectors: (tourId: string) => {
      const tour = TourConfigLoader.getTourConfig(tourId)
      if (!tour) return
      
      tour.steps.forEach((step, index) => {
        const element = document.querySelector(step.element as string)
        console.log(`Step ${index + 1} (${step.title}):`, {
          selector: step.element,
          found: !!element,
          visible: element ? element.offsetParent !== null : false
        })
      })
    }
  }
}
```

## Common Error Messages

### "Tour definition validation failed"

**Cause**: Configuration doesn't match schema
**Solution**: Check required fields and data types

```typescript
// Check these common issues:
{
  "id": "",                    // ❌ Empty string
  "name": null,               // ❌ Null value
  "category": "invalid",      // ❌ Not in enum
  "triggers": [],             // ❌ Empty array
  "steps": [
    {
      "element": "",          // ❌ Empty selector
      "title": "",            // ❌ Empty title
      "description": ""       // ❌ Empty description
    }
  ]
}
```

### "Element not found: [selector]"

**Cause**: CSS selector doesn't match any element
**Solution**: 
1. Check selector syntax
2. Ensure element exists when tour starts
3. Use more stable selectors

### "Tour [id] not found"

**Cause**: Tour not registered or configuration file missing
**Solution**:
1. Check file exists in `src/lib/tour/configs/`
2. Verify tour is registered in tour registry
3. Check for typos in tour ID

### "Failed to load tour config from [path]"

**Cause**: Network error or file not found
**Solution**:
1. Check file path is correct
2. Ensure file is accessible
3. Check network connectivity

### "Tour conditions not met"

**Cause**: Conditional logic prevents tour from starting
**Solution**:
1. Check user context matches conditions
2. Verify condition logic is correct
3. Test with different user states

---

## Getting Help

If you're still experiencing issues:

1. **Check the browser console** for error messages
2. **Use the debug panel** to inspect tour state
3. **Test with different browsers** and devices
4. **Review the configuration guide** for best practices
5. **Contact the development team** with specific error details

Remember to include:
- Browser and version
- Device type (desktop/mobile)
- Tour configuration
- Console error messages
- Steps to reproduce the issue