'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect user's high contrast preference
 */
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersHighContrast
}

/**
 * Get high contrast color scheme
 */
export function getHighContrastColors(isDark: boolean = false) {
  if (isDark) {
    return {
      background: '#000000',
      foreground: '#ffffff',
      border: '#ffffff',
      accent: '#ffff00',
      focus: '#00ffff',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00'
    }
  }

  return {
    background: '#ffffff',
    foreground: '#000000',
    border: '#000000',
    accent: '#0000ff',
    focus: '#ff0000',
    error: '#ff0000',
    success: '#008000',
    warning: '#ff8c00'
  }
}

/**
 * Create high contrast CSS variables
 */
export function createHighContrastVariables(isDark: boolean = false) {
  const colors = getHighContrastColors(isDark)
  
  return {
    '--hc-bg': colors.background,
    '--hc-fg': colors.foreground,
    '--hc-border': colors.border,
    '--hc-accent': colors.accent,
    '--hc-focus': colors.focus,
    '--hc-error': colors.error,
    '--hc-success': colors.success,
    '--hc-warning': colors.warning,
    '--hc-border-width': '2px',
    '--hc-outline-width': '3px'
  }
}

/**
 * High contrast styles for tour components
 */
export function getHighContrastTourStyles(isDark: boolean = false) {
  const colors = getHighContrastColors(isDark)
  
  return {
    // Popover styles
    popover: {
      backgroundColor: colors.background,
      color: colors.foreground,
      border: `2px solid ${colors.border}`,
      boxShadow: `0 0 0 1px ${colors.border}`,
      outline: `2px solid ${colors.focus}`,
      outlineOffset: '2px'
    },
    
    // Button styles
    button: {
      backgroundColor: colors.background,
      color: colors.foreground,
      border: `2px solid ${colors.border}`,
      outline: 'none',
      '&:hover': {
        backgroundColor: colors.foreground,
        color: colors.background,
        outline: `2px solid ${colors.focus}`
      },
      '&:focus': {
        outline: `3px solid ${colors.focus}`,
        outlineOffset: '2px'
      }
    },
    
    // Primary button
    primaryButton: {
      backgroundColor: colors.accent,
      color: colors.background,
      border: `2px solid ${colors.border}`,
      '&:hover': {
        backgroundColor: colors.focus,
        color: colors.background
      },
      '&:focus': {
        outline: `3px solid ${colors.foreground}`,
        outlineOffset: '2px'
      }
    },
    
    // Progress bar
    progressBar: {
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      '& .progress-fill': {
        backgroundColor: colors.accent
      }
    },
    
    // Overlay
    overlay: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      border: `1px solid ${colors.border}`
    },
    
    // Spotlight
    spotlight: {
      outline: `3px solid ${colors.focus}`,
      outlineOffset: '2px',
      boxShadow: `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.border}`
    }
  }
}

/**
 * Hook for managing high contrast tour styles
 */
export function useHighContrastTourStyles(isDark: boolean = false) {
  const prefersHighContrast = useHighContrast()
  
  const styles = prefersHighContrast 
    ? getHighContrastTourStyles(isDark)
    : null

  const getStylesForElement = (elementType: keyof ReturnType<typeof getHighContrastTourStyles>) => {
    return styles?.[elementType] || {}
  }

  return {
    prefersHighContrast,
    styles,
    getStylesForElement
  }
}

/**
 * CSS class names for high contrast mode
 */
export const highContrastClasses = {
  enabled: 'hc-enabled',
  popover: 'hc-popover',
  button: 'hc-button',
  primaryButton: 'hc-button-primary',
  progressBar: 'hc-progress',
  overlay: 'hc-overlay',
  spotlight: 'hc-spotlight',
  text: 'hc-text',
  border: 'hc-border'
}

/**
 * Generate high contrast CSS
 */
export function generateHighContrastCSS(isDark: boolean = false) {
  const colors = getHighContrastColors(isDark)
  const variables = createHighContrastVariables(isDark)
  
  return `
    @media (prefers-contrast: high) {
      :root {
        ${Object.entries(variables).map(([key, value]) => `${key}: ${value}`).join(';\n        ')};
      }
      
      .${highContrastClasses.enabled} {
        /* Force high contrast colors */
        background-color: ${colors.background} !important;
        color: ${colors.foreground} !important;
        border-color: ${colors.border} !important;
      }
      
      .${highContrastClasses.popover} {
        background-color: ${colors.background} !important;
        color: ${colors.foreground} !important;
        border: 2px solid ${colors.border} !important;
        box-shadow: 0 0 0 1px ${colors.border} !important;
        outline: 2px solid ${colors.focus} !important;
        outline-offset: 2px !important;
      }
      
      .${highContrastClasses.button} {
        background-color: ${colors.background} !important;
        color: ${colors.foreground} !important;
        border: 2px solid ${colors.border} !important;
        outline: none !important;
      }
      
      .${highContrastClasses.button}:hover {
        background-color: ${colors.foreground} !important;
        color: ${colors.background} !important;
        outline: 2px solid ${colors.focus} !important;
      }
      
      .${highContrastClasses.button}:focus {
        outline: 3px solid ${colors.focus} !important;
        outline-offset: 2px !important;
      }
      
      .${highContrastClasses.primaryButton} {
        background-color: ${colors.accent} !important;
        color: ${colors.background} !important;
        border: 2px solid ${colors.border} !important;
      }
      
      .${highContrastClasses.primaryButton}:hover {
        background-color: ${colors.focus} !important;
        color: ${colors.background} !important;
      }
      
      .${highContrastClasses.primaryButton}:focus {
        outline: 3px solid ${colors.foreground} !important;
        outline-offset: 2px !important;
      }
      
      .${highContrastClasses.progressBar} {
        background-color: ${colors.background} !important;
        border: 1px solid ${colors.border} !important;
      }
      
      .${highContrastClasses.progressBar} .progress-fill {
        background-color: ${colors.accent} !important;
      }
      
      .${highContrastClasses.overlay} {
        background-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} !important;
        border: 1px solid ${colors.border} !important;
      }
      
      .${highContrastClasses.spotlight} {
        outline: 3px solid ${colors.focus} !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.border} !important;
      }
      
      .${highContrastClasses.text} {
        color: ${colors.foreground} !important;
      }
      
      .${highContrastClasses.border} {
        border-color: ${colors.border} !important;
        border-width: 2px !important;
      }
    }
  `
}

/**
 * Inject high contrast CSS into document
 */
export function injectHighContrastCSS(isDark: boolean = false) {
  const existingStyle = document.getElementById('high-contrast-tour-styles')
  if (existingStyle) {
    document.head.removeChild(existingStyle)
  }

  const styleElement = document.createElement('style')
  styleElement.id = 'high-contrast-tour-styles'
  styleElement.textContent = generateHighContrastCSS(isDark)
  document.head.appendChild(styleElement)

  return () => {
    const style = document.getElementById('high-contrast-tour-styles')
    if (style) {
      document.head.removeChild(style)
    }
  }
}

/**
 * Check if system is in high contrast mode
 */
export function isHighContrastMode(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Get WCAG compliant contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want a more robust color parsing library
  
  const getLuminance = (color: string): number => {
    // This is a simplified version - use a proper color library in production
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 4.5 // WCAG AA standard for normal text
}

/**
 * Check if color combination meets WCAG AAA standards
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 7 // WCAG AAA standard for normal text
}