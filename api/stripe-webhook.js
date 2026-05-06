const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Stripe sends raw body — Vercel needs raw body for signature verification
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Vercel provides raw body as buffer
    const rawBody = req.body;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Fallback: trust the event (for development/testing without webhook secret)
      event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status === 'paid') {
          const email = session.customer_details?.email;
          const plan = session.metadata?.plan || 'monthly';
          const customerId = session.customer;
          const subscriptionId = session.subscription;

          if (email) {
            // Upsert subscription record
            await supabase.from('subscriptions').upsert({
              email: email.toLowerCase(),
              plan,
              status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const status = subscription.status; // active, past_due, canceled, etc.
        const subscriptionId = subscription.id;

        // Update status by subscription ID
        await supabase.from('subscriptions')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscriptionId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        await supabase.from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscriptionId);
        break;
      }

      default:
        // Unhandled event type — that's fine
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Tell Vercel not to parse the body (needed for Stripe signature verification)
module.exports.config = {
  api: { bodyParser: false }
};
