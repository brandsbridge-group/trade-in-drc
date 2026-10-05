import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolvePostAuthRedirect } from '@/lib/auth/redirect-guard';

/**
 * Landing route for the links in our auth e-mails (supabase/templates/).
 *
 * The templates send `?token_hash=…&type=…&next=…` here instead of the PKCE
 * {{ .ConfirmationURL }}: a PKCE code can only be exchanged in the browser that
 * requested it, so a link opened on another device (sign up on a laptop, open
 * the mail on a phone) failed — and a password reset was impossible there.
 * verifyOtp() needs no browser state and signs the user in on this device.
 *
 * `next` is the emailRedirectTo passed at signUp()/resetPasswordForEmail() —
 * our /callback URL — so the post-auth `?redirect=` is read out of it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const localeMatch = pathname.match(/^\/(en|fr|tr|es|zh)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  if (tokenHash && type) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(new URL(destination(type, searchParams.get('next'), locale, origin), origin));
    }
  }

  // Expired, already used, or malformed. A failed reset link goes back to the
  // form that issues a new one; anything else to login.
  const retry = type === 'recovery' ? 'forgot-password' : 'login';
  return NextResponse.redirect(new URL(`/${locale}/${retry}?error=link_invalid`, origin));
}

/** Same branching as /callback, so both entry points land in the same place. */
function destination(type: EmailOtpType, next: string | null, locale: string, origin: string): string {
  if (type === 'recovery') return `/${locale}/reset-password`;
  if (type === 'email_change') return `/${locale}/dashboard/settings/account?changed=1`;

  let redirect: string | null = null;
  try {
    redirect = next ? new URL(next, origin).searchParams.get('redirect') : null;
  } catch {
    // Unparseable `next` — fall back to the default landing spot.
  }
  return resolvePostAuthRedirect(redirect, locale, origin);
}
