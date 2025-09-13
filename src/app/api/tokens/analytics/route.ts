import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { TokenConsumptionService } from '@/lib/services/token-consumption';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.VIEW_TOKEN_USAGE)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to view token analytics' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '30'; // days

    // Calculate date range
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - parseInt(period));
    }

    // Get comprehensive analytics
    const [usageAnalytics, balanceSummary] = await Promise.all([
      TokenConsumptionService.getUsageAnalytics(session.user.agencyId, start, end),
      TokenConsumptionService.getBalanceSummary(session.user.agencyId),
    ]);

    // Get token costs for reference
    const tokenCosts = TokenConsumptionService.getTokenCosts();

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: start?.toISOString(),
          end: end?.toISOString(),
        },
        usage: usageAnalytics,
        balance: balanceSummary,
        tokenCosts,
        insights: {
          averageDailyUsage: usageAnalytics.totalConsumed / parseInt(period),
          projectedMonthlyUsage: (usageAnalytics.totalConsumed / parseInt(period)) * 30,
          mostUsedOperation: usageAnalytics.byOperationType[0]?.operation || 'None',
          efficiencyScore: calculateEfficiencyScore(usageAnalytics.byOperationType),
        },
      },
    });
  } catch (error) {
    console.error('Get token analytics error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch token analytics' 
        } 
      },
      { status: 500 }
    );
  }
}

function calculateEfficiencyScore(operationTypes: Array<{ operation: string; tokens: number; count: number }>): number {
  if (operationTypes.length === 0) return 100;

  // Calculate average tokens per operation
  const totalOperations = operationTypes.reduce((sum, op) => sum + op.count, 0);
  const totalTokens = operationTypes.reduce((sum, op) => sum + op.tokens, 0);
  
  if (totalOperations === 0) return 100;

  const averageTokensPerOperation = totalTokens / totalOperations;
  
  // Efficiency score based on how close to optimal token usage
  // Lower token usage per operation = higher efficiency
  const optimalTokensPerOperation = 150; // Baseline
  const efficiency = Math.max(0, Math.min(100, 
    100 - ((averageTokensPerOperation - optimalTokensPerOperation) / optimalTokensPerOperation) * 100
  ));

  return Math.round(efficiency);
}