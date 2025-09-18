/**
 * Tour condition evaluation system for dynamic tour loading
 */

import type { TourCondition } from '@/types/tour'

interface EvaluationContext {
  userRole?: string
  userPermissions?: string[]
  currentClient?: {
    id: string
    brandName: string
    [key: string]: any
  }
  currentPath?: string
  featureFlags?: Record<string, boolean>
  userProperties?: Record<string, any>
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  sessionData?: Record<string, any>
}

/**
 * Evaluates tour conditions to determine if a tour should be shown
 */
export class TourConditionEvaluator {
  private context: EvaluationContext

  constructor(context: EvaluationContext = {}) {
    this.context = context
  }

  /**
   * Update the evaluation context
   */
  updateContext(newContext: Partial<EvaluationContext>): void {
    this.context = { ...this.context, ...newContext }
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(condition: TourCondition): boolean {
    try {
      switch (condition.type) {
        case 'user_role':
          return this.evaluateUserRole(condition)
        
        case 'client_selected':
          return this.evaluateClientSelected(condition)
        
        case 'page_path':
          return this.evaluatePagePath(condition)
        
        case 'feature_flag':
          return this.evaluateFeatureFlag(condition)
        
        case 'user_property':
          return this.evaluateUserProperty(condition)
        
        default:
          console.warn(`Unknown condition type: ${condition.type}`)
          return false
      }
    } catch (error) {
      console.error(`Error evaluating condition:`, condition, error)
      return false
    }
  }

  /**
   * Evaluate multiple conditions with AND logic
   */
  evaluateConditions(conditions: TourCondition[]): boolean {
    if (!conditions || conditions.length === 0) {
      return true // No conditions means always show
    }

    return conditions.every(condition => this.evaluateCondition(condition))
  }

  /**
   * Evaluate multiple conditions with OR logic
   */
  evaluateConditionsOr(conditions: TourCondition[]): boolean {
    if (!conditions || conditions.length === 0) {
      return true
    }

    return conditions.some(condition => this.evaluateCondition(condition))
  }

  /**
   * Evaluate user role condition
   */
  private evaluateUserRole(condition: TourCondition): boolean {
    const userRole = this.context.userRole

    switch (condition.operator) {
      case 'equals':
        return userRole === condition.value
      
      case 'not_equals':
        return userRole !== condition.value
      
      case 'contains':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(userRole)
        }
        return false
      
      case 'exists':
        return userRole !== undefined && userRole !== null
      
      default:
        return false
    }
  }

  /**
   * Evaluate client selected condition
   */
  private evaluateClientSelected(condition: TourCondition): boolean {
    const currentClient = this.context.currentClient

    switch (condition.operator) {
      case 'exists':
        return currentClient !== undefined && currentClient !== null
      
      case 'equals':
        return currentClient?.id === condition.value
      
      case 'not_equals':
        return currentClient?.id !== condition.value
      
      case 'contains':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(currentClient?.id)
        }
        return currentClient?.brandName?.toLowerCase().includes(condition.value?.toLowerCase())
      
      default:
        return false
    }
  }

  /**
   * Evaluate page path condition
   */
  private evaluatePagePath(condition: TourCondition): boolean {
    const currentPath = this.context.currentPath || (typeof window !== 'undefined' ? window.location.pathname : '')

    switch (condition.operator) {
      case 'equals':
        return currentPath === condition.value
      
      case 'not_equals':
        return currentPath !== condition.value
      
      case 'contains':
        return currentPath.includes(condition.value)
      
      case 'exists':
        return currentPath !== undefined && currentPath !== ''
      
      default:
        return false
    }
  }

  /**
   * Evaluate feature flag condition
   */
  private evaluateFeatureFlag(condition: TourCondition): boolean {
    const featureFlags = this.context.featureFlags || {}

    switch (condition.operator) {
      case 'equals':
        return featureFlags[condition.value] === true
      
      case 'not_equals':
        return featureFlags[condition.value] !== true
      
      case 'exists':
        return condition.value in featureFlags
      
      default:
        return false
    }
  }

  /**
   * Evaluate user property condition
   */
  private evaluateUserProperty(condition: TourCondition): boolean {
    const userProperties = this.context.userProperties || {}
    const sessionData = this.context.sessionData || {}
    
    // Check both user properties and session data
    const allProperties = { ...userProperties, ...sessionData }

    switch (condition.operator) {
      case 'equals':
        return allProperties[condition.value.property] === condition.value.value
      
      case 'not_equals':
        return allProperties[condition.value.property] !== condition.value.value
      
      case 'contains':
        const propertyValue = allProperties[condition.value.property]
        if (typeof propertyValue === 'string') {
          return propertyValue.includes(condition.value.value)
        }
        if (Array.isArray(propertyValue)) {
          return propertyValue.includes(condition.value.value)
        }
        return false
      
      case 'exists':
        return condition.value.property in allProperties
      
      default:
        return false
    }
  }

  /**
   * Get current context for debugging
   */
  getContext(): EvaluationContext {
    return { ...this.context }
  }

  /**
   * Create a condition for common scenarios
   */
  static createCondition(
    type: TourCondition['type'],
    operator: TourCondition['operator'],
    value: any
  ): TourCondition {
    return { type, operator, value }
  }

  /**
   * Create common conditions
   */
  static commonConditions = {
    /**
     * User must have a specific role
     */
    requireRole: (role: string): TourCondition => ({
      type: 'user_role',
      operator: 'equals',
      value: role
    }),

    /**
     * User must have one of multiple roles
     */
    requireAnyRole: (roles: string[]): TourCondition => ({
      type: 'user_role',
      operator: 'contains',
      value: roles
    }),

    /**
     * Client must be selected
     */
    requireClientSelected: (): TourCondition => ({
      type: 'client_selected',
      operator: 'exists',
      value: true
    }),

    /**
     * Must be on specific page
     */
    requirePage: (path: string): TourCondition => ({
      type: 'page_path',
      operator: 'equals',
      value: path
    }),

    /**
     * Must be on page containing path
     */
    requirePageContains: (pathSegment: string): TourCondition => ({
      type: 'page_path',
      operator: 'contains',
      value: pathSegment
    }),

    /**
     * Feature flag must be enabled
     */
    requireFeatureFlag: (flagName: string): TourCondition => ({
      type: 'feature_flag',
      operator: 'equals',
      value: flagName
    }),

    /**
     * User property must equal value
     */
    requireUserProperty: (property: string, value: any): TourCondition => ({
      type: 'user_property',
      operator: 'equals',
      value: { property, value }
    }),

    /**
     * First time user (no tours completed)
     */
    firstTimeUser: (): TourCondition => ({
      type: 'user_property',
      operator: 'not_equals',
      value: { property: 'hasCompletedTour', value: true }
    }),

    /**
     * Mobile device
     */
    mobileDevice: (): TourCondition => ({
      type: 'user_property',
      operator: 'equals',
      value: { property: 'deviceType', value: 'mobile' }
    }),

    /**
     * Desktop device
     */
    desktopDevice: (): TourCondition => ({
      type: 'user_property',
      operator: 'equals',
      value: { property: 'deviceType', value: 'desktop' }
    })
  }
}

/**
 * Global evaluator instance
 */
let globalEvaluator: TourConditionEvaluator | null = null

/**
 * Get or create the global condition evaluator
 */
export function getConditionEvaluator(context?: EvaluationContext): TourConditionEvaluator {
  if (!globalEvaluator) {
    globalEvaluator = new TourConditionEvaluator(context)
  } else if (context) {
    globalEvaluator.updateContext(context)
  }
  return globalEvaluator
}

/**
 * Update the global evaluator context
 */
export function updateEvaluationContext(context: Partial<EvaluationContext>): void {
  if (!globalEvaluator) {
    globalEvaluator = new TourConditionEvaluator(context)
  } else {
    globalEvaluator.updateContext(context)
  }
}

/**
 * Evaluate conditions using the global evaluator
 */
export function evaluateConditions(conditions: TourCondition[], context?: EvaluationContext): boolean {
  const evaluator = getConditionEvaluator(context)
  return evaluator.evaluateConditions(conditions)
}

/**
 * Helper to get device type
 */
export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Helper to get current page path
 */
export function getCurrentPath(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname
}

/**
 * Create evaluation context from current environment
 */
export function createEvaluationContext(additionalContext: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    currentPath: getCurrentPath(),
    deviceType: getDeviceType(),
    ...additionalContext
  }
}