// /api/notify-light
//
// Called when a user taps "Notify me" on The Light in the Cabinet.
// Does two things:
//   1. Sends Rhea an internal heads-up with the user's email address.
//   2. Sends the user a beautiful confirmation that they're on the list.
//
// POST body: { email: string }
//
// REQUIRED env vars (already set for send-welcome):
//   RESEND_API_KEY   — Resend sending key, scoped to rheihouse.com

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM    = 'Rhei. <hello@rheihouse.com>';
const RHEA    = 'hello@rheihouse.com';

function isValidEmail(v) {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && t.length <= 254;
}

async function sendViaResend(payload) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error('Resend error'), { status: res.status, data });
  return data;
}

const INTERNAL_HTML = (email) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Light notification</title></head>
<body style="margin:0;padding:40px 24px;background:#1A0F06;font-family:Georgia,'Times New Roman',serif;color:#F8F2E5;">
  <p style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#E4C38A;margin:0 0 18px;">Rhei. · Internal</p>
  <h2 style="font-weight:300;font-size:26px;margin:0 0 14px;color:#F8F2E5;">Someone wants The Light.</h2>
  <p style="font-size:15px;line-height:1.65;color:rgba(248,242,229,0.82);margin:0 0 10px;">
    A user has requested to be notified when The Light ships:
  </p>
  <p style="font-size:17px;color:#E4C38A;margin:0;font-style:italic;">${email}</p>
  <p style="font-size:12px;color:rgba(248,242,229,0.45);margin:24px 0 0;">Their profile has been flagged notify_light = true in Supabase.</p>
</body>
</html>`;

const USER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>You're on the list.</title>
  <style>
    :root { color-scheme: dark; }
    @media (prefers-color-scheme: dark) {
      body, body * { -webkit-text-fill-color: inherit !important; }
      .cream { color: #F8F2E5 !important; }
      .gold  { color: #E4C38A !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#1A0F06;font-family:Georgia,'Times New Roman',serif;color:#F8F2E5;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#1A0F06;">
    You're on the list. We'll write when The Light is near.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1A0F06;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px;background:linear-gradient(180deg,#2D1B0E 0%,#1A0F06 80%);border:1px solid rgba(228,195,138,0.18);border-radius:18px;overflow:hidden;">

          <tr>
            <td align="center" style="padding:56px 32px 8px;">
              <h1 style="margin:0;font-weight:300;font-size:52px;letter-spacing:-0.025em;color:#F8F2E5 !important;line-height:1;">Rhei.</h1>
              <p style="margin:12px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:0.32em;text-transform:uppercase;color:#E4C38A !important;">The Cabinet</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 0;">
              <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:500;letter-spacing:0.34em;text-transform:uppercase;color:rgba(228,195,138,0.80);">The First Object</p>
              <h2 style="margin:0 0 22px;font-weight:300;font-size:32px;letter-spacing:-0.02em;color:#F8F2E5 !important;line-height:1.05;">The Light</h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(248,242,229,0.82) !important;">
                You're on the list.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(248,242,229,0.82) !important;">
                When The Light is close to arriving — red-light therapy and EMS, in a single ensemble designed for the ritual — we'll write to you first.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:rgba(248,242,229,0.82) !important;font-style:italic;">
                It's worth the wait.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 40px 48px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="80" style="border-top:1px solid rgba(228,195,138,0.22);font-size:0;line-height:0;">&nbsp;</td></tr></table>
              <p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:1.6;color:rgba(248,242,229,0.45) !important;">
                You're receiving this because you requested notification about The Light at rheihouse.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const USER_PLAIN = `You're on the list.

When The Light is close to arriving — red-light therapy and EMS, in a single ensemble designed for the ritual — we'll write to you first.

It's worth the wait.

— Rhei.

You're receiving this because you requested notification about The Light at rheihouse.com.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[notify-light] RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Server misconfigured.' });
  }

  const { email } = req.body || {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Missing or invalid email.' });
  }
  const to = email.trim().toLowerCase();

  try {
    // Fire both emails in parallel — internal alert to Rhea, confirmation to user
    await Promise.all([
      sendViaResend({
        from: FROM,
        to: [RHEA],
        subject: `The Light — new notification request`,
        html: INTERNAL_HTML(to),
        text: `Someone wants The Light: ${to}`,
        tags: [{ name: 'category', value: 'notify-light-internal' }],
      }),
      sendViaResend({
        from: FROM,
        to: [to],
        reply_to: 'hello@rheihouse.com',
        subject: `You're on the list. — Rhei.`,
        html: USER_HTML,
        text: USER_PLAIN,
        tags: [{ name: 'category', value: 'notify-light-user' }],
      }),
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[notify-light]', err);
    return res.status(502).json({ error: 'Could not send notification.' });
  }
}
