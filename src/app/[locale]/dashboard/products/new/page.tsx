"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Building2 } from "lucide-react";
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
import { ProductForm } from "@/components/dashboard/product-form";
import { PageHeader } from "@/components/design";
import { AnimatedField } from "@/components/forms/animated-field";

export default function NewProductPage() {
  const { user } = useAuth();
  const t = useTranslations("Dashboard");
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
        <p className="text-sm text-slate-500">{t("products.signInToAdd")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <Link
        href="/dashboard/products"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("products.backToProducts")}
      </Link>
      <PageHeader title={t("products.addProduct")} />

      {loadingCompanies ? (
        <div className="space-y-3">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-sm" />
          <div className="h-8 bg-muted animate-pulse rounded-sm" />
        </div>
      ) : !companies || companies.length === 0 ? (
        <div className="bg-card border border-slate-200 rounded-2xl p-6 text-center">
          <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">{t("products.noCompany")}</p>
          <p className="text-xs text-muted-foreground mb-4">{t("products.noCompanyBody")}</p>
          <Button size="sm" asChild variant="outline">
            <Link href="/register-company">{t("products.registerCompany")}</Link>
          </Button>
        </div>
      ) : (
        <>
          {companies.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("products.companyLabel")}</span>
              <Select
                value={selectedCompanyId ?? ""}
                onValueChange={setActiveCompany}
              >
                <SelectTrigger className="h-8 text-sm w-56">
                  <SelectValue placeholder={t("products.selectCompany")} />
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

          <AnimatedField show={!!selectedCompanyId}>
            <div className="bg-card border border-slate-200 rounded-2xl p-4">
              {selectedCompanyId && <ProductForm companyId={selectedCompanyId} />}
            </div>
          </AnimatedField>
        </>
      )}
    </div>
  );
}
