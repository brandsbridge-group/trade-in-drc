"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useDashboardStore } from "@/stores/dashboard-store";
import { RfqList } from "@/components/dashboard/rfq-list";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@/i18n/routing";
import { Plus, AlertCircle, Inbox } from "lucide-react";
import { COMPANY_STATUS } from "@/constants/status";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/design";

/**
 * Count inbound responses across the active company's posted opportunities.
 *
 * RFQ listings and opportunities are answered through secure messaging /
 * opportunity_responses; this surfaces "inbound interest" so a poster sees
 * activity (Req 13). RLS (opportunity_responses_read) restricts rows to
 * opportunities the caller owns, so the count is owner-scoped automatically.
 */
function useInboundInterest(companyId: string | undefined) {
  return useQuery({
    queryKey: ["rfq-inbound-interest", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const supabase = createClient();
      const { data: opps, error: oppErr } = await supabase
        .from("opportunities")
        .select("id")
        .eq("company_id", companyId as string);
      if (oppErr) throw oppErr;
      const oppIds = (opps ?? []).map((o) => (o as { id: string }).id);
      if (oppIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("opportunity_responses")
        .select("id", { count: "exact", head: true })
        .in("opportunity_id", oppIds);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export default function RfqPage() {
  const t = useTranslations("RfqBoard");
  const { user } = useAuth();
  const { data: companies, isLoading } = useCompanies(user?.id);
  const { activeCompanyId, setActiveCompany } = useDashboardStore();

  const verifiedCompanies = companies?.filter(
    (c) => c.status === COMPANY_STATUS.VERIFIED
  );

  const selectedId = activeCompanyId || verifiedCompanies?.[0]?.id;
  const { data: inboundInterest } = useInboundInterest(selectedId);

  if (isLoading) {
    return (
      <div className="max-w-5xl">
        <PageHeader title={t("title")} />
        <div className="h-32 bg-muted animate-pulse rounded-xl mt-4" />
      </div>
    );
  }

  if (!verifiedCompanies?.length) {
    return (
      <div className="max-w-5xl">
        <PageHeader title={t("title")} />
        <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">{t("verificationRequired")}</p>
            <p className="text-sm text-amber-700 mt-1">
              {t("verificationRequiredBody")}{" "}
              <Link href="/dashboard/companies" className="underline text-primary">
                {t("checkVerificationStatus")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/rfq/new">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t("createListing")}
            </Link>
          </Button>
        }
      />

      {verifiedCompanies.length > 1 && (
        <Select value={selectedId} onValueChange={setActiveCompany}>
          <SelectTrigger className="w-64 h-9 text-sm mt-4 mb-4">
            <SelectValue placeholder={t("selectCompany")} />
          </SelectTrigger>
          <SelectContent>
            {verifiedCompanies.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-sm">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Inbound interest: responses to this company's opportunities (Req 13). */}
      <Link
        href="/dashboard/inbox"
        className="mt-4 mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-card px-4 py-3 transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Inbox className="h-4 w-4" />
          {t("inboundInterest")}
        </span>
        <span className="inline-flex items-center justify-center min-w-7 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
          {inboundInterest ?? 0}
        </span>
      </Link>

      {selectedId && <RfqList companyId={selectedId} />}
    </div>
  );
}
