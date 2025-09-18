/**
 * Tour selection utilities for choosing appropriate tours based on user context
 */

import { DEFAULT_TOUR_IDS } from './tour-registry'
import type { TourDefinition } from '@/types/tour'

export interface UserContext {
  role?: 'admin' | 'editor' | 'viewer'
  isNewUser?: boolean
  isMobile?: boolean
  hasMultipleClients?: boolean
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  currentPage?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
}

export interface TourRecommendation {
  tourId: string
  priority: number
  reason: string
  category: TourDefinition['category']
}

/**
 * Tour selector class for intelligent tour recommendations
 */
export class TourSelector {
  /**
   * Get the appropriate welcome tour based on user context
   */
  static getWelcomeTour(context: UserContext): string {
    // Mobile users get mobile-optimized tour
    if (context.isMobile || context.deviceType === 'mobile') {
      return DEFAULT_TOUR_IDS.WELCOME_MOBILE
    }

    // Role-specific tours for desktop users
    switch (context.role) {
      case 'admin':
        return DEFAULT_TOUR_IDS.WELCOME_ADMIN
      case 'editor':
        return DEFAULT_TOUR_IDS.WELCOME_EDITOR
      default:
        return DEFAULT_TOUR_IDS.WELCOME
    }
  }

  /**
   * Get appropriate content generation tour based on experience
   */
  static getContentGenerationTour(context: UserContext): string {
    if (context.experienceLevel === 'advanced') {
      return DEFAULT_TOUR_IDS.CONTENT_GENERATION_QUICK
    }

    if (context.experienceLevel === 'intermediate') {
      return DEFAULT_TOUR_IDS.CONTENT_OPTIMIZATION
    }

    return DEFAULT_TOUR_IDS.CONTENT_GENERATION
  }

  /**
   * Get campaign management tour based on context
   */
  static getCampaignTour(context: UserContext): string {
    // If user is on calendar page, show calendar-specific tour
    if (context.currentPage?.includes('calendar')) {
      return DEFAULT_TOUR_IDS.CAMPAIGN_CALENDAR
    }

    return DEFAULT_TOUR_IDS.CAMPAIGN_MANAGEMENT
  }

  /**
   * Get contextual tour recommendations based on user behavior and page
   */
  static getContextualRecommendations(context: UserContext): TourRecommendation[] {
    const recommendations: TourRecommendation[] = []

    // New user recommendations
    if (context.isNewUser) {
      recommendations.push({
        tourId: this.getWelcomeTour(context),
        priority: 10,
        reason: 'New user onboarding',
        category: 'onboarding'
      })
    }

    // Page-specific recommendations
    if (context.currentPage) {
      if (context.currentPage.includes('/content')) {
        recommendations.push({
          tourId: this.getContentGenerationTour(context),
          priority: 8,
          reason: 'Content generation page detected',
          category: 'feature'
        })
      }

      if (context.currentPage.includes('/campaign')) {
        recommendations.push({
          tourId: this.getCampaignTour(context),
          priority: 8,
          reason: 'Campaign management page detected',
          category: 'feature'
        })
      }

      if (context.currentPage.includes('/calendar')) {
        recommendations.push({
          tourId: DEFAULT_TOUR_IDS.CAMPAIGN_CALENDAR,
          priority: 9,
          reason: 'Calendar page detected',
          category: 'feature'
        })
      }
    }

    // Multi-client users
    if (context.hasMultipleClients) {
      recommendations.push({
        tourId: DEFAULT_TOUR_IDS.CLIENT_SWITCHING,
        priority: 6,
        reason: 'Multi-client account detected',
        category: 'feature'
      })
    }

    // Role-specific recommendations
    if (context.role === 'admin') {
      recommendations.push({
        tourId: DEFAULT_TOUR_IDS.WELCOME_ADMIN,
        priority: 7,
        reason: 'Administrator role detected',
        category: 'onboarding'
      })
    }

    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get the next recommended tour based on completed tours
   */
  static getNextRecommendedTour(
    context: UserContext, 
    completedTours: string[]
  ): TourRecommendation | null {
    const recommendations = this.getContextualRecommendations(context)
    
    // Filter out completed tours
    const availableRecommendations = recommendations.filter(
      rec => !completedTours.includes(rec.tourId)
    )

    // Return the highest priority available recommendation
    return availableRecommendations[0] || null
  }

  /**
   * Check if a tour should be auto-triggered based on context
   */
  static shouldAutoTriggerTour(
    tourId: string, 
    context: UserContext, 
    completedTours: string[]
  ): boolean {
    // Don't auto-trigger if already completed
    if (completedTours.includes(tourId)) {
      return false
    }

    // Auto-trigger welcome tours for new users
    if (context.isNewUser && tourId.includes('welcome')) {
      return true
    }

    // Auto-trigger contextual tours on relevant pages
    if (context.currentPage) {
      if (context.currentPage.includes('/content') && tourId.includes('content-generation')) {
        return !context.isNewUser // Don't conflict with welcome tour
      }

      if (context.currentPage.includes('/campaign') && tourId.includes('campaign')) {
        return !context.isNewUser
      }
    }

    return false
  }

  /**
   * Get tour difficulty level for progressive disclosure
   */
  static getTourDifficulty(tourId: string): 'beginner' | 'intermediate' | 'advanced' {
    if (tourId.includes('quick') || tourId.includes('optimization')) {
      return 'advanced'
    }

    if (tourId.includes('admin') || tourId.includes('calendar')) {
      return 'intermediate'
    }

    return 'beginner'
  }

  /**
   * Filter tours by user experience level
   */
  static filterToursByExperience(
    tourIds: string[], 
    experienceLevel: UserContext['experienceLevel']
  ): string[] {
    return tourIds.filter(tourId => {
      const tourDifficulty = this.getTourDifficulty(tourId)
      
      switch (experienceLevel) {
        case 'beginner':
          return tourDifficulty === 'beginner'
        case 'intermediate':
          return tourDifficulty === 'beginner' || tourDifficulty === 'intermediate'
        case 'advanced':
          return true // Advanced users can access all tours
        default:
          return tourDifficulty === 'beginner'
      }
    })
  }

  /**
   * Get estimated completion time for a tour sequence
   */
  static getEstimatedSequenceTime(tourIds: string[]): number {
    // Base estimates in seconds
    const tourEstimates: Record<string, number> = {
      [DEFAULT_TOUR_IDS.WELCOME]: 210,
      [DEFAULT_TOUR_IDS.WELCOME_ADMIN]: 280,
      [DEFAULT_TOUR_IDS.WELCOME_EDITOR]: 240,
      [DEFAULT_TOUR_IDS.WELCOME_MOBILE]: 180,
      [DEFAULT_TOUR_IDS.CONTENT_GENERATION]: 320,
      [DEFAULT_TOUR_IDS.CONTENT_OPTIMIZATION]: 380,
      [DEFAULT_TOUR_IDS.CONTENT_GENERATION_QUICK]: 120,
      [DEFAULT_TOUR_IDS.CAMPAIGN_MANAGEMENT]: 420,
      [DEFAULT_TOUR_IDS.CAMPAIGN_CALENDAR]: 300,
      [DEFAULT_TOUR_IDS.CLIENT_SWITCHING]: 280,
    }

    return tourIds.reduce((total, tourId) => {
      return total + (tourEstimates[tourId] || 180) // Default 3 minutes
    }, 0)
  }
}

/**
 * Convenience functions for common tour selection scenarios
 */

export function getWelcomeTourForUser(context: UserContext): string {
  return TourSelector.getWelcomeTour(context)
}

export function getRecommendedToursForUser(context: UserContext): TourRecommendation[] {
  return TourSelector.getContextualRecommendations(context)
}

export function shouldShowTourAutomatically(
  tourId: string, 
  context: UserContext, 
  completedTours: string[]
): boolean {
  return TourSelector.shouldAutoTriggerTour(tourId, context, completedTours)
}

export function getNextTourRecommendation(
  context: UserContext, 
  completedTours: string[]
): TourRecommendation | null {
  return TourSelector.getNextRecommendedTour(context, completedTours)
}