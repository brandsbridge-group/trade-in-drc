import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Building2, Calendar, Check, Globe, Mail, MapPin, Package, Phone, UserRound, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { DecisionPanel } from "@/components/admin/decision-panel";
import { VerificationTimeline, toneOfDecision, type TimelineItem } from "@/components/verification/timeline";
import { getCompanyForReview } from "@/lib/verifications/actions";
import { REVIEW_TARGET_DAYS, daysBetween, isTierOverride, sortEvents } from "@/lib/verifications/workflow";
import { isHomeCountry, type LegalIdentity } from "@/lib/verifications/required-documents";
import { DOCUMENT_STATUS } from "@/constants/status";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

const CARD = "rounded-2xl bg-white p-5 ring-1 ring-slate-200/70";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-wider text-slate-400";

const STAGE_PILL: Record<string, string> = {
  not_submitted: "bg-slate-100 text-slate-600",
  to_review: "bg-blue-50 text-blue-700",
  awaiting_owner: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

/**
 * One verification file: what the company declared (identity, legal numbers,
 * documents), whether it is complete, the reviewer's decision, and the whole
 * trail of the file — who did what, when.
 */
export default async function VerificationDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations("Admin.verifications");
  const tBadge = await getTranslations("Trust.badge");
  const tForm = await getTranslations("RegisterCompany");
  const format = await getFormatter();

  const company = await getCompanyForReview(id, locale);
  if (!company) {
    redirect(`/${locale}/console/verifications`);
  }

  const now = new Date();
  const dateTime = (value: string) =>
    format.dateTime(new Date(value), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const home = isHomeCountry(company.country);
  const location = [company.address, company.city, company.province, company.country].filter(Boolean).join(", ");
  const waiting = daysBetween(company.submittedAt, now);
  const incomplete = company.missingDocuments.length > 0 || company.missingLegal.length > 0;
  const refused = company.documents.filter((d) => d.status === DOCUMENT_STATUS.REJECTED).length;

  const legalRows: { key: keyof LegalIdentity; label: string; value: string }[] = [
    { key: "registrationNumber", label: tForm(home ? "fields.rccmNumber" : "fields.registrationNumber"), value: company.legal.registrationNumber },
    { key: "taxId", label: tForm(home ? "fields.nif" : "fields.taxIdIntl"), value: company.legal.taxId },
    { key: "nationalId", label: tForm(home ? "fields.nationalId" : "fields.nationalIdIntl"), value: company.legal.nationalId },
    {
      key: "legalForm",
      label: tForm("fields.legalForm"),
      value: company.legal.legalForm && tForm.has(`legalForms.${company.legal.legalForm}`) ? tForm(`legalForms.${company.legal.legalForm}`) : company.legal.legalForm,
    },
    { key: "yearEstablished", label: tForm("fields.yearEstablished"), value: company.legal.yearEstablished },
    {
      key: "employees",
      label: tForm("fields.employees"),
      value: company.legal.employees && tForm.has(`employeeRanges.${company.legal.employees}`) ? tForm(`employeeRanges.${company.legal.employees}`) : company.legal.employees,
    },
  ];

  const timeline: TimelineItem[] = sortEvents(company.reviews).map((review) => ({
    id: review.id,
    tone: toneOfDecision(review.decision),
    title: t(isTierOverride(review) ? "timeline.tierOverride" : `decisionValues.${review.decision}`),
    date: dateTime(review.createdAt),
    actor: review.byOwner ? t("timeline.byCompany") : (review.actorName ?? t("timeline.byStaff")),
    // Staff see every note; the tier marker is spelled out instead of shown raw.
    notes: isTierOverride(review)
      ? t("timeline.tierOverrideNote", { tier: review.notes?.replace("tier:", "") ?? "" })
      : review.byOwner
        ? null
        : review.notes,
  }));

  const initials = (value: string) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  const place = [company.city, company.country].filter(Boolean).join(", ");
  const tradingName = company.intake.tradingName && company.intake.tradingName !== company.name ? company.intake.tradingName : null;
  const profileLabel = company.intake.registrationProfile
    ? t(`detail.intake.profiles.${company.intake.registrationProfile === "international" ? "international" : "congolese"}`)
    : null;
  const websiteHref = company.website ? (/^https?:\/\//i.test(company.website) ? company.website : `https://${company.website}`) : null;

  // The company's own contact channels — each one opens the matching app.
  type ContactRow = { icon: LucideIcon; label: string; value: string; href?: string; external?: boolean };
  const contactRows: ContactRow[] = [];
  if (company.contactEmail) contactRows.push({ icon: Mail, label: tForm("fields.officialEmail"), value: company.contactEmail, href: `mailto:${company.contactEmail}` });
  if (company.contactPhone) contactRows.push({ icon: Phone, label: tForm("fields.phone"), value: company.contactPhone, href: `tel:${company.contactPhone.replace(/\s+/g, "")}` });
  if (company.website && websiteHref) contactRows.push({ icon: Globe, label: tForm("fields.website"), value: company.website.replace(/^https?:\/\//i, "").replace(/\/$/, ""), href: websiteHref, external: true });
  if (location) contactRows.push({ icon: MapPin, label: t("detail.card.address"), value: location });

  const contactPerson = [company.intake.contactPerson, company.intake.jobTitle].filter(Boolean).join(" — ") || null;
  const ownerLabel = company.ownerName ?? company.ownerEmail;
  const declaredChips = [
    { label: t("detail.intake.interests"), values: company.intake.drcInterests },
    { label: t("detail.intake.provinces"), values: company.intake.targetProvinces },
  ].filter((group) => group.values.length > 0);

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

          <section aria-labelledby="review-company" className={CARD}>
            <h2 id="review-company" className="sr-only">{t("detail.companyInfo")}</h2>

            {/* Identity: who this is, at a glance. */}
            <div className="flex flex-wrap items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-market-navy font-display text-lg font-semibold text-market-or-light" aria-hidden>
                {initials(company.name) || <Building2 className="h-6 w-6" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold leading-tight text-market-navy">{company.name}</p>
                {tradingName && <p className="mt-0.5 text-[13px] text-slate-500">{t("detail.card.tradingAs", { name: tradingName })}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    { icon: Package, value: company.sectorName },
                    { icon: Building2, value: profileLabel },
                    { icon: MapPin, value: place || null },
                  ]
                    .filter((chip) => chip.value)
                    .map(({ icon: Icon, value }) => (
                      <span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-700">
                        <Icon className="h-3 w-3 text-slate-500" aria-hidden />
                        {value}
                      </span>
                    ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className={EYEBROW}>{t("detail.card.registered")}</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-market-navy">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                  {dateTime(company.createdAt)}
                </p>
              </div>
            </div>

            {/* What the company says about itself — shown in full: the reviewer reads it. */}
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className={EYEBROW}>{t("detail.card.about")}</p>
              <p className={cn("mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed", company.description ? "text-slate-700" : "text-slate-400")}>
                {company.description || t("detail.card.noDescription")}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <p className={EYEBROW}>{t("detail.card.contactTitle")}</p>
                <ul className="mt-2 space-y-2.5">
                  {contactRows.map(({ icon: Icon, label, value, href, external }) => (
                    <li key={label} className="flex min-w-0 items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500" aria-hidden>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11.5px] text-slate-500">{label}</p>
                        {href ? (
                          <a
                            href={href}
                            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            className="inline-flex max-w-full items-center gap-1 break-all text-[13px] font-medium text-market-navy underline-offset-2 transition-colors hover:text-market-or-dark hover:underline"
                          >
                            {value}
                            {external && <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />}
                          </a>
                        ) : (
                          <p className="break-words text-[13px] font-medium text-market-navy">{value}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0">
                <p className={EYEBROW}>{t("detail.card.ownerTitle")}</p>
                <div className="mt-2 rounded-xl p-3 ring-1 ring-slate-200/70">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-market-cream text-[12px] font-semibold text-market-navy" aria-hidden>
                      {ownerLabel ? initials(ownerLabel) : <UserRound className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-market-navy">{company.ownerName ?? t("detail.card.accountOwner")}</p>
                      {company.ownerEmail && (
                        <a href={`mailto:${company.ownerEmail}`} className="block truncate text-xs text-slate-500 transition-colors hover:text-market-navy">
                          {company.ownerEmail}
                        </a>
                      )}
                    </div>
                  </div>
                  {contactPerson && (
                    <div className="mt-3 border-t border-slate-100 pt-2.5">
                      <p className="text-[11.5px] text-slate-500">{tForm("fields.contactPerson")}</p>
                      <p className="break-words text-[13px] font-medium text-market-navy">{contactPerson}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(company.intake.headOffice || declaredChips.length > 0) && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className={EYEBROW}>{t("detail.card.declaredTitle")}</p>
                {company.intake.headOffice && (
                  <p className="mt-2 text-[13px] text-slate-600">
                    <span className="text-slate-500">{t("detail.intake.headOffice")} : </span>
                    <span className="font-medium text-market-navy">{company.intake.headOffice}</span>
                  </p>
                )}
                {declaredChips.map((group) => (
                  <div key={group.label} className="mt-2.5">
                    <p className="text-[11.5px] text-slate-500">{group.label}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {group.values.map((value) => (
                        <span key={value} className="rounded-full bg-market-cream px-2.5 py-1 text-[11.5px] font-medium text-market-navy">{value}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="review-legal" className={CARD}>
            <h2 id="review-legal" className="font-display text-base font-semibold text-market-navy">{t("detail.legalTitle")}</h2>
            <p className="text-xs text-slate-500">{t("detail.legalHint")}</p>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {legalRows.map((row) => {
                const missing = company.missingLegal.includes(row.key);
                return (
                  <div key={row.key} className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2.5 text-[13px]">
                    <dt className="min-w-0 text-slate-500">{row.label}</dt>
                    <dd className={cn("min-w-0 text-right font-semibold", row.value ? "text-market-navy" : missing ? "text-amber-700" : "font-normal text-slate-400")}>
                      {row.value || t(missing ? "detail.requiredMissing" : "detail.notProvided")}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

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
