import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolvePostAuthRedirect } from '@/lib/auth/redirect-guard';

export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const redirect = searchParams.get('redirect');

  const localeMatch = pathname.match(/^\/(en|fr|tr|es|zh)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  if (code) {
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
  // still wins, and its absence falls back to /dashboard/companies (P2-7) —
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
