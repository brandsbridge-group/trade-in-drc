import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolvePostAuthRedirect } from '@/lib/auth/redirect-guard';

const EMAIL_LINK_TYPES: EmailOtpType[] = ['email', 'signup', 'recovery', 'email_change', 'invite', 'magiclink'];

/**
 * Where an auth link lands: the address the app gave Supabase as
 * `emailRedirectTo` (see src/lib/auth/email-redirect.ts).
 *
 * Two kinds of link arrive here:
 *   - `?token_hash=…&type=…` — our e-mail templates. They append the token to
 *     the emailRedirectTo itself, so the link goes back to the DOMAIN the
 *     person signed up on (.net, .com, .org, staging, localhost) instead of
 *     the single "Site URL" of the Supabase project. verifyOtp() needs no
 *     browser state, so the mail can be opened on another device.
 *   - `?code=…` — the PKCE exchange (OAuth, or a link from a default template).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const redirect = searchParams.get('redirect');

  const localeMatch = pathname.match(/^\/(en|fr|tr|es|zh)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  if (tokenHash) {
    const otpType = EMAIL_LINK_TYPES.find((t) => t === type);
    const supabase = await createServerSupabaseClient();
    const { error } = otpType
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
      : { error: new Error('unknown link type') };
    if (error) {
      // Expired, already used, or malformed. A failed reset link goes back to
      // the form that issues a new one; anything else to login.
      const retry = type === 'recovery' ? 'forgot-password' : 'login';
      return NextResponse.redirect(new URL(`/${locale}/${retry}?error=link_invalid`, origin));
    }
  } else if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, origin)
      );
    }
  }

  // type-based branching takes priority. Otherwise, resolvePostAuthRedirect
  // handles both cases: an explicit `?redirect=` (validated, same-origin)
  // still wins, and its absence falls back to the /dashboard overview (P2-7) —
  // the one default every auth path shares, defined once in redirect-guard.ts.
  let next: string;
  if (type === 'recovery') {
    next = `/${locale}/reset-password`;
  } else if (type === 'email_change') {
    next = `/${locale}/dashboard/settings/account?changed=1`;
  } else {
    next = resolvePostAuthRedirect(redirect, locale, origin);
  }

  return NextResponse.redirect(new URL(next, origin));
}
