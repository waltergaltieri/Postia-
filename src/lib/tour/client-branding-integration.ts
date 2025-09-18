/**
 * Client Branding Integration for Tours
 * 
 * This module provides integration between the tour system and client branding,
 * enabling dynamic tour customization based on selected client brand.
 */

import { ClientBranding, TourConfig, TourStep } from '@/types/tour'

export interface ClientBrandingConfig {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
  typography?: {
    fontFamily?: string
    fontSize?: string
    fontWeight?: string
  }
  customCSS?: string
}

export interface BrandedTourConfig extends TourConfig {
  branding?: ClientBrandingConfig
  brandedElements?: {
    popoverClass?: string
    overlayClass?: string
    buttonClass?: string
    progressClass?: string
  }
}

/**
 * Applies client branding to tour configuration
 */
export function applyClientBrandingToTour(
  baseTourConfig: TourConfig,
  clientBranding?: ClientBrandingConfig
): BrandedTourConfig {
  if (!clientBranding) return baseTourConfig

  const brandedConfig: BrandedTourConfig = {
    ...baseTourConfig,
    branding: clientBranding,
    brandedElements: generateBrandedClasses(clientBranding)
  }

  // Apply branding to individual steps
  if (brandedConfig.steps) {
    brandedConfig.steps = brandedConfig.steps.map(step => 
      applyBrandingToStep(step, clientBranding)
    )
  }

  return brandedConfig
}

/**
 * Applies branding to individual tour step
 */
function applyBrandingToStep(
  step: TourStep,
  branding: ClientBrandingConfig
): TourStep {
  const brandedStep: TourStep = {
    ...step,
    popoverClass: `${step.popoverClass || ''} tour-branded-popover`.trim(),
    onBeforeHighlight: async () => {
      // Apply branding styles before highlighting
      applyBrandingStyles(branding)
      
      // Call original callback if exists
      if (step.onBeforeHighlight) {
        await step.onBeforeHighlight()
      }
    }
  }

  // Add brand-aware content if needed
  if (step.description && branding.brandName) {
    brandedStep.description = step.description.replace(
      /\{brandName\}/g,
      branding.brandName
    )
  }

  return brandedStep
}

/**
 * Generates CSS classes for branded tour elements
 */
function generateBrandedClasses(branding: ClientBrandingConfig) {
  const primaryColor = branding.brandColors[0] || '#3b82f6'
  const secondaryColor = branding.brandColors[1] || '#64748b'
  const accentColor = branding.brandColors[2] || primaryColor

  return {
    popoverClass: 'tour-branded-popover',
    overlayClass: 'tour-branded-overlay',
    buttonClass: 'tour-branded-button',
    progressClass: 'tour-branded-progress'
  }
}

/**
 * Applies branding styles to the document
 */
export function applyBrandingStyles(branding: ClientBrandingConfig) {
  const primaryColor = branding.brandColors[0] || '#3b82f6'
  const secondaryColor = branding.brandColors[1] || '#64748b'
  const accentColor = branding.brandColors[2] || primaryColor

  // Remove existing branded styles
  removeBrandingStyles()

  // Create style element
  const styleElement = document.createElement('style')
  styleElement.id = 'tour-branding-styles'
  styleElement.textContent = `
    /* Tour Branded Popover */
    .tour-branded-popover {
      --tour-primary-color: ${primaryColor};
      --tour-secondary-color: ${secondaryColor};
      --tour-accent-color: ${accentColor};
      border-color: ${primaryColor} !important;
    }
    
    .tour-branded-popover .driver-popover-title {
      color: ${primaryColor} !important;
      ${branding.typography?.fontFamily ? `font-family: ${branding.typography.fontFamily} !important;` : ''}
      ${branding.typography?.fontWeight ? `font-weight: ${branding.typography.fontWeight} !important;` : ''}
    }
    
    .tour-branded-popover .driver-popover-description {
      ${branding.typography?.fontFamily ? `font-family: ${branding.typography.fontFamily} !important;` : ''}
    }
    
    /* Tour Branded Buttons */
    .tour-branded-button,
    .tour-branded-popover .driver-popover-next-btn {
      background-color: ${primaryColor} !important;
      border-color: ${primaryColor} !important;
      color: white !important;
    }
    
    .tour-branded-button:hover,
    .tour-branded-popover .driver-popover-next-btn:hover {
      background-color: ${darkenColor(primaryColor, 10)} !important;
      border-color: ${darkenColor(primaryColor, 10)} !important;
    }
    
    .tour-branded-popover .driver-popover-prev-btn {
      border-color: ${secondaryColor} !important;
      color: ${secondaryColor} !important;
    }
    
    .tour-branded-popover .driver-popover-prev-btn:hover {
      background-color: ${secondaryColor} !important;
      color: white !important;
    }
    
    /* Tour Branded Progress */
    .tour-branded-progress .driver-popover-progress-text {
      color: ${primaryColor} !important;
    }
    
    /* Tour Branded Overlay */
    .tour-branded-overlay {
      background-color: rgba(0, 0, 0, 0.5) !important;
    }
    
    /* Brand Logo Integration */
    .tour-brand-logo {
      max-width: 120px;
      max-height: 40px;
      object-fit: contain;
    }
    
    /* Custom CSS from client */
    ${branding.customCSS || ''}
  `

  document.head.appendChild(styleElement)
}

/**
 * Removes existing branding styles
 */
export function removeBrandingStyles() {
  const existingStyles = document.getElementById('tour-branding-styles')
  if (existingStyles) {
    existingStyles.remove()
  }
}

/**
 * Utility to darken a color by a percentage
 */
function darkenColor(color: string, percent: number): string {
  // Simple color darkening - in production you might want a more robust solution
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = (num >> 8 & 0x00FF) - amt
  const B = (num & 0x0000FF) - amt
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16)
    .slice(1)
}

/**
 * Creates brand-aware tour content
 */
export function createBrandAwareTourContent(
  baseContent: string,
  branding: ClientBrandingConfig
): string {
  let content = baseContent

  // Replace brand placeholders
  content = content.replace(/\{brandName\}/g, branding.brandName)
  content = content.replace(/\{primaryColor\}/g, branding.brandColors[0] || '#3b82f6')
  
  // Add brand logo if available
  if (branding.logoUrl) {
    content = content.replace(
      /\{brandLogo\}/g,
      `<img src="${branding.logoUrl}" alt="${branding.brandName}" class="tour-brand-logo" />`
    )
  } else {
    content = content.replace(/\{brandLogo\}/g, '')
  }

  return content
}

/**
 * Generates brand-specific tour messages
 */
export function getBrandedTourMessages(branding: ClientBrandingConfig) {
  return {
    welcome: `¡Bienvenido al tour de ${branding.brandName}!`,
    completion: `¡Has completado el tour de ${branding.brandName}! Ahora puedes empezar a crear contenido increíble.`,
    skip: `¿Estás seguro de que quieres saltar el tour de ${branding.brandName}?`,
    navigation: `Explorando las funcionalidades de ${branding.brandName}`,
    contentGeneration: `Aprende a generar contenido para ${branding.brandName}`,
    campaignManagement: `Gestiona las campañas de ${branding.brandName}`,
    brandAssets: `Explora los assets de marca de ${branding.brandName}`
  }
}

/**
 * Creates client-specific tour configuration
 */
export function createClientSpecificTourConfig(
  baseTourId: string,
  clientBranding: ClientBrandingConfig
): string {
  // Generate a client-specific tour ID
  return `${baseTourId}-${clientBranding.id}`
}

/**
 * Checks if client branding should be applied to tour
 */
export function shouldApplyClientBranding(
  tourId: string,
  clientBranding?: ClientBrandingConfig
): boolean {
  if (!clientBranding) return false
  
  // Don't apply branding to system tours
  const systemTours = ['error-recovery', 'accessibility-help', 'keyboard-shortcuts']
  if (systemTours.includes(tourId)) return false
  
  // Apply branding to client-specific tours
  const clientTours = ['welcome-tour', 'content-generation-tour', 'campaign-management-tour']
  return clientTours.includes(tourId)
}

/**
 * Tour branding manager class
 */
export class TourBrandingManager {
  private currentBranding: ClientBrandingConfig | null = null
  private brandingApplied = false

  /**
   * Sets the current client branding
   */
  setClientBranding(branding: ClientBrandingConfig | null) {
    this.currentBranding = branding
    
    if (branding && this.brandingApplied) {
      // Reapply branding if tour is active
      applyBrandingStyles(branding)
    }
  }

  /**
   * Gets the current client branding
   */
  getCurrentBranding(): ClientBrandingConfig | null {
    return this.currentBranding
  }

  /**
   * Applies branding for a tour
   */
  applyBrandingForTour(tourId: string): BrandedTourConfig | null {
    if (!this.currentBranding || !shouldApplyClientBranding(tourId, this.currentBranding)) {
      return null
    }

    applyBrandingStyles(this.currentBranding)
    this.brandingApplied = true

    return {
      branding: this.currentBranding,
      brandedElements: generateBrandedClasses(this.currentBranding)
    } as BrandedTourConfig
  }

  /**
   * Removes branding when tour ends
   */
  removeBranding() {
    removeBrandingStyles()
    this.brandingApplied = false
  }

  /**
   * Gets branded messages for current client
   */
  getBrandedMessages() {
    if (!this.currentBranding) return null
    return getBrandedTourMessages(this.currentBranding)
  }
}

// Global branding manager instance
export const tourBrandingManager = new TourBrandingManager()