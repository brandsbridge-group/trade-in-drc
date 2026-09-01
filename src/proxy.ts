import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import { PROTECTED_ROUTES, ADMIN_ROUTES, ROUTES } from '@/constants/routes';
import { isAdmin } from '@/constants/roles';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const response = intlResponse || NextResponse.next();

  // Set visitor_id cookie for analytics tracking
  if (!request.cookies.get('visitor_id')) {
    const visitorId = crypto.randomUUID();
    response.cookies.set('visitor_id', visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  const { supabase, user } = await updateSession(request, response);

  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|fr|tr|es|zh)/, '') || '/';

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const locale = pathname.split('/')[1] || 'en';
    const loginUrl = new URL(`/${locale}${ROUTES.LOGIN}`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    if (!user) {
      const locale = pathname.split('/')[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}${ROUTES.LOGIN}`, request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, staff_role, account_type')
      .eq('id', user.id)
      .single();

    // Honour staff_role (moderator/super_admin) AND legacy role='admin',
    // mirroring the SQL is_admin() helper — not just the legacy column.
    if (!isAdmin(profile)) {
      const locale = pathname.split('/')[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/(fr|en|tr|es|zh)/:path*'],
};
