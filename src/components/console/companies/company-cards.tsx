import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowUpRight, Building2, Calendar, Globe, Mail, MapPin, Package, Phone, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { companyInitials } from "@/lib/console/companies";
import { isHomeCountry, type LegalIdentity } from "@/lib/verifications/required-documents";
import { isTierOverride, sortEvents } from "@/lib/verifications/workflow";
import { toneOfDecision, type TimelineItem } from "@/components/verification/timeline";
import type { ReviewCompany } from "@/lib/verifications/actions";
import { CompanyAvatar } from "./company-avatar";

export const CONSOLE_CARD = "rounded-2xl bg-white p-5 ring-1 ring-slate-200/70";
export const CONSOLE_EYEBROW = "text-[11px] font-semibold uppercase tracking-wider text-slate-400";

export interface LegalRow {
  key: keyof LegalIdentity;
  label: string;
  value: string;
}

/**
 * The legal identifiers a company declared, labelled for its country (RCCM and
 * NIF in the DRC, their generic names abroad). Shared by the legal card and by
 * the "what is missing" banner of the verification file.
 */
export async function getLegalRows(company: Pick<ReviewCompany, "country" | "legal">): Promise<LegalRow[]> {
  const tForm = await getTranslations("RegisterCompany");
  const home = isHomeCountry(company.country);
  const { legal } = company;
  return [
    { key: "registrationNumber", label: tForm(home ? "fields.rccmNumber" : "fields.registrationNumber"), value: legal.registrationNumber },
    { key: "taxId", label: tForm(home ? "fields.nif" : "fields.taxIdIntl"), value: legal.taxId },
    { key: "nationalId", label: tForm(home ? "fields.nationalId" : "fields.nationalIdIntl"), value: legal.nationalId },
    {
      key: "legalForm",
      label: tForm("fields.legalForm"),
      value: legal.legalForm && tForm.has(`legalForms.${legal.legalForm}`) ? tForm(`legalForms.${legal.legalForm}`) : legal.legalForm,
    },
    { key: "yearEstablished", label: tForm("fields.yearEstablished"), value: legal.yearEstablished },
    {
      key: "employees",
      label: tForm("fields.employees"),
      value: legal.employees && tForm.has(`employeeRanges.${legal.employees}`) ? tForm(`employeeRanges.${legal.employees}`) : legal.employees,
    },
  ];
}

/**
 * The trail of a company's verification file, newest first, worded for staff:
 * every note is shown, and a manual tier change is spelled out instead of
 * showing its raw marker.
 */
export async function getReviewTimeline(company: Pick<ReviewCompany, "reviews">): Promise<TimelineItem[]> {
  const t = await getTranslations("Admin.verifications");
  const format = await getFormatter();
  return sortEvents(company.reviews).map((review) => ({
    id: review.id,
    tone: toneOfDecision(review.decision),
    title: t(isTierOverride(review) ? "timeline.tierOverride" : `decisionValues.${review.decision}`),
    date: format.dateTime(new Date(review.createdAt), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    actor: review.byOwner ? t("timeline.byCompany") : (review.actorName ?? t("timeline.byStaff")),
    notes: isTierOverride(review)
      ? t("timeline.tierOverrideNote", { tier: review.notes?.replace("tier:", "") ?? "" })
      : review.byOwner
        ? null
        : review.notes,
  }));
}

/**
 * Who a company is, at a glance: identity, what it says about itself, how to
 * reach it, who holds the account, and what it declared at registration.
 * Shared by the verification file and the company sheet.
 */
export async function CompanyIdentityCard({
  company,
  headingId,
  showName = true,
}: {
  company: ReviewCompany;
  headingId: string;
  /** False where the page header already carries the logo, the name and the registration date. */
  showName?: boolean;
}) {
  const t = await getTranslations("Admin.verifications");
  const tForm = await getTranslations("RegisterCompany");
  const format = await getFormatter();

  const location = [company.address, company.city, company.province, company.country].filter(Boolean).join(", ");
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
  const chips = [
    { icon: Package, value: company.sectorName },
    { icon: Building2, value: profileLabel },
    { icon: MapPin, value: place || null },
  ].filter((chip) => chip.value);
  const chipRow = (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(({ icon: Icon, value }) => (
        <span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-700">
          <Icon className="h-3 w-3 text-slate-500" aria-hidden />
          {value}
        </span>
      ))}
    </div>
  );

  return (
    <section aria-labelledby={headingId} className={CONSOLE_CARD}>
      <h2 id={headingId} className="sr-only">{t("detail.companyInfo")}</h2>

      {showName ? (
        // Identity: who this is, at a glance.
        <div className="flex flex-wrap items-start gap-4">
          <CompanyAvatar name={company.name} logoUrl={company.logoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold leading-tight text-market-navy">{company.name}</p>
            {tradingName && <p className="mt-0.5 text-[13px] text-slate-500">{t("detail.card.tradingAs", { name: tradingName })}</p>}
            <div className="mt-2">{chipRow}</div>
          </div>
          <div className="shrink-0 text-right">
            <p className={CONSOLE_EYEBROW}>{t("detail.card.registered")}</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-market-navy">
              <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              {format.dateTime(new Date(company.createdAt), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {tradingName && <p className="mb-2 text-[13px] text-slate-500">{t("detail.card.tradingAs", { name: tradingName })}</p>}
          {chipRow}
        </div>
      )}

      {/* What the company says about itself — shown in full: the reviewer reads it. */}
      <div className={cn("rounded-xl bg-slate-50 p-4", (showName || chips.length > 0 || tradingName) && "mt-4")}>
        <p className={CONSOLE_EYEBROW}>{t("detail.card.about")}</p>
        <p className={cn("mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed", company.description ? "text-slate-700" : "text-slate-400")}>
          {company.description || t("detail.card.noDescription")}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <p className={CONSOLE_EYEBROW}>{t("detail.card.contactTitle")}</p>
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
          <p className={CONSOLE_EYEBROW}>{t("detail.card.ownerTitle")}</p>
          <div className="mt-2 rounded-xl p-3 ring-1 ring-slate-200/70">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-market-cream text-[12px] font-semibold text-market-navy" aria-hidden>
                {ownerLabel ? companyInitials(ownerLabel) : <UserRound className="h-4 w-4" />}
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
          <p className={CONSOLE_EYEBROW}>{t("detail.card.declaredTitle")}</p>
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
  );
}

/** The declared legal identity; a required identifier still missing is flagged in amber. */
export async function CompanyLegalCard({ company, rows, headingId }: { company: Pick<ReviewCompany, "missingLegal">; rows: LegalRow[]; headingId: string }) {
  const t = await getTranslations("Admin.verifications");
  return (
    <section aria-labelledby={headingId} className={CONSOLE_CARD}>
      <h2 id={headingId} className="font-display text-base font-semibold text-market-navy">{t("detail.legalTitle")}</h2>
      <p className="text-xs text-slate-500">{t("detail.legalHint")}</p>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {rows.map((row) => {
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
  );
}
