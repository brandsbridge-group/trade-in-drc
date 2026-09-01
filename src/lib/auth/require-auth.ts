import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side authentication guard for the user dashboard.
 *
 * Returns the authenticated Supabase user, or redirects an unauthenticated
 * visitor to the locale-prefixed login page with a `next` param so they land
 * back on the page they were trying to reach after signing in.
 *
 * RLS remains the source of truth for data access; this guard is a UX layer
 * that keeps the dashboard from rendering a flash of empty/authenticated-only
 * UI to logged-out visitors (the matching client guard is `useAuth()`).
 *
 * @param locale  Active locale (e.g. "en" / "fr") for the redirect prefix.
 * @param nextPath Path to return to after login, defaulting to the dashboard.
 *                 Pass the locale-less path (e.g. "/dashboard/companies").
 */
export async function requireAuth(
  locale: string,
  nextPath: string = "/dashboard"
): Promise<User> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const next = encodeURIComponent(nextPath);
    redirect(`/${locale}/login?next=${next}`);
  }

  return data.user;
}
