"use client";

import { latestStaffMessage } from "@/lib/verifications/workflow";
import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Clock, Crown, ExternalLink, FileWarning, MapPin, Package, Pencil, Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { canViewPublicProfile, resolveSectorLabel } from "@/lib/dashboard/company-display";
import { fetchOwnerContent } from "@/lib/dashboard/overview/queries";
import { completenessHref, profileCompleteness } from "@/lib/dashboard/overview/profile-completeness";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import { COMPANY_STATUS, VERIFICATION_DECISION } from "@/constants/status";
import type { Locale } from "@/config/locales";

interface SectorRef {
  name_en: string | null;
  name_fr: string | null;
}

interface Company {
  id: string;
  name: string;
  status: string;
  sectors: SectorRef | SectorRef[] | null;
  country: string | null;
  city: string | null;
  logo_url: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  certifications: string[] | null;
  markets: string[] | null;
  is_premium: boolean;
  verification_reviews: { decision: string; notes?: string | null; created_at: string }[] | null;
}

/** Where the company stands, as the owner should read it. */
type Stage = "pending_documents" | "pending" | "more_info" | "rejected" | "verified";

const STAGE: Record<Stage, { pill: string; band: string; icon: LucideIcon; iconTone: string }> = {
  pending_documents: { pill: "bg-amber-100 text-amber-800", band: "bg-market-cream", icon: FileWarning, iconTone: "text-market-or-dark" },
  pending: { pill: "bg-blue-50 text-blue-700", band: "bg-blue-50", icon: Clock, iconTone: "text-blue-700" },
  more_info: { pill: "bg-amber-100 text-amber-800", band: "bg-amber-50", icon: ShieldAlert, iconTone: "text-amber-700" },
  rejected: { pill: "bg-red-50 text-red-700", band: "bg-red-50", icon: ShieldAlert, iconTone: "text-red-700" },
  verified: { pill: "bg-emerald-50 text-emerald-700", band: "bg-emerald-50", icon: ShieldCheck, iconTone: "text-emerald-700" },
};

function stageOf(company: Company): Stage {
  if (company.status === COMPANY_STATUS.VERIFIED) return "verified";
  if (company.status === COMPANY_STATUS.REJECTED) return "rejected";
  if (company.status === COMPANY_STATUS.PENDING) {
    const latest = [...(company.verification_reviews ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return latest?.decision === VERIFICATION_DECISION.MORE_INFO_REQUESTED ? "more_info" : "pending";
  }
  return "pending_documents";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const NAVY_PILL =
  "inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep";
const SOFT_PILL =
  "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-[13px] font-semibold text-market-navy transition-colors hover:bg-slate-200";

/** "My companies": one card per company — identity, where it stands, and the next thing to do. */
export default function DashboardCompaniesPage() {
  const t = useTranslations("Dashboard");
  const tp = useTranslations("Dashboard.companiesPage");
  const tStatus = useTranslations("CompanyVerification.status");
  const format = useFormatter();
  const locale = useLocale();
  const { user } = useAuth();
  const { data, isLoading } = useCompanies(user?.id);

  const companies = React.useMemo(() => (data ?? []) as unknown as Company[], [data]);
  const companyIds = React.useMemo(() => companies.map((c) => c.id), [companies]);
  const content = useQuery({
    queryKey: ["overview", "content", companyIds],
    queryFn: () => fetchOwnerContent(companyIds),
    enabled: companyIds.length > 0,
  });

  const addButton = (
    <Link href="/dashboard/companies/new" className={NAVY_PILL}>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-market-or text-market-navy">
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </span>
      {t("registerCompany")}
    </Link>
  );

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
            {t("myCompanies")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {companies.length > 0 ? tp("subtitle", { count: companies.length }) : tp("subtitleEmpty")}
          </p>
        </div>
        {companies.length > 0 && addButton}
      </header>

      {isLoading ? (
        <CardSkeleton rows={5} />
      ) : companies.length === 0 ? (
        <section className="relative overflow-hidden rounded-3xl bg-market-navy p-8 text-center text-white sm:p-10">
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-market-or/25 blur-3xl" />
          <h2 className="relative font-display text-xl font-semibold">{t("noCompaniesYet")}</h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-white/70">{t("noCompaniesYetBody")}</p>
          <Link
            href="/dashboard/companies/new"
            className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-market-or px-5 py-2.5 text-[13px] font-bold text-market-navy transition-colors hover:bg-market-or-light"
          >
            {t("registerCompany")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      ) : (
        <>
          {companies.map((company) => {
            const stage = stageOf(company);
            const tone = STAGE[stage];
            const StageIcon = tone.icon;
            const sectorLabel = resolveSectorLabel(company.sectors, locale as Locale);
            const place = [company.city, company.country].filter(Boolean).join(", ");
            const productCount = content.data?.productCountByCompany[company.id] ?? 0;
            const completeness = content.data
              ? profileCompleteness({
                  ...company,
                  photoCount: content.data.photoCountByCompany[company.id] ?? 0,
                  productCount,
                })
              : null;
            const verificationHref = `/dashboard/companies/${company.id}/verification`;
            const teamMessage = latestStaffMessage(
              (company.verification_reviews ?? []).map((r) => ({ decision: r.decision, notes: r.notes ?? null, createdAt: r.created_at }))
            );

            return (
              <article key={company.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
                <div className="flex flex-wrap items-center gap-4 p-5">
                  {company.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- owner logo, small avatar
                    <img src={company.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-white object-cover ring-1 ring-slate-200" />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-market-navy font-display text-lg font-semibold text-market-or-light" aria-hidden>
                      {initials(company.name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 basis-[220px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-display text-lg font-semibold text-market-navy">{company.name}</h2>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", tone.pill)}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                        {tStatus(stage)}
                      </span>
                      {company.is_premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-market-navy px-2.5 py-1 text-[11.5px] font-semibold text-market-or-light">
                          <Crown className="h-3 w-3" aria-hidden />
                          {tp("premium")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-slate-500">
                      {sectorLabel && <span>{sectorLabel}</span>}
                      {sectorLabel && place && <span className="text-slate-300" aria-hidden>·</span>}
                      {place && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {place}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canViewPublicProfile(company.status) ? (
                      <Link href={`/companies/${company.id}`} className={SOFT_PILL}>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        {tp("publicProfile")}
                      </Link>
                    ) : (
                      // Not a link yet: the public page only exists once the company is verified.
                      <span
                        title={t("viewProfilePendingHint")}
                        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-2 text-[13px] font-semibold text-slate-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        {tp("publicProfile")}
                        <span className="sr-only"> — {t("viewProfilePendingHint")}</span>
                      </span>
                    )}
                    <Link href={`/dashboard/companies/${company.id}/edit`} className={SOFT_PILL}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      {t("edit")}
                    </Link>
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-3">
                  <div className="min-w-0 rounded-xl bg-slate-50 p-3.5">
                    <dt className="text-[11.5px] font-medium text-slate-500">{tp("completeness")}</dt>
                    <dd className="mt-1">
                      <span className="font-display text-xl font-semibold tabular-nums text-market-navy">
                        {completeness ? format.number(completeness.percent / 100, { style: "percent" }) : "—"}
                      </span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
                        <span className="block h-full rounded-full bg-market-or-dark" style={{ width: `${completeness?.percent ?? 0}%` }} />
                      </span>
                      {completeness && completeness.missing.length > 0 && (
                        <Link
                          href={completenessHref(company.id, completeness.missing[0])}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-market-navy hover:underline"
                        >
                          {tp("complete")}
                          <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      )}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-xl bg-slate-50 p-3.5">
                    <dt className="text-[11.5px] font-medium text-slate-500">{tp("products")}</dt>
                    <dd className="mt-1">
                      <span className="font-display text-xl font-semibold tabular-nums text-market-navy">
                        {content.data ? format.number(productCount) : "—"}
                      </span>
                      <Link
                        href={productCount > 0 ? "/dashboard/products" : "/dashboard/products/new"}
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-market-navy hover:underline"
                      >
                        <Package className="h-3 w-3" aria-hidden />
                        {tp(productCount > 0 ? "manageProducts" : "addProduct")}
                      </Link>
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-xl bg-slate-50 p-3.5">
                    <dt className="text-[11.5px] font-medium text-slate-500">{tp("visibility")}</dt>
                    <dd className="mt-1">
                      <span className="font-display text-xl font-semibold text-market-navy">
                        {tp(stage === "verified" ? "visibilityOn" : "visibilityOff")}
                      </span>
                      <span className="mt-2 block text-xs text-slate-500">
                        {tp(stage === "verified" ? "visibilityOnHint" : "visibilityOffHint")}
                      </span>
                    </dd>
                  </div>
                </dl>

                {/* The next thing to do for this company, by stage. */}
                <div className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", tone.band)}>
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white", tone.iconTone)} aria-hidden>
                    <StageIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1 basis-[220px]">
                    <p className="text-[13px] font-semibold text-market-navy">{tp(`next.${stage}.title`)}</p>
                    <p className="text-xs text-slate-600">{tp(`next.${stage}.body`)}</p>
                    {teamMessage && (
                      <p className="mt-1.5 line-clamp-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs text-slate-700" title={teamMessage.notes}>
                        <span className="font-semibold text-market-navy">{tp("teamMessage")} </span>
                        {teamMessage.notes}
                      </p>
                    )}
                  </div>
                  <Link href={verificationHref} className={stage === "pending" || stage === "verified" ? cn(SOFT_PILL, "bg-white hover:bg-white/70") : NAVY_PILL}>
                    {tp(`next.${stage}.cta`)}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </article>
            );
          })}

          <Link
            href="/dashboard/companies/new"
            className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-5 transition-colors hover:border-market-navy hover:bg-white"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-market-navy ring-1 ring-slate-200" aria-hidden>
              <Plus className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-market-navy">{tp("addAnother.title")}</span>
              <span className="block text-xs text-slate-500">{tp("addAnother.body")}</span>
            </span>
          </Link>
        </>
      )}
    </div>
  );
}
