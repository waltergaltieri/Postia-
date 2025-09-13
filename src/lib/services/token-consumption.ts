import { db } from '@/lib/db';

export interface TokenConsumption {
  agencyId: string;
  userId?: string;
  amount: number;
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export class TokenConsumptionService {
  /**
   * Check if agency has sufficient tokens
   */
  static async checkTokenBalance(agencyId: string, requiredTokens: number): Promise<boolean> {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { tokenBalance: true },
    });

    return (agency?.tokenBalance || 0) >= requiredTokens;
  }

  /**
   * Consume tokens for an operation
   */
  static async consumeTokens(consumption: TokenConsumption): Promise<void> {
    const { agencyId, userId, amount, description, reference, metadata } = consumption;

    // Check if agency has sufficient tokens
    const hasBalance = await this.checkTokenBalance(agencyId, amount);
    if (!hasBalance) {
      throw new Error('Insufficient token balance');
    }

    await db.$transaction(async (tx) => {
      // Deduct tokens from agency balance
      await tx.agency.update({
        where: { id: agencyId },
        data: {
          tokenBalance: {
            decrement: amount,
          },
        },
      });

      // Create consumption record
      await tx.tokenTransaction.create({
        data: {
          agencyId,
          userId,
          amount: -amount, // Negative for consumption
          type: 'CONSUMPTION',
          description,
          reference,
          metadata,
        },
      });
    });
  }

  /**
   * Get token consumption for specific operation types
   */
  static getTokenCosts() {
    return {
      // AI Content Generation
      IDEA_GENERATION: 50,
      COPY_DESIGN: 75,
      COPY_PUBLICATION: 75,
      BASE_IMAGE: 150,
      FINAL_DESIGN: 200,
      
      // Additional operations
      CONTENT_REGENERATION: 25,
      BULK_GENERATION: 300,
      PREMIUM_TEMPLATES: 100,
      
      // Social Media
      SOCIAL_PUBLISHING: 10,
      SOCIAL_ANALYTICS: 5,
    };
  }

  /**
   * Calculate tokens needed for a complete content generation job
   */
  static calculateJobTokens(steps: string[]): number {
    const costs = this.getTokenCosts();
    let total = 0;

    for (const step of steps) {
      switch (step) {
        case 'IDEA':
          total += costs.IDEA_GENERATION;
          break;
        case 'COPY_DESIGN':
          total += costs.COPY_DESIGN;
          break;
        case 'COPY_PUBLICATION':
          total += costs.COPY_PUBLICATION;
          break;
        case 'BASE_IMAGE':
          total += costs.BASE_IMAGE;
          break;
        case 'FINAL_DESIGN':
          total += costs.FINAL_DESIGN;
          break;
        default:
          total += 50; // Default cost for unknown steps
      }
    }

    return total;
  }

  /**
   * Get token usage analytics for an agency
   */
  static async getUsageAnalytics(agencyId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      agencyId,
      type: 'CONSUMPTION',
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get total consumption
    const totalConsumption = await db.tokenTransaction.aggregate({
      where,
      _sum: { amount: true },
    });

    // Get consumption by operation type
    const consumptionByType = await db.tokenTransaction.groupBy({
      by: ['description'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'asc' } },
    });

    // Get daily consumption trend
    const dailyConsumption = await db.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(ABS(amount)) as tokens
      FROM token_transactions 
      WHERE agency_id = ${agencyId} 
        AND type = 'CONSUMPTION'
        ${startDate ? `AND created_at >= ${startDate}` : ''}
        ${endDate ? `AND created_at <= ${endDate}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    return {
      totalConsumed: Math.abs(totalConsumption._sum.amount || 0),
      byOperationType: consumptionByType.map(item => ({
        operation: item.description,
        tokens: Math.abs(item._sum.amount || 0),
        count: item._count,
      })),
      dailyTrend: dailyConsumption,
    };
  }

  /**
   * Get current token balance and usage summary
   */
  static async getBalanceSummary(agencyId: string) {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: {
        tokenBalance: true,
        subscriptionPlan: true,
      },
    });

    if (!agency) {
      throw new Error('Agency not found');
    }

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await db.tokenTransaction.aggregate({
      where: {
        agencyId,
        type: 'CONSUMPTION',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    // Get recent transactions
    const recentTransactions = await db.tokenTransaction.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    return {
      currentBalance: agency.tokenBalance,
      subscriptionPlan: agency.subscriptionPlan,
      monthlyUsage: Math.abs(monthlyUsage._sum.amount || 0),
      recentTransactions,
    };
  }

  /**
   * Estimate tokens needed for a campaign
   */
  static estimateCampaignTokens(
    postsCount: number,
    includeImages: boolean = true,
    regenerationBuffer: number = 0.2
  ): number {
    const steps = ['IDEA', 'COPY_DESIGN', 'COPY_PUBLICATION'];
    if (includeImages) {
      steps.push('BASE_IMAGE', 'FINAL_DESIGN');
    }

    const tokensPerPost = this.calculateJobTokens(steps);
    const baseTokens = postsCount * tokensPerPost;
    
    // Add buffer for regenerations and revisions
    const bufferTokens = baseTokens * regenerationBuffer;
    
    return Math.ceil(baseTokens + bufferTokens);
  }

  /**
   * Check if agency can afford a campaign
   */
  static async canAffordCampaign(
    agencyId: string,
    postsCount: number,
    includeImages: boolean = true
  ): Promise<{ canAfford: boolean; required: number; available: number }> {
    const required = this.estimateCampaignTokens(postsCount, includeImages);
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { tokenBalance: true },
    });

    const available = agency?.tokenBalance || 0;

    return {
      canAfford: available >= required,
      required,
      available,
    };
  }
}