import { TourDefinition, TourStep, ClientBranding, TourCondition, TourTrigger } from '@/types/tour'

export class TourValidationError extends Error {
  constructor(
    message: string,
    public tourId?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'TourValidationError'
  }
}

/**
 * Validates a complete tour definition
 */
export function validateTourDefinition(tour: any): TourDefinition {
  if (!tour) {
    throw new TourValidationError('Tour definition is required')
  }

  // Validate required fields
  if (!tour.id) {
    throw new TourValidationError('Tour ID is required')
  }

  if (!tour.name) {
    throw new TourValidationError('Tour name is required')
  }

  if (!tour.description) {
    throw new TourValidationError('Tour description is required')
  }

  // Validate ID format (letters, numbers, hyphens only)
  if (!/^[a-zA-Z0-9-]+$/.test(tour.id)) {
    throw new TourValidationError('Tour ID must contain only letters, numbers, and hyphens', tour.id)
  }

  // Validate category
  const validCategories = ['onboarding', 'feature', 'contextual', 'help']
  if (!validCategories.includes(tour.category)) {
    throw new TourValidationError('Invalid tour category', tour.id)
  }

  // Validate steps
  if (!Array.isArray(tour.steps) || tour.steps.length === 0) {
    throw new TourValidationError('At least one step is required', tour.id)
  }

  // Validate each step
  tour.steps.forEach((step: any, index: number) => {
    try {
      validateTourStep(step)
    } catch (error) {
      throw new TourValidationError(
        `Step ${index + 1}: ${error.message}`,
        tour.id
      )
    }
  })

  // Validate triggers
  if (!Array.isArray(tour.triggers) || tour.triggers.length === 0) {
    throw new TourValidationError('At least one trigger is required', tour.id)
  }

  tour.triggers.forEach((trigger: any, index: number) => {
    try {
      validateTourTrigger(trigger)
    } catch (error) {
      throw new TourValidationError(
        `Trigger ${index + 1}: ${error.message}`,
        tour.id
      )
    }
  })

  // Validate conditions if present
  if (tour.conditions) {
    tour.conditions.forEach((condition: any, index: number) => {
      try {
        validateTourCondition(condition)
      } catch (error) {
        throw new TourValidationError(
          `Condition ${index + 1}: ${error.message}`,
          tour.id
        )
      }
    })
  }

  // Validate metadata
  if (!tour.metadata) {
    throw new TourValidationError('Tour metadata is required', tour.id)
  }

  if (!tour.metadata.version) {
    throw new TourValidationError('Tour version is required', tour.id)
  }

  if (!tour.metadata.author) {
    throw new TourValidationError('Tour author is required', tour.id)
  }

  if (!tour.metadata.lastUpdated) {
    throw new TourValidationError('Tour lastUpdated is required', tour.id)
  }

  if (typeof tour.metadata.estimatedDuration !== 'number' || tour.metadata.estimatedDuration <= 0) {
    throw new TourValidationError('Estimated duration must be positive', tour.id)
  }

  return tour as TourDefinition
}

/**
 * Validates a tour step
 */
export function validateTourStep(step: any): TourStep {
  if (!step) {
    throw new TourValidationError('Step is required')
  }

  if (!step.element || typeof step.element !== 'string' || step.element.trim() === '') {
    throw new TourValidationError('Step element selector is required')
  }

  if (!step.title || typeof step.title !== 'string' || step.title.trim() === '') {
    throw new TourValidationError('Step title is required')
  }

  if (!step.description || typeof step.description !== 'string' || step.description.trim() === '') {
    throw new TourValidationError('Step description is required')
  }

  // Validate CSS selector format (basic validation)
  if (!/^[a-zA-Z0-9\-_#.\[\]="':,\s>+~*]+$/.test(step.element)) {
    throw new TourValidationError('Invalid CSS selector format')
  }

  // Validate position if present
  if (step.position) {
    const validPositions = ['top', 'bottom', 'left', 'right', 'auto']
    if (!validPositions.includes(step.position)) {
      throw new TourValidationError('Invalid step position')
    }
  }

  // Validate accessibility properties if present
  if (step.accessibility) {
    if (step.accessibility.ariaLabel !== undefined && 
        (typeof step.accessibility.ariaLabel !== 'string' || step.accessibility.ariaLabel.trim() === '')) {
      throw new TourValidationError('Accessibility aria-label cannot be empty')
    }

    if (step.accessibility.ariaDescription !== undefined && 
        (typeof step.accessibility.ariaDescription !== 'string' || step.accessibility.ariaDescription.trim() === '')) {
      throw new TourValidationError('Accessibility aria-description cannot be empty')
    }
  }

  return step as TourStep
}

/**
 * Validates client branding configuration
 */
export function validateClientBranding(branding: any): ClientBranding {
  if (!branding) {
    throw new TourValidationError('Client branding is required')
  }

  // Validate required colors
  const requiredColors = ['primaryColor', 'secondaryColor', 'accentColor']
  for (const colorField of requiredColors) {
    if (!branding[colorField]) {
      throw new TourValidationError(`${colorField} is required`)
    }

    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(branding[colorField])) {
      throw new TourValidationError(`Invalid hex color format for ${colorField}`)
    }
  }

  // Validate brand name
  if (!branding.brandName || typeof branding.brandName !== 'string' || branding.brandName.trim() === '') {
    throw new TourValidationError('Brand name is required')
  }

  // Validate logo URL if present
  if (branding.logoUrl) {
    try {
      new URL(branding.logoUrl)
    } catch {
      throw new TourValidationError('Invalid logo URL format')
    }
  }

  return branding as ClientBranding
}

/**
 * Validates a tour condition
 */
export function validateTourCondition(condition: any): TourCondition {
  if (!condition) {
    throw new TourValidationError('Condition is required')
  }

  // Validate condition type
  const validTypes = ['user_role', 'client_selected', 'page_path', 'feature_flag', 'user_property']
  if (!validTypes.includes(condition.type)) {
    throw new TourValidationError('Invalid condition type')
  }

  // Validate operator
  const validOperators = ['equals', 'contains', 'not_equals', 'exists']
  if (!validOperators.includes(condition.operator)) {
    throw new TourValidationError('Invalid condition operator')
  }

  // Validate value based on condition type
  if (condition.type === 'user_role' && (condition.value === null || condition.value === undefined)) {
    throw new TourValidationError('Value is required for user_role condition')
  }

  return condition as TourCondition
}

/**
 * Validates a tour trigger
 */
export function validateTourTrigger(trigger: any): TourTrigger {
  if (!trigger) {
    throw new TourValidationError('Trigger is required')
  }

  // Validate trigger type
  const validTypes = ['manual', 'auto', 'conditional', 'scheduled']
  if (!validTypes.includes(trigger.type)) {
    throw new TourValidationError('Invalid trigger type')
  }

  // Validate conditional trigger requirements
  if (trigger.type === 'conditional' && !trigger.condition) {
    throw new TourValidationError('Condition is required for conditional trigger')
  }

  // Validate scheduled trigger requirements
  if (trigger.type === 'scheduled') {
    if (trigger.delay !== undefined && (typeof trigger.delay !== 'number' || trigger.delay < 0)) {
      throw new TourValidationError('Delay must be non-negative for scheduled trigger')
    }
  }

  // Validate priority if present
  if (trigger.priority !== undefined) {
    if (typeof trigger.priority !== 'number' || trigger.priority < 1 || trigger.priority > 10) {
      throw new TourValidationError('Priority must be between 1 and 10')
    }
  }

  return trigger as TourTrigger
}

/**
 * Validates multiple tour definitions
 */
export function validateTourDefinitions(tours: any[]): TourDefinition[] {
  if (!Array.isArray(tours)) {
    throw new TourValidationError('Tours must be an array')
  }

  const validatedTours: TourDefinition[] = []
  const tourIds = new Set<string>()

  for (let i = 0; i < tours.length; i++) {
    const tour = tours[i]
    
    try {
      const validatedTour = validateTourDefinition(tour)
      
      // Check for duplicate IDs
      if (tourIds.has(validatedTour.id)) {
        throw new TourValidationError(`Duplicate tour ID: ${validatedTour.id}`)
      }
      
      tourIds.add(validatedTour.id)
      validatedTours.push(validatedTour)
    } catch (error) {
      throw new TourValidationError(
        `Tour ${i + 1}: ${error.message}`,
        tour?.id
      )
    }
  }

  return validatedTours
}

/**
 * Validates tour configuration loading
 */
export function validateTourConfigLoad(config: any): {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    validateTourDefinition(config)
    return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined }
  } catch (error) {
    if (error instanceof TourValidationError) {
      errors.push(error.message)
    } else {
      errors.push('Unknown validation error')
    }
    
    return { 
      isValid: false, 
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }
}