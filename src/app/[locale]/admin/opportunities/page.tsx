import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/design";

/**
 * Admin moderation queue for opportunities.
 *
 * - Sorts `pending_review` first (the items needing action) rather than burying
 *   them behind published/rejected rows.
 * - Supports a status filter via the `?status=` query param.
 * - Renders an explicit error state distinct from an empty queue.
 */

const STATUS_FILTERS = [
  "pending_review",
  "published",
  "rejected",
  "draft",
  "expired",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function isStatusFilter(value: unknown): value is StatusFilter {
  return (
    typeof value === "string" &&
    (STATUS_FILTERS as readonly string[]).includes(value)
  );
}

interface AdminOpportunityRow {
  id: string;
  title_en: string;
  category: string;
  status: string;
  updated_at: string;
  companies: { name: string } | null;
}

export default async function AdminOpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const supabase = await createServerSupabaseClient();

  const activeStatus = isStatusFilter(sp.status) ? sp.status : undefined;
  const basePath = `/${locale}/admin/opportunities`;

  let query = supabase
    .from("opportunities")
    .select("id, title_en, category, status, updated_at, companies(name)");
  if (activeStatus) query = query.eq("status", activeStatus);

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(200);

  // Pending items first (needs-action), then everything else by recency.
  const items = ((data ?? []) as unknown as AdminOpportunityRow[]).sort((a, b) => {
    const aPending = a.status === "pending_review" ? 0 : 1;
    const bPending = b.status === "pending_review" ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="space-y-4">
      <PageHeader title={t("admin.queue")} subtitle={t("admin.queueSubtitle")} />

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={basePath}
          className={
            "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
            (!activeStatus
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70")
          }
        >
          {t("admin.filterAll")}
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`${basePath}?status=${s}`}
            className={
              "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
              (activeStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70")
            }
          >
            {t(`status.${s}` as Parameters<typeof t>[0])}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{t("admin.loadError")}</p>
        </div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2 pr-4">{t("fields.title")}</th>
              <th className="py-2 pr-4">{t("fields.category")}</th>
              <th className="py-2 pr-4">{t("admin.company")}</th>
              <th className="py-2 pr-4">{t("admin.statusHeading")}</th>
              <th className="py-2">{t("admin.updated")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4">
                  <Link className="underline" href={`/admin/opportunities/${o.id}`}>
                    {o.title_en}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  {t(`categories.${o.category}` as Parameters<typeof t>[0])}
                </td>
                <td className="py-2 pr-4">{o.companies?.name ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      o.status === "pending_review" ? "font-medium text-amber-700" : ""
                    }
                  >
                    {t(`status.${o.status}` as Parameters<typeof t>[0])}
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  {new Date(o.updated_at).toLocaleDateString(locale)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  {t("admin.queueEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
