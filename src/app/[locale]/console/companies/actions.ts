"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { reviewStage } from "@/lib/verifications/workflow";
import type { Locale } from "@/config/locales";
import type { CompanyStatus, VerificationTier } from "@/constants/status";
import type { ConsoleCompanyRow } from "@/lib/console/companies";

/**
 * Admin companies LIST server action.
 *
 * Why service-role: the list shows each company's owner (name and e-mail), and
 * the e-mail lives in `auth.users`, which only the service-role key can read;
 * it also reads the premium columns, REVOKE'd from owners. The service-role
 * client is built and used exclusively here, on the server, and never leaves
 * this module. `requireAdmin` gates every call before it is constructed.
 */

interface RawCompanyRow {
  id: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  country: string | null;
  status: CompanyStatus;
  verification_tier: VerificationTier;
  is_premium: boolean;
  premium_plan: string | null;
  premium_expires_at: string | null;
  owner_id: string;
  created_at: string;
  sectors: Record<string, string | null> | null;
  products: { count: number }[];
  verification_reviews: { decision: string; notes: string | null; created_at: string }[];
}

/**
 * Resolve a set of owner ids to their auth emails. One `getUserById` per
 * unique id; missing/errored ids simply stay absent so the UI can fall back to
 * a placeholder.
 */
async function resolveOwnerEmails(
  adminClient: ReturnType<typeof createAdminClient>,
  ownerIds: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  await Promise.all(
    ownerIds.map(async (id) => {
      const { data, error } = await adminClient.auth.admin.getUserById(id);
      if (!error && data.user?.email) {
        result.set(id, data.user.email);
      }
    })
  );

  return result;
}

/**
 * Every company, newest first, with what the list needs to be read at a
 * glance: sector (in the reader's language), where the file stands in the
 * verification circuit, trust tier, premium, number of products and owner.
 * Throws when the privileged read fails so the page surfaces a real error
 * rather than an empty table.
 */
export async function listCompaniesForAdmin(locale: string): Promise<ConsoleCompanyRow[]> {
  await requireAdmin(locale);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("companies")
    .select(
      `id, name, logo_url, city, country, status, verification_tier,
       is_premium, premium_plan, premium_expires_at, owner_id, created_at,
       sectors(name_en, name_fr, name_es, name_tr, name_zh),
       products(count),
       verification_reviews(decision, notes, created_at)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[listCompaniesForAdmin] ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawCompanyRow[];
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));
  const [emailByOwner, profiles] = await Promise.all([
    resolveOwnerEmails(adminClient, ownerIds),
    adminClient.from("profiles").select("id, full_name").in("id", ownerIds),
  ]);
  const nameByOwner = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name?.trim() || null]));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    city: row.city,
    country: row.country,
    sectorName: row.sectors ? pickLocalized(row.sectors, "name", locale as Locale) || null : null,
    status: row.status,
    // `status` alone cannot tell a file waiting on staff from one waiting on the owner.
    stage: reviewStage(
      row.status,
      (row.verification_reviews ?? []).map((v) => ({ decision: v.decision, notes: v.notes, createdAt: v.created_at }))
    ),
    verificationTier: row.verification_tier,
    isPremium: row.is_premium,
    premiumPlan: row.premium_plan,
    premiumExpiresAt: row.premium_expires_at,
    productCount: row.products?.[0]?.count ?? 0,
    ownerName: nameByOwner.get(row.owner_id) ?? null,
    ownerEmail: emailByOwner.get(row.owner_id) ?? null,
    createdAt: row.created_at,
  }));
}
