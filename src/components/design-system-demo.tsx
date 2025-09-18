'use client'

import { ThemeProvider, ThemeToggle } from './theme-provider'

/**
 * Demo component to showcase the premium design system
 */
export function DesignSystemDemo() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gradient-primary">
              Premium Design System
            </h1>
            <ThemeToggle />
          </div>

          {/* Color Palette */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Color Palette</h2>
            <div className="grid grid-cols-5 gap-4">
              {/* Primary Colors */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Primary</h3>
                <div className="space-y-1">
                  <div className="h-8 bg-primary-100 rounded border"></div>
                  <div className="h-8 bg-primary-300 rounded border"></div>
                  <div className="h-8 bg-primary-500 rounded border"></div>
                  <div className="h-8 bg-primary-700 rounded border"></div>
                  <div className="h-8 bg-primary-900 rounded border"></div>
                </div>
              </div>

              {/* Neutral Colors */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Neutral</h3>
                <div className="space-y-1">
                  <div className="h-8 bg-neutral-100 rounded border"></div>
                  <div className="h-8 bg-neutral-300 rounded border"></div>
                  <div className="h-8 bg-neutral-500 rounded border"></div>
                  <div className="h-8 bg-neutral-700 rounded border"></div>
                  <div className="h-8 bg-neutral-900 rounded border"></div>
                </div>
              </div>

              {/* Success Colors */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Success</h3>
                <div className="space-y-1">
                  <div className="h-8 bg-success-50 rounded border"></div>
                  <div className="h-8 bg-success-100 rounded border"></div>
                  <div className="h-8 bg-success-500 rounded border"></div>
                  <div className="h-8 bg-success-600 rounded border"></div>
                  <div className="h-8 bg-success-700 rounded border"></div>
                </div>
              </div>

              {/* Warning Colors */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Warning</h3>
                <div className="space-y-1">
                  <div className="h-8 bg-warning-50 rounded border"></div>
                  <div className="h-8 bg-warning-100 rounded border"></div>
                  <div className="h-8 bg-warning-500 rounded border"></div>
                  <div className="h-8 bg-warning-600 rounded border"></div>
                  <div className="h-8 bg-warning-700 rounded border"></div>
                </div>
              </div>

              {/* Error Colors */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Error</h3>
                <div className="space-y-1">
                  <div className="h-8 bg-error-50 rounded border"></div>
                  <div className="h-8 bg-error-100 rounded border"></div>
                  <div className="h-8 bg-error-500 rounded border"></div>
                  <div className="h-8 bg-error-600 rounded border"></div>
                  <div className="h-8 bg-error-700 rounded border"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Premium Buttons</h2>
            <div className="flex gap-4 flex-wrap">
              <button className="btn-premium-primary">
                Primary Button
              </button>
              <button className="btn-premium-secondary">
                Secondary Button
              </button>
              <button className="btn-premium-primary" disabled>
                Disabled Button
              </button>
            </div>
          </section>

          {/* Cards */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Premium Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-premium p-6">
                <h3 className="text-lg font-semibold mb-2">Basic Card</h3>
                <p className="text-muted-foreground">
                  This is a premium card with elevation and hover effects.
                </p>
              </div>
              
              <div className="card-premium p-6 glass">
                <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
                <p className="text-muted-foreground">
                  This card uses glass morphism effects.
                </p>
              </div>
              
              <div className="card-premium p-6 elevation-4">
                <h3 className="text-lg font-semibold mb-2">Elevated Card</h3>
                <p className="text-muted-foreground">
                  This card has higher elevation for emphasis.
                </p>
              </div>
            </div>
          </section>

          {/* Gradients */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Premium Gradients</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-24 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-medium">
                Primary
              </div>
              <div className="h-24 bg-gradient-content rounded-xl flex items-center justify-center text-white font-medium">
                Content
              </div>
              <div className="h-24 bg-gradient-success rounded-xl flex items-center justify-center text-white font-medium">
                Success
              </div>
              <div className="h-24 bg-gradient-premium rounded-xl flex items-center justify-center text-white font-medium">
                Premium
              </div>
            </div>
          </section>

          {/* Typography */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Typography</h2>
            <div className="space-y-2">
              <h1 className="text-6xl font-bold">Heading 1</h1>
              <h2 className="text-4xl font-semibold">Heading 2</h2>
              <h3 className="text-2xl font-medium">Heading 3</h3>
              <p className="text-lg">Large paragraph text</p>
              <p className="text-base">Regular paragraph text</p>
              <p className="text-sm text-muted-foreground">Small muted text</p>
            </div>
          </section>

          {/* Shadows & Elevation */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Elevation System</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="h-16 bg-card rounded-lg elevation-1 flex items-center justify-center text-sm">
                Level 1
              </div>
              <div className="h-16 bg-card rounded-lg elevation-2 flex items-center justify-center text-sm">
                Level 2
              </div>
              <div className="h-16 bg-card rounded-lg elevation-3 flex items-center justify-center text-sm">
                Level 3
              </div>
              <div className="h-16 bg-card rounded-lg elevation-4 flex items-center justify-center text-sm">
                Level 4
              </div>
              <div className="h-16 bg-card rounded-lg elevation-5 flex items-center justify-center text-sm">
                Level 5
              </div>
            </div>
          </section>

          {/* Status Colors */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Status Indicators</h2>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-draft rounded-full"></div>
                <span className="text-sm">Draft</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-pending rounded-full"></div>
                <span className="text-sm">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-approved rounded-full"></div>
                <span className="text-sm">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-published rounded-full"></div>
                <span className="text-sm">Published</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-error rounded-full"></div>
                <span className="text-sm">Error</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ThemeProvider>
  )
}