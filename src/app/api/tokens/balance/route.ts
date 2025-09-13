import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';

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
        { error: { message: 'Insufficient permissions to view token balance' } },
        { status: 403 }
      );
    }

    // Get agency with current token balance
    const agency = await db.agency.findUnique({
      where: { id: session.user.agencyId },
      select: {
        id: true,
        name: true,
        tokenBalance: true,
        subscriptionPlan: true,
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: { message: 'Agency not found' } },
        { status: 404 }
      );
    }

    // Get recent token transactions
    const recentTransactions = await db.tokenTransaction.findMany({
      where: { agencyId: session.user.agencyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Calculate usage statistics for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await db.tokenTransaction.aggregate({
      where: {
        agencyId: session.user.agencyId,
        type: 'CONSUMPTION',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const monthlySpent = Math.abs(monthlyUsage._sum.amount || 0);

    // Get usage by service type
    const usageByService = await db.tokenTransaction.groupBy({
      by: ['description'],
      where: {
        agencyId: session.user.agencyId,
        type: 'CONSUMPTION',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'asc' } },
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          current: agency.tokenBalance,
          currency: 'tokens',
          subscriptionPlan: agency.subscriptionPlan,
        },
        usage: {
          monthly: monthlySpent,
          period: {
            start: startOfMonth.toISOString(),
            end: new Date().toISOString(),
          },
          byService: usageByService.map(item => ({
            service: item.description,
            tokens: Math.abs(item._sum.amount || 0),
          })),
        },
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          createdAt: tx.createdAt,
          metadata: tx.metadata,
        })),
      },
    });
  } catch (error) {
    console.error('Get token balance error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch token balance' 
        } 
      },
      { status: 500 }
    );
  }
}