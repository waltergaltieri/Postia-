import { describe, it, expect, beforeEach } from 'vitest'
import { 
  validateTourDefinition,
  validateTourStep,
  validateClientBranding,
  validateTourCondition,
  validateTourTrigger,
  TourValidationError
} from '../tour-validation'
import { TourDefinition, TourStep, ClientBranding, TourCondition, TourTrigger } from '@/types/tour'

describe('Tour Validation', () => {
  describe('validateTourDefinition', () => {
    const validTourDefinition: TourDefinition = {
      id: 'test-tour',
      name: 'Test Tour',
      description: 'A test tour for validation',
      category: 'onboarding',
      triggers: [{ type: 'manual' }],
      steps: [
        {
          element: '#test-element',
          title: 'Test Step',
          description: 'A test step'
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'Test Author',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        estimatedDuration: 60
      }
    }

    it('should validate a correct tour definition', () => {
      expect(() => validateTourDefinition(validTourDefinition)).not.toThrow()
      const result = validateTourDefinition(validTourDefinition)
      expect(result).toEqual(validTourDefinition)
    })

    it('should throw error for missing required fields', () => {
      const invalidTour = { ...validTourDefinition }
      delete (invalidTour as any).id

      expect(() => validateTourDefinition(invalidTour as any)).toThrow(TourValidationError)
      expect(() => validateTourDefinition(invalidTour as any)).toThrow('Tour ID is required')
    })

    it('should throw error for invalid tour ID format', () => {
      const invalidTour = {
        ...validTourDefinition,
        id: 'Invalid Tour ID!'
      }

      expect(() => validateTourDefinition(invalidTour)).toThrow(TourValidationError)
      expect(() => validateTourDefinition(invalidTour)).toThrow('Tour ID must contain only letters, numbers, and hyphens')
    })

    it('should throw error for empty steps array', () => {
      const invalidTour = {
        ...validTourDefinition,
        steps: []
      }

      expect(() => validateTourDefinition(invalidTour)).toThrow(TourValidationError)
      expect(() => validateTourDefinition(invalidTour)).toThrow('At least one step is required')
    })

    it('should throw error for invalid category', () => {
      const invalidTour = {
        ...validTourDefinition,
        category: 'invalid-category' as any
      }

      expect(() => validateTourDefinition(invalidTour)).toThrow(TourValidationError)
      expect(() => validateTourDefinition(invalidTour)).toThrow('Invalid tour category')
    })

    it('should validate nested steps', () => {
      const tourWithInvalidStep = {
        ...validTourDefinition,
        steps: [
          {
            element: '', // Invalid empty element
            title: 'Test Step',
            description: 'A test step'
          }
        ]
      }

      expect(() => validateTourDefinition(tourWithInvalidStep)).toThrow(TourValidationError)
      expect(() => validateTourDefinition(tourWithInvalidStep)).toThrow('Step element selector is required')
    })

    it('should validate metadata fields', () => {
      const tourWithInvalidMetadata = {
        ...validTourDefinition,
        metadata: {
          ...validTourDefinition.metadata,
          estimatedDuration: -10 // Invalid negative duration
        }
      }

      expect(() => validateTourDefinition(tourWithInvalidMetadata)).toThrow(TourValidationError)
      expect(() => validateTourDefinition(tourWithInvalidMetadata)).toThrow('Estimated duration must be positive')
    })
  })

  describe('validateTourStep', () => {
    const validStep: TourStep = {
      element: '#test-element',
      title: 'Test Step',
      description: 'A test step description'
    }

    it('should validate a correct tour step', () => {
      expect(() => validateTourStep(validStep)).not.toThrow()
      const result = validateTourStep(validStep)
      expect(result).toEqual(validStep)
    })

    it('should throw error for missing element selector', () => {
      const invalidStep = { ...validStep, element: '' }

      expect(() => validateTourStep(invalidStep)).toThrow(TourValidationError)
      expect(() => validateTourStep(invalidStep)).toThrow('Step element selector is required')
    })

    it('should throw error for missing title', () => {
      const invalidStep = { ...validStep, title: '' }

      expect(() => validateTourStep(invalidStep)).toThrow(TourValidationError)
      expect(() => validateTourStep(invalidStep)).toThrow('Step title is required')
    })

    it('should throw error for missing description', () => {
      const invalidStep = { ...validStep, description: '' }

      expect(() => validateTourStep(invalidStep)).toThrow(TourValidationError)
      expect(() => validateTourStep(invalidStep)).toThrow('Step description is required')
    })

    it('should validate CSS selector format', () => {
      const invalidStep = { ...validStep, element: 'invalid-selector!' }

      expect(() => validateTourStep(invalidStep)).toThrow(TourValidationError)
      expect(() => validateTourStep(invalidStep)).toThrow('Invalid CSS selector format')
    })

    it('should validate position values', () => {
      const invalidStep = { ...validStep, position: 'invalid-position' as any }

      expect(() => validateTourStep(invalidStep)).toThrow(TourValidationError)
      expect(() => validateTourStep(invalidStep)).toThrow('Invalid step position')
    })

    it('should validate accessibility properties', () => {
      const stepWithInvalidA11y = {
        ...validStep,
        accessibility: {
          ariaLabel: '', // Empty aria label
          ariaDescription: 'Valid description'
        }
      }

      expect(() => validateTourStep(stepWithInvalidA11y)).toThrow(TourValidationError)
      expect(() => validateTourStep(stepWithInvalidA11y)).toThrow('Accessibility aria-label cannot be empty')
    })
  })

  describe('validateClientBranding', () => {
    const validBranding: ClientBranding = {
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      accentColor: '#0000FF',
      brandName: 'Test Brand'
    }

    it('should validate correct client branding', () => {
      expect(() => validateClientBranding(validBranding)).not.toThrow()
      const result = validateClientBranding(validBranding)
      expect(result).toEqual(validBranding)
    })

    it('should throw error for invalid hex colors', () => {
      const invalidBranding = { ...validBranding, primaryColor: 'red' }

      expect(() => validateClientBranding(invalidBranding)).toThrow(TourValidationError)
      expect(() => validateClientBranding(invalidBranding)).toThrow('Invalid hex color format for primaryColor')
    })

    it('should throw error for missing brand name', () => {
      const invalidBranding = { ...validBranding, brandName: '' }

      expect(() => validateClientBranding(invalidBranding)).toThrow(TourValidationError)
      expect(() => validateClientBranding(invalidBranding)).toThrow('Brand name is required')
    })

    it('should validate optional logo URL', () => {
      const brandingWithInvalidLogo = {
        ...validBranding,
        logoUrl: 'not-a-valid-url'
      }

      expect(() => validateClientBranding(brandingWithInvalidLogo)).toThrow(TourValidationError)
      expect(() => validateClientBranding(brandingWithInvalidLogo)).toThrow('Invalid logo URL format')
    })

    it('should accept valid logo URL', () => {
      const brandingWithValidLogo = {
        ...validBranding,
        logoUrl: 'https://example.com/logo.png'
      }

      expect(() => validateClientBranding(brandingWithValidLogo)).not.toThrow()
    })
  })

  describe('validateTourCondition', () => {
    const validCondition: TourCondition = {
      type: 'user_role',
      operator: 'equals',
      value: 'admin'
    }

    it('should validate correct tour condition', () => {
      expect(() => validateTourCondition(validCondition)).not.toThrow()
      const result = validateTourCondition(validCondition)
      expect(result).toEqual(validCondition)
    })

    it('should throw error for invalid condition type', () => {
      const invalidCondition = { ...validCondition, type: 'invalid_type' as any }

      expect(() => validateTourCondition(invalidCondition)).toThrow(TourValidationError)
      expect(() => validateTourCondition(invalidCondition)).toThrow('Invalid condition type')
    })

    it('should throw error for invalid operator', () => {
      const invalidCondition = { ...validCondition, operator: 'invalid_operator' as any }

      expect(() => validateTourCondition(invalidCondition)).toThrow(TourValidationError)
      expect(() => validateTourCondition(invalidCondition)).toThrow('Invalid condition operator')
    })

    it('should validate value based on condition type', () => {
      const conditionWithInvalidValue = {
        type: 'user_role' as const,
        operator: 'equals' as const,
        value: null // Invalid null value for user_role
      }

      expect(() => validateTourCondition(conditionWithInvalidValue)).toThrow(TourValidationError)
      expect(() => validateTourCondition(conditionWithInvalidValue)).toThrow('Value is required for user_role condition')
    })
  })

  describe('validateTourTrigger', () => {
    const validTrigger: TourTrigger = {
      type: 'manual'
    }

    it('should validate correct tour trigger', () => {
      expect(() => validateTourTrigger(validTrigger)).not.toThrow()
      const result = validateTourTrigger(validTrigger)
      expect(result).toEqual(validTrigger)
    })

    it('should throw error for invalid trigger type', () => {
      const invalidTrigger = { type: 'invalid_type' as any }

      expect(() => validateTourTrigger(invalidTrigger)).toThrow(TourValidationError)
      expect(() => validateTourTrigger(invalidTrigger)).toThrow('Invalid trigger type')
    })

    it('should validate conditional trigger requirements', () => {
      const conditionalTrigger = {
        type: 'conditional' as const,
        // Missing required condition field
      }

      expect(() => validateTourTrigger(conditionalTrigger)).toThrow(TourValidationError)
      expect(() => validateTourTrigger(conditionalTrigger)).toThrow('Condition is required for conditional trigger')
    })

    it('should validate scheduled trigger requirements', () => {
      const scheduledTrigger = {
        type: 'scheduled' as const,
        delay: -100 // Invalid negative delay
      }

      expect(() => validateTourTrigger(scheduledTrigger)).toThrow(TourValidationError)
      expect(() => validateTourTrigger(scheduledTrigger)).toThrow('Delay must be non-negative for scheduled trigger')
    })

    it('should validate priority values', () => {
      const triggerWithInvalidPriority = {
        type: 'auto' as const,
        priority: 15 // Invalid priority (should be 1-10)
      }

      expect(() => validateTourTrigger(triggerWithInvalidPriority)).toThrow(TourValidationError)
      expect(() => validateTourTrigger(triggerWithInvalidPriority)).toThrow('Priority must be between 1 and 10')
    })
  })

  describe('TourValidationError', () => {
    it('should create error with correct properties', () => {
      const error = new TourValidationError('Test error message', 'test-tour', 'validation_failed')

      expect(error.message).toBe('Test error message')
      expect(error.tourId).toBe('test-tour')
      expect(error.code).toBe('validation_failed')
      expect(error.name).toBe('TourValidationError')
    })

    it('should be instance of Error', () => {
      const error = new TourValidationError('Test error')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(TourValidationError)
    })
  })

  describe('Complex Validation Scenarios', () => {
    it('should validate tour with multiple conditions', () => {
      const complexTour: TourDefinition = {
        id: 'complex-tour',
        name: 'Complex Tour',
        description: 'A complex tour with multiple conditions',
        category: 'feature',
        triggers: [
          { type: 'auto', priority: 5 },
          { type: 'conditional', condition: 'user.role === "admin"' }
        ],
        conditions: [
          { type: 'user_role', operator: 'equals', value: 'admin' },
          { type: 'page_path', operator: 'contains', value: '/dashboard' }
        ],
        steps: [
          {
            element: '#complex-element',
            title: 'Complex Step',
            description: 'A complex step with accessibility',
            accessibility: {
              ariaLabel: 'Complex step label',
              ariaDescription: 'Complex step description'
            }
          }
        ],
        metadata: {
          version: '2.1.0',
          author: 'Complex Author',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          estimatedDuration: 180
        }
      }

      expect(() => validateTourDefinition(complexTour)).not.toThrow()
    })

    it('should validate tour with client branding integration', () => {
      const tourWithBranding: TourDefinition = {
        id: 'branded-tour',
        name: 'Branded Tour',
        description: 'A tour with client branding',
        category: 'onboarding',
        triggers: [{ type: 'manual' }],
        steps: [
          {
            element: '#branded-element',
            title: 'Branded Step',
            description: 'A step with branding'
          }
        ],
        metadata: {
          version: '1.0.0',
          author: 'Brand Team',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          estimatedDuration: 90
        }
      }

      const branding: ClientBranding = {
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        accentColor: '#60A5FA',
        brandName: 'Acme Corp',
        logoUrl: 'https://acme.com/logo.svg'
      }

      expect(() => validateTourDefinition(tourWithBranding)).not.toThrow()
      expect(() => validateClientBranding(branding)).not.toThrow()
    })
  })
})