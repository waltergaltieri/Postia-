/**
 * Dynamic tour configuration loader with lazy loading and condition evaluation
 */

import { TourConfigLoader, validateTourDefinition } from './tour-config'
import { TourConditionEvaluator, getConditionEvaluator, createEvaluationContext } from './tour-condition-evaluator'
import { getTourRegistry } from './tour-registry'
import type { TourDefinition, TourCondition, TourTrigger } from '@/types/tour'

interface LoaderOptions {
  enableCaching?: boolean
  validateOnLoad?: boolean
  evaluateConditions?: boolean
  preloadRelated?: boolean
}

interface TourLoadResult {
  tour: TourDefinition
  conditionsMet: boolean
  loadTime: number
  fromCache: boolean
}

interface TourLoadError {
  tourId: string
  error: string
  timestamp: Date
}

/**
 * Enhanced tour loader with dynamic loading capabilities
 */
export class DynamicTourLoader {
  private static instance: DynamicTourLoader
  private loadCache = new Map<string, { tour: TourDefinition; timestamp: number }>()
  private loadErrors = new Map<string, TourLoadError>()
  private loadingPromises = new Map<string, Promise<TourDefinition>>()
  private options: LoaderOptions

  private constructor(options: LoaderOptions = {}) {
    this.options = {
      enableCaching: true,
      validateOnLoad: true,
      evaluateConditions: true,
      preloadRelated: false,
      ...options
    }
  }

  static getInstance(options?: LoaderOptions): DynamicTourLoader {
    if (!DynamicTourLoader.instance) {
      DynamicTourLoader.instance = new DynamicTourLoader(options)
    }
    return DynamicTourLoader.instance
  }

  /**
   * Load a tour with full evaluation and validation
   */
  async loadTour(
    tourId: string, 
    evaluationContext?: any,
    options?: Partial<LoaderOptions>
  ): Promise<TourLoadResult> {
    const startTime = Date.now()
    const mergedOptions = { ...this.options, ...options }

    try {
      // Check cache first
      if (mergedOptions.enableCaching) {
        const cached = this.getCachedTour(tourId)
        if (cached) {
          const conditionsMet = mergedOptions.evaluateConditions 
            ? await this.evaluateTourConditions(cached, evaluationContext)
            : true

          return {
            tour: cached,
            conditionsMet,
            loadTime: Date.now() - startTime,
            fromCache: true
          }
        }
      }

      // Check if already loading
      const existingPromise = this.loadingPromises.get(tourId)
      if (existingPromise) {
        const tour = await existingPromise
        const conditionsMet = mergedOptions.evaluateConditions 
          ? await this.evaluateTourConditions(tour, evaluationContext)
          : true

        return {
          tour,
          conditionsMet,
          loadTime: Date.now() - startTime,
          fromCache: false
        }
      }

      // Start loading
      const loadPromise = this.performTourLoad(tourId, mergedOptions)
      this.loadingPromises.set(tourId, loadPromise)

      try {
        const tour = await loadPromise
        
        // Cache the result
        if (mergedOptions.enableCaching) {
          this.setCachedTour(tourId, tour)
        }

        // Evaluate conditions
        const conditionsMet = mergedOptions.evaluateConditions 
          ? await this.evaluateTourConditions(tour, evaluationContext)
          : true

        // Preload related tours if enabled
        if (mergedOptions.preloadRelated && conditionsMet) {
          this.preloadRelatedTours(tour, evaluationContext).catch(error => {
            console.warn('Failed to preload related tours:', error)
          })
        }

        return {
          tour,
          conditionsMet,
          loadTime: Date.now() - startTime,
          fromCache: false
        }
      } finally {
        this.loadingPromises.delete(tourId)
      }
    } catch (error) {
      this.loadingPromises.delete(tourId)
      
      // Store error for debugging
      this.loadErrors.set(tourId, {
        tourId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })

      throw error
    }
  }

  /**
   * Load multiple tours in parallel
   */
  async loadTours(
    tourIds: string[], 
    evaluationContext?: any,
    options?: Partial<LoaderOptions>
  ): Promise<TourLoadResult[]> {
    const loadPromises = tourIds.map(tourId => 
      this.loadTour(tourId, evaluationContext, options)
    )

    const results = await Promise.allSettled(loadPromises)
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // Return a failed result
        return {
          tour: null as any,
          conditionsMet: false,
          loadTime: 0,
          fromCache: false,
          error: result.reason
        }
      }
    }).filter(result => result.tour !== null)
  }

  /**
   * Get tours that match current conditions
   */
  async getAvailableTours(evaluationContext?: any): Promise<TourDefinition[]> {
    const registry = getTourRegistry()
    const allTourIds = registry.getAvailableTours()
    
    const loadResults = await this.loadTours(allTourIds, evaluationContext, {
      evaluateConditions: true
    })

    return loadResults
      .filter(result => result.conditionsMet)
      .map(result => result.tour)
  }

  /**
   * Get tours by trigger type
   */
  async getToursByTrigger(
    triggerType: TourTrigger['type'],
    evaluationContext?: any
  ): Promise<TourDefinition[]> {
    const availableTours = await this.getAvailableTours(evaluationContext)
    
    return availableTours.filter(tour => 
      tour.triggers.some(trigger => trigger.type === triggerType)
    )
  }

  /**
   * Get tours for automatic triggering
   */
  async getAutoTriggerTours(evaluationContext?: any): Promise<TourDefinition[]> {
    const autoTours = await this.getToursByTrigger('auto', evaluationContext)
    
    // Sort by priority (higher priority first)
    return autoTours.sort((a, b) => {
      const aPriority = Math.max(...a.triggers.map(t => t.priority || 0))
      const bPriority = Math.max(...b.triggers.map(t => t.priority || 0))
      return bPriority - aPriority
    })
  }

  /**
   * Check if a tour should be triggered based on conditions
   */
  async shouldTriggerTour(
    tourId: string,
    triggerType: TourTrigger['type'],
    evaluationContext?: any
  ): Promise<boolean> {
    try {
      const result = await this.loadTour(tourId, evaluationContext)
      
      if (!result.conditionsMet) {
        return false
      }

      // Check if tour has the specified trigger type
      const hasTrigger = result.tour.triggers.some(trigger => trigger.type === triggerType)
      if (!hasTrigger) {
        return false
      }

      // Additional trigger-specific logic can be added here
      // For example, checking delay, frequency, etc.

      return true
    } catch (error) {
      console.warn(`Failed to check trigger for tour ${tourId}:`, error)
      return false
    }
  }

  /**
   * Validate a tour configuration
   */
  async validateTour(tourId: string): Promise<{ isValid: boolean; errors?: string[] }> {
    try {
      const result = await this.loadTour(tourId, undefined, { 
        validateOnLoad: true,
        evaluateConditions: false 
      })
      
      // Additional validation can be added here
      const errors: string[] = []
      
      // Check for required elements
      for (const step of result.tour.steps) {
        if (typeof step.element === 'string') {
          // In a real implementation, you might want to check if the element exists
          // This is just a placeholder for element validation
          if (!step.element.trim()) {
            errors.push(`Step "${step.title}" has empty element selector`)
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      }
    }
  }

  /**
   * Perform the actual tour loading
   */
  private async performTourLoad(
    tourId: string, 
    options: LoaderOptions
  ): Promise<TourDefinition> {
    const registry = getTourRegistry()
    
    // Load from registry
    const tour = await registry.loadTour(tourId)
    
    // Validate if enabled
    if (options.validateOnLoad) {
      try {
        validateTourDefinition(tour)
      } catch (error) {
        throw new Error(`Tour validation failed for ${tourId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return tour
  }

  /**
   * Evaluate tour conditions
   */
  private async evaluateTourConditions(
    tour: TourDefinition,
    evaluationContext?: any
  ): Promise<boolean> {
    if (!tour.conditions || tour.conditions.length === 0) {
      return true
    }

    const context = evaluationContext || createEvaluationContext()
    const evaluator = getConditionEvaluator(context)
    
    return evaluator.evaluateConditions(tour.conditions)
  }

  /**
   * Preload related tours
   */
  private async preloadRelatedTours(
    tour: TourDefinition,
    evaluationContext?: any
  ): Promise<void> {
    // Get tours from the same category
    const registry = getTourRegistry()
    const relatedTours = await registry.getToursByCategory(tour.category)
    
    // Preload up to 3 related tours
    const toPreload = relatedTours
      .filter(t => t.id !== tour.id)
      .slice(0, 3)
      .map(t => t.id)

    if (toPreload.length > 0) {
      this.loadTours(toPreload, evaluationContext, { 
        enableCaching: true,
        evaluateConditions: false 
      }).catch(error => {
        console.warn('Failed to preload related tours:', error)
      })
    }
  }

  /**
   * Cache management
   */
  private getCachedTour(tourId: string): TourDefinition | null {
    const cached = this.loadCache.get(tourId)
    if (!cached) return null

    // Check if cache is still valid (1 hour)
    const maxAge = 60 * 60 * 1000 // 1 hour
    if (Date.now() - cached.timestamp > maxAge) {
      this.loadCache.delete(tourId)
      return null
    }

    return cached.tour
  }

  private setCachedTour(tourId: string, tour: TourDefinition): void {
    this.loadCache.set(tourId, {
      tour,
      timestamp: Date.now()
    })
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.loadCache.clear()
    this.loadErrors.clear()
  }

  /**
   * Get load statistics
   */
  getLoadStats(): {
    cacheSize: number
    errorCount: number
    activeLoads: number
  } {
    return {
      cacheSize: this.loadCache.size,
      errorCount: this.loadErrors.size,
      activeLoads: this.loadingPromises.size
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(): TourLoadError[] {
    return Array.from(this.loadErrors.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
  }
}

/**
 * Convenience functions
 */
export function getDynamicTourLoader(options?: LoaderOptions): DynamicTourLoader {
  return DynamicTourLoader.getInstance(options)
}

export async function loadTourDynamic(
  tourId: string,
  evaluationContext?: any,
  options?: Partial<LoaderOptions>
): Promise<TourLoadResult> {
  const loader = getDynamicTourLoader()
  return loader.loadTour(tourId, evaluationContext, options)
}

export async function getAvailableToursForContext(evaluationContext?: any): Promise<TourDefinition[]> {
  const loader = getDynamicTourLoader()
  return loader.getAvailableTours(evaluationContext)
}

export async function shouldAutoTriggerTour(
  tourId: string,
  evaluationContext?: any
): Promise<boolean> {
  const loader = getDynamicTourLoader()
  return loader.shouldTriggerTour(tourId, 'auto', evaluationContext)
}