import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowUpRight, ClipboardCheck, Crown, FileText, Layers, Package, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { TierOverridePanel } from "@/components/admin/tier-override-panel";
import { VerificationTimeline } from "@/components/verification/timeline";
import { CompanyAvatar } from "@/components/console/companies/company-avatar";
import { PremiumPill, StagePill, TierPill } from "@/components/console/companies/company-pills";
import {
  CONSOLE_CARD as CARD,
  CompanyIdentityCard,
  CompanyLegalCard,
  getLegalRows,
  getReviewTimeline,
} from "@/components/console/companies/company-cards";
import { premiumActive } from "@/lib/console/companies";
import { isSegmentKey, type SegmentKey } from "@/lib/marketplace/segments";
import type { ReviewCompany } from "@/lib/verifications/actions";
import { COMPANY_STATUS, DOCUMENT_STATUS } from "@/constants/status";
import { TrustProfileForm } from "./trust-profile-form";
import { SegmentsForm } from "./segments-form";

const SECTION_TITLE = "font-display text-base font-semibold text-market-navy";
const GHOST_LINK =
  "inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50";

function Fact({ icon: Icon, label, value, footnote }: { icon: LucideIcon; label: string; value: string; footnote: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-market-navy" aria-hidden>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-words font-display text-lg font-semibold leading-tight text-market-navy">{value}</p>
        <p className="truncate text-xs text-slate-500">{footnote}</p>
      </div>
    </div>
  );
}

/**
 * The company sheet: the permanent record of a company — who it is, what it
 * sells, its documents, and what staff decides about it (trust tier, public
 * checks, marketplace segments). The review itself happens on the
 * verification file; this page links to it.
 */
export async function CompanySheet({ company }: { company: ReviewCompany }) {
  const t = await getTranslations("Admin.companies");
  const tStage = await getTranslations("Admin.verifications.stage");
  const tVerif = await getTranslations("Admin.verifications");
  const tBadge = await getTranslations("Trust.badge");
  const tPlan = await getTranslations("AdminRequests.fulfil.plans");
  const format = await getFormatter();

  const now = new Date();
  const date = (value: string) => format.dateTime(new Date(value), { dateStyle: "medium" });
  const [legalRows, timeline] = await Promise.all([getLegalRows(company), getReviewTimeline(company)]);

  const premium = premiumActive({ isPremium: company.isPremium, premiumExpiresAt: company.premiumExpiresAt }, now);
  const planLabel = company.premiumPlan && tPlan.has(company.premiumPlan) ? tPlan(company.premiumPlan) : tBadge("premium");
  const published = company.products.filter((p) => p.isPublished).length;
  const approvedDocs = company.documents.filter((d) => d.status === DOCUMENT_STATUS.APPROVED).length;
  const segments = company.segmentKeys.filter(isSegmentKey) as SegmentKey[];
  const isPublic = company.status === COMPANY_STATUS.VERIFIED;

  const premiumFoot = premium
    ? company.premiumExpiresAt
      ? t("sheet.facts.premiumUntil", { date: date(company.premiumExpiresAt) })
      : t("sheet.facts.premiumNoEnd")
    : company.isPremium && company.premiumExpiresAt
      ? t("sheet.facts.premiumEnded", { date: date(company.premiumExpiresAt) })
      : t("sheet.facts.premiumNoneFoot");

  return (
    <div className="space-y-4">
      <header>
        <Link href="/console/companies" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy">
          <ArrowLeft className="size-3.5" aria-hidden />
          {t("backToCompanies")}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <CompanyAvatar name={company.name} logoUrl={company.logoUrl} size="lg" />
            <div className="min-w-0">
              <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">{company.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StagePill stage={company.stage} label={tStage(company.stage)} />
                <TierPill tier={company.verificationTier} label={tBadge(company.verificationTier)} />
                {premium && <PremiumPill label={planLabel} />}
              </div>
              <p className="mt-1.5 text-sm text-slate-500">
                {t("registeredOn", { date: date(company.createdAt) })}
                {company.verifiedAt && ` · ${t("sheet.verifiedOn", { date: date(company.verifiedAt) })}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/console/verifications/${company.id}`} className={GHOST_LINK}>
              <ClipboardCheck className="size-3.5" aria-hidden />
              {t("sheet.verificationFile")}
            </Link>
            {isPublic && (
              <Link
                href={`/companies/${company.id}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
              >
                {t("sheet.publicPage")}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Fact icon={Package} label={t("sheet.facts.products")} value={format.number(company.products.length)} footnote={t("sheet.facts.productsFoot", { count: published })} />
        <Fact icon={FileText} label={t("sheet.facts.documents")} value={format.number(company.documents.length)} footnote={t("sheet.facts.documentsFoot", { count: approvedDocs })} />
        <Fact icon={Layers} label={t("sheet.facts.segments")} value={format.number(segments.length)} footnote={t("sheet.facts.segmentsFoot")} />
        <Fact icon={Crown} label={t("sheet.facts.premium")} value={premium ? planLabel : t("sheet.facts.premiumNone")} footnote={premiumFoot} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          <CompanyIdentityCard company={company} headingId="sheet-company" showName={false} />
          <CompanyLegalCard company={company} rows={legalRows} headingId="sheet-legal" />

          <section aria-labelledby="sheet-products" className={CARD}>
            <h2 id="sheet-products" className={SECTION_TITLE}>{t("products.title", { count: company.products.length })}</h2>
            {company.products.length === 0 ? (
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">{t("products.empty")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {company.products.map((product) => (
                  <li key={product.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-market-navy">{product.name}</p>
                      {product.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{product.description}</p>}
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
                        product.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-500 ring-1 ring-slate-200"
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" aria-hidden />
                      {t(product.isPublished ? "sheet.published" : "sheet.draft")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="sheet-documents" className={CARD}>
            <div className="mb-3">
              <h2 id="sheet-documents" className={SECTION_TITLE}>{t("documents.title", { count: company.documents.length })}</h2>
              <p className="text-xs text-slate-500">{tVerif("detail.documentsHint")}</p>
            </div>
            <DocumentViewer documents={company.documents} missingTypes={company.missingDocuments} />
          </section>

          <section aria-labelledby="sheet-trust" className={CARD}>
            <h2 id="sheet-trust" className={SECTION_TITLE}>{t("trustProfile.title")}</h2>
            <p className="mb-4 text-xs text-slate-500">{t("sheet.trustHint")}</p>
            <TrustProfileForm companyId={company.id} initialTier={company.verificationTier} initialSummary={company.verificationSummary} />
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <section aria-labelledby="sheet-tier" className={CARD}>
            <h2 id="sheet-tier" className={SECTION_TITLE}>{t("tier.title")}</h2>
            <p className="mb-3 text-xs text-slate-500">{t("tier.hint")}</p>
            <TierOverridePanel companyId={company.id} initialTier={company.verificationTier} />
          </section>

          <section aria-labelledby="sheet-segments" className={CARD}>
            <h2 id="sheet-segments" className={SECTION_TITLE}>{t("segments.title")}</h2>
            <p className="mb-3 text-xs text-slate-500">{t("sheet.segmentsHint")}</p>
            <SegmentsForm companyId={company.id} initial={segments} />
          </section>

          <section aria-labelledby="sheet-history" className={CARD}>
            <h2 id="sheet-history" className={cn(SECTION_TITLE, "mb-3")}>{tVerif("detail.reviewHistory")}</h2>
            <VerificationTimeline items={timeline} empty={tVerif("detail.noReviews")} />
          </section>
        </aside>
      </div>
    </div>
  );
}
