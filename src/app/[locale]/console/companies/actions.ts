"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CompanyStatus } from "@/constants/status";

/**
 * Admin companies LIST server action.
 *
 * Why service-role: the list page must show each company's sector name and its
 * owner's email. The sector name is resolvable via the `sectors` join, but the
 * owner email lives in `auth.users`, which only the service-role key can read.
 * Mirrors `getCompanyForReview` (verifications/actions.ts) which fixed the same
 * blank "-" gap on the company DETAIL page. The service-role client is built
 * and used exclusively here, on the server, and never leaves this module.
 * `requireAdmin` gates every call before the privileged client is constructed.
 */

export interface AdminCompanyRow {
  id: string;
  name: string;
  city: string | null;
  sectorName: string | null;
  status: CompanyStatus;
  ownerEmail: string | null;
  createdAt: string;
}

interface RawCompanyRow {
  id: string;
  name: string;
  city: string | null;
  status: CompanyStatus;
  owner_id: string;
  created_at: string;
  sectors: { name_en: string; name_fr: string } | null;
}

/**
 * Resolve a set of owner ids to their auth emails. Pages through one
 * `getUserById` per unique id; missing/errored ids simply stay absent so the
 * UI can fall back to a placeholder.
 */
async function resolveOwnerEmails(
  adminClient: ReturnType<typeof createAdminClient>,
  ownerIds: string[]
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ownerIds));
  const result = new Map<string, string>();

  await Promise.all(
    unique.map(async (id) => {
      const { data, error } = await adminClient.auth.admin.getUserById(id);
      if (!error && data.user?.email) {
        result.set(id, data.user.email);
      }
    })
  );

  return result;
}

/**
 * List every company with sector name (localized) + owner email resolved.
 * Sorted newest first. Throws on the privileged read failing so the page can
 * surface a real error rather than silently rendering an empty table.
 */
export async function listCompaniesForAdmin(
  locale: string
): Promise<AdminCompanyRow[]> {
  await requireAdmin(locale);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("companies")
    .select(
      `id, name, city, status, owner_id, created_at,
       sectors(name_en, name_fr)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[listCompaniesForAdmin] ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawCompanyRow[];
  const emailByOwner = await resolveOwnerEmails(
    adminClient,
    rows.map((r) => r.owner_id)
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    sectorName: row.sectors
      ? locale === "fr"
        ? row.sectors.name_fr
        : row.sectors.name_en
      : null,
    status: row.status,
    ownerEmail: emailByOwner.get(row.owner_id) ?? null,
    createdAt: row.created_at,
  }));
}
