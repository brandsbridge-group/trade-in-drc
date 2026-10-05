"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { MessageSquareText,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  Eye,
  FileText,
  FolderPlus,
  Globe2,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Receipt,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { companiesQueryKey, useCompanies } from "@/hooks/use-companies";
import { STORAGE_BUCKETS } from "@/constants/storage";
import { COMPANY_STATUS, DOCUMENT_TYPE, VERIFICATION_DECISION } from "@/constants/status";
import {
  ACCEPTED_REGISTRATION_DOCUMENT_EXTENSIONS,
  MAX_REGISTRATION_DOCUMENT_BYTES,
  validateRegistrationDocument,
} from "@/lib/storage/registration-documents";
import { uploadCompanyDocument } from "@/components/register/market/upload-documents";
import {
  VERIFICATION_DOC_TYPES,
  isHomeCountry,
  legalFromSummary,
  missingDocTypes,
  missingLegalFields,
  requiredDocTypes,
  type VerificationDocType,
} from "@/lib/verifications/required-documents";
import { submitCompanyForReview } from "@/lib/verifications/owner-actions";
import { resubmitCompanyVerification } from "@/lib/verifications/actions";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import { LegalIdentityCard } from "./legal-identity-card";
import { VerificationTimeline, toneOfDecision } from "@/components/verification/timeline";
import { latestStaffMessage, ownerVisibleNotes, sortEvents } from "@/lib/verifications/workflow";

interface VerificationCompany {
  id: string;
  name: string;
  status: string;
  country: string | null;
  verification_summary: unknown;
  verification_reviews: { decision: string; notes: string | null; created_at: string }[] | null;
}

interface CompanyDocument {
  id: string;
  type: string;
  file_url: string;
  file_name: string;
  status: string;
  /** Reviewer's reason when the document was refused (00058). */
  review_note: string | null;
}

const DOC_ICON: Record<VerificationDocType, LucideIcon> = {
  [DOCUMENT_TYPE.BUSINESS_LICENSE]: Landmark,
  [DOCUMENT_TYPE.TAX_REGISTRATION]: Receipt,
  [DOCUMENT_TYPE.PROOF_OF_ADDRESS]: MapPin,
  [DOCUMENT_TYPE.ADDITIONAL_DOCUMENT]: FolderPlus,
};

const DOC_STATUS_DOT: Record<string, string> = {
  pending: "bg-slate-400",
  approved: "bg-emerald-500",
  rejected: "bg-market-red",
};

const STATUS_PILL: Record<string, string> = {
  pending_documents: "bg-amber-100 text-amber-800",
  pending: "bg-blue-50 text-blue-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const PHASES = ["documents", "review", "published"] as const;

const documentsQueryKey = (companyId: string) => ["company-documents", companyId] as const;

async function fetchDocuments(companyId: string): Promise<CompanyDocument[]> {
  const { data, error } = await createClient()
    .from("company_documents")
    .select("id, type, file_url, file_name, status, review_note")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CompanyDocument[];
}

/**
 * "Get my company verified": the owner files the documents, then sends the
 * company to the staff review queue. The only way out of `pending_documents`.
 */
export function VerificationScreen({ companyId }: { companyId: string }) {
  const t = useTranslations("CompanyVerification");
  const tDocs = useTranslations("RegisterCompany.documents");
  const format = useFormatter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: rawCompanies, isLoading } = useCompanies(user?.id);

  const company = ((rawCompanies ?? []) as unknown as VerificationCompany[]).find((c) => c.id === companyId);
  const documents = useQuery({
    queryKey: documentsQueryKey(companyId),
    queryFn: () => fetchDocuments(companyId),
    enabled: !!company,
  });

  const [uploading, setUploading] = React.useState<VerificationDocType | null>(null);
  const [dragOver, setDragOver] = React.useState<VerificationDocType | null>(null);
  const [busyDoc, setBusyDoc] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const inputs = React.useRef<Partial<Record<VerificationDocType, HTMLInputElement | null>>>({});

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={6} />
      </div>
    );
  }
  if (!company) {
    return (
      <div className="mx-auto max-w-[1100px] rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200/70">
        <p className="text-sm text-slate-500">{t("notFound")}</p>
        <Link href="/dashboard/companies" className="mt-3 inline-flex text-sm font-semibold text-market-navy hover:underline">
          {t("back")}
        </Link>
      </div>
    );
  }

  const home = isHomeCountry(company.country);
  const docs = documents.data ?? [];
  const required = requiredDocTypes(company.country);
  const missing = missingDocTypes(company.country, docs.map((d) => d.type));
  const legal = legalFromSummary(company.verification_summary);
  const missingLegal = missingLegalFields(company.country, legal);

  const latestReview = [...(company.verification_reviews ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const moreInfo =
    company.status === COMPANY_STATUS.PENDING && latestReview?.decision === VERIFICATION_DECISION.MORE_INFO_REQUESTED;
  const rejected = company.status === COMPANY_STATUS.REJECTED;
  const verified = company.status === COMPANY_STATUS.VERIFIED;
  const inReview = company.status === COMPANY_STATUS.PENDING && !moreInfo;
  const editable = company.status === COMPANY_STATUS.PENDING_DOCUMENTS || rejected || moreInfo;
  const phaseIndex = verified ? 3 : company.status === COMPANY_STATUS.PENDING ? 1 : 0;

  // The registration certificate and the tax document have another name outside the DRC.
  const docText = (type: VerificationDocType, field: "title" | "hint") =>
    !home && (type === DOCUMENT_TYPE.BUSINESS_LICENSE || type === DOCUMENT_TYPE.TAX_REGISTRATION)
      ? t(`docs.${type}.${field}Intl`)
      : t(`docs.${type}.${field}`);

  const upload = async (type: VerificationDocType, file: File | undefined) => {
    if (!file || uploading) return;
    const check = validateRegistrationDocument(file);
    if (!check.ok) {
      toast.error(
        check.reason === "type"
          ? tDocs("invalidType")
          : tDocs("tooLarge", { max: MAX_REGISTRATION_DOCUMENT_BYTES / (1024 * 1024) })
      );
      return;
    }
    setUploading(type);
    const toastId = toast.loading(t("uploading", { file: file.name }));
    const result = await uploadCompanyDocument(company.id, type, file);
    setUploading(null);
    if (!result.ok) {
      toast.error(t("uploadError"), { id: toastId });
      return;
    }
    toast.success(t("uploaded"), { id: toastId });
    await queryClient.invalidateQueries({ queryKey: documentsQueryKey(company.id) });
  };

  const view = async (doc: CompanyDocument) => {
    setBusyDoc(doc.id);
    // Private bucket: a short-lived signed URL, readable by the owner (RLS).
    const { data, error } = await createClient()
      .storage.from(STORAGE_BUCKETS.COMPANY_DOCUMENTS)
      .createSignedUrl(doc.file_url, 60);
    setBusyDoc(null);
    if (error || !data?.signedUrl) {
      toast.error(t("viewError"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (doc: CompanyDocument) => {
    setBusyDoc(doc.id);
    const supabase = createClient();
    const { error } = await supabase.from("company_documents").delete().eq("id", doc.id);
    if (!error) await supabase.storage.from(STORAGE_BUCKETS.COMPANY_DOCUMENTS).remove([doc.file_url]);
    setBusyDoc(null);
    if (error) {
      toast.error(t("removeError"));
      return;
    }
    toast.success(t("removed"));
    await queryClient.invalidateQueries({ queryKey: documentsQueryKey(company.id) });
  };

  const submit = async () => {
    setSubmitting(true);
    const toastId = toast.loading(t("submitting"));
    try {
      // After a more-info request the company is still `pending`: the existing
      // resubmit action records the answer; everything else enters the queue here.
      const result = moreInfo
        ? await resubmitCompanyVerification({ companyId: company.id, locale })
        : await submitCompanyForReview({ companyId: company.id, locale });
      if (!result.ok) throw new Error(result.error ?? "submit_failed");
      toast.success(t("submitted"), { id: toastId });
      await queryClient.invalidateQueries({ queryKey: companiesQueryKey(user?.id) });
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      toast.error(
        code === "missing_documents" ? t("submitMissing") : code === "missing_legal" ? t("submitMissingLegal") : t("submitError"),
        { id: toastId }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // The file's trail as the company may read it: sends and decisions, with
  // staff's message — internal markers are filtered out (ownerVisibleNotes).
  const timeline = sortEvents(
    (company.verification_reviews ?? []).map((r) => ({ decision: r.decision, notes: r.notes, createdAt: r.created_at }))
  ).map((event, index) => ({
    id: `${event.createdAt}-${index}`,
    tone: toneOfDecision(event.decision),
    title: t(`timeline.events.${event.decision}`),
    date: format.dateTime(new Date(event.createdAt), { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    notes: ownerVisibleNotes(event),
  }));

  // What the team wrote with its latest decision — shown at the top whatever
  // the decision was, approval included.
  const teamMessage = latestStaffMessage(
    (company.verification_reviews ?? []).map((r) => ({ decision: r.decision, notes: r.notes, createdAt: r.created_at }))
  );
  const messageTone =
    teamMessage?.decision === VERIFICATION_DECISION.APPROVED
      ? "bg-emerald-50 ring-emerald-100 text-emerald-900"
      : teamMessage?.decision === VERIFICATION_DECISION.REJECTED
        ? "bg-red-50 ring-red-100 text-red-900"
        : "bg-amber-50 ring-amber-200 text-amber-900";

  const benefits: { key: "public" | "badge" | "contact"; icon: LucideIcon }[] = [
    { key: "public", icon: Globe2 },
    { key: "badge", icon: BadgeCheck },
    { key: "contact", icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
      <header>
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("back")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
            {t("title")}
          </h1>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
              STATUS_PILL[company.status] ?? "bg-slate-100 text-slate-600"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {t(`status.${moreInfo ? "more_info" : company.status}`)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle", { company: company.name })}</p>
      </header>

      {/* Where the file stands: documents → review → published. */}
      <ol className="grid grid-cols-1 gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70 sm:grid-cols-3">
        {PHASES.map((phase, i) => {
          const done = i < phaseIndex;
          const current = i === phaseIndex;
          return (
            <li
              key={phase}
              aria-current={current ? "step" : undefined}
              className={cn("flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5", current && "bg-market-navy text-white")}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                  done && "bg-emerald-100 text-emerald-700",
                  current && "bg-market-or text-market-navy",
                  !done && !current && "bg-slate-100 text-slate-400"
                )}
                aria-hidden
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[13px] font-semibold", !current && (done ? "text-market-navy" : "text-slate-500"))}>
                  {t(`phases.${phase}.title`)}
                </span>
                <span className={cn("block truncate text-[11.5px]", current ? "text-white/65" : "text-slate-400")}>
                  {t(`phases.${phase}.body`)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          {(rejected || moreInfo) && (
            <div role="alert" className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="text-sm font-semibold text-amber-900">{t(rejected ? "banner.rejected.title" : "banner.moreInfo.title")}</p>
              <p className="mt-0.5 text-[13px] text-amber-800">{t(rejected ? "banner.rejected.body" : "banner.moreInfo.body")}</p>
            </div>
          )}
          {teamMessage && (
            <section aria-labelledby="team-message" className={cn("rounded-2xl p-4 ring-1", messageTone)}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h2 id="team-message" className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquareText className="h-4 w-4" aria-hidden />
                  {t("teamMessage.title")}
                </h2>
                <p className="text-xs opacity-80">
                  {t(`timeline.events.${teamMessage.decision}`)} ·{" "}
                  {format.dateTime(new Date(teamMessage.createdAt), { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-line rounded-xl bg-white/70 px-3.5 py-3 text-[13.5px] leading-relaxed">{teamMessage.notes}</p>
            </section>
          )}
          {inReview && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-blue-700">
                <Clock className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-blue-900">{t("banner.pending.title")}</p>
                <p className="text-[13px] text-blue-800">{t("banner.pending.body")}</p>
              </div>
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100"
              >
                {t("banner.pending.cta")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          )}
          {verified && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-emerald-700">
                <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-900">{t("banner.verified.title")}</p>
                <p className="text-[13px] text-emerald-800">{t("banner.verified.body")}</p>
              </div>
              <Link
                href={`/companies/${company.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                {t("banner.verified.cta")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          )}

          <LegalIdentityCard
            // Remount when the saved values change, so the form always starts from what is on file.
            key={JSON.stringify(legal)}
            companyId={company.id}
            userId={user?.id}
            country={company.country}
            home={home}
            saved={legal}
            editable={editable}
          />

          <section aria-labelledby="verification-docs" className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="verification-docs" className="font-display text-base font-semibold text-market-navy">{t("docsTitle")}</h2>
                <p className="text-xs text-slate-500">{t("formats")}</p>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {t("requiredProgress", { done: required.length - missing.length, total: required.length })}
              </p>
            </div>

            {documents.isError ? (
              <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {t("loadError")}
                <button type="button" onClick={() => documents.refetch()} className="font-semibold underline">
                  {t("retry")}
                </button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {VERIFICATION_DOC_TYPES.map((type) => {
                  const Icon = DOC_ICON[type];
                  const files = docs.filter((d) => d.type === type);
                  const isRequired = required.includes(type);
                  const has = files.length > 0;
                  const busy = uploading === type;
                  return (
                    <li
                      key={type}
                      onDragOver={(e) => {
                        if (!editable) return;
                        e.preventDefault();
                        setDragOver(type);
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => {
                        if (!editable) return;
                        e.preventDefault();
                        setDragOver(null);
                        upload(type, e.dataTransfer.files?.[0]);
                      }}
                      className={cn(
                        "rounded-xl p-3.5 ring-1 transition-colors",
                        dragOver === type ? "bg-slate-50 ring-market-navy" : "ring-slate-200/80"
                      )}
                    >
                      <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                        <span
                          className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                            has ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}
                          aria-hidden
                        >
                          {has ? <Check className="h-[18px] w-[18px]" /> : <Icon className="h-[18px] w-[18px]" />}
                        </span>
                        <div className="min-w-0 flex-1 basis-[calc(100%-3.25rem)] sm:basis-auto">
                          <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-market-navy">
                            {docText(type, "title")}
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                                isRequired ? "bg-market-cream text-market-or-dark" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {t(isRequired ? "required" : "optional")}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{docText(type, "hint")}</p>

                          {has && (
                            <ul className="mt-2.5 space-y-1.5">
                              {files.map((doc) => (
                                <li key={doc.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                                  <span className="min-w-0 flex-1 truncate font-medium text-market-navy" title={doc.file_name}>
                                    {doc.file_name}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                                    <span className={cn("h-1.5 w-1.5 rounded-full", DOC_STATUS_DOT[doc.status] ?? "bg-slate-400")} aria-hidden />
                                    {t(`docStatus.${doc.status in DOC_STATUS_DOT ? doc.status : "pending"}`)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => view(doc)}
                                    disabled={busyDoc === doc.id}
                                    aria-label={t("viewFile", { file: doc.file_name })}
                                    title={t("view")}
                                    className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white hover:text-market-navy disabled:opacity-50"
                                  >
                                    <Eye className="h-3.5 w-3.5" aria-hidden />
                                  </button>
                                  {doc.status === "rejected" && doc.review_note && (
                                    <span className="order-last basis-full rounded-md bg-red-50 px-2 py-1 text-[11.5px] text-red-800">
                                      <span className="font-semibold">{t("docRefusedReason")} </span>
                                      {doc.review_note}
                                    </span>
                                  )}
                                  {editable && (
                                    <button
                                      type="button"
                                      onClick={() => remove(doc)}
                                      disabled={busyDoc === doc.id}
                                      aria-label={t("removeFile", { file: doc.file_name })}
                                      title={t("remove")}
                                      className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white hover:text-market-red disabled:opacity-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {editable && (
                          <>
                            <button
                              type="button"
                              onClick={() => inputs.current[type]?.click()}
                              disabled={uploading !== null}
                              className={cn(
                                "ml-[3.25rem] inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 sm:ml-0",
                                has ? "bg-slate-100 text-market-navy hover:bg-slate-200" : "bg-market-navy text-white hover:bg-market-navy-deep"
                              )}
                            >
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <UploadCloud className="h-3.5 w-3.5" aria-hidden />}
                              {t(has ? "addAnother" : "choose")}
                            </button>
                            <input
                              ref={(el) => {
                                inputs.current[type] = el;
                              }}
                              type="file"
                              accept={ACCEPTED_REGISTRATION_DOCUMENT_EXTENSIONS}
                              className="hidden"
                              aria-label={docText(type, "title")}
                              onChange={(e) => {
                                upload(type, e.target.files?.[0]);
                                // Let the same file be picked again after a failure.
                                e.target.value = "";
                              }}
                            />
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {editable && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p
                  className={cn(
                    "min-w-0 flex-1 basis-full text-xs sm:basis-0",
                    missing.length || missingLegal.length ? "text-slate-500" : "font-medium text-emerald-700"
                  )}
                >
                  {missing.length
                    ? t("missing", { list: missing.map((type) => docText(type, "title")).join(", ") })
                    : missingLegal.length
                      ? t("missingLegal")
                      : t("ready")}
                </p>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || missing.length > 0 || missingLegal.length > 0 || documents.isLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-market-navy px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                  {t(rejected || moreInfo ? "resubmit" : "submit")}
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          {timeline.length > 0 && (
            <section aria-labelledby="verification-trail" className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
              <h2 id="verification-trail" className="mb-3 font-display text-base font-semibold text-market-navy">{t("timeline.title")}</h2>
              <VerificationTimeline items={timeline} empty={t("timeline.empty")} />
            </section>
          )}
          <div className="relative overflow-hidden rounded-2xl bg-market-navy p-5 text-white">
            <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-market-or/25 blur-2xl" />
            <p className="relative font-display text-base font-semibold">{t("aside.title")}</p>
            <ul className="relative mt-3.5 space-y-3">
              {benefits.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-market-or-light ring-1 ring-white/15">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">{t(`aside.items.${key}.title`)}</span>
                    <span className="block text-[11.5px] leading-relaxed text-white/65">{t(`aside.items.${key}.body`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
            <p className="flex items-start gap-2.5 text-xs text-slate-600">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-market-or-dark" aria-hidden />
              {t("aside.delay")}
            </p>
            <p className="flex items-start gap-2.5 text-xs text-slate-600">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-market-or-dark" aria-hidden />
              {t("aside.privacy")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
