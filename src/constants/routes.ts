export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',
  COMPANIES: '/companies',
  PRODUCTS: '/products',
  RFQ: '/rfq',

  // Dashboard routes
  /** "Find a local partner": the public form where anyone posts a need. */
  REQUEST: '/request',
  DASHBOARD: '/dashboard',
  DASHBOARD_COMPANIES: '/dashboard/companies',
  DASHBOARD_COMPANIES_NEW: '/dashboard/companies/new',
  DASHBOARD_PRODUCTS: '/dashboard/products',
  DASHBOARD_PRODUCTS_NEW: '/dashboard/products/new',
  DASHBOARD_REQUESTS: '/dashboard/requests',
  DASHBOARD_OPPORTUNITIES: '/dashboard/opportunities',
  DASHBOARD_INBOX: '/dashboard/inbox',
  DASHBOARD_ANALYTICS: '/dashboard/analytics',
  DASHBOARD_SETTINGS: '/dashboard/settings',

  // Staff console routes (super-admin + moderator)
  CONSOLE: '/console',
  CONSOLE_VERIFICATIONS: '/console/verifications',
  CONSOLE_COMPANIES: '/console/companies',
  CONSOLE_OPPORTUNITIES: '/console/opportunities',
  CONSOLE_REQUESTS: '/console/requests',
  CONSOLE_PREMIUM: '/console/requests/premium',
  CONSOLE_MESSAGES: '/console/messages',
  CONSOLE_USERS: '/console/users',
  CONSOLE_TAXONOMY: '/console/taxonomy',
  CONSOLE_ANALYTICS: '/console/analytics',
  CONSOLE_SETTINGS: '/console/settings',
} as const;

/**
 * The two signed-in areas, strictly separated by role (enforced in proxy.ts):
 *  - company area: company owners ("Admin" of their own company) and signed-in
 *    users who haven't registered a company yet.
 *  - staff area: super-admins and moderators only.
 * Each prefix covers every page beneath it.
 */
export const COMPANY_AREA = ROUTES.DASHBOARD;
export const STAFF_AREA = ROUTES.CONSOLE;

/**
 * Company-area pages staff may still open: their own account settings
 * (password, email change) live there until the staff area gets its own.
 */
export const STAFF_ALLOWED_COMPANY_ROUTES = [ROUTES.DASHBOARD_SETTINGS] as const;

/** True when `path` (locale-less) is `route` itself or a page beneath it. */
export function isUnderRoute(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`);
}

/**
 * Staff console sections reserved to super-admins. Moderators reach the rest
 * of /console (verifications, moderation queues, content) but not user/role
 * management or platform settings.
 */
export const SUPER_ADMIN_ROUTES = [
  ROUTES.CONSOLE_USERS,
  ROUTES.CONSOLE_SETTINGS,
] as const;
