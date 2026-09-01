import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin, type RoleProfile } from "@/constants/roles";

/**
 * Boolean admin check for Server Actions / Route Handlers.
 *
 * Unlike {@link requireAdmin} (which redirects, for the `/admin` shell), this
 * returns a plain `{ ok, userId }` result so callers can branch and return a
 * typed error envelope instead of throwing a navigation redirect.
 *
 * Authorization is ultimately enforced by RLS + the SQL `is_admin()` helper
 * (migration 00013). This guard is the application-layer gate that mirrors it,
 * using the canonical {@link isAdmin} predicate — which honours `staff_role`
 * (moderator / super_admin) first and falls back to the legacy `role = 'admin'`
 * only for un-migrated rows. It must NOT be reduced to a raw `role === 'admin'`
 * check: that wrongly rejects moderators and super-admins.
 *
 * Returns `{ ok: false }` for any non-admin or unauthenticated caller, and for
 * any profile-fetch failure (fail-closed). It never throws — callers that need
 * a hard 500 on infrastructure failure should use {@link requireAdmin} instead.
 */
export async function requireCallerAdmin(): Promise<{
  ok: boolean;
  userId?: string;
}> {
  const supabase = await createServerSupabaseClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_type, staff_role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false, userId: authData.user.id };
  }

  return { ok: isAdmin(profile as RoleProfile), userId: authData.user.id };
}
