import { getTranslations } from "next-intl/server";
import { Inbox, Search, Send, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/console/page-header";
import { RequestKpis } from "@/components/admin/requests-table/request-kpis";
import { handledRate, viewCounts } from "@/lib/requests/views";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  BusinessRequestStatus,
  BusinessRequestIntent,
} from "@/lib/supabase/types";
import {
  RequestsTable,
  type AdminRequestRow,
} from "@/components/admin/requests-table";

/**
 * Admin "Received Requests" dashboard (business_requests, migration 00022).
 *
 * Auth is enforced by the admin layout (requireAdmin); admin RLS on
 * business_requests lets admins read every row including the REVOKE'd
 * status / follow_up_owner / admin_notes columns. Submitter display names are
 * resolved through a batched profiles lookup (Relationships are empty in the
 * generated types, so no PostgREST auto-embed).
 *
 * A request aimed at one company (quote request, contact request — 00062) also
 * shows that company and the product, and can be forwarded to it.
 */

const REQUEST_FETCH_LIMIT = 300;

interface RawRequest {
  id: string;
  reference: string | null;
  submitter_id: string | null;
  full_name: string;
  company_name: string | null;
  country: string | null;
  sector: string | null;
  intent: BusinessRequestIntent;
  status: BusinessRequestStatus;
  follow_up_owner: string | null;
  admin_notes: string | null;
  message: string;
  email: string;
  phone: string | null;
  preferred_location: string | null;
  timeline: string | null;
  created_at: string;
  promotion_plan: string | null;
  promotion_amount_usd: number | null;
  target_company_id: string | null;
  product_id: string | null;
  quantity: string | null;
  interest: string | null;
  forwarded_at: string | null;
  details: unknown;
  attachment_path: string | null;
  attachment_name: string | null;
}

export default async function AdminRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminRequests" });
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("business_requests")
    .select(
      "id, reference, submitter_id, full_name, company_name, country, sector, intent, status, follow_up_owner, admin_notes, message, email, phone, preferred_location, timeline, created_at, promotion_plan, promotion_amount_usd, target_company_id, product_id, quantity, interest, forwarded_at, details, attachment_path, attachment_name"
    )
    .order("created_at", { ascending: false })
    .limit(REQUEST_FETCH_LIMIT);

  const raw = (data ?? []) as RawRequest[];

  // Resolve submitter display names in a single batched lookup.
  const idsOf = (pick: (r: RawRequest) => string | null) =>
    Array.from(new Set(raw.map(pick).filter((id): id is string => !!id)));
  const submitterIds = idsOf((r) => r.submitter_id);
  const submitterNameById = new Map<string, string | null>();
  if (submitterIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", submitterIds);
    for (const p of people ?? []) {
      submitterNameById.set(p.id, p.full_name);
    }
  }

  // Same for the company a request is addressed to, and its product.
  const targetIds = idsOf((r) => r.target_company_id);
  const productIds = idsOf((r) => r.product_id);
  const [targets, products] = await Promise.all([
    targetIds.length > 0
      ? supabase.from("companies").select("id, name").in("id", targetIds)
      : null,
    productIds.length > 0
      ? supabase.from("products").select("id, name, name_en, name_fr").in("id", productIds)
      : null,
  ]);
  const targetNameById = new Map((targets?.data ?? []).map((c) => [c.id, c.name]));
  const productNameById = new Map(
    (products?.data ?? []).map((p) => [
      p.id,
      (locale === "fr" ? p.name_fr : p.name_en) || p.name,
    ])
  );

  const rows: AdminRequestRow[] = raw.map(({ attachment_path, ...r }) => ({
    ...r,
    // The path stays on the server: the panel asks for a short-lived link.
    has_attachment: !!attachment_path,
    submitter_name: r.submitter_id ? submitterNameById.get(r.submitter_id) ?? null : null,
    target_company_name: r.target_company_id ? targetNameById.get(r.target_company_id) ?? null : null,
    product_name: r.product_id ? productNameById.get(r.product_id) ?? null : null,
  }));

  // Indicators: the same counting rules as the table's quick views.
  const counts = viewCounts(rows);

  // Distinct filter facets.
  const sectors = Array.from(
    new Set(rows.map((r) => r.sector).filter(Boolean) as string[])
  ).sort();
  const countries = Array.from(
    new Set(rows.map((r) => r.country).filter(Boolean) as string[])
  ).sort();
  const owners = Array.from(
    new Set(rows.map((r) => r.follow_up_owner).filter(Boolean) as string[])
  ).sort();

  const steps: { key: "step1" | "step2" | "step3" | "step4"; icon: LucideIcon }[] = [
    { key: "step1", icon: Inbox },
    { key: "step2", icon: Search },
    { key: "step3", icon: Send },
    { key: "step4", icon: UserCheck },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <RequestKpis counts={counts} handledRate={handledRate(rows)} />

      <RequestsTable
        rows={rows}
        sectors={sectors}
        countries={countries}
        owners={owners}
      />

      {/* How a request travels, as one line of four steps. */}
      <section aria-labelledby="requests-how" className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
        <h2 id="requests-how" className="font-display text-base font-semibold text-market-navy">
          {t("howItWorks.heading")}
        </h2>
        <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ key, icon: Icon }, index) => (
            <li key={key} className="flex min-w-0 gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-market-navy" aria-hidden>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-market-navy">
                  <span className="text-market-or-dark">{index + 1}.</span> {t(`howItWorks.${key}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">{t(`howItWorks.${key}.description`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
