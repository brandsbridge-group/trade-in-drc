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
  DASHBOARD: '/dashboard',
  DASHBOARD_COMPANIES: '/dashboard/companies',
  DASHBOARD_PRODUCTS: '/dashboard/products',
  DASHBOARD_RFQ: '/dashboard/rfq',
  DASHBOARD_OPPORTUNITIES: '/dashboard/opportunities',
  DASHBOARD_INBOX: '/dashboard/inbox',
  DASHBOARD_ANALYTICS: '/dashboard/analytics',
  DASHBOARD_SETTINGS: '/dashboard/settings',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_VERIFICATIONS: '/admin/verifications',
  ADMIN_COMPANIES: '/admin/companies',
  ADMIN_USERS: '/admin/users',
  ADMIN_TAXONOMY: '/admin/taxonomy',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.DASHBOARD_COMPANIES,
  ROUTES.DASHBOARD_PRODUCTS,
  ROUTES.DASHBOARD_RFQ,
  ROUTES.DASHBOARD_OPPORTUNITIES,
  ROUTES.DASHBOARD_INBOX,
  ROUTES.DASHBOARD_ANALYTICS,
  ROUTES.DASHBOARD_SETTINGS,
] as const;

export const ADMIN_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.ADMIN_VERIFICATIONS,
  ROUTES.ADMIN_COMPANIES,
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_TAXONOMY,
  ROUTES.ADMIN_ANALYTICS,
  ROUTES.ADMIN_SETTINGS,
] as const;
