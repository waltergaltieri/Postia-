import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { StripeService, SUBSCRIPTION_PLANS } from '@/lib/services/stripe';

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
        { error: { message: 'Insufficient permissions to view subscription' } },
        { status: 403 }
      );
    }

    // Get current subscription details
    const subscriptionDetails = await StripeService.getSubscriptionDetails(session.user.agencyId);
    
    // Get usage analytics
    const usageAnalytics = await StripeService.getUsageAnalytics(session.user.agencyId);

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscriptionDetails,
        usage: usageAnalytics,
        availablePlans: SUBSCRIPTION_PLANS,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch subscription details' 
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

    // Check permissions - only owners can manage subscriptions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_AGENCY)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to manage subscription' } },
        { status: 403 }
      );
    }

    const { plan, action } = await request.json();

    if (action === 'cancel') {
      const result = await StripeService.cancelSubscription(session.user.agencyId);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Subscription cancelled successfully',
      });
    }

    // Validate plan
    if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json(
        { error: { message: 'Invalid subscription plan' } },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing?success=true&plan=${plan}`;
    const cancelUrl = `${baseUrl}/dashboard/billing?cancelled=true`;

    const checkoutSession = await StripeService.createSubscriptionCheckout(
      session.user.agencyId,
      plan,
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
    console.error('Subscription management error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to manage subscription' 
        } 
      },
      { status: 500 }
    );
  }
}