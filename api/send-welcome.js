// /api/send-welcome
//
// Sends the Rhei. welcome email via Resend. Triggered by a Supabase Database
// Webhook on INSERT into auth.users.
//
// The webhook payload shape from Supabase is:
//   { type: 'INSERT', table: 'users', schema: 'auth',
//     record: { id, email, ... }, old_record: null }
//
// Auth: the request must carry an `x-webhook-secret` header matching
// process.env.WELCOME_WEBHOOK_SECRET. Configure the same secret in the
// Supabase webhook custom headers.
//
// REQUIRED env vars:
//   RESEND_API_KEY            (Resend sending key, scoped to rheihouse.com)
//   WELCOME_WEBHOOK_SECRET    (shared secret with Supabase webhook)
//
// Sends FROM: Rhei. <hello@rheihouse.com>
// Reply-To:   rheihouse@gmail.com   (launch-day inbox)

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const FROM = 'Rhei. <hello@rheihouse.com>';
const REPLY_TO = 'rheihouse@gmail.com';
const SUBJECT = 'Welcome home. Your seven days begin.';

// Static HTML template — inlined to avoid runtime filesystem reads and to
// keep this function zero-dependency.
const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welcome to RHEI</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p { font-family: Georgia, 'Times New Roman', serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Tell iOS Mail / Apple Mail / Outlook 2019+ that this email is
       designed for dark mode. Without these declarations they apply
       their own color-shifting algorithm which inverts our cream text
       into a near-invisible brown against the dark background. */
    :root {
      color-scheme: dark;
      supported-color-schemes: dark;
    }
    /* Belt-and-braces: if a client still tries to override, force
       cream and gold tones to survive in dark mode. */
    @media (prefers-color-scheme: dark) {
      body, body * {
        -webkit-text-fill-color: inherit !important;
      }
      .rhei-cream { color: #F8F2E5 !important; }
      .rhei-gold  { color: #E4C38A !important; }
    }
    /* Gmail mobile app dark mode (uses [data-ogsc] attribute injection) */
    [data-ogsc] .rhei-cream,
    u + .body .rhei-cream {
      color: #F8F2E5 !important;
    }
    [data-ogsc] .rhei-gold,
    u + .body .rhei-gold {
      color: #E4C38A !important;
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#1A0F06;font-family:Georgia,'Times New Roman',serif;color:#F8F2E5 !important;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#1A0F06;opacity:0;">
    Welcome home. Your nervous system practice begins now.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1A0F06;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:linear-gradient(180deg,#2D1B0E 0%,#1A0F06 80%);border:1px solid rgba(228,195,138,0.18);border-radius:18px;overflow:hidden;">

          <tr>
            <td align="center" style="padding:56px 32px 8px 32px;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:300;font-size:56px;letter-spacing:-0.025em;color:#F8F2E5 !important;line-height:1;">Rhei.</h1>
              <p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:0.32em;text-transform:uppercase;color:#E4C38A !important;">A nervous system practice</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="40" style="border-top:1px solid rgba(228,195,138,0.32);font-size:0;line-height:0;">&nbsp;</td></tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px 8px 40px;font-family:Georgia,'Times New Roman',serif;color:#F8F2E5 !important;">
              <h2 style="margin:0 0 22px 0;font-weight:300;font-size:30px;line-height:1.18;letter-spacing:-0.015em;color:#F8F2E5 !important;">Welcome home.</h2>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.65;color:#F8F2E5 !important;">
                You've just stepped into a quieter way of caring for yourself — grounded in the science of the nervous system, expressed through rituals that fit between everything else.
              </p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.65;color:#F8F2E5 !important;">
                For the next seven days, you have full access. Move through it at your own pace. Notice what changes.
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;line-height:1.65;color:#F8F2E5 !important;">
                If you only do one thing today, do this:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(228,195,138,0.06);border:1px solid rgba(228,195,138,0.22);border-radius:14px;margin:0 0 32px 0;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:0.28em;text-transform:uppercase;color:#E4C38A !important;">Begin here</p>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:300;line-height:1.35;color:#F8F2E5 !important;letter-spacing:-0.01em;">
                      The Morning Reset. Three minutes. Anywhere you are.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 32px auto;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.rheihouse.com" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="50%" stroke="f" fillcolor="#F8F2E5">
                      <w:anchorlock/>
                      <center style="color:#2D1B0E;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:0.08em;">OPEN RHEI</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a href="https://www.rheihouse.com" style="display:inline-block;background:#F8F2E5;color:#2D1B0E;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:0.08em;text-decoration:none;padding:16px 36px;border-radius:100px;mso-hide:all;">OPEN RHEI</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 14px 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:0.28em;text-transform:uppercase;color:rgba(228,195,138,0.85) !important;">Your seven days</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:8px 0;border-top:1px solid rgba(228,195,138,0.22);font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.55;color:#F8F2E5 !important;">
                    Every guided ritual — Gua Sha, Lymphatic Flow, Buccal, Face Lift, Eye Revival.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-top:1px solid rgba(228,195,138,0.22);font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.55;color:#F8F2E5 !important;">
                    Live Mirror Mode — your face, your camera, gold gesture overlays in real time.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-top:1px solid rgba(228,195,138,0.22);border-bottom:1px solid rgba(228,195,138,0.22);font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.55;color:#F8F2E5 !important;">
                    Resets, affirmations, breath — the full sound library.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px 8px 40px;font-family:Georgia,'Times New Roman',serif;color:#F8F2E5 !important;">
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.65;color:#F8F2E5 !important;">
                If you forget, we'll send a single gentle reminder — nothing noisy, nothing daily by default.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.65;color:#F8F2E5 !important;font-style:italic;">
                Return to yourself.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:40px 32px 48px 32px;border-top:1px solid rgba(248,242,229,0.06);margin-top:24px;">
              <p style="margin:0 0 10px 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:0.28em;text-transform:uppercase;color:rgba(228,195,138,0.70) !important;">RHEI</p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:1.6;color:rgba(248,242,229,0.72) !important;">
                You received this because you created an account at rheihouse.com.<br>
                Manage your reminders inside the app under Journey → Gentle reminders.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const PLAIN_TEXT_FALLBACK = `Welcome home.

You've just stepped into a quieter way of caring for yourself — grounded in the science of the nervous system, expressed through rituals that fit between everything else.

For the next seven days, you have full access. Move through it at your own pace. Notice what changes.

If you only do one thing today, do this:
The Morning Reset. Three minutes. Anywhere you are.

Open Rhei: https://www.rheihouse.com

Your seven days:
- Every guided ritual — Gua Sha, Lymphatic Flow, Buccal, Face Lift, Eye Revival.
- Live Mirror Mode — your face, your camera, gold gesture overlays in real time.
- Resets, affirmations, breath — the full sound library.

If you forget, we'll send a single gentle reminder — nothing noisy, nothing daily by default.

Return to yourself.

— Rhei.

You received this because you created an account at rheihouse.com.
Manage your reminders inside the app under Journey → Gentle reminders.`;

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  // RFC-pragmatic: not a strict RFC 5322 validator, but rejects obvious garbage.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: shared secret with Supabase webhook
  const expectedSecret = process.env.WELCOME_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error('[send-welcome] WELCOME_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Server misconfigured.' });
  }
  const providedSecret = req.headers['x-webhook-secret'];
  if (providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[send-welcome] RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfigured.' });
  }

  // Extract email. Supports both:
  //   { record: { email: '...' } }   ← Supabase Database Webhook payload
  //   { email: '...' }               ← direct invocation (smoke test)
  const body = req.body || {};
  const candidate =
    (body.record && body.record.email) ||
    body.email ||
    null;

  if (!isValidEmail(candidate)) {
    console.error('[send-welcome] No valid email in payload');
    return res.status(400).json({ error: 'Missing or invalid email.' });
  }
  const to = candidate.trim().toLowerCase();

  try {
    const resendRes = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject: SUBJECT,
        html: WELCOME_HTML,
        text: PLAIN_TEXT_FALLBACK,
        tags: [{ name: 'category', value: 'welcome' }],
      }),
    });

    const data = await resendRes.json().catch(() => ({}));

    if (!resendRes.ok) {
      console.error('[send-welcome] Resend error', resendRes.status, data);
      return res.status(502).json({ error: 'Email provider error.', details: data });
    }

    return res.status(200).json({ ok: true, id: data.id || null });
  } catch (err) {
    console.error('[send-welcome]', err);
    return res.status(500).json({ error: 'Could not send welcome email.' });
  }
}
