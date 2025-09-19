'use client'

/**
 * Color contrast utilities for WCAG compliance
 * Provides functions to calculate and validate color contrast ratios
 */

/**
 * Calculate the contrast ratio between two colors
 * @param color1 - First color in hex format (e.g., '#ffffff')
 * @param color2 - Second color in hex format (e.g., '#000000')
 * @returns Contrast ratio as a number (e.g., 21 for white on black)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    // Calculate relative luminance
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
 * Check if color combination meets WCAG contrast requirements
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param level - WCAG compliance level ('AA' or 'AAA')
 * @param size - Text size category ('normal' or 'large')
 * @returns True if the combination meets the specified WCAG level
 */
export function meetsWCAGContrast(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background)
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7
  }
  
  return size === 'large' ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if touch target meets minimum size requirements
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns True if the touch target meets WCAG 2.1 AA requirements (44x44px minimum)
 */
export function meetsTouchTargetSize(width: number, height: number): boolean {
  // WCAG 2.1 AA requires minimum 44x44px touch targets
  return width >= 44 && height >= 44
}

/**
 * Color palette accessibility checker
 * @param colors - Object containing color palette
 * @returns Compliance result with issues and suggestions
 */
export function checkColorPaletteAccessibility(colors: {
  primary: string
  secondary: string
  background: string
  foreground: string
  muted: string
  accent: string
}): {
  compliant: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check primary text on background
  if (!meetsWCAGContrast(colors.foreground, colors.background)) {
    issues.push('Primary text does not meet WCAG AA contrast requirements')
    suggestions.push('Increase contrast between foreground and background colors')
  }

  // Check primary button contrast
  if (!meetsWCAGContrast('#ffffff', colors.primary)) {
    issues.push('Primary button text may not be readable')
    suggestions.push('Consider using darker primary color or different text color')
  }

  // Check muted text contrast
  if (!meetsWCAGContrast(colors.muted, colors.background)) {
    issues.push('Muted text does not meet WCAG AA contrast requirements')
    suggestions.push('Increase contrast for muted text elements')
  }

  return {
    compliant: issues.length === 0,
    issues,
    suggestions
  }
}

/**
 * Interface for color contrast validation result
 */
export interface ContrastValidationResult {
  ratio: number
  meetsAA: boolean
  meetsAAA: boolean
  level: 'fail' | 'AA' | 'AAA'
  recommendation?: string
}

/**
 * Validate color contrast and provide detailed results
 * @param foreground - Foreground color
 * @param background - Background color
 * @param textSize - Size of text ('normal' | 'large')
 * @returns Detailed validation result
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  textSize: 'normal' | 'large' = 'normal'
): ContrastValidationResult {
  const ratio = getContrastRatio(foreground, background)
  const meetsAA = meetsWCAGContrast(foreground, background, 'AA', textSize)
  const meetsAAA = meetsWCAGContrast(foreground, background, 'AAA', textSize)

  let level: 'fail' | 'AA' | 'AAA' = 'fail'
  let recommendation: string | undefined

  if (meetsAAA) {
    level = 'AAA'
  } else if (meetsAA) {
    level = 'AA'
    recommendation = 'Consider increasing contrast for AAA compliance'
  } else {
    level = 'fail'
    const requiredRatio = textSize === 'large' ? 3 : 4.5
    recommendation = `Increase contrast ratio to at least ${requiredRatio}:1 for AA compliance`
  }

  return {
    ratio,
    meetsAA,
    meetsAAA,
    level,
    recommendation
  }
}