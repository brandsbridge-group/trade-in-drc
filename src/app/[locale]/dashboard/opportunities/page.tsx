import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { EmptyState, PageHeader } from "@/components/design";
import type { Opportunity } from "@/lib/opportunities/types";

export default async function MyOpportunitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const supabase = await createServerSupabaseClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/${locale}/login?next=/dashboard/opportunities`);

  const { data: myCompanies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", auth.user.id);

  const ids = (myCompanies ?? []).map((c) => c.id);
  let items: Opportunity[] = [];
  let loadError = false;
  const responseCounts = new Map<string, number>();

  if (ids.length) {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .in("company_id", ids)
      .order("updated_at", { ascending: false });
    if (error) {
      loadError = true;
    } else {
      items = (data ?? []) as unknown as Opportunity[];

      // Inbound interest (Req 13): how many responses each opportunity has. RLS
      // (opportunity_responses_read) only returns responses to opportunities the
      // caller owns, so this is safe to query directly with the user client.
      const opportunityIds = items.map((o) => o.id);
      if (opportunityIds.length) {
        const { data: responses } = await supabase
          .from("opportunity_responses")
          .select("opportunity_id")
          .in("opportunity_id", opportunityIds);
        for (const r of (responses ?? []) as Array<{ opportunity_id: string }>) {
          responseCounts.set(
            r.opportunity_id,
            (responseCounts.get(r.opportunity_id) ?? 0) + 1
          );
        }
      }
    }
  }

  return (
    <div className="max-w-5xl space-y-4">
      <PageHeader
        title={t("dashboard.title")}
        action={
          <Link
            href="/dashboard/opportunities/new"
            className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            + {t("dashboard.new")}
          </Link>
        }
      />

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{t("dashboard.loadError")}</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t("dashboard.emptyTitle")}
          body={t("dashboard.emptyBody")}
          action={
            <Link
              href="/dashboard/opportunities/new"
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium"
            >
              + {t("dashboard.new")}
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="text-xs text-muted-foreground uppercase tracking-wide text-left border-b">
              <tr>
                <th className="py-2 px-3 font-medium">{t("fields.title")}</th>
                <th className="py-2 px-3 font-medium">{t("fields.category")}</th>
                <th className="py-2 px-3 font-medium">{t("admin.statusHeading")}</th>
                <th className="py-2 px-3 font-medium text-right">{t("dashboard.responses")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const count = responseCounts.get(o.id) ?? 0;
                return (
                  <tr key={o.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3">
                      <Link
                        className="underline hover:text-primary"
                        href={`/dashboard/opportunities/${o.id}`}
                      >
                        {locale === "fr" ? o.title_fr : o.title_en}
                      </Link>
                    </td>
                    <td className="py-2 px-3">{t(`categories.${o.category}`)}</td>
                    <td className="py-2 px-3">{t(`status.${o.status}`)}</td>
                    <td className="py-2 px-3 text-right">
                      {count > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-6 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {count}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("dashboard.noResponses")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
