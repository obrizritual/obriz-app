// Temporary proxy endpoint to call ElevenLabs from Vercel's servers.
// The sandbox cannot reach api.elevenlabs.io directly (egress proxy blocks it),
// so during the audio regeneration we route through this endpoint. The
// endpoint is removed in the same series of commits once regeneration is done.
//
// Security: the caller provides the ElevenLabs key in the request body, so
// we don't store it in Vercel env. A short-lived admin token also gates the
// endpoint so random callers can't burn quota.

const ADMIN_TOKEN = 'rhei_regen_2026_05_19'; // removed when endpoint is deleted

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
  const { eleven_key, voice_id, text, model_id = 'eleven_multilingual_v2', voice_settings } = body || {};

  if (!eleven_key || !voice_id || !text) {
    return res.status(400).json({ error: 'missing eleven_key, voice_id, or text' });
  }

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': eleven_key,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: voice_settings || {
          stability: 0.55,
          similarity_boost: 0.80,
          style: 0.20,
          use_speaker_boost: true,
        },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText.slice(0, 500) });
    }

    const cl = parseInt(r.headers.get('content-length') || '0', 10);
    const buf = Buffer.from(await r.arrayBuffer());

    if (cl > 0 && buf.length !== cl) {
      return res.status(502).json({
        error: 'partial response from ElevenLabs',
        expected: cl,
        got: buf.length,
      });
    }

    return res.status(200).json({
      audio_b64: buf.toString('base64'),
      size: buf.length,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e).slice(0, 500) });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
};
