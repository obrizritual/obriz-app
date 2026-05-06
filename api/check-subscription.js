const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status, updated_at')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return res.status(200).json({ isPremium: false });
    }

    return res.status(200).json({
      isPremium: true,
      plan: data.plan,
      since: data.updated_at,
    });
  } catch (err) {
    console.error('Check subscription error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
