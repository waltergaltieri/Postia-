import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, StripeService } from '@/lib/services/stripe';
import { SubscriptionPlan } from '@/generated/prisma';
import { db } from '@/lib/db';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Processing Stripe webhook:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { agencyId, plan, packageKey, tokens } = session.metadata || {};

  if (!agencyId) {
    console.error('No agencyId in session metadata');
    return;
  }

  try {
    if (session.mode === 'subscription' && plan) {
      // Handle subscription activation
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await StripeService.handleSubscriptionSuccess(
        agencyId,
        plan as SubscriptionPlan,
        subscription.id
      );
      console.log(`Subscription activated for agency ${agencyId}, plan: ${plan}`);
    } else if (session.mode === 'payment' && packageKey && tokens) {
      // Handle token purchase
      await StripeService.handleTokenPurchaseSuccess(
        agencyId,
        parseInt(tokens),
        session.payment_intent as string,
        packageKey
      );
      console.log(`Tokens purchased for agency ${agencyId}, package: ${packageKey}, tokens: ${tokens}`);
    }
  } catch (error) {
    console.error('Error processing checkout session:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    return; // Not a subscription invoice
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (typeof customer === 'string' || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const agencyId = customer.metadata?.agencyId;
    if (!agencyId) {
      console.error('No agencyId in customer metadata');
      return;
    }

    // This handles recurring subscription renewals
    // The subscription plan should already be set, we just need to add monthly tokens
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { subscriptionPlan: true },
    });

    if (agency) {
      await StripeService.handleSubscriptionSuccess(
        agencyId,
        agency.subscriptionPlan,
        subscription.id
      );
      console.log(`Subscription renewed for agency ${agencyId}`);
    }
  } catch (error) {
    console.error('Error processing invoice payment:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (typeof customer === 'string' || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const agencyId = customer.metadata?.agencyId;
    if (!agencyId) {
      console.error('No agencyId in customer metadata');
      return;
    }

    // Downgrade to basic plan when subscription is cancelled
    await db.agency.update({
      where: { id: agencyId },
      data: { subscriptionPlan: 'BASIC' },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId,
        action: 'SUBSCRIPTION_ENDED',
        resource: 'SUBSCRIPTION',
        resourceId: subscription.id,
        details: {
          endedAt: new Date(),
          downgradedTo: 'BASIC',
        },
      },
    });

    console.log(`Subscription ended for agency ${agencyId}, downgraded to BASIC`);
  } catch (error) {
    console.error('Error processing subscription deletion:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (typeof customer === 'string' || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const agencyId = customer.metadata?.agencyId;
    if (!agencyId) {
      console.error('No agencyId in customer metadata');
      return;
    }

    // Handle subscription status changes (e.g., cancelled, past_due, etc.)
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      // Could implement logic to restrict access or send notifications
      console.log(`Subscription ${subscription.id} is ${subscription.status} for agency ${agencyId}`);
    }

    // Create audit log for subscription changes
    await db.auditLog.create({
      data: {
        agencyId,
        action: 'SUBSCRIPTION_UPDATED',
        resource: 'SUBSCRIPTION',
        resourceId: subscription.id,
        details: {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      },
    });
  } catch (error) {
    console.error('Error processing subscription update:', error);
    throw error;
  }
}