import Stripe from 'stripe';
import { db } from '@/lib/db';
import { SubscriptionPlan } from '@/generated/prisma';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    monthlyTokens: 1000,
    price: 29,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      '1,000 tokens per month',
      'Basic AI content generation',
      'Up to 3 clients',
      'Email support',
    ],
  },
  INTERMEDIATE: {
    name: 'Intermediate',
    monthlyTokens: 5000,
    price: 99,
    stripePriceId: process.env.STRIPE_INTERMEDIATE_PRICE_ID,
    features: [
      '5,000 tokens per month',
      'Advanced AI content generation',
      'Up to 10 clients',
      'Social media integration',
      'Priority support',
    ],
  },
  ADVANCED: {
    name: 'Advanced',
    monthlyTokens: 15000,
    price: 299,
    stripePriceId: process.env.STRIPE_ADVANCED_PRICE_ID,
    features: [
      '15,000 tokens per month',
      'Premium AI content generation',
      'Unlimited clients',
      'Advanced analytics',
      'WhatsApp bot integration',
      'Dedicated support',
    ],
  },
  CUSTOM: {
    name: 'Custom',
    monthlyTokens: 0,
    price: 0,
    stripePriceId: null,
    features: [
      'Custom token allocation',
      'Enterprise features',
      'Custom integrations',
      'Dedicated account manager',
    ],
  },
} as const;

// Token package configurations for one-time purchases
export const TOKEN_PACKAGES = {
  SMALL: {
    name: 'Small Package',
    tokens: 500,
    price: 19,
    stripePriceId: process.env.STRIPE_TOKENS_SMALL_PRICE_ID,
  },
  MEDIUM: {
    name: 'Medium Package',
    tokens: 1500,
    price: 49,
    stripePriceId: process.env.STRIPE_TOKENS_MEDIUM_PRICE_ID,
  },
  LARGE: {
    name: 'Large Package',
    tokens: 3500,
    price: 99,
    stripePriceId: process.env.STRIPE_TOKENS_LARGE_PRICE_ID,
  },
  ENTERPRISE: {
    name: 'Enterprise Package',
    tokens: 10000,
    price: 249,
    stripePriceId: process.env.STRIPE_TOKENS_ENTERPRISE_PRICE_ID,
  },
} as const;

export class StripeService {
  /**
   * Create or retrieve Stripe customer for agency
   */
  static async getOrCreateCustomer(agencyId: string, email: string, name: string) {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { stripeCustomerId: true },
    });

    if (agency?.stripeCustomerId) {
      return await stripe.customers.retrieve(agency.stripeCustomerId);
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        agencyId,
      },
    });

    // Update agency with customer ID
    await db.agency.update({
      where: { id: agencyId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  /**
   * Create subscription checkout session
   */
  static async createSubscriptionCheckout(
    agencyId: string,
    plan: keyof typeof SUBSCRIPTION_PLANS,
    successUrl: string,
    cancelUrl: string
  ) {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    
    if (!planConfig.stripePriceId) {
      throw new Error(`Price ID not configured for plan: ${plan}`);
    }

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: {
        users: {
          where: { role: 'OWNER' },
          take: 1,
        },
      },
    });

    if (!agency || !agency.users[0]) {
      throw new Error('Agency or owner not found');
    }

    const customer = await this.getOrCreateCustomer(
      agencyId,
      agency.users[0].email,
      agency.name
    );

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        agencyId,
        plan,
      },
    });

    return session;
  }

  /**
   * Create token purchase checkout session
   */
  static async createTokenCheckout(
    agencyId: string,
    packageKey: keyof typeof TOKEN_PACKAGES,
    successUrl: string,
    cancelUrl: string
  ) {
    const packageConfig = TOKEN_PACKAGES[packageKey];
    
    if (!packageConfig.stripePriceId) {
      throw new Error(`Price ID not configured for package: ${packageKey}`);
    }

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: {
        users: {
          where: { role: 'OWNER' },
          take: 1,
        },
      },
    });

    if (!agency || !agency.users[0]) {
      throw new Error('Agency or owner not found');
    }

    const customer = await this.getOrCreateCustomer(
      agencyId,
      agency.users[0].email,
      agency.name
    );

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: packageConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        agencyId,
        packageKey,
        tokens: packageConfig.tokens.toString(),
      },
    });

    return session;
  }

  /**
   * Handle successful subscription payment
   */
  static async handleSubscriptionSuccess(
    agencyId: string,
    plan: SubscriptionPlan,
    stripeSubscriptionId: string
  ) {
    const planConfig = SUBSCRIPTION_PLANS[plan];

    await db.$transaction(async (tx) => {
      // Update agency subscription
      await tx.agency.update({
        where: { id: agencyId },
        data: {
          subscriptionPlan: plan,
          tokenBalance: {
            increment: planConfig.monthlyTokens,
          },
        },
      });

      // Create token transaction record
      await tx.tokenTransaction.create({
        data: {
          agencyId,
          amount: planConfig.monthlyTokens,
          type: 'SUBSCRIPTION_RENEWAL',
          description: `Monthly tokens for ${planConfig.name} subscription`,
          reference: stripeSubscriptionId,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          agencyId,
          action: 'SUBSCRIPTION_ACTIVATED',
          resource: 'SUBSCRIPTION',
          resourceId: stripeSubscriptionId,
          details: {
            plan,
            tokensAdded: planConfig.monthlyTokens,
          },
        },
      });
    });
  }

  /**
   * Handle successful token purchase
   */
  static async handleTokenPurchaseSuccess(
    agencyId: string,
    tokens: number,
    stripePaymentIntentId: string,
    packageKey: string
  ) {
    const packageConfig = TOKEN_PACKAGES[packageKey as keyof typeof TOKEN_PACKAGES];

    await db.$transaction(async (tx) => {
      // Add tokens to agency balance
      await tx.agency.update({
        where: { id: agencyId },
        data: {
          tokenBalance: {
            increment: tokens,
          },
        },
      });

      // Create token transaction record
      await tx.tokenTransaction.create({
        data: {
          agencyId,
          amount: tokens,
          type: 'PURCHASE',
          description: `Token purchase - ${packageConfig.name}`,
          reference: stripePaymentIntentId,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          agencyId,
          action: 'TOKENS_PURCHASED',
          resource: 'TOKEN_TRANSACTION',
          resourceId: stripePaymentIntentId,
          details: {
            packageKey,
            tokensAdded: tokens,
            amount: packageConfig.price,
          },
        },
      });
    });
  }

  /**
   * Get subscription details
   */
  static async getSubscriptionDetails(agencyId: string) {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: {
        stripeCustomerId: true,
        subscriptionPlan: true,
      },
    });

    if (!agency?.stripeCustomerId) {
      return null;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: agency.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subscription = subscriptions.data[0];
    const planConfig = SUBSCRIPTION_PLANS[agency.subscriptionPlan];

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan: agency.subscriptionPlan,
      planConfig,
    };
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(agencyId: string) {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { stripeCustomerId: true },
    });

    if (!agency?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: agency.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error('No active subscription found');
    }

    const subscription = subscriptions.data[0];
    
    // Cancel at period end to allow current period usage
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId,
        action: 'SUBSCRIPTION_CANCELLED',
        resource: 'SUBSCRIPTION',
        resourceId: subscription.id,
        details: {
          cancelledAt: new Date(),
          willEndAt: new Date(subscription.current_period_end * 1000),
        },
      },
    });

    return {
      cancelled: true,
      endsAt: new Date(subscription.current_period_end * 1000),
    };
  }

  /**
   * Get usage analytics for billing period
   */
  static async getUsageAnalytics(agencyId: string) {
    const subscription = await this.getSubscriptionDetails(agencyId);
    
    if (!subscription) {
      return null;
    }

    const startDate = subscription.currentPeriodStart;
    const endDate = subscription.currentPeriodEnd;

    // Get token usage for current billing period
    const usage = await db.tokenTransaction.aggregate({
      where: {
        agencyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        amount: { lt: 0 }, // Only consumption (negative amounts)
      },
      _sum: { amount: true },
    });

    const consumed = Math.abs(usage._sum.amount || 0);
    const allocated = subscription.planConfig.monthlyTokens;
    const remaining = Math.max(0, allocated - consumed);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      tokens: {
        allocated,
        consumed,
        remaining,
        usagePercentage: allocated > 0 ? (consumed / allocated) * 100 : 0,
      },
    };
  }
}