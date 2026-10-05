"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { saveTerm } from "@/app/[locale]/console/taxonomy/actions";
import {
  EMPTY_TERM,
  NAME_MAX,
  OPTIONAL_LOCALES,
  REQUIRED_LOCALES,
  SLUG_MAX,
  slugifyTerm,
  termName,
  validateTerm,
  type HsCodeTerm,
  type SectorTerm,
  type TermError,
  type TermField,
  type TermValues,
} from "@/lib/taxonomy/terms";
import { PRIMARY_PILL, type TermTarget } from "./shared";

const FIELD =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy aria-[invalid=true]:border-red-400";
const LABEL = "mb-1 block text-xs font-semibold text-slate-700";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400";

/** Field order on screen, used to focus the first one in error. */
const FIELD_ORDER: TermField[] = ["code", "name_en", "name_fr", "name_es", "name_tr", "name_zh", "slug", "sector_id", "parent_code"];

/** The message of a field error; "invalid" means something different per field. */
function errorKey(field: TermField, error: TermError | "duplicate"): string {
  if (error === "duplicate") return field === "code" ? "duplicate_code" : "duplicate_slug";
  if (error !== "invalid") return error;
  if (field === "code") return "invalid_code";
  if (field === "parent_code") return "invalid_parent";
  if (field === "sector_id") return "invalid_sector";
  return "invalid_slug";
}

function initialValues(target: TermTarget): TermValues {
  const term = target.term;
  if (!term) return { ...EMPTY_TERM, sector_id: target.sectorId ?? "" };
  return {
    name_en: term.name_en,
    name_fr: term.name_fr,
    name_es: term.name_es ?? "",
    name_tr: term.name_tr ?? "",
    name_zh: term.name_zh ?? "",
    slug: "slug" in term ? term.slug : "",
    code: "code" in term ? term.code : "",
    parent_code: "parent_code" in term ? (term.parent_code ?? "") : "",
    sector_id: "sector_id" in term ? (term.sector_id ?? "") : "",
  };
}

interface TermSheetProps {
  target: TermTarget | null;
  sectors: SectorTerm[];
  hsCodes: HsCodeTerm[];
  onClose: () => void;
  onSaved: () => void;
}

/** Creating or editing one taxonomy entry, in a side panel so the tree stays in view. */
export function TermSheet({ target, sectors, hsCodes, onClose, onSaved }: TermSheetProps) {
  const t = useTranslations("Taxonomy");
  if (!target) return null;
  const creating = !target.term;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-slate-50 p-0 sm:max-w-lg">
        <SheetHeader className="gap-1 bg-white p-5 ring-1 ring-slate-200/70">
          <SheetTitle className="pr-8 font-display text-lg font-semibold text-market-navy">
            {t(`kinds.${target.kind}.${creating ? "new" : "edit"}`)}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-slate-500">{t(`kinds.${target.kind}.hint`)}</SheetDescription>
        </SheetHeader>
        <TermForm
          // A fresh form per entry: no value of the previous one may linger.
          key={`${target.kind}:${target.term?.id ?? "new"}`}
          target={target}
          sectors={sectors}
          hsCodes={hsCodes}
          onClose={onClose}
          onSaved={onSaved}
        />
      </SheetContent>
    </Sheet>
  );
}

function TermForm({ target, sectors, hsCodes, onClose, onSaved }: TermSheetProps & { target: TermTarget }) {
  const t = useTranslations("Taxonomy");
  const locale = useLocale();
  const { kind, term } = target;
  const creating = !term;
  const [values, setValues] = React.useState<TermValues>(() => initialValues(target));
  const [errors, setErrors] = React.useState<Partial<Record<TermField, TermError | "duplicate">>>({});
  const [saving, setSaving] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const isHs = kind === "hs_codes";
  const hasSlug = !isHs;
  const hasSector = kind === "categories" || isHs;

  const set = (field: TermField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const showErrors = (next: Partial<Record<TermField, TermError | "duplicate">>) => {
    setErrors(next);
    const first = FIELD_ORDER.find((field) => next[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateTerm(kind, values, creating);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }
    setSaving(true);
    try {
      const result = await saveTerm({ kind, id: term?.id, values });
      if (result.ok) {
        toast.success(t(creating ? "toasts.created" : "toasts.saved"));
        onSaved();
        return;
      }
      if (result.error === "duplicate") {
        showErrors({ [isHs ? "code" : "slug"]: "duplicate" });
      } else if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        showErrors(result.fieldErrors);
      } else {
        toast.error(t(result.error === "not_authorized" ? "errors.not_authorized" : "errors.write_failed"));
      }
    } catch {
      toast.error(t("errors.write_failed"));
    } finally {
      setSaving(false);
    }
  };

  const field = (name: TermField, label: string, options: { required?: boolean; maxLength?: number; mono?: boolean; placeholder?: string; hint?: string } = {}) => {
    const error = errors[name];
    return (
      <label className="block min-w-0">
        <span className={LABEL}>
          {label}
          {options.required && <span className="text-red-500" aria-hidden> *</span>}
        </span>
        <input
          name={name}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
          maxLength={options.maxLength}
          placeholder={options.placeholder}
          aria-invalid={error ? true : undefined}
          aria-required={options.required || undefined}
          autoComplete="off"
          className={cn(FIELD, options.mono && "font-mono text-[13px]")}
        />
        {error ? (
          <span className="mt-1 block text-xs font-medium text-red-600">{t(`errors.${errorKey(name, error)}`)}</span>
        ) : (
          options.hint && <span className="mt-1 block text-xs text-slate-500">{options.hint}</span>
        )}
      </label>
    );
  };

  const parentChoices = hsCodes.filter((code) => code.id !== term?.id);

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-3 p-4">
      {isHs && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
          <h3 className={EYEBROW}>{t("form.code")}</h3>
          <div className="mt-3">
            {creating ? (
              field("code", t("form.code"), { required: true, maxLength: 13, mono: true, placeholder: "0901.21", hint: t("form.codeHint") })
            ) : (
              <FrozenValue value={values.code} hint={t("form.codeFrozen")} />
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
        <h3 className={EYEBROW}>{t("form.names")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REQUIRED_LOCALES.map((l) => (
            <React.Fragment key={l}>
              {field(`name_${l}`, t(l === "en" ? "form.nameEn" : "form.nameFr"), { required: true, maxLength: NAME_MAX })}
            </React.Fragment>
          ))}
        </div>
        <h3 className={cn(EYEBROW, "mt-5")}>{t("form.otherLanguages")}</h3>
        <p className="mt-1 text-xs text-slate-500">{t("form.otherLanguagesHint")}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {OPTIONAL_LOCALES.map((l) => (
            <React.Fragment key={l}>
              {field(`name_${l}`, t(`languages.${l}`), { maxLength: NAME_MAX })}
            </React.Fragment>
          ))}
        </div>
      </section>

      {(hasSlug || hasSector) && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
          <h3 className={EYEBROW}>{t("form.placement")}</h3>

          {hasSector && (
            <label className="block min-w-0">
              <span className={LABEL}>
                {t("form.sector")}
                {kind === "categories" && <span className="text-red-500" aria-hidden> *</span>}
              </span>
              <select
                name="sector_id"
                value={values.sector_id}
                onChange={(e) => set("sector_id", e.target.value)}
                aria-invalid={errors.sector_id ? true : undefined}
                aria-required={kind === "categories" || undefined}
                className={FIELD}
              >
                <option value="">{t(kind === "categories" ? "form.sectorChoose" : "form.sectorNone")}</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {termName(sector, locale)}
                  </option>
                ))}
              </select>
              {errors.sector_id && (
                <span className="mt-1 block text-xs font-medium text-red-600">{t(`errors.${errorKey("sector_id", errors.sector_id)}`)}</span>
              )}
            </label>
          )}

          {isHs && (
            <label className="block min-w-0">
              <span className={LABEL}>{t("form.parentCode")}</span>
              <select
                name="parent_code"
                value={values.parent_code}
                onChange={(e) => set("parent_code", e.target.value)}
                aria-invalid={errors.parent_code ? true : undefined}
                className={FIELD}
              >
                <option value="">{t("form.parentNone")}</option>
                {parentChoices.map((code) => (
                  <option key={code.id} value={code.code}>
                    {code.code} — {termName(code, locale)}
                  </option>
                ))}
              </select>
              {errors.parent_code ? (
                <span className="mt-1 block text-xs font-medium text-red-600">{t(`errors.${errorKey("parent_code", errors.parent_code)}`)}</span>
              ) : (
                <span className="mt-1 block text-xs text-slate-500">{t("form.parentCodeHint")}</span>
              )}
            </label>
          )}

          {hasSlug &&
            (creating ? (
              field("slug", t("form.slug"), {
                maxLength: SLUG_MAX,
                mono: true,
                placeholder: slugifyTerm(values.name_en) || "…",
                hint: t("form.slugHintNew"),
              })
            ) : (
              <div>
                <span className={LABEL}>{t("form.slug")}</span>
                <FrozenValue value={values.slug} hint={t("form.slugFrozen")} />
              </div>
            ))}
        </section>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-60"
        >
          {t("form.cancel")}
        </button>
        <button type="submit" disabled={saving} className={PRIMARY_PILL}>
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t(creating ? "form.create" : "form.save")}
        </button>
      </div>
    </form>
  );
}

/** An identifier that can no longer change, shown rather than offered. */
function FrozenValue({ value, hint }: { value: string; hint: string }) {
  return (
    <>
      <p className="flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 font-mono text-[13px] text-slate-600">
        <Lock className="size-3.5 shrink-0 text-slate-400" aria-hidden />
        <span className="truncate">{value}</span>
      </p>
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    </>
  );
}
