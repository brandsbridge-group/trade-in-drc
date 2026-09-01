import { getTranslations } from "next-intl/server";
import {
  ClipboardList,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Target,
  Inbox,
  Search,
  UserCheck,
  ArrowRightLeft,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/design";
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
 */

const REQUEST_FETCH_LIMIT = 300;

interface RawRequest {
  id: string;
  submitter_id: string;
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
      "id, submitter_id, full_name, company_name, country, sector, intent, status, follow_up_owner, admin_notes, message, email, phone, preferred_location, timeline, created_at, promotion_plan, promotion_amount_usd"
    )
    .order("created_at", { ascending: false })
    .limit(REQUEST_FETCH_LIMIT);

  const raw = (data ?? []) as RawRequest[];

  // Resolve submitter display names in a single batched lookup.
  const submitterIds = Array.from(new Set(raw.map((r) => r.submitter_id)));
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

  const rows: AdminRequestRow[] = raw.map((r) => ({
    ...r,
    submitter_name: submitterNameById.get(r.submitter_id) ?? null,
  }));

  // Stats.
  const total = rows.length;
  const countBy = (s: BusinessRequestStatus) =>
    rows.filter((r) => r.status === s).length;
  const newCount = countBy("new");
  const inProgress = countBy("in_progress");
  const converted = countBy("converted");
  const pending = countBy("pending");
  const responseRate =
    total === 0 ? 0 : Math.round(((total - newCount) / total) * 100);

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

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={<ClipboardList className="size-4" />}
          label={t("stats.total")}
          value={total}
          tone="text-primary"
        />
        <StatCard
          icon={<Sparkles className="size-4" />}
          label={t("stats.new")}
          value={newCount}
          tone="text-blue-600"
        />
        <StatCard
          icon={<RefreshCw className="size-4" />}
          label={t("stats.inProgress")}
          value={inProgress}
          tone="text-indigo-600"
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label={t("stats.converted")}
          value={converted}
          tone="text-green-600"
        />
        <StatCard
          icon={<Clock className="size-4" />}
          label={t("stats.pending")}
          value={pending}
          tone="text-amber-600"
        />
        <StatCard
          icon={<Target className="size-4" />}
          label={t("stats.responseRate")}
          value={`${responseRate}%`}
          tone="text-primary"
        />
      </div>

      <RequestsTable
        rows={rows}
        sectors={sectors}
        countries={countries}
        owners={owners}
      />

      {/* How It Works */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-center text-sm font-semibold text-foreground">
          {t("howItWorks.heading")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HowItWorksStep
            index={1}
            icon={<Inbox className="size-4" />}
            title={t("howItWorks.step1.title")}
            description={t("howItWorks.step1.description")}
          />
          <HowItWorksStep
            index={2}
            icon={<Search className="size-4" />}
            title={t("howItWorks.step2.title")}
            description={t("howItWorks.step2.description")}
          />
          <HowItWorksStep
            index={3}
            icon={<UserCheck className="size-4" />}
            title={t("howItWorks.step3.title")}
            description={t("howItWorks.step3.description")}
          />
          <HowItWorksStep
            index={4}
            icon={<ArrowRightLeft className="size-4" />}
            title={t("howItWorks.step4.title")}
            description={t("howItWorks.step4.description")}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={tone} aria-hidden>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <p className={`mt-1.5 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function HowItWorksStep({
  index,
  icon,
  title,
  description,
}: {
  index: number;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          <span className="text-primary">{index}.</span> {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
