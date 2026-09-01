import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin, type RoleProfile } from "@/constants/roles";

/**
 * PostgREST code for "no rows returned" from `.single()`. This is NOT an infra
 * error — it means the caller simply has no `profiles` row (a Visitor), so it
 * resolves to not_authorized, not a 500.
 */
const PGRST_NO_ROWS = "PGRST116";

/**
 * Server-side admin guard for the `/admin` area.
 *
 * Authorization is ultimately enforced by RLS + the SQL `is_admin()` helper
 * (migration 00013); this guard is the UX layer that keeps the admin shell
 * from rendering to non-staff.
 *
 * Three distinct outcomes — the key correctness fix is that they no longer
 * collapse into one:
 *  - Unauthenticated            -> redirect to login.
 *  - Authenticated, not staff   -> redirect home with `not_authorized`.
 *  - Infrastructure failure     -> THROW so it surfaces as a real 500 instead
 *    of masquerading as "not authorized" (which would hide outages and lock
 *    out legitimate admins whenever the profiles fetch hiccups).
 */
export async function requireAdmin(locale: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new Error(
      `[requireAdmin] auth.getUser failed: ${authError.message}`
    );
  }
  if (!data.user) {
    redirect(`/${locale}/login?next=/admin`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_type, staff_role")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    // "No rows" is a legitimate not-authorized case (Visitor with no profile).
    // Any other error is infrastructure (DB down, RLS misconfig, network) and
    // must surface as a 500 — never be swallowed into a not_authorized redirect.
    if (profileError.code === PGRST_NO_ROWS) {
      redirect(`/${locale}?error=not_authorized`);
    }
    throw new Error(
      `[requireAdmin] profile fetch failed (${profileError.code ?? "unknown"}): ${profileError.message}`
    );
  }

  if (!isAdmin(profile as RoleProfile | null)) {
    redirect(`/${locale}?error=not_authorized`);
  }

  return data.user;
}
