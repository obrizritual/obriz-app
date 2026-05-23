// ════════════════════════════════════════════════════════════════
// RHEI — Supabase client
//
// Initializes the Supabase JS client from VITE_SUPABASE_URL +
// VITE_SUPABASE_ANON_KEY (Vercel env vars). If either is missing at
// build time, the export is `null` and the app gracefully falls back
// to a local-only account flow so users can still create an account
// on-device. Premium status, name, and email are saved to localStorage.
//
// To enable cross-device sync (magic-link sign-in, premium restoration
// across devices):
//   1. Vercel → Project Settings → Environment Variables
//        VITE_SUPABASE_URL       = https://<your-project>.supabase.co
//        VITE_SUPABASE_ANON_KEY  = <your-anon-key>
//   2. Redeploy.
// ════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

// Project credentials. Env vars take precedence when set on Vercel; the
// fallback constants ensure the magic-link flow works in production today
// even before env vars are wired up. The anon key is designed for
// client-side use — it only grants access to actions allowed by Row Level
// Security policies on the database.
const FALLBACK_URL = 'https://qtrzvxlhaegwlufmnpwc.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cnp2eGxoYWVnd2x1Zm1ucHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODk4MTgsImV4cCI6MjA5NDE2NTgxOH0.l9-E5au6Awik8XkQdujqjTSHtsqAuHOj02DuqKc_D68';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Build-time hint for the developer console — surfaces why magic-link
// sign-in isn't connecting without exposing details to the end user.
if (!supabase && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.warn(
    '[RHEI] Supabase env vars missing — falling back to local-only accounts. ' +
    'Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY on Vercel to enable cross-device sync.'
  );
}

// Boolean that the rest of the app branches on instead of repeatedly
// null-checking `supabase`. Cleaner reads + a single source of truth.
export const supabaseEnabled = !!supabase;
