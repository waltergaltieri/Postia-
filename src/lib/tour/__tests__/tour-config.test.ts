/**
 * Tests for tour configuration system
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  validateTourDefinition, 
  validateClientBranding,
  TourConfigLoader,
  DEFAULT_TOUR_CONFIGS 
} from '../tour-config'
import { getTourRegistry } from '../tour-registry'

describe('Tour Configuration System', () => {
  beforeEach(() => {
    TourConfigLoader.clearCache()
    getTourRegistry().clearCache()
  })

  describe('validateTourDefinition', () => {
    it('should validate a correct tour definition', () => {
      const validTour = {
        id: 'test-tour',
        name: 'Test Tour',
        description: 'A test tour',
        category: 'feature',
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

      expect(() => validateTourDefinition(validTour)).not.toThrow()
      const result = validateTourDefinition(validTour)
      expect(result.id).toBe('test-tour')
      expect(result.steps).toHaveLength(1)
    })

    it('should reject tour definition with missing required fields', () => {
      const invalidTour = {
        id: 'test-tour',
        // Missing name, description, etc.
      }

      expect(() => validateTourDefinition(invalidTour)).toThrow()
    })

    it('should reject tour definition with empty steps array', () => {
      const invalidTour = {
        id: 'test-tour',
        name: 'Test Tour',
        description: 'A test tour',
        category: 'feature',
        triggers: [{ type: 'manual' }],
        steps: [], // Empty steps array
        metadata: {
          version: '1.0.0',
          author: 'Test Author',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          estimatedDuration: 60
        }
      }

      expect(() => validateTourDefinition(invalidTour)).toThrow('At least one step is required')
    })
  })

  describe('validateClientBranding', () => {
    it('should validate correct client branding', () => {
      const validBranding = {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        accentColor: '#0000FF',
        brandName: 'Test Brand'
      }

      expect(() => validateClientBranding(validBranding)).not.toThrow()
      const result = validateClientBranding(validBranding)
      expect(result.brandName).toBe('Test Brand')
    })

    it('should reject invalid hex colors', () => {
      const invalidBranding = {
        primaryColor: 'red', // Invalid hex color
        secondaryColor: '#00FF00',
        accentColor: '#0000FF',
        brandName: 'Test Brand'
      }

      expect(() => validateClientBranding(invalidBranding)).toThrow('Invalid hex color')
    })
  })

  describe('TourConfigLoader', () => {
    it('should load and cache tour configuration', async () => {
      const tourConfig = DEFAULT_TOUR_CONFIGS.welcome
      
      const loaded = await TourConfigLoader.loadTourConfig('welcome-tour', tourConfig)
      expect(loaded.id).toBe('welcome-tour')
      
      // Should be cached now
      const cached = TourConfigLoader.getTourConfig('welcome-tour')
      expect(cached).toBeDefined()
      expect(cached?.id).toBe('welcome-tour')
    })

    it('should validate config without loading', () => {
      const validConfig = DEFAULT_TOUR_CONFIGS.welcome
      const result = TourConfigLoader.validateConfig(validConfig)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should return validation errors for invalid config', () => {
      const invalidConfig = { id: 'test' } // Missing required fields
      const result = TourConfigLoader.validateConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })
})