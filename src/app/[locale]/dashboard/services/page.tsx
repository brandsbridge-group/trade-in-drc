"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useDashboardStore } from "@/stores/dashboard-store";
import { ServiceList } from "@/components/dashboard/service-list";
import { PageHeader } from "@/components/design";

export default function ServicesPage() {
  const t = useTranslations("Dashboard.services");
  const { user } = useAuth();
  const { data: companies, isLoading: loadingCompanies } = useCompanies(user?.id);
  const { activeCompanyId, setActiveCompany } = useDashboardStore();

  const selectedCompanyId = React.useMemo(() => {
    if (!companies || companies.length === 0) return null;
    if (activeCompanyId && companies.some((c) => c.id === activeCompanyId)) {
      return activeCompanyId;
    }
    return companies[0].id;
  }, [companies, activeCompanyId]);

  React.useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== activeCompanyId) {
      setActiveCompany(selectedCompanyId);
    }
  }, [selectedCompanyId, activeCompanyId, setActiveCompany]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-slate-500">{t("signInRequired")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      <PageHeader
        title={t("title")}
        action={
          selectedCompanyId ? (
            <Button size="sm" asChild>
              <Link href="/dashboard/services/new">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {t("addService")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {loadingCompanies ? (
        <div className="h-8 w-48 bg-muted animate-pulse rounded-sm" />
      ) : !companies || companies.length === 0 ? (
        <div className="bg-card border border-slate-200 rounded-2xl p-6 text-center">
          <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">{t("noCompany")}</p>
          <p className="text-xs text-muted-foreground mb-4">{t("noCompanyBody")}</p>
          <Button size="sm" asChild variant="outline">
            <Link href="/dashboard/companies">{t("registerCompany")}</Link>
          </Button>
        </div>
      ) : (
        <>
          {companies.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("companyLabel")}</span>
              <Select value={selectedCompanyId ?? ""} onValueChange={setActiveCompany}>
                <SelectTrigger className="h-8 text-sm w-56">
                  <SelectValue placeholder={t("selectCompany")} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id} className="text-sm">
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCompanyId && <ServiceList companyId={selectedCompanyId} />}
        </>
      )}
    </div>
  );
}
