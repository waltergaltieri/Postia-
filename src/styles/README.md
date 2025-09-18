# Premium Design System

This directory contains the complete design system for Postia's premium UI/UX redesign.

## Files Overview

- `tokens.css` - Core design tokens (colors, typography, spacing, etc.)
- `themes.css` - Light/dark theme implementations
- `globals.css` - Global styles and utility classes

## Design Tokens

### Color System

#### Primary Colors
Premium blue palette for primary actions and branding:
- `--primary-50` to `--primary-950` - Full scale from lightest to darkest
- Used for: Primary buttons, links, active states, brand elements

#### Neutral Colors
Warm gray palette for text and backgrounds:
- `--neutral-50` to `--neutral-950` - Full scale
- Used for: Text, backgrounds, borders, subtle elements

#### Semantic Colors
Status and feedback colors:
- `--success-*` - Green for positive actions
- `--warning-*` - Amber for caution
- `--error-*` - Red for errors and destructive actions
- `--info-*` - Cyan for informational content

#### Gradients
Premium gradient combinations:
- `--gradient-primary` - Primary brand gradient
- `--gradient-content` - Content-focused gradient
- `--gradient-success` - Success state gradient
- `--gradient-premium` - Multi-color premium gradient

### Typography

#### Font Families
- `--font-primary` - Inter for UI text
- `--font-mono` - JetBrains Mono for code

#### Font Sizes
Scale from `--text-xs` (12px) to `--text-6xl` (60px)

#### Font Weights
From `--font-light` (300) to `--font-extrabold` (800)

### Spacing System

8px-based spacing scale:
- `--space-1` (4px) to `--space-32` (128px)
- Consistent vertical and horizontal rhythm

### Border Radius

From `--radius-sm` (2px) to `--radius-3xl` (24px) plus `--radius-full`

### Shadows

#### Standard Shadows
- `--shadow-xs` to `--shadow-2xl` - Elevation system
- `--shadow-inner` - Inset shadow

#### Colored Shadows
- `--shadow-primary`, `--shadow-success`, etc. - Brand-colored shadows

#### Elevation System
- `--elevation-1` to `--elevation-5` - Semantic elevation levels

### Animation

#### Durations
- `--duration-fast` (150ms) to `--duration-slower` (500ms)

#### Easing Functions
- `--ease-linear`, `--ease-in`, `--ease-out`, `--ease-in-out`, `--ease-bounce`

## Theme System

### Light Theme (Default)
Clean, professional appearance with warm grays and vibrant accents.

### Dark Theme
Sophisticated dark mode with proper contrast ratios and adjusted colors.

### System Theme
Automatically follows user's system preference with proper media query support.

## Usage Examples

### Using Design Tokens in CSS

```css
.my-component {
  background: var(--primary-500);
  color: var(--neutral-50);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-2);
  transition: all var(--duration-normal) var(--ease-out);
}
```

### Using with Tailwind Classes

```jsx
<div className="bg-primary-500 text-neutral-50 p-4 px-6 rounded-lg shadow-elevation-2 transition-all duration-normal">
  Premium component
</div>
```

### Theme-Aware Components

```jsx
<div className="bg-background text-foreground border border-border">
  This adapts to light/dark theme automatically
</div>
```

## Utility Classes

### Glass Morphism
```jsx
<div className="glass">
  Glass morphism effect
</div>
```

### Elevation
```jsx
<div className="elevation-3">
  Elevated surface
</div>
```

### Interactive Overlays
```jsx
<div className="hover-overlay">
  Hover effect
</div>
```

### Content Layouts
```jsx
<div className="content-grid">
  Responsive content grid
</div>

<div className="content-masonry">
  Masonry layout
</div>
```

### Premium Buttons
```jsx
<button className="btn-premium-primary">
  Primary Action
</button>

<button className="btn-premium-secondary">
  Secondary Action
</button>
```

### Navigation
```jsx
<a className="nav-item nav-item-active">
  Active nav item
</a>
```

### Text Gradients
```jsx
<h1 className="text-gradient-primary">
  Gradient text
</h1>
```

### Scrollbars
```jsx
<div className="scrollbar-thin">
  Custom scrollbar
</div>
```

## Accessibility Features

- WCAG 2.1 AA compliant color contrasts
- Respects `prefers-reduced-motion`
- Supports `prefers-color-scheme`
- High contrast mode support
- Focus indicators for keyboard navigation

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Adaptive spacing and typography
- Touch-friendly interactive elements

## Performance Considerations

- CSS custom properties for runtime theme switching
- Minimal CSS bundle size
- GPU-accelerated animations
- Optimized for modern browsers

## Browser Support

- Modern browsers with CSS custom properties support
- Graceful degradation for older browsers
- Progressive enhancement approach