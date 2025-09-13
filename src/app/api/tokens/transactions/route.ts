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
        { error: { message: 'Insufficient permissions to view token transactions' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'CONSUMPTION', 'PURCHASE', 'REFUND'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      agencyId: session.user.agencyId,
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      db.tokenTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
          metadata: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.tokenTransaction.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await db.tokenTransaction.aggregate({
      where,
      _sum: { amount: true },
    });

    const consumptionSummary = await db.tokenTransaction.aggregate({
      where: {
        ...where,
        type: 'CONSUMPTION',
      },
      _sum: { amount: true },
    });

    const purchaseSummary = await db.tokenTransaction.aggregate({
      where: {
        ...where,
        type: 'PURCHASE',
      },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          createdAt: tx.createdAt,
          metadata: tx.metadata,
          user: tx.user,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        summary: {
          totalAmount: summary._sum.amount || 0,
          totalConsumption: Math.abs(consumptionSummary._sum.amount || 0),
          totalPurchases: purchaseSummary._sum.amount || 0,
          netBalance: summary._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get token transactions error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch token transactions' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions - only owners can manually add tokens
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_AGENCY)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to add tokens' } },
        { status: 403 }
      );
    }

    const { amount, description, type = 'PURCHASE' } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: { message: 'Amount must be a positive number' } },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: { message: 'Description is required' } },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await db.$transaction(async (tx) => {
      // Create token transaction record
      const tokenTransaction = await tx.tokenTransaction.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          amount,
          type,
          description,
          metadata: {
            addedBy: session.user.id,
            addedAt: new Date().toISOString(),
          },
        },
      });

      // Update agency token balance
      await tx.agency.update({
        where: { id: session.user.agencyId },
        data: {
          tokenBalance: {
            increment: amount,
          },
        },
      });

      return tokenTransaction;
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'TOKEN_TRANSACTION',
        resourceId: transaction.id,
        details: {
          amount,
          type,
          description,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          createdAt: transaction.createdAt,
        },
        message: 'Tokens added successfully',
      },
    });
  } catch (error) {
    console.error('Add tokens error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to add tokens' 
        } 
      },
      { status: 500 }
    );
  }
}