import { db } from '@/lib/db';

// Centralized token pricing configuration
export const TOKEN_COSTS = {
  // AI Content Generation Steps
  IDEA_GENERATION: 50,
  COPY_DESIGN: 75,
  COPY_PUBLICATION: 75,
  BASE_IMAGE: 150,
  FINAL_DESIGN: 200,
  
  // Additional Operations
  CONTENT_REGENERATION: 25,
  BULK_GENERATION: 300,
  PREMIUM_TEMPLATES: 100,
  
  // Social Media Operations
  SOCIAL_PUBLISHING: 10,
  SOCIAL_ANALYTICS: 5,
  
  // Default for unknown operations
  DEFAULT_OPERATION: 50,
} as const;

// Type for token cost keys
export type TokenCostKey = keyof typeof TOKEN_COSTS;

// Workflow step mapping to standardize naming
export const WORKFLOW_STEP_MAPPING = {
  // Standard names -> Cost keys
  'IDEA': 'IDEA_GENERATION',
  'IDEA_GENERATION': 'IDEA_GENERATION',
  'COPY_DESIGN': 'COPY_DESIGN',
  'COPY_PUBLICATION': 'COPY_PUBLICATION',
  'BASE_IMAGE': 'BASE_IMAGE',
  'FINAL_DESIGN': 'FINAL_DESIGN',
  'REGENERATION': 'CONTENT_REGENERATION',
  'BULK': 'BULK_GENERATION',
} as const;

export class TokenPricingService {
  /**
   * Get cost for a specific operation
   */
  static getCost(operation: string): number {
    // Normalize operation name
    const normalizedOp = operation.toUpperCase() as keyof typeof WORKFLOW_STEP_MAPPING;
    const costKey = WORKFLOW_STEP_MAPPING[normalizedOp] as TokenCostKey;
    
    if (costKey && TOKEN_COSTS[costKey]) {
      return TOKEN_COSTS[costKey];
    }
    
    // Fallback to default cost
    return TOKEN_COSTS.DEFAULT_OPERATION;
  }

  /**
   * Get all token costs
   */
  static getAllCosts() {
    return TOKEN_COSTS;
  }

  /**
   * Calculate total cost for multiple operations
   */
  static calculateTotalCost(operations: string[]): number {
    return operations.reduce((total, operation) => {
      return total + this.getCost(operation);
    }, 0);
  }

  /**
   * Calculate cost for a complete content generation job
   */
  static calculateJobCost(steps: string[]): number {
    return this.calculateTotalCost(steps);
  }

  /**
   * Estimate campaign cost
   */
  static estimateCampaignCost(
    postsCount: number,
    includeImages: boolean = true,
    regenerationBuffer: number = 0.2
  ): number {
    const baseSteps = ['IDEA_GENERATION', 'COPY_DESIGN', 'COPY_PUBLICATION'];
    const imageSteps = includeImages ? ['BASE_IMAGE', 'FINAL_DESIGN'] : [];
    const allSteps = [...baseSteps, ...imageSteps];
    
    const costPerPost = this.calculateTotalCost(allSteps);
    const baseCost = costPerPost * postsCount;
    
    // Add buffer for regenerations
    const bufferCost = baseCost * regenerationBuffer;
    
    return Math.ceil(baseCost + bufferCost);
  }

  /**
   * Check if operation name is valid
   */
  static isValidOperation(operation: string): boolean {
    const normalizedOp = operation.toUpperCase() as keyof typeof WORKFLOW_STEP_MAPPING;
    return normalizedOp in WORKFLOW_STEP_MAPPING;
  }

  /**
   * Get standardized operation name
   */
  static getStandardizedName(operation: string): string {
    const normalizedOp = operation.toUpperCase() as keyof typeof WORKFLOW_STEP_MAPPING;
    return WORKFLOW_STEP_MAPPING[normalizedOp] || operation;
  }

  /**
   * Future: Load costs from database (for dynamic pricing)
   */
  static async loadCostsFromDatabase(): Promise<typeof TOKEN_COSTS> {
    // TODO: Implement database-driven pricing
    // For now, return static costs
    return TOKEN_COSTS;
  }
}

// Export for backward compatibility
export const getTokenCosts = () => TOKEN_COSTS;
export const calculateJobTokens = (steps: string[]) => TokenPricingService.calculateJobCost(steps);