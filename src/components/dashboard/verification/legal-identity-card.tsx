"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { companiesQueryKey } from "@/hooks/use-companies";
import { EMPLOYEE_RANGES, LEGAL_FORMS, YEAR_OPTIONS } from "@/components/register/market/constants";
import { saveCompanyLegalIdentity, type LegalIdentityInput } from "@/lib/verifications/owner-actions";
import { EMPTY_LEGAL, missingLegalFields, type LegalIdentity } from "@/lib/verifications/required-documents";
import { applyDraft, changedFields, readLocalDraft, writeLocalDraft } from "@/lib/drafts/local-draft";

const FIELD =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy disabled:bg-slate-50 disabled:text-slate-500";

interface Props {
  companyId: string;
  userId: string | undefined;
  /** Country of the company: decides the wording and what is required. */
  country: string | null;
  home: boolean;
  /** What is on file (from `verification_summary`). */
  saved: LegalIdentity;
  editable: boolean;
}

/**
 * Legal identifiers, filed on the same screen as the documents that prove
 * them, so the reviewer gets the numbers and the papers together.
 */
export function LegalIdentityCard({ companyId, userId, country, home, saved, editable }: Props) {
  const t = useTranslations("CompanyVerification.legal");
  const tForm = useTranslations("RegisterCompany");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<LegalIdentity>(saved);
  const [saving, setSaving] = React.useState(false);
  // Unsaved numbers are kept in this browser: leaving the screen before
  // pressing Save loses nothing. `draftChecked` gates the writer so it never
  // runs on the first pass, when the form still shows the stored values.
  const [draftChecked, setDraftChecked] = React.useState(false);
  const [draftRestored, setDraftRestored] = React.useState(false);
  const draftKey = `tidrc:company-legal:draft:v1:${companyId}`;

  React.useEffect(() => {
    if (!editable) return;
    const restored = applyDraft(saved, readLocalDraft(draftKey));
    if (changedFields(restored, saved)) {
      setForm(restored);
      setDraftRestored(true);
    }
    setDraftChecked(true);
    // Restore once per screen visit; later changes of `saved` are our own saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, editable]);

  React.useEffect(() => {
    if (!editable || !draftChecked) return;
    writeLocalDraft(draftKey, changedFields(form, saved));
  }, [draftKey, editable, draftChecked, form, saved]);

  const discardDraft = () => {
    setForm(saved);
    setDraftRestored(false);
  };

  const dirty = (Object.keys(form) as (keyof LegalIdentity)[]).some((key) => form[key] !== saved[key]);
  // Against an empty identity, "missing" is exactly the list of required fields.
  const required = new Set(missingLegalFields(country, EMPTY_LEGAL));
  const set = (patch: Partial<LegalIdentity>) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    const toastId = toast.loading(t("saving"));
    // The selects only offer the enum values; the action re-validates them anyway.
    const result = await saveCompanyLegalIdentity({ companyId, locale, legal: form as LegalIdentityInput }).catch(
      () => ({ ok: false })
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(t("saveError"), { id: toastId });
      return;
    }
    toast.success(t("saved"), { id: toastId });
    await queryClient.invalidateQueries({ queryKey: companiesQueryKey(userId) });
  };

  const label = (text: string, key: keyof LegalIdentity) => (
    <span className="mb-1 block text-xs font-semibold text-slate-700">
      {text}
      {required.has(key) && <span className="ml-0.5 text-market-red">*</span>}
    </span>
  );

  return (
    <section aria-labelledby="verification-legal" className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
      <div className="mb-4">
        <h2 id="verification-legal" className="font-display text-base font-semibold text-market-navy">{t("title")}</h2>
        <p className="text-xs text-slate-500">{t("subtitle")}</p>
      </div>

      {draftRestored && dirty && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900 ring-1 ring-amber-200">
          <p className="min-w-0 flex-1 basis-[200px]">{t("draft.restored")}</p>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
          >
            {t("draft.discard")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block min-w-0">
          {label(tForm(home ? "fields.rccmNumber" : "fields.registrationNumber"), "registrationNumber")}
          <input
            className={FIELD}
            value={form.registrationNumber}
            disabled={!editable}
            onChange={(e) => set({ registrationNumber: e.target.value })}
            placeholder={tForm(home ? "ph.rccmNumber" : "ph.registrationNumber")}
          />
        </label>
        <label className="block min-w-0">
          {label(tForm(home ? "fields.nif" : "fields.taxIdIntl"), "taxId")}
          <input
            className={FIELD}
            value={form.taxId}
            disabled={!editable}
            onChange={(e) => set({ taxId: e.target.value })}
            placeholder={tForm(home ? "ph.nif" : "ph.taxIdIntl")}
          />
        </label>
        <label className="block min-w-0">
          {label(tForm(home ? "fields.nationalId" : "fields.nationalIdIntl"), "nationalId")}
          <input
            className={FIELD}
            value={form.nationalId}
            disabled={!editable}
            onChange={(e) => set({ nationalId: e.target.value })}
            placeholder={tForm(home ? "ph.nationalId" : "ph.nationalIdIntl")}
          />
        </label>
        <label className="block min-w-0">
          {label(tForm("fields.legalForm"), "legalForm")}
          <select className={FIELD} value={form.legalForm} disabled={!editable} onChange={(e) => set({ legalForm: e.target.value })}>
            <option value="">{tForm("ph.legalForm")}</option>
            {LEGAL_FORMS.map((value) => (
              <option key={value} value={value}>{tForm(`legalForms.${value}`)}</option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          {label(tForm("fields.yearEstablished"), "yearEstablished")}
          <select className={FIELD} value={form.yearEstablished} disabled={!editable} onChange={(e) => set({ yearEstablished: e.target.value })}>
            <option value="">{tForm("ph.yearEstablished")}</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          {label(tForm("fields.employees"), "employees")}
          <select className={FIELD} value={form.employees} disabled={!editable} onChange={(e) => set({ employees: e.target.value })}>
            <option value="">{tForm("ph.employees")}</option>
            {EMPLOYEE_RANGES.map((value) => (
              <option key={value} value={value}>{tForm(`employeeRanges.${value}`)}</option>
            ))}
          </select>
        </label>
      </div>

      {editable && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className={cn("min-w-0 flex-1 basis-full text-xs sm:basis-0", dirty ? "text-amber-700" : "text-slate-500")}>
            {dirty ? `${t("unsaved")} ${t("draft.kept")}` : t("hint")}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[13px] font-semibold text-market-navy transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            {t("save")}
          </button>
        </div>
      )}
    </section>
  );
}
