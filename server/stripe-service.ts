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

// ============= STRIPE CONNECT (Phase 12) =============

/**
 * Create Stripe Connect Account for Partner
 */
export async function createConnectAccount(
  email: string,
  businessType: 'individual' | 'company' = 'individual'
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    business_type: businessType,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  
  return account.id;
}

/**
 * Create Stripe Connect Onboarding Link
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  
  return accountLink.url;
}

/**
 * Check Stripe Connect Account Status
 */
export async function getAccountStatus(accountId: string): Promise<{
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const account = await stripe.accounts.retrieve(accountId);
  
  return {
    onboardingComplete: account.details_submitted || false,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
  };
}

/**
 * Create Package Checkout Session with Split Payment
 */
export async function createPackageCheckoutSession(
  packageBookingId: string,
  amount: number, // in euros
  currency: string,
  partnerAccountId: string,
  platformFeePercentage: number, // 0.15 = 15%
  successUrl: string,
  cancelUrl: string,
  metadata: any
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const amountCents = Math.round(amount * 100);
  const platformFeeCents = Math.round(amountCents * platformFeePercentage);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency,
          product_data: {
            name: 'Package Booking',
            description: `Package booking #${packageBookingId}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: partnerAccountId,
      },
      metadata,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      packageBookingId,
      ...metadata,
    },
  });
  
  return session.url!;
}

/**
 * Process Payout to Partner
 */
export async function createPayout(
  accountId: string,
  amount: number, // in euros
  currency: string = 'eur'
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const amountCents = Math.round(amount * 100);
  
  const payout = await stripe.payouts.create(
    {
      amount: amountCents,
      currency: currency,
    },
    {
      stripeAccount: accountId,
    }
  );
  
  return payout.id;
}

/**
 * Handle Stripe Connect Webhooks
 */
export async function handleConnectWebhook(
  event: Stripe.Event,
  storage: any
): Promise<void> {
  const { partnerAccounts, payouts } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  
  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      
      // Find partner account by Stripe ID
      const [partnerAccount] = await storage.db
        .select()
        .from(partnerAccounts)
        .where(eq(partnerAccounts.stripeAccountId, account.id));
      
      if (partnerAccount) {
        const status = account.charges_enabled ? 'active' : 'pending';
        const onboardingComplete = account.details_submitted || false;
        
        await storage.updatePartnerAccount(partnerAccount.id, {
          status,
          onboardingComplete,
        });
      }
      break;
    }
    
    case 'payout.paid':
    case 'payout.failed': {
      const payout = event.data.object as Stripe.Payout;
      const status = event.type === 'payout.paid' ? 'completed' : 'failed';
      
      // Find our payout record by Stripe ID
      const [partnerPayout] = await storage.db
        .select()
        .from(payouts)
        .where(eq(payouts.stripePayoutId, payout.id));
      
      if (partnerPayout) {
        await storage.updatePayoutStatus(partnerPayout.id, status);
      }
      break;
    }
    
    default:
      console.log(`[Stripe Connect] Unhandled event type: ${event.type}`);
  }
}
