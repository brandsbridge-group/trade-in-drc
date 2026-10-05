"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ExternalLink, FileText, FileWarning, Loader2, RotateCcw, X } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { DOCUMENT_STATUS } from "@/constants/status";
import { setCompanyDocumentStatus, type SignedDocument } from "@/lib/verifications/actions";

interface DocumentViewerProps {
  documents: SignedDocument[];
  /** Required document types with nothing on file — listed so a gap is visible, not silent. */
  missingTypes?: string[];
}

const STATUS_PILL: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-slate-100 text-slate-600",
  rejected: "bg-red-50 text-red-700",
};

/**
 * Documents of a file under review: open each one (short-lived signed URL),
 * then accept it or refuse it with a reason the company will read.
 */
export function DocumentViewer({ documents, missingTypes = [] }: DocumentViewerProps) {
  const t = useTranslations("Admin.verifications");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [refusing, setRefusing] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  const setStatus = async (documentId: string, status: string, note?: string) => {
    setBusy(documentId);
    const result = await setCompanyDocumentStatus({ documentId, status: status as never, note, locale }).catch(() => ({ ok: false as const }));
    setBusy(null);
    if (!result.ok) {
      toast.error(t("documents.updateError"));
      return;
    }
    toast.success(t(`documents.updated.${status}`));
    setRefusing(null);
    setReason("");
    router.refresh();
  };

  if (documents.length === 0 && missingTypes.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">{t("documents.empty")}</p>;
  }

  return (
    <ul className="space-y-2">
      {missingTypes.map((type) => (
        <li key={`missing-${type}`} className="flex items-center gap-3 rounded-xl bg-amber-50 px-3.5 py-3 ring-1 ring-amber-200">
          <FileWarning className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <p className="text-[13px] text-amber-900">
            <span className="font-semibold">{t(`documents.type.${type}`)}</span> — {t("documents.requiredMissing")}
          </p>
        </li>
      ))}
      {documents.map((doc) => {
        const working = busy === doc.id;
        return (
          <li key={doc.id} className="rounded-xl px-3.5 py-3 ring-1 ring-slate-200/80">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 basis-[200px]">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-market-navy">
                  {t(`documents.type.${doc.type}`)}
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", STATUS_PILL[doc.status] ?? STATUS_PILL.pending)}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    {t(`documents.status.${doc.status}`)}
                  </span>
                </p>
                <p className="truncate text-xs text-slate-500" title={doc.fileName}>{doc.fileName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {doc.signedUrl ? (
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-market-navy transition-colors hover:bg-slate-200"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {t("documents.view")}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 text-xs text-slate-500">
                    <FileWarning className="h-3.5 w-3.5" aria-hidden />
                    {t("documents.unavailable")}
                  </span>
                )}
                {doc.status !== DOCUMENT_STATUS.APPROVED && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => setStatus(doc.id, DOCUMENT_STATUS.APPROVED)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
                    {t("documents.accept")}
                  </button>
                )}
                {doc.status !== DOCUMENT_STATUS.REJECTED && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => {
                      setRefusing(refusing === doc.id ? null : doc.id);
                      setReason("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    {t("documents.refuse")}
                  </button>
                )}
                {doc.status !== DOCUMENT_STATUS.PENDING && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => setStatus(doc.id, DOCUMENT_STATUS.PENDING)}
                    aria-label={t("documents.reset")}
                    title={t("documents.reset")}
                    className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-navy disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </div>

            {doc.status === DOCUMENT_STATUS.REJECTED && doc.reviewNote && (
              <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
                <span className="font-semibold">{t("documents.reasonLabel")} </span>
                {doc.reviewNote}
              </p>
            )}

            {refusing === doc.id && (
              <div className="mt-2.5 rounded-xl bg-slate-50 p-3">
                <label htmlFor={`reason-${doc.id}`} className="mb-1 block text-xs font-semibold text-slate-700">
                  {t("documents.reasonPrompt")}
                </label>
                <textarea
                  id={`reason-${doc.id}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder={t("documents.reasonPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-market-navy"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setRefusing(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200">
                    {t("documents.cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={working || !reason.trim()}
                    onClick={() => setStatus(doc.id, DOCUMENT_STATUS.REJECTED, reason.trim())}
                    className="inline-flex items-center gap-1.5 rounded-full bg-market-red px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-market-red/90 disabled:opacity-50"
                  >
                    {working && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                    {t("documents.confirmRefuse")}
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
