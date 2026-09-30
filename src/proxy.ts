import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import {
  COMPANY_AREA,
  STAFF_AREA,
  STAFF_ALLOWED_COMPANY_ROUTES,
  SUPER_ADMIN_ROUTES,
  ROUTES,
  isUnderRoute,
} from '@/constants/routes';
import { hasSuperAdminAccess, isAdmin, roleHomePath } from '@/constants/roles';

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
  const localeMatch = pathname.match(/^\/(en|fr|tr|es|zh)(?=\/|$)/);
  const locale = localeMatch?.[1] ?? 'en';
  const path = localeMatch ? pathname.slice(localeMatch[0].length) || '/' : pathname;

  const inCompanyArea = isUnderRoute(path, COMPANY_AREA);
  const inStaffArea = isUnderRoute(path, STAFF_AREA);
  if (!inCompanyArea && !inStaffArea) return response;

  const to = (target: string) =>
    NextResponse.redirect(new URL(`/${locale}${target}`, request.url));

  if (!user) {
    const loginUrl = new URL(`/${locale}${ROUTES.LOGIN}`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // A missing profile row resolves to "not staff" (a plain signed-in user).
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, staff_role, account_type')
    .eq('id', user.id)
    .single();
  // Honours staff_role (moderator/super_admin) AND legacy role='admin',
  // mirroring the SQL is_admin() helper — not just the legacy column.
  const staff = isAdmin(profile);

  if (inStaffArea) {
    // Companies and plain users go back to their own area.
    if (!staff) return to(roleHomePath(profile));

    // Moderators share the console but not user/role management or settings.
    const superAdminOnly = SUPER_ADMIN_ROUTES.some((route) => isUnderRoute(path, route));
    if (superAdminOnly && !hasSuperAdminAccess(profile)) {
      return to(`${STAFF_AREA}?error=super_admin_only`);
    }
  }

  // Staff work from the console; only their account settings live here.
  if (inCompanyArea && staff) {
    const allowed = STAFF_ALLOWED_COMPANY_ROUTES.some((route) => isUnderRoute(path, route));
    if (!allowed) return to(roleHomePath(profile));
  }

  return response;
}

export const config = {
  matcher: ['/', '/(fr|en|tr|es|zh)/:path*'],
};
