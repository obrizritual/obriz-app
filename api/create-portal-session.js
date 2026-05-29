// /api/create-portal-session
//
// Opens the Stripe Customer Portal so a member can:
//   • cancel their subscription (effective at period end)
//   • switch monthly ↔ yearly
//   • update payment method
//   • download invoices
//
// REQUIRED Stripe dashboard setup (one-time):
//   1. https://dashboard.stripe.com/settings/billing/portal
//   2. Toggle "Customer can cancel subscription" → at end of billing period
//   3. Toggle "Customer can switch plans" → enable
//   4. Under "Products", allow switching between the monthly + yearly Rhei. prices
//   5. Save
//
// Looks up the Stripe customer by email and creates a billing-portal session.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Find the Stripe customer for this email
    const customers = await stripe.customers.list({
      email: email.trim().toLowerCase(),
      limit: 1,
    });

    if (!customers.data.length) {
      return res.status(404).json({
        error: 'No subscription found for this email. Use the email from your receipt.',
      });
    }

    const customer = customers.data[0];

    // Where to send them back when they're done
    const origin =
      req.headers.origin ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://rheihouse.com');

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/?portal=return`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-portal-session]', err);
    return res.status(500).json({ error: 'Could not open billing portal. Try again.' });
  }
}
