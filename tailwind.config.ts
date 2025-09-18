import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Font families
      fontFamily: {
        sans: ['var(--font-primary)'],
        mono: ['var(--font-mono)'],
      },
      
      // Enhanced color system with our premium tokens
      colors: {
        // Semantic colors (existing shadcn/ui compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          950: "var(--primary-950)",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Premium color scales
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
          950: "var(--neutral-950)",
        },
        
        success: {
          50: "var(--success-50)",
          100: "var(--success-100)",
          500: "var(--success-500)",
          600: "var(--success-600)",
          700: "var(--success-700)",
        },
        
        warning: {
          50: "var(--warning-50)",
          100: "var(--warning-100)",
          500: "var(--warning-500)",
          600: "var(--warning-600)",
          700: "var(--warning-700)",
        },
        
        error: {
          50: "var(--error-50)",
          100: "var(--error-100)",
          500: "var(--error-500)",
          600: "var(--error-600)",
          700: "var(--error-700)",
        },
        
        info: {
          50: "var(--info-50)",
          100: "var(--info-100)",
          500: "var(--info-500)",
          600: "var(--info-600)",
          700: "var(--info-700)",
        },
        
        // Content-specific colors
        content: {
          background: "var(--content-background)",
          surface: "var(--content-surface)",
          'surface-hover': "var(--content-surface-hover)",
        },
        
        // Navigation colors
        nav: {
          background: "var(--nav-background)",
          border: "var(--nav-border)",
          item: "var(--nav-item)",
          'item-hover': "var(--nav-item-hover)",
          'item-active': "var(--nav-item-active)",
        },
        
        // Status colors
        status: {
          draft: "var(--status-draft)",
          pending: "var(--status-pending)",
          approved: "var(--status-approved)",
          published: "var(--status-published)",
          error: "var(--status-error)",
        },
      },
      
      // Enhanced spacing system
      spacing: {
        '0.5': 'var(--space-0-5)',
        '1.5': 'var(--space-1-5)',
        '2.5': 'var(--space-2-5)',
        '3.5': 'var(--space-3-5)',
        '7': 'var(--space-7)',
        '9': 'var(--space-9)',
        '11': 'var(--space-11)',
        // Safe area spacing
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Accessibility touch targets
        'touch-target': 'var(--touch-target-min)',
        'touch-target-comfortable': 'var(--touch-target-comfortable)',
        'touch-target-large': 'var(--touch-target-large)',
      },
      
      // Enhanced border radius
      borderRadius: {
        'none': 'var(--radius-none)',
        'sm': 'var(--radius-sm)',
        'base': 'var(--radius-base)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        'full': 'var(--radius-full)',
      },
      
      // Enhanced box shadows
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'base': 'var(--shadow-base)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'inner': 'var(--shadow-inner)',
        'primary': 'var(--shadow-primary)',
        'success': 'var(--shadow-success)',
        'warning': 'var(--shadow-warning)',
        'error': 'var(--shadow-error)',
        'elevation-1': 'var(--elevation-1)',
        'elevation-2': 'var(--elevation-2)',
        'elevation-3': 'var(--elevation-3)',
        'elevation-4': 'var(--elevation-4)',
        'elevation-5': 'var(--elevation-5)',
      },
      
      // Animation durations
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'slower': 'var(--duration-slower)',
      },
      
      // Animation timing functions
      transitionTimingFunction: {
        'bounce': 'var(--ease-bounce)',
      },
      
      // Background images for gradients
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-content': 'var(--gradient-content)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-premium': 'var(--gradient-premium)',
      },
      
      // Enhanced keyframes and animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down var(--duration-normal) var(--ease-out)",
        "accordion-up": "accordion-up var(--duration-normal) var(--ease-out)",
        "fade-in": "fade-in var(--duration-normal) var(--ease-out)",
        "fade-out": "fade-out var(--duration-normal) var(--ease-out)",
        "slide-in-from-top": "slide-in-from-top var(--duration-normal) var(--ease-out)",
        "slide-in-from-bottom": "slide-in-from-bottom var(--duration-normal) var(--ease-out)",
        "slide-in-from-left": "slide-in-from-left var(--duration-normal) var(--ease-out)",
        "slide-in-from-right": "slide-in-from-right var(--duration-normal) var(--ease-out)",
        "scale-in": "scale-in var(--duration-normal) var(--ease-out)",
        "scale-out": "scale-out var(--duration-normal) var(--ease-out)",
        // Reduced motion alternatives
        "fade-in-reduced": "fade-in 0.01ms ease-out",
        "slide-in-reduced": "slide-in-from-bottom 0.01ms ease-out",
        "scale-in-reduced": "scale-in 0.01ms ease-out",
      },
      
      // Accessibility-focused utilities
      minWidth: {
        'touch-target': 'var(--touch-target-min)',
        'touch-target-comfortable': 'var(--touch-target-comfortable)',
        'touch-target-large': 'var(--touch-target-large)',
      },
      
      minHeight: {
        'touch-target': 'var(--touch-target-min)',
        'touch-target-comfortable': 'var(--touch-target-comfortable)',
        'touch-target-large': 'var(--touch-target-large)',
      },
      
      // Focus ring utilities
      ringWidth: {
        'focus': 'var(--focus-ring-width)',
      },
      
      ringOffsetWidth: {
        'focus': 'var(--focus-ring-offset)',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config