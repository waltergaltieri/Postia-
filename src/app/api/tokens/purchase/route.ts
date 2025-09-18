import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { StripeService, TOKEN_PACKAGES } from '@/lib/services/stripe';

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
        { error: { message: 'Insufficient permissions to view token packages' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        packages: TOKEN_PACKAGES,
      },
    });
  } catch (error) {
    console.error('Get token packages error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch token packages' 
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

    // Check permissions - owners and managers can purchase tokens
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_CAMPAIGNS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to purchase tokens' } },
        { status: 403 }
      );
    }

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: { message: 'Invalid JSON in request body' } },
        { status: 400 }
      );
    }

    const { packageKey } = body;

    // Validate package key
    if (!packageKey || typeof packageKey !== 'string') {
      return NextResponse.json(
        { error: { message: 'Package key is required and must be a string' } },
        { status: 400 }
      );
    }

    if (!TOKEN_PACKAGES[packageKey as keyof typeof TOKEN_PACKAGES]) {
      return NextResponse.json(
        { error: { message: 'Invalid token package' } },
        { status: 400 }
      );
    }

    // Validate user has agency
    if (!session.user.agencyId) {
      return NextResponse.json(
        { error: { message: 'User must be associated with an agency' } },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing?success=true&type=tokens&package=${packageKey}`;
    const cancelUrl = `${baseUrl}/dashboard/billing?cancelled=true`;

    const checkoutSession = await StripeService.createTokenCheckout(
      session.user.agencyId,
      packageKey,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
    });
  } catch (error) {
    console.error('Token purchase error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to create token purchase' 
        } 
      },
      { status: 500 }
    );
  }
}