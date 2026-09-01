import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PremiumPlan } from "@/lib/supabase/types";

/**
 * Granting premium to a company — the single implementation.
 *
 * Two screens grant it: approving a company-scoped request at
 * /admin/requests/premium, and fulfilling an anonymous promotion lead at
 * /admin/requests. They used to write these four columns separately and had
 * already drifted — one advanced the term with `setMonth(+12)` (calendar year)
 * and the other with a fixed `365 * 24 * 60 * 60 * 1000`, so the same package
 * expired on different dates depending on which screen the admin used.
 */

/** Subscription term. A calendar year, so leap years land on the same date. */
export const PREMIUM_TERM_MONTHS = 12;

/** End of the term starting at `start`, ISO-8601. */
export function premiumExpiryFrom(start: Date): string {
  const expires = new Date(start);
  expires.setMonth(expires.getMonth() + PREMIUM_TERM_MONTHS);
  return expires.toISOString();
}

/**
 * Mark a company premium for one term. Requires a service-role client —
 * `companies.is_premium` and friends are not owner-writable.
 */
export async function grantCompanyPremium(
  adminClient: SupabaseClient<Database>,
  companyId: string,
  plan: PremiumPlan,
  start: Date = new Date()
): Promise<{ ok: boolean }> {
  const { error } = await adminClient
    .from("companies")
    .update({
      is_premium: true,
      premium_plan: plan,
      premium_since: start.toISOString(),
      premium_expires_at: premiumExpiryFrom(start),
    })
    .eq("id", companyId);

  return { ok: !error };
}
