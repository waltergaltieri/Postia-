/**
 * Tour configuration system with JSON schema validation using Zod
 */

import { z } from 'zod'
import type { 
  TourDefinition, 
  TourStep, 
  TourTrigger, 
  TourCondition,
  ClientBranding,
  ThemedTourConfig 
} from '@/types/tour'

// Zod schemas for validation
export const TourStepSchema = z.object({
  element: z.union([z.string(), z.any()]), // HTMLElement can't be validated by Zod
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  position: z.enum(['top', 'bottom', 'left', 'right', 'auto']).optional(),
  showButtons: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  onBeforeHighlight: z.function().optional(),
  onHighlight: z.function().optional(),
  onDeselect: z.function().optional(),
  customComponent: z.any().optional(), // React component can't be validated by Zod
  accessibility: z.object({
    ariaLabel: z.string().optional(),
    ariaDescription: z.string().optional(),
    announceOnFocus: z.string().optional(),
  }).optional(),
})

export const TourTriggerSchema = z.object({
  type: z.enum(['manual', 'auto', 'conditional', 'scheduled']),
  condition: z.string().optional(),
  delay: z.number().min(0).optional(),
  priority: z.number().min(0).optional(),
})

export const TourConditionSchema = z.object({
  type: z.enum(['user_role', 'client_selected', 'page_path', 'feature_flag', 'user_property']),
  operator: z.enum(['equals', 'contains', 'not_equals', 'exists']),
  value: z.any(),
})

export const TourDefinitionSchema = z.object({
  id: z.string().min(1, 'Tour ID is required'),
  name: z.string().min(1, 'Tour name is required'),
  description: z.string().min(1, 'Tour description is required'),
  category: z.enum(['onboarding', 'feature', 'contextual', 'help']),
  triggers: z.array(TourTriggerSchema).min(1, 'At least one trigger is required'),
  conditions: z.array(TourConditionSchema).optional(),
  steps: z.array(TourStepSchema).min(1, 'At least one step is required'),
  metadata: z.object({
    version: z.string().min(1, 'Version is required'),
    author: z.string().min(1, 'Author is required'),
    lastUpdated: z.string().min(1, 'Last updated date is required'),
    estimatedDuration: z.number().min(0, 'Duration must be positive'),
  }),
})

export const ClientBrandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  logoUrl: z.string().url().optional(),
  brandName: z.string().min(1, 'Brand name is required'),
  customCSS: z.string().optional(),
})

export const ThemedTourConfigSchema = z.object({
  baseConfig: z.object({
    steps: z.array(TourStepSchema),
    showProgress: z.boolean().optional(),
    allowClose: z.boolean().optional(),
    allowKeyboardControl: z.boolean().optional(),
    animate: z.boolean().optional(),
    popoverClass: z.string().optional(),
    overlayClass: z.string().optional(),
  }),
  clientBranding: ClientBrandingSchema.optional(),
  theme: z.enum(['light', 'dark']),
  accessibility: z.object({
    highContrast: z.boolean(),
    reducedMotion: z.boolean(),
    fontSize: z.enum(['small', 'medium', 'large']),
  }),
})

/**
 * Validates a tour definition against the schema
 */
export function validateTourDefinition(data: unknown): TourDefinition {
  try {
    return TourDefinitionSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new Error(`Tour definition validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * Validates client branding configuration
 */
export function validateClientBranding(data: unknown): ClientBranding {
  try {
    return ClientBrandingSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new Error(`Client branding validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * Validates themed tour configuration
 */
export function validateThemedTourConfig(data: unknown): ThemedTourConfig {
  try {
    return ThemedTourConfigSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new Error(`Themed tour config validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * Tour configuration loader with validation and enhanced features
 */
export class TourConfigLoader {
  private static tourConfigs = new Map<string, TourDefinition>()
  private static loadingPromises = new Map<string, Promise<TourDefinition>>()
  
  /**
   * Loads and validates a tour configuration from JSON
   */
  static async loadTourConfig(tourId: string, configData: unknown): Promise<TourDefinition> {
    const validatedConfig = validateTourDefinition(configData)
    
    // Ensure the tour ID matches
    if (validatedConfig.id !== tourId) {
      throw new Error(`Tour ID mismatch: expected ${tourId}, got ${validatedConfig.id}`)
    }
    
    // Validate steps have required elements
    this.validateTourSteps(validatedConfig)
    
    // Cache the validated configuration
    this.tourConfigs.set(tourId, validatedConfig)
    
    return validatedConfig
  }
  
  /**
   * Gets a cached tour configuration
   */
  static getTourConfig(tourId: string): TourDefinition | undefined {
    return this.tourConfigs.get(tourId)
  }
  
  /**
   * Loads tour configuration from a JSON file with caching
   */
  static async loadTourConfigFromFile(tourId: string, filePath: string): Promise<TourDefinition> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(tourId)
    if (existingPromise) {
      return existingPromise
    }

    // Check cache first
    const cached = this.getTourConfig(tourId)
    if (cached) {
      return cached
    }

    // Start loading
    const loadPromise = this.performFileLoad(tourId, filePath)
    this.loadingPromises.set(tourId, loadPromise)

    try {
      const result = await loadPromise
      return result
    } finally {
      this.loadingPromises.delete(tourId)
    }
  }

  /**
   * Perform the actual file loading
   */
  private static async performFileLoad(tourId: string, filePath: string): Promise<TourDefinition> {
    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to load tour config from ${filePath}: ${response.statusText}`)
      }
      
      const configData = await response.json()
      return this.loadTourConfig(tourId, configData)
    } catch (error) {
      throw new Error(`Error loading tour config from file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Validates tour configuration without loading
   */
  static validateConfig(configData: unknown): { isValid: boolean; errors?: string[] } {
    try {
      const validated = validateTourDefinition(configData)
      this.validateTourSteps(validated)
      return { isValid: true }
    } catch (error) {
      return { 
        isValid: false, 
        errors: error instanceof Error ? [error.message] : ['Unknown validation error']
      }
    }
  }

  /**
   * Validate tour steps for common issues
   */
  private static validateTourSteps(tour: TourDefinition): void {
    const errors: string[] = []

    tour.steps.forEach((step, index) => {
      // Check for empty selectors
      if (typeof step.element === 'string' && !step.element.trim()) {
        errors.push(`Step ${index + 1} ("${step.title}") has empty element selector`)
      }

      // Check for missing title or description
      if (!step.title?.trim()) {
        errors.push(`Step ${index + 1} is missing a title`)
      }

      if (!step.description?.trim()) {
        errors.push(`Step ${index + 1} ("${step.title}") is missing a description`)
      }

      // Validate position values
      if (step.position && !['top', 'bottom', 'left', 'right', 'auto'].includes(step.position)) {
        errors.push(`Step ${index + 1} ("${step.title}") has invalid position: ${step.position}`)
      }
    })

    if (errors.length > 0) {
      throw new Error(`Tour validation failed:\n${errors.join('\n')}`)
    }
  }

  /**
   * Load multiple tour configurations in parallel
   */
  static async loadMultipleTourConfigs(tourIds: string[]): Promise<Map<string, TourDefinition>> {
    const loadPromises = tourIds.map(async (tourId) => {
      try {
        const tour = await this.loadTourConfigFromFile(tourId, `/tours/${tourId}.json`)
        return [tourId, tour] as [string, TourDefinition]
      } catch (error) {
        console.warn(`Failed to load tour ${tourId}:`, error)
        return null
      }
    })

    const results = await Promise.all(loadPromises)
    const successfulLoads = results.filter((result): result is [string, TourDefinition] => result !== null)
    
    return new Map(successfulLoads)
  }

  /**
   * Preload tour configurations for better performance
   */
  static async preloadTours(tourIds: string[]): Promise<void> {
    const loadPromises = tourIds.map(tourId => 
      this.loadTourConfigFromFile(tourId, `/tours/${tourId}.json`).catch(error => {
        console.warn(`Failed to preload tour ${tourId}:`, error)
      })
    )

    await Promise.allSettled(loadPromises)
  }
  
  /**
   * Gets all loaded tour configurations
   */
  static getAllTourConfigs(): Map<string, TourDefinition> {
    return new Map(this.tourConfigs)
  }
  
  /**
   * Clears all cached configurations
   */
  static clearCache(): void {
    this.tourConfigs.clear()
    this.loadingPromises.clear()
  }

  /**
   * Get loading statistics
   */
  static getStats(): { cached: number; loading: number } {
    return {
      cached: this.tourConfigs.size,
      loading: this.loadingPromises.size
    }
  }
}

/**
 * Default tour configuration templates
 */
export const DEFAULT_TOUR_CONFIGS = {
  welcome: {
    id: 'welcome-tour',
    name: 'Welcome Tour',
    description: 'Introduction to Postia SaaS platform',
    category: 'onboarding' as const,
    triggers: [
      {
        type: 'auto' as const,
        condition: 'first_login',
        delay: 1000,
        priority: 1,
      }
    ],
    steps: [
      {
        element: '[data-testid="main-navigation"]',
        title: 'Bienvenido a Postia',
        description: 'Esta es tu barra de navegación principal donde puedes acceder a todas las funcionalidades.',
        position: 'bottom' as const,
        showProgress: true,
      },
      {
        element: '[data-testid="client-selector"]',
        title: 'Selector de Cliente',
        description: 'Aquí puedes cambiar entre diferentes clientes para gestionar sus campañas.',
        position: 'bottom' as const,
        showProgress: true,
      },
      {
        element: '[data-testid="content-generation"]',
        title: 'Generación de Contenido',
        description: 'Crea contenido automáticamente usando IA para tus redes sociales.',
        position: 'right' as const,
        showProgress: true,
      }
    ],
    metadata: {
      version: '1.0.0',
      author: 'Postia Team',
      lastUpdated: new Date().toISOString(),
      estimatedDuration: 120, // 2 minutes
    }
  }
} as const

/**
 * Utility functions for tour configuration
 */
export const TourConfigUtils = {
  /**
   * Creates a basic tour step
   */
  createTourStep(
    element: string,
    title: string,
    description: string,
    options?: Partial<TourStep>
  ): TourStep {
    return {
      element,
      title,
      description,
      position: 'auto',
      showProgress: true,
      showButtons: true,
      ...options,
    }
  },

  /**
   * Creates a tour definition with default metadata
   */
  createTourDefinition(
    id: string,
    name: string,
    description: string,
    steps: TourStep[],
    options?: Partial<TourDefinition>
  ): TourDefinition {
    return {
      id,
      name,
      description,
      category: 'feature',
      triggers: [{ type: 'manual' }],
      steps,
      metadata: {
        version: '1.0.0',
        author: 'Postia Team',
        lastUpdated: new Date().toISOString(),
        estimatedDuration: steps.length * 30, // 30 seconds per step
      },
      ...options,
    }
  },

  /**
   * Merges tour configurations
   */
  mergeTourConfigs(base: Partial<TourDefinition>, override: Partial<TourDefinition>): Partial<TourDefinition> {
    return {
      ...base,
      ...override,
      steps: [...(base.steps || []), ...(override.steps || [])],
      triggers: [...(base.triggers || []), ...(override.triggers || [])],
      conditions: [...(base.conditions || []), ...(override.conditions || [])],
      metadata: {
        ...base.metadata,
        ...override.metadata,
      } as any,
    }
  },
}