import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OpportunityForm } from "../opportunity-form";
import { PageHeader } from "@/components/design";
import { Link } from "@/i18n/routing";
import { MessageSquare } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities/types";

interface InboundResponse {
  id: string;
  message: string;
  created_at: string;
  conversation_id: string | null;
  profiles: { full_name: string | null } | null;
}

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const supabase = await createServerSupabaseClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/${locale}/login?next=/dashboard/opportunities/${id}`);

  // Fetch opportunity
  const { data: op } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (!op) notFound();

  const opportunity = op as unknown as Opportunity;

  // Scope check: ensure this opportunity belongs to a company the user owns
  const { data: ownerCheck } = await supabase
    .from("companies")
    .select("id")
    .eq("id", opportunity.company_id)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!ownerCheck) redirect(`/${locale}/dashboard/opportunities`);

  // Fetch all companies owned by the user for the form company selector
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", auth.user.id);

  const ownedCompanies = companies ?? [];

  // Inbound responses to this opportunity (Req 13). RLS
  // (opportunity_responses_read) only returns responses to opportunities the
  // caller owns, so this is safe with the cookie-aware user client.
  const { data: responseRows } = await supabase
    .from("opportunity_responses")
    .select("id, message, created_at, conversation_id, profiles(full_name)")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  const responses = (responseRows ?? []) as unknown as InboundResponse[];

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title={t("dashboard.edit")} />

      {opportunity.status === "rejected" && opportunity.rejected_reason && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="font-semibold">{t("status.rejected")}: </span>
          {opportunity.rejected_reason}
        </div>
      )}

      <OpportunityForm
        mode="edit"
        initial={opportunity}
        companies={ownedCompanies}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" />
          {t("responses.heading")}
          {responses.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({responses.length})
            </span>
          )}
        </h2>

        {responses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-card px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("responses.empty")}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {responses.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200 bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">
                    {r.profiles?.full_name ?? t("responses.anonymous")}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(r.created_at).toLocaleDateString(locale)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                  {r.message}
                </p>
                {r.conversation_id && (
                  <Link
                    href={`/dashboard/inbox/${r.conversation_id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t("responses.openThread")}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
