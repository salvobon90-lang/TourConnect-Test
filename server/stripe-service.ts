import Stripe from 'stripe';

// Try production key first, then testing key (same pattern as routes.ts)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY;
const isValidSecretKey = stripeSecretKey && stripeSecretKey.startsWith('sk_');
const stripe = isValidSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-09-30.clover" })
  : null;

// Log which key is being used (helpful for debugging)
if (stripe && stripeSecretKey) {
  console.log('[Stripe Service] Initialized with key starting with:', stripeSecretKey.substring(0, 7));
} else {
  console.warn('[Stripe Service] No valid secret key found. Stripe checkout will be unavailable.');
}

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  standard: {
    name: 'Standard',
    priceMonthly: 9.99,
    currency: 'eur',
    visibilityDays: 7,
    features: ['Basic visibility', '7-day promotion'],
    stripePriceId: process.env.STRIPE_PRICE_STANDARD || 'price_standard',
  },
  premium: {
    name: 'Premium',
    priceMonthly: 29.99,
    currency: 'eur',
    visibilityDays: 30,
    features: ['30-day promotion', '"Featured" badge', 'Priority listing'],
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
  },
  pro: {
    name: 'Pro',
    priceMonthly: 59.99,
    currency: 'eur',
    visibilityDays: 90,
    features: ['90-day promotion', '"Partner Verified" badge', 'Analytics dashboard', 'Top visibility'],
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Create Stripe checkout session for subscription
export async function createSubscriptionCheckout(
  userId: string,
  tier: SubscriptionTier,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const tierConfig = SUBSCRIPTION_TIERS[tier];
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: userEmail,
    client_reference_id: userId,
    line_items: [
      {
        price: tierConfig.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      tier,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId,
        tier,
      },
    },
  });

  return session.url!;
}

// Cancel Stripe subscription
export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  await stripe.subscriptions.cancel(stripeSubscriptionId);
}

// Handle Stripe webhook events
export async function handleStripeWebhook(
  event: Stripe.Event,
  storage: any
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier as SubscriptionTier;
      
      if (!userId || !tier) {
        console.error('[Stripe] Missing metadata in checkout session:', session.id);
        return;
      }

      // Get subscription details
      const subscription = await stripe!.subscriptions.retrieve(session.subscription as string);
      
      // Calculate end date
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + tierConfig.visibilityDays);
      
      // Create partnership
      await storage.createPartnership({
        userId,
        tier,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        endDate,
      });
      
      // Award reward points (using correct method name: awardPoints)
      await storage.awardPoints(userId, 'subscription_complete', {
        description: `Subscribed to ${tierConfig.name} tier`,
        targetId: subscription.id,
      });
      
      console.log(`[Stripe] Partnership created for user ${userId} with tier ${tier}`);
      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      if (!userId) {
        console.error('[Stripe] Missing userId in subscription metadata:', subscription.id);
        return;
      }

      const partnership = await storage.getPartnershipByUserId(userId);
      if (!partnership) {
        console.error('[Stripe] Partnership not found for user:', userId);
        return;
      }

      // Update status based on subscription status
      const newStatus = subscription.status === 'active' ? 'active' : 
                       subscription.status === 'canceled' ? 'cancelled' : 'expired';
      
      await storage.updatePartnershipStatus(partnership.id, newStatus);
      
      console.log(`[Stripe] Partnership ${partnership.id} updated to ${newStatus}`);
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}
