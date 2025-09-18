/**
 * Navigation Integration for Tours
 * 
 * This module provides integration between the tour system and navigation context,
 * enabling tour-aware navigation behavior and progress indicators.
 */

import { BreadcrumbItem } from '@/components/navigation/navigation-context'
import { TourDefinition, TourStep } from '@/types/tour'

export interface TourNavigationState {
  activeTourId: string | null
  currentStep: number
  totalSteps: number
  showProgressInNav: boolean
  tourBreadcrumbs: BreadcrumbItem[]
  navigationLocked: boolean
}

export interface TourNavigationConfig {
  showProgressIndicator?: boolean
  lockNavigationDuringTour?: boolean
  addTourBreadcrumbs?: boolean
  highlightActiveElements?: boolean
}

/**
 * Creates tour-aware breadcrumbs based on current tour step
 */
export function createTourBreadcrumbs(
  tourDefinition: TourDefinition,
  currentStep: number,
  baseBreadcrumbs: BreadcrumbItem[] = []
): BreadcrumbItem[] {
  if (!tourDefinition) return baseBreadcrumbs

  const tourBreadcrumb: BreadcrumbItem = {
    label: `Tour: ${tourDefinition.name}`,
    href: '#tour-active',
    metadata: {
      status: 'active',
      contentType: 'tour'
    }
  }

  const stepBreadcrumb: BreadcrumbItem = {
    label: `Paso ${currentStep + 1} de ${tourDefinition.steps.length}`,
    href: '#tour-step',
    isActive: true,
    metadata: {
      status: 'current',
      contentType: 'tour-step'
    }
  }

  return [...baseBreadcrumbs, tourBreadcrumb, stepBreadcrumb]
}

/**
 * Generates navigation progress indicator data for tours
 */
export function getTourProgressData(
  currentStep: number,
  totalSteps: number,
  tourDefinition?: TourDefinition
) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  
  return {
    progress,
    currentStep: currentStep + 1,
    totalSteps,
    stepTitle: tourDefinition?.steps[currentStep]?.title || `Paso ${currentStep + 1}`,
    tourName: tourDefinition?.name || 'Tour Activo',
    estimatedTimeRemaining: calculateEstimatedTime(currentStep, totalSteps, tourDefinition)
  }
}

/**
 * Calculates estimated time remaining for tour completion
 */
function calculateEstimatedTime(
  currentStep: number,
  totalSteps: number,
  tourDefinition?: TourDefinition
): number {
  if (!tourDefinition?.metadata?.estimatedDuration) return 0
  
  const totalDuration = tourDefinition.metadata.estimatedDuration
  const remainingSteps = totalSteps - (currentStep + 1)
  const avgTimePerStep = totalDuration / totalSteps
  
  return Math.ceil(remainingSteps * avgTimePerStep)
}

/**
 * Determines if navigation should be locked during tour
 */
export function shouldLockNavigation(
  tourDefinition?: TourDefinition,
  config: TourNavigationConfig = {}
): boolean {
  if (config.lockNavigationDuringTour === false) return false
  
  // Lock navigation for critical onboarding tours
  if (tourDefinition?.category === 'onboarding') return true
  
  // Lock navigation if tour has navigation-dependent steps
  const hasNavigationSteps = tourDefinition?.steps.some(step => 
    step.element?.includes('nav') || 
    step.element?.includes('sidebar') ||
    step.element?.includes('breadcrumb')
  )
  
  return hasNavigationSteps || false
}

/**
 * Gets navigation elements that should be highlighted during tour
 */
export function getHighlightedNavElements(
  currentStep: TourStep,
  tourDefinition?: TourDefinition
): string[] {
  const elements: string[] = []
  
  // Highlight navigation elements mentioned in current step
  if (currentStep.element?.includes('nav')) {
    elements.push('[data-nav-item]')
  }
  
  if (currentStep.element?.includes('sidebar')) {
    elements.push('[data-sidebar-item]')
  }
  
  if (currentStep.element?.includes('breadcrumb')) {
    elements.push('[data-breadcrumb-item]')
  }
  
  // Add tour-specific highlights
  if (tourDefinition?.metadata?.highlightElements) {
    elements.push(...tourDefinition.metadata.highlightElements)
  }
  
  return elements
}

/**
 * Creates tour-aware navigation state
 */
export function createTourNavigationState(
  tourId: string | null,
  currentStep: number,
  totalSteps: number,
  tourDefinition?: TourDefinition,
  config: TourNavigationConfig = {}
): TourNavigationState {
  const baseBreadcrumbs: BreadcrumbItem[] = []
  
  return {
    activeTourId: tourId,
    currentStep,
    totalSteps,
    showProgressInNav: config.showProgressIndicator !== false,
    tourBreadcrumbs: tourId ? createTourBreadcrumbs(tourDefinition!, currentStep, baseBreadcrumbs) : [],
    navigationLocked: tourId ? shouldLockNavigation(tourDefinition, config) : false
  }
}

/**
 * Handles navigation events during active tours
 */
export class TourNavigationHandler {
  private onNavigationAttempt?: (targetPath: string, tourId: string) => boolean
  private onTourInterrupted?: (tourId: string, targetPath: string) => void
  
  constructor(
    onNavigationAttempt?: (targetPath: string, tourId: string) => boolean,
    onTourInterrupted?: (tourId: string, targetPath: string) => void
  ) {
    this.onNavigationAttempt = onNavigationAttempt
    this.onTourInterrupted = onTourInterrupted
  }
  
  /**
   * Handles navigation attempts during active tours
   */
  handleNavigationAttempt(
    targetPath: string,
    currentTourId: string | null,
    navigationLocked: boolean
  ): boolean {
    if (!currentTourId || !navigationLocked) return true
    
    // Allow navigation if callback permits it
    if (this.onNavigationAttempt) {
      const allowed = this.onNavigationAttempt(targetPath, currentTourId)
      if (allowed) return true
    }
    
    // Show confirmation dialog for locked navigation
    const shouldContinue = window.confirm(
      '¿Estás seguro de que quieres salir del tour? Tu progreso se guardará automáticamente.'
    )
    
    if (shouldContinue) {
      this.onTourInterrupted?.(currentTourId, targetPath)
      return true
    }
    
    return false
  }
  
  /**
   * Updates navigation state when tour step changes
   */
  updateNavigationForTourStep(
    step: TourStep,
    tourDefinition: TourDefinition,
    updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  ) {
    // Update breadcrumbs with current step info
    const stepBreadcrumb: BreadcrumbItem = {
      label: step.title || `Paso ${step.element}`,
      href: '#tour-current-step',
      isActive: true,
      metadata: {
        status: 'current',
        contentType: 'tour-step'
      }
    }
    
    const tourBreadcrumb: BreadcrumbItem = {
      label: `Tour: ${tourDefinition.name}`,
      href: '#tour-active',
      metadata: {
        status: 'active',
        contentType: 'tour'
      }
    }
    
    updateBreadcrumbs([tourBreadcrumb, stepBreadcrumb])
  }
}

/**
 * Utility to check if current page supports tours
 */
export function isPageTourCompatible(pathname: string): boolean {
  // Define pages that support tours
  const tourCompatiblePaths = [
    '/dashboard',
    '/dashboard/content',
    '/dashboard/campaigns',
    '/dashboard/clients',
    '/dashboard/brand-assets'
  ]
  
  return tourCompatiblePaths.some(path => pathname.startsWith(path))
}

/**
 * Gets suggested tours for current navigation context
 */
export function getSuggestedToursForContext(
  pathname: string,
  clientId?: string,
  userRole?: string
): string[] {
  const suggestions: string[] = []
  
  // Page-specific tour suggestions
  if (pathname === '/dashboard') {
    suggestions.push('welcome-tour')
  } else if (pathname.startsWith('/dashboard/content')) {
    suggestions.push('content-generation-tour')
  } else if (pathname.startsWith('/dashboard/campaigns')) {
    suggestions.push('campaign-management-tour')
  }
  
  // Role-specific suggestions
  if (userRole === 'admin') {
    suggestions.push('admin-features-tour')
  }
  
  // Client-specific suggestions
  if (clientId) {
    suggestions.push('client-switching-tour')
  }
  
  return suggestions
}