import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { DecisionPanel } from "@/components/admin/decision-panel";
import { VerificationTimeline } from "@/components/verification/timeline";
import { getCompanyForReview } from "@/lib/verifications/actions";
import { REVIEW_TARGET_DAYS, daysBetween } from "@/lib/verifications/workflow";
import { CONSOLE_CARD as CARD, CompanyIdentityCard, CompanyLegalCard, getLegalRows, getReviewTimeline } from "@/components/console/companies/company-cards";
import { STAGE_PILL } from "@/components/console/companies/company-pills";
import { DOCUMENT_STATUS } from "@/constants/status";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

/**
 * One verification file: what the company declared (identity, legal numbers,
 * documents), whether it is complete, the reviewer's decision, and the whole
 * trail of the file — who did what, when.
 */
export default async function VerificationDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations("Admin.verifications");
  const tBadge = await getTranslations("Trust.badge");
  const format = await getFormatter();

  const company = await getCompanyForReview(id, locale);
  if (!company) {
    redirect(`/${locale}/console/verifications`);
  }

  const now = new Date();
  const dateTime = (value: string) =>
    format.dateTime(new Date(value), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const waiting = daysBetween(company.submittedAt, now);
  const incomplete = company.missingDocuments.length > 0 || company.missingLegal.length > 0;
  const refused = company.documents.filter((d) => d.status === DOCUMENT_STATUS.REJECTED).length;

  const legalRows = await getLegalRows(company);

  const timeline = await getReviewTimeline(company);

  return (
    <div className="space-y-4">
      <header>
        <Link href="/console/verifications" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("backToQueue")}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">{company.name}</h1>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", STAGE_PILL[company.stage])}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                {t(`stage.${company.stage}`)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600">
                {t("detail.currentTier")} : {tBadge(company.verificationTier)}
              </span>
            </div>
            <p className={cn("mt-1 text-sm", company.stage === "to_review" && waiting > REVIEW_TARGET_DAYS ? "font-medium text-red-700" : "text-slate-500")}>
              {company.stage === "not_submitted"
                ? t("detail.notSubmitted")
                : `${t("detail.submittedOn", { date: dateTime(company.submittedAt) })}${
                    company.stage === "to_review" || company.stage === "awaiting_owner" ? ` · ${t("waiting", { count: waiting })}` : ""
                  }`}
            </p>
          </div>
          <Link
            href={`/console/companies/${company.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            {t("detail.companySheet")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          {/* Is the file complete? The first thing a reviewer needs to know. */}
          <div
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-2xl p-4 ring-1",
              incomplete ? "bg-amber-50 ring-amber-200" : "bg-emerald-50 ring-emerald-100"
            )}
          >
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white", incomplete ? "text-amber-700" : "text-emerald-700")} aria-hidden>
              {incomplete ? <AlertTriangle className="h-[18px] w-[18px]" /> : <Check className="h-[18px] w-[18px]" />}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-market-navy">{t(incomplete ? "detail.incompleteTitle" : "detail.completeTitle")}</p>
              {incomplete ? (
                <ul className="mt-1 list-inside list-disc text-xs text-amber-900">
                  {company.missingDocuments.map((type) => (
                    <li key={type}>{t("detail.missingDocument", { name: t(`documents.type.${type}`) })}</li>
                  ))}
                  {company.missingLegal.map((key) => (
                    <li key={key}>{t("detail.missingLegal", { name: legalRows.find((r) => r.key === key)?.label ?? key })}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-800">{t("detail.completeBody")}</p>
              )}
            </div>
          </div>

          <CompanyIdentityCard company={company} headingId="review-company" />

          <CompanyLegalCard company={company} rows={legalRows} headingId="review-legal" />

          <section aria-labelledby="review-documents" className={CARD}>
            <div className="mb-3">
              <h2 id="review-documents" className="font-display text-base font-semibold text-market-navy">{t("detail.documents")}</h2>
              <p className="text-xs text-slate-500">{t("detail.documentsHint")}</p>
            </div>
            <DocumentViewer documents={company.documents} missingTypes={company.missingDocuments} />
          </section>

          <section aria-labelledby="review-products" className={CARD}>
            <h2 id="review-products" className="font-display text-base font-semibold text-market-navy">
              {t("detail.products", { count: company.products.length })}
            </h2>
            {company.products.length === 0 ? (
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">{t("detail.noProducts")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {company.products.map((product) => (
                  <li key={product.id} className="rounded-xl bg-slate-50 px-3.5 py-2.5">
                    <p className="text-[13px] font-semibold text-market-navy">{product.name}</p>
                    {product.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{product.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <section aria-labelledby="review-decision" className={CARD}>
            <h2 id="review-decision" className="font-display text-base font-semibold text-market-navy">{t("decision.title")}</h2>
            <p className="mb-3 text-xs text-slate-500">{t(`decision.hint.${company.stage}`)}</p>
            <DecisionPanel companyId={company.id} incomplete={incomplete} refusedDocuments={refused} />
          </section>

          <section aria-labelledby="review-history" className={CARD}>
            <h2 id="review-history" className="mb-3 font-display text-base font-semibold text-market-navy">{t("detail.reviewHistory")}</h2>
            <VerificationTimeline items={timeline} empty={t("detail.noReviews")} />
          </section>
        </aside>
      </div>
    </div>
  );
}
