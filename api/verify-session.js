const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const email = session.customer_details?.email;
      const plan = session.metadata?.plan || 'monthly';

      // Write to Supabase as backup (webhook is primary)
      if (supabase && email) {
        try {
          await supabase.from('subscriptions').upsert({
            email: email.toLowerCase(),
            plan,
            status: 'active',
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
        } catch (e) { console.error('Supabase upsert error:', e.message); }
      }

      return res.status(200).json({
        verified: true,
        plan,
        customer_email: email,
      });
    }

    return res.status(200).json({ verified: false });
  } catch (err) {
    console.error('Verify error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
