import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/design";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PremiumRequestsTable,
  type PremiumRequestRow,
} from "@/components/admin/premium-requests-table";
import type {
  PremiumPlan,
  PremiumRequestStatus,
} from "@/lib/supabase/types";

/**
 * Admin review queue for Premium profile requests (migration 00022).
 *
 * Auth is enforced by the parent admin layout (requireAdmin); the
 * premium_requests_admin_read RLS policy gates the privileged read so admins
 * see every row. The generated relationships are empty arrays, so company names
 * and requester identities are resolved with id-batched follow-up lookups
 * rather than PostgREST auto-embeds (same pattern as the messages queue).
 *
 * Requester emails live in auth.users (not the profiles table), so they are
 * resolved through the service-role admin client — this file is a server
 * component and never ships to the browser. The lookup pages auth.users once
 * (listUsers) into an id -> email map rather than calling getUserById per
 * requester, avoiding an N+1 of up to 200 admin calls per load.
 */

const PREMIUM_FETCH_LIMIT = 200;
const AUTH_PAGE_SIZE = 100;
const AUTH_MAX_PAGES = 50;

interface PremiumRequestRecord {
  id: string;
  company_id: string;
  requested_by: string;
  plan: PremiumPlan;
  amount_usd: number;
  status: PremiumRequestStatus;
  created_at: string;
}

export default async function AdminPremiumRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminPremium" });
  const supabase = await createServerSupabaseClient();

  const { data: requestData } = await supabase
    .from("premium_requests")
    .select(
      "id, company_id, requested_by, plan, amount_usd, status, created_at"
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(PREMIUM_FETCH_LIMIT);

  const requests = (requestData ?? []) as PremiumRequestRecord[];

  // Batched company-name lookup (admin RLS on companies permits the read).
  const companyIds = Array.from(new Set(requests.map((r) => r.company_id)));
  const companyNameById = new Map<string, string>();
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds);
    for (const c of companies ?? []) {
      companyNameById.set(c.id, c.name);
    }
  }

  // Requester display name from profiles (batched) + email from auth.users
  // (service-role). Missing values fall back to placeholders in the table.
  const requesterIds = Array.from(new Set(requests.map((r) => r.requested_by)));
  const requesterNameById = new Map<string, string | null>();
  const requesterEmailById = new Map<string, string>();

  if (requesterIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", requesterIds);
    for (const p of people ?? []) {
      requesterNameById.set(p.id, p.full_name);
    }

    // Resolve emails for all requesters in one batched scan instead of one
    // getUserById call per requester (up to 200/load). `profiles` has no email
    // column, so we page auth.users once and build an id -> email map, stopping
    // early once every requester id is resolved. Same pattern as listUsers.
    const adminClient = createAdminClient();
    const pendingIds = new Set(requesterIds);
    for (let page = 1; page <= AUTH_MAX_PAGES && pendingIds.size > 0; page += 1) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage: AUTH_PAGE_SIZE,
      });
      if (error) break;
      const users = data?.users ?? [];
      for (const u of users) {
        if (pendingIds.has(u.id)) {
          if (u.email) {
            requesterEmailById.set(u.id, u.email);
          }
          pendingIds.delete(u.id);
        }
      }
      if (users.length < AUTH_PAGE_SIZE) break;
    }
  }

  const rows: PremiumRequestRow[] = requests.map((r) => ({
    id: r.id,
    companyName: companyNameById.get(r.company_id) ?? "—",
    requestedByName: requesterNameById.get(r.requested_by) ?? null,
    requestedByEmail: requesterEmailById.get(r.requested_by) ?? null,
    plan: r.plan,
    amountUsd: r.amount_usd,
    status: r.status,
    createdAt: r.created_at,
  }));

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <PremiumRequestsTable rows={rows} locale={locale} />
    </div>
  );
}
