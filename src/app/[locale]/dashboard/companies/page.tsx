"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/design";
import {
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Plus,
} from "lucide-react";
import {
  canViewPublicProfile,
  resolveSectorLabel,
} from "@/lib/dashboard/company-display";
import type { Locale } from "@/config/locales";

interface SectorRef {
  name_en: string | null;
  name_fr: string | null;
}

interface Company {
  id: string;
  name: string;
  sectors: SectorRef | SectorRef[] | null;
  status: "pending" | "verified" | "rejected" | "more_info_requested";
}

export default function DashboardCompaniesPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const { user } = useAuth();
  const { data: companies, isLoading } = useCompanies(user?.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="badge-verified">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t("verified")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {t("statusPending")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {t("rejected")}
          </Badge>
        );
      case "more_info_requested":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            {t("moreInfoNeeded")}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t("myCompanies")}
        action={
          <Button size="sm" asChild>
            <Link href="/register-company">
              <Plus className="w-4 h-4 mr-1" />
              {t("registerCompany")}
            </Link>
          </Button>
        }
      />

      <div className="mt-4 bg-card border border-slate-200 rounded-2xl">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (companies as unknown as Company[] | undefined)?.length ? (
            <div className="divide-y">
              {(companies as unknown as Company[]).map((company) => {
                const sectorLabel = resolveSectorLabel(company.sectors, locale as Locale);
                const canViewProfile = canViewPublicProfile(company.status);
                return (
                  <div key={company.id} className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-muted flex items-center justify-center rounded-sm shrink-0">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{company.name}</span>
                          {getStatusBadge(company.status)}
                        </div>
                        {sectorLabel && (
                          <p className="text-xs text-muted-foreground truncate">{sectorLabel}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canViewProfile ? (
                        <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                          <Link href={`/companies/${company.id}`}>
                            <Eye className="w-3 h-3 mr-1" />
                            {t("view")}
                          </Link>
                        </Button>
                      ) : (
                        // disabled:pointer-events-none on the Button primitive
                        // (src/components/ui/button.tsx) also blocks the
                        // browser's native title tooltip on the button itself,
                        // so the explanation is carried by this wrapping span
                        // instead — it isn't disabled and still receives
                        // pointer/hover events.
                        <span title={t("viewProfilePendingHint")}>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-7 text-xs px-2"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {t("view")}
                          </Button>
                        </span>
                      )}
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                        <Link href={`/dashboard/companies/${company.id}/edit`}>
                          <Edit className="w-3 h-3 mr-1" />
                          {t("edit")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">{t("noCompaniesYet")}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {t("noCompaniesYetBody")}
              </p>
              <Button size="sm" asChild>
                <Link href="/register-company">
                  <Plus className="w-4 h-4 mr-1" />
                  {t("registerCompany")}
                </Link>
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
