"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useDashboardStore } from "@/stores/dashboard-store";
import { ProductsManager } from "@/components/dashboard/products/products-manager";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";

export default function ProductsPage() {
  const t = useTranslations("Dashboard.products");
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
    return <p className="py-10 text-center text-sm text-slate-500">{t("signInRequired")}</p>;
  }

  const selected = companies?.find((c) => c.id === selectedCompanyId);

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {companies && companies.length > 1 && (
            <Select value={selectedCompanyId ?? ""} onValueChange={setActiveCompany}>
              <SelectTrigger aria-label={t("companyLabel")} className="h-10 w-60 rounded-full border-slate-200 bg-white text-sm">
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
          )}
          {selected && (
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-market-or text-market-navy">
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </span>
              {t("addProduct")}
            </Link>
          )}
        </div>
      </header>

      {loadingCompanies ? (
        <CardSkeleton rows={6} />
      ) : !selected ? (
        <section className="relative overflow-hidden rounded-3xl bg-market-navy p-8 text-center text-white sm:p-10">
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-market-or/25 blur-3xl" />
          <h2 className="relative font-display text-xl font-semibold">{t("noCompany")}</h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-white/70">{t("noCompanyBody")}</p>
          <Link
            href="/dashboard/companies/new"
            className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-market-or px-5 py-2.5 text-[13px] font-bold text-market-navy transition-colors hover:bg-market-or-light"
          >
            {t("registerCompany")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      ) : (
        // key: a fresh toolbar (search, filters) per company.
        <ProductsManager key={selected.id} companyId={selected.id} company={{ name: selected.name, status: selected.status }} />
      )}
    </div>
  );
}
