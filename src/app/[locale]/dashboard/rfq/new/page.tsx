"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useDashboardStore } from "@/stores/dashboard-store";
import { RfqForm } from "@/components/dashboard/rfq-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { COMPANY_STATUS } from "@/constants/status";
import { PageHeader } from "@/components/design";

export default function NewRfqPage() {
  const { user } = useAuth();
  const t = useTranslations("RfqBoard");
  const { data: companies } = useCompanies(user?.id);
  const { activeCompanyId, setActiveCompany } = useDashboardStore();

  const verifiedCompanies = companies?.filter(
    (c) => c.status === COMPANY_STATUS.VERIFIED
  );

  const selectedId = activeCompanyId || verifiedCompanies?.[0]?.id;

  return (
    <div className="max-w-5xl">
      <Link
        href="/dashboard/rfq"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("backToListings")}
      </Link>

      <PageHeader
        title={t("createTitle")}
        subtitle={t("createSubtitle")}
      />

      {verifiedCompanies && verifiedCompanies.length > 1 && (
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

      {selectedId && <RfqForm companyId={selectedId} />}
    </div>
  );
}
