/**
 * Tests for Deployment Validator
 */

import { DeploymentValidator, DeploymentValidationConfig } from '../deployment-validator'
import { TourDefinition } from '@/types/tour'

// Mock dependencies
jest.mock('../tour-health-check')
jest.mock('../tour-performance-monitor')

const mockTour: TourDefinition = {
  id: 'test-tour',
  name: 'Test Tour',
  description: 'A test tour',
  category: 'onboarding',
  triggers: [{ type: 'manual' }],
  steps: [
    {
      element: '#test-element',
      title: 'Test Step',
      description: 'This is a test step',
      position: 'bottom',
      accessibility: {
        ariaLabel: 'Test step'
      }
    }
  ],
  metadata: {
    version: '1.0.0',
    author: 'Test Author',
    lastUpdated: '2024-01-01',
    estimatedDuration: 120000
  }
}

describe('DeploymentValidator', () => {
  let validator: DeploymentValidator
  let mockConfig: DeploymentValidationConfig

  beforeEach(() => {
    mockConfig = {
      environment: 'staging',
      strictMode: false,
      performanceChecks: true,
      accessibilityChecks: true,
      crossBrowserChecks: false,
      loadTesting: false,
      maxCriticalIssues: 0,
      maxWarnings: 10,
      requiredHealthScore: 70
    }

    validator = new DeploymentValidator(mockConfig)

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()

    // Mock performance.now
    jest.spyOn(performance, 'now').mockReturnValue(Date.now())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('validateForDeployment', () => {
    test('should validate valid tours for deployment', async () => {
      const tours = [mockTour]

      const result = await validator.validateForDeployment(tours)

      expect(result.canDeploy).toBe(true)
      expect(result.environment).toBe('staging')
      expect(result.summary.totalTours).toBe(1)
      expect(result.blockers).toHaveLength(0)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    test('should detect duplicate tour IDs', async () => {
      const tours = [mockTour, { ...mockTour }] // Same ID

      const result = await validator.validateForDeployment(tours)

      expect(result.canDeploy).toBe(false)
      expect(result.blockers.some(blocker => 
        blocker.message.includes('Duplicate tour ID')
      )).toBe(true)
    })

    test('should detect security issues', async () => {
      const unsafeTour: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: '#test',
            title: 'Unsafe <script>alert("xss")</script>',
            description: 'Test',
            position: 'bottom'
          }
        ]
      }

      const result = await validator.validateForDeployment([unsafeTour])

      expect(result.canDeploy).toBe(false)
      expect(result.blockers.some(blocker => 
        blocker.type === 'security'
      )).toBe(true)
    })

    test('should detect dangerous selectors', async () => {
      const unsafeTour: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: 'javascript:alert("xss")',
            title: 'Test',
            description: 'Test',
            position: 'bottom'
          }
        ]
      }

      const result = await validator.validateForDeployment([unsafeTour])

      expect(result.canDeploy).toBe(false)
      expect(result.blockers.some(blocker => 
        blocker.type === 'security' && blocker.message.includes('unsafe selector')
      )).toBe(true)
    })

    test('should detect sensitive information', async () => {
      const sensitiveContentTour: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: '#test',
            title: 'Enter your password',
            description: 'Use API key abc123 to authenticate',
            position: 'bottom'
          }
        ]
      }

      const result = await validator.validateForDeployment([sensitiveContentTour])

      expect(result.warnings.some(warning => 
        warning.message.includes('sensitive information')
      )).toBe(true)
    })

    test('should validate accessibility in strict mode', async () => {
      const strictValidator = new DeploymentValidator({
        ...mockConfig,
        strictMode: true,
        accessibilityChecks: true
      })

      const inaccessibleTour: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: '#test',
            title: 'Test',
            description: 'Click the red button', // Color-only instruction
            position: 'bottom'
            // Missing accessibility attributes
          }
        ]
      }

      const result = await strictValidator.validateForDeployment([inaccessibleTour])

      expect(result.warnings.some(warning => 
        warning.type === 'accessibility'
      )).toBe(true)
    })

    test('should handle production environment validations', async () => {
      const prodValidator = new DeploymentValidator({
        ...mockConfig,
        environment: 'production'
      })

      const testTour: TourDefinition = {
        ...mockTour,
        id: 'test-debug-tour', // Should trigger warning in production
        metadata: {
          ...mockTour.metadata,
          version: '0.0.0' // Should trigger warning
        }
      }

      const result = await prodValidator.validateForDeployment([testTour])

      expect(result.warnings.some(warning => 
        warning.message.includes('testing/debugging')
      )).toBe(true)
      expect(result.warnings.some(warning => 
        warning.message.includes('version number')
      )).toBe(true)
    })

    test('should perform performance validation', async () => {
      const performanceValidator = new DeploymentValidator({
        ...mockConfig,
        performanceChecks: true
      })

      // Mock slow performance
      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1500) // 1.5 second load time

      const result = await performanceValidator.validateForDeployment([mockTour])

      expect(result.performanceReport).toBeDefined()
      expect(result.performanceReport?.averageLoadTime).toBeGreaterThan(0)
    })

    test('should handle validation errors gracefully', async () => {
      // Create invalid tour that will cause validation to throw
      const invalidTour = {
        ...mockTour,
        steps: null // Invalid steps
      } as any

      const result = await validator.validateForDeployment([invalidTour])

      expect(result.canDeploy).toBe(false)
      expect(result.blockers.some(blocker => 
        blocker.type === 'critical'
      )).toBe(true)
    })

    test('should generate recommendations', async () => {
      const tours = Array(5).fill(null).map((_, i) => ({
        ...mockTour,
        id: `tour-${i}`,
        steps: [
          {
            element: '#test',
            title: 'Test',
            description: 'Test with potential issue',
            position: 'bottom' as const
          }
        ]
      }))

      const result = await validator.validateForDeployment(tours)

      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })

  describe('generateDeploymentReport', () => {
    test('should generate readable deployment report', async () => {
      const result = await validator.validateForDeployment([mockTour])
      const report = validator.generateDeploymentReport(result)

      expect(report).toContain('# Tour Deployment Validation Report')
      expect(report).toContain('**Environment:** staging')
      expect(report).toContain('## Summary')
      expect(report).toContain('Total Tours: 1')
    })

    test('should include blockers in report', async () => {
      const unsafeTour: TourDefinition = {
        ...mockTour,
        steps: [
          {
            element: 'javascript:alert("test")',
            title: 'Test',
            description: 'Test',
            position: 'bottom'
          }
        ]
      }

      const result = await validator.validateForDeployment([unsafeTour])
      const report = validator.generateDeploymentReport(result)

      expect(report).toContain('## Blockers')
      expect(report).toContain('SECURITY')
    })

    test('should include recommendations in report', async () => {
      // Create scenario that generates recommendations
      const tours = Array(3).fill(null).map((_, i) => ({
        ...mockTour,
        id: `tour-${i}`
      }))

      const result = await validator.validateForDeployment(tours)
      result.recommendations.push('Test recommendation')
      
      const report = validator.generateDeploymentReport(result)

      expect(report).toContain('## Recommendations')
      expect(report).toContain('Test recommendation')
    })
  })

  describe('configuration handling', () => {
    test('should use default configuration', () => {
      const defaultValidator = new DeploymentValidator()
      expect(defaultValidator).toBeDefined()
    })

    test('should merge custom configuration', () => {
      const customValidator = new DeploymentValidator({
        environment: 'production',
        strictMode: true,
        maxWarnings: 5
      })
      expect(customValidator).toBeDefined()
    })
  })
})