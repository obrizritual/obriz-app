const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers
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
    const { plan, email } = req.body; // 'monthly' or 'yearly', optional email

    const priceData = plan === 'yearly'
      ? { currency: 'usd', unit_amount: 4900, recurring: { interval: 'year' }, product_data: { name: 'RHEI Premium — Yearly', description: 'Full access to all ritual guides, exclusive resets, and future content' } }
      : { currency: 'usd', unit_amount: 999, recurring: { interval: 'month' }, product_data: { name: 'RHEI Premium — Monthly', description: 'Full access to all ritual guides, exclusive resets, and future content' } };

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://rhei-app.vercel.app';

    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price_data: priceData, quantity: 1 }],
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      metadata: { plan },
    };

    // Pre-fill email if the user is signed in
    if (email) {
      sessionConfig.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
