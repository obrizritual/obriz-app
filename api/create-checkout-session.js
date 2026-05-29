// /api/create-checkout-session
//
// Creates a Stripe Checkout session for either the monthly (€9.99 + 7-day trial)
// or yearly (€79, no trial) Rhei. plan.
//
// Base currency is EUR. Enable Stripe Adaptive Pricing in dashboard to
// auto-convert at checkout for non-EUR cards (US/UK/CA, etc).
//
// REQUIRED env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_MONTHLY     (price_xxx for €9.99/mo recurring, EUR)
//   STRIPE_PRICE_YEARLY      (price_xxx for €79/year recurring, EUR)
//
// Body: { plan: 'monthly' | 'yearly', email?: string }

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const TRIAL_DAYS_MONTHLY = 7;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, email } = req.body || {};

    if (plan !== 'monthly' && plan !== 'yearly') {
      return res.status(400).json({ error: 'Plan must be "monthly" or "yearly".' });
    }

    const priceId =
      plan === 'monthly'
        ? process.env.STRIPE_PRICE_MONTHLY
        : process.env.STRIPE_PRICE_YEARLY;

    if (!priceId) {
      console.error('Missing Stripe price env var for plan:', plan);
      return res.status(500).json({ error: 'Pricing is not configured.' });
    }

    const origin =
      req.headers.origin ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://rheihouse.com');

    // Build the session — monthly includes a 7-day free trial; yearly does not
    const subscriptionData = {
      metadata: { plan, source: 'rhei-web' },
    };
    if (plan === 'monthly') {
      subscriptionData.trial_period_days = TRIAL_DAYS_MONTHLY;
      // Optional: how to behave if no payment method survives trial → cancel
      subscriptionData.trial_settings = {
        end_behavior: { missing_payment_method: 'cancel' },
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      customer_email: email && typeof email === 'string' ? email.trim().toLowerCase() : undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: subscriptionData,
      // Always collect a payment method — for monthly trials this means seamless
      // auto-conversion when the 7 days end; user can cancel anytime via portal.
      payment_method_collection: 'always',
      metadata: { plan, source: 'rhei-web' },
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    return res.status(500).json({ error: 'Could not start checkout. Try again.' });
  }
}
