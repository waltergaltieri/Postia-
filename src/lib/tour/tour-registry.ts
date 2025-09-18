/**
 * Tour registry for managing available tours and their configurations
 */

import { TourConfigLoader } from './tour-config'
import type { TourDefinition } from '@/types/tour'

/**
 * Registry of available tours with lazy loading support
 */
export class TourRegistry {
  private static instance: TourRegistry
  private tourLoaders = new Map<string, () => Promise<any>>()
  private loadedTours = new Map<string, TourDefinition>()

  private constructor() {
    this.registerDefaultTours()
  }

  static getInstance(): TourRegistry {
    if (!TourRegistry.instance) {
      TourRegistry.instance = new TourRegistry()
    }
    return TourRegistry.instance
  }

  /**
   * Register default tours with lazy loading
   */
  private registerDefaultTours() {
    // Welcome Tours - Role-specific and device-optimized
    this.tourLoaders.set('welcome-tour', () => 
      import('./configs/welcome-tour.json').then(module => module.default)
    )
    this.tourLoaders.set('welcome-tour-admin', () => 
      import('./configs/welcome-tour-admin.json').then(module => module.default)
    )
    this.tourLoaders.set('welcome-tour-editor', () => 
      import('./configs/welcome-tour-editor.json').then(module => module.default)
    )
    this.tourLoaders.set('welcome-tour-mobile', () => 
      import('./configs/welcome-tour-mobile.json').then(module => module.default)
    )

    // Content Generation Tours - Comprehensive workflow guidance
    this.tourLoaders.set('content-generation-tour', () => 
      import('./configs/content-generation-tour.json').then(module => module.default)
    )
    this.tourLoaders.set('content-optimization-tour', () => 
      import('./configs/content-optimization-tour.json').then(module => module.default)
    )
    this.tourLoaders.set('content-generation-quick', () => 
      import('./configs/content-generation-quick.json').then(module => module.default)
    )

    // Campaign Management Tours - Full campaign lifecycle
    this.tourLoaders.set('campaign-management-tour', () => 
      import('./configs/campaign-management-tour.json').then(module => module.default)
    )
    this.tourLoaders.set('campaign-calendar-tour', () => 
      import('./configs/campaign-calendar-tour.json').then(module => module.default)
    )
    this.tourLoaders.set('client-switching-tour', () => 
      import('./configs/client-switching-tour.json').then(module => module.default)
    )
  }

  /**
   * Register a new tour with lazy loading
   */
  registerTour(tourId: string, loader: () => Promise<any>) {
    this.tourLoaders.set(tourId, loader)
  }

  /**
   * Load a tour configuration by ID
   */
  async loadTour(tourId: string): Promise<TourDefinition> {
    // Check if already loaded
    const cached = this.loadedTours.get(tourId)
    if (cached) {
      return cached
    }

    // Get the loader
    const loader = this.tourLoaders.get(tourId)
    if (!loader) {
      throw new Error(`Tour '${tourId}' not found in registry`)
    }

    try {
      // Load and validate the tour configuration
      const configData = await loader()
      const tourDefinition = await TourConfigLoader.loadTourConfig(tourId, configData)
      
      // Cache the loaded tour
      this.loadedTours.set(tourId, tourDefinition)
      
      return tourDefinition
    } catch (error) {
      throw new Error(`Failed to load tour '${tourId}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all available tour IDs
   */
  getAvailableTours(): string[] {
    return Array.from(this.tourLoaders.keys())
  }

  /**
   * Check if a tour is available
   */
  hasTour(tourId: string): boolean {
    return this.tourLoaders.has(tourId)
  }

  /**
   * Get tours by category
   */
  async getToursByCategory(category: TourDefinition['category']): Promise<TourDefinition[]> {
    const allTourIds = this.getAvailableTours()
    const tours: TourDefinition[] = []

    for (const tourId of allTourIds) {
      try {
        const tour = await this.loadTour(tourId)
        if (tour.category === category) {
          tours.push(tour)
        }
      } catch (error) {
        console.warn(`Failed to load tour ${tourId} for category filtering:`, error)
      }
    }

    return tours
  }

  /**
   * Search tours by name or description
   */
  async searchTours(query: string): Promise<TourDefinition[]> {
    const allTourIds = this.getAvailableTours()
    const tours: TourDefinition[] = []
    const searchTerm = query.toLowerCase()

    for (const tourId of allTourIds) {
      try {
        const tour = await this.loadTour(tourId)
        if (
          tour.name.toLowerCase().includes(searchTerm) ||
          tour.description.toLowerCase().includes(searchTerm) ||
          tour.id.toLowerCase().includes(searchTerm)
        ) {
          tours.push(tour)
        }
      } catch (error) {
        console.warn(`Failed to load tour ${tourId} for search:`, error)
      }
    }

    return tours
  }

  /**
   * Preload tours for better performance
   */
  async preloadTours(tourIds: string[]): Promise<void> {
    const loadPromises = tourIds.map(async (tourId) => {
      try {
        await this.loadTour(tourId)
      } catch (error) {
        console.warn(`Failed to preload tour ${tourId}:`, error)
      }
    })

    await Promise.all(loadPromises)
  }

  /**
   * Clear cached tours
   */
  clearCache(): void {
    this.loadedTours.clear()
    TourConfigLoader.clearCache()
  }

  /**
   * Get tour metadata without loading full configuration
   */
  async getTourMetadata(tourId: string): Promise<TourDefinition['metadata'] | null> {
    try {
      const tour = await this.loadTour(tourId)
      return tour.metadata
    } catch (error) {
      console.warn(`Failed to get metadata for tour ${tourId}:`, error)
      return null
    }
  }

  /**
   * Validate all registered tours
   */
  async validateAllTours(): Promise<{ valid: string[]; invalid: { tourId: string; error: string }[] }> {
    const allTourIds = this.getAvailableTours()
    const valid: string[] = []
    const invalid: { tourId: string; error: string }[] = []

    for (const tourId of allTourIds) {
      try {
        await this.loadTour(tourId)
        valid.push(tourId)
      } catch (error) {
        invalid.push({
          tourId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return { valid, invalid }
  }
}

/**
 * Convenience function to get the tour registry instance
 */
export function getTourRegistry(): TourRegistry {
  return TourRegistry.getInstance()
}

/**
 * Convenience function to load a tour
 */
export async function loadTour(tourId: string): Promise<TourDefinition> {
  return getTourRegistry().loadTour(tourId)
}

/**
 * Convenience function to get available tours
 */
export function getAvailableTours(): string[] {
  return getTourRegistry().getAvailableTours()
}

/**
 * Tour categories for easy filtering
 */
export const TOUR_CATEGORIES = {
  ONBOARDING: 'onboarding' as const,
  FEATURE: 'feature' as const,
  CONTEXTUAL: 'contextual' as const,
  HELP: 'help' as const,
} as const

/**
 * Default tour IDs for easy reference
 */
export const DEFAULT_TOUR_IDS = {
  // Welcome Tours
  WELCOME: 'welcome-tour',
  WELCOME_ADMIN: 'welcome-tour-admin',
  WELCOME_EDITOR: 'welcome-tour-editor',
  WELCOME_MOBILE: 'welcome-tour-mobile',
  
  // Content Generation Tours
  CONTENT_GENERATION: 'content-generation-tour',
  CONTENT_OPTIMIZATION: 'content-optimization-tour',
  CONTENT_GENERATION_QUICK: 'content-generation-quick',
  
  // Campaign Management Tours
  CAMPAIGN_MANAGEMENT: 'campaign-management-tour',
  CAMPAIGN_CALENDAR: 'campaign-calendar-tour',
  CLIENT_SWITCHING: 'client-switching-tour',
} as const