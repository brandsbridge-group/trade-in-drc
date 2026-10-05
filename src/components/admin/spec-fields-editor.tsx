"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  SPEC_FIELD_TYPES,
  parseOptions,
  slugifySpecKey,
  specLabel,
  type SpecFieldType,
  type SpecOption,
} from "@/lib/products/specs";
import type { Json } from "@/lib/supabase/types";

interface FieldRow {
  id: string;
  key: string;
  label_en: string;
  label_fr: string;
  field_type: SpecFieldType;
  unit: string | null;
  options: SpecOption[];
  required: boolean;
  sort_order: number;
}

interface Draft {
  /** null = a new field. */
  id: string | null;
  label_en: string;
  label_fr: string;
  field_type: SpecFieldType;
  unit: string;
  /** One choice per line, "English | Français". */
  options: string;
  required: boolean;
}

const EMPTY_DRAFT: Draft = { id: null, label_en: "", label_fr: "", field_type: "text", unit: "", options: "", required: false };

const FIELD =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";

/** "Washed | Lavé" lines → stored options; the value is derived from the English label and kept stable. */
export function parseOptionLines(text: string, existing: SpecOption[] = []): SpecOption[] {
  const seen = new Set<string>();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [en, fr] = line.split("|").map((part) => part.trim());
      if (!en) return [];
      // Renaming a choice must not orphan products that already use it: reuse its value.
      const value = existing.find((o) => o.label_en === en)?.value ?? slugifySpecKey(en);
      if (!value || seen.has(value)) return [];
      seen.add(value);
      return [{ value, label_en: en, label_fr: fr || en }];
    });
}

const optionLines = (options: SpecOption[]) =>
  options.map((o) => (o.label_fr && o.label_fr !== o.label_en ? `${o.label_en} | ${o.label_fr}` : o.label_en)).join("\n");

/**
 * Staff editor of the specification template of one product category
 * (`category_spec_fields`, 00055): the fields a seller fills in the product
 * form. Writes go through the browser client; RLS limits them to staff, and
 * the audit trigger of 00066 records each one.
 */
export function SpecFieldsEditor({ categoryId, onChanged }: { categoryId: string; /** A field was added or removed. */ onChanged?: () => void }) {
  const t = useTranslations("Taxonomy.specs");
  const locale = useLocale();
  const [fields, setFields] = React.useState<FieldRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);

  const loadFields = React.useCallback(
    async (id: string) => {
      setLoading(true);
      const { data, error } = await createClient()
        .from("category_spec_fields")
        .select("id, key, label_en, label_fr, field_type, unit, options, required, sort_order")
        .eq("category_id", id)
        .order("sort_order", { ascending: true });
      setLoading(false);
      if (error) {
        toast.error(t("errorLoad"));
        return;
      }
      setFields((data ?? []).map((row) => ({ ...row, options: parseOptions(row.options) })));
    },
    [t]
  );

  // The parent remounts the editor per category (`key`), so there is no draft to reset here.
  React.useEffect(() => {
    loadFields(categoryId);
  }, [categoryId, loadFields]);

  const save = async () => {
    if (!draft || !categoryId) return;
    const labelEn = draft.label_en.trim();
    const labelFr = draft.label_fr.trim();
    if (!labelEn || !labelFr) {
      toast.error(t("errorLabels"));
      return;
    }
    const editing = fields.find((f) => f.id === draft.id);
    const options = draft.field_type === "select" ? parseOptionLines(draft.options, editing?.options) : [];
    if (draft.field_type === "select" && options.length < 2) {
      toast.error(t("errorOptions"));
      return;
    }
    // The key is what products store: derived once from the English label, never changed afterwards.
    const key = editing?.key ?? slugifySpecKey(labelEn);
    if (!key) {
      toast.error(t("errorKey"));
      return;
    }
    if (!editing && fields.some((f) => f.key === key)) {
      toast.error(t("errorDuplicate"));
      return;
    }

    setSaving(true);
    const payload = {
      label_en: labelEn,
      label_fr: labelFr,
      field_type: draft.field_type,
      unit: draft.field_type === "number" && draft.unit.trim() ? draft.unit.trim() : null,
      options: options as unknown as Json,
      required: draft.required,
    };
    const supabase = createClient();
    const { error } = editing
      ? await supabase.from("category_spec_fields").update(payload).eq("id", editing.id)
      : await supabase.from("category_spec_fields").insert({
          ...payload,
          category_id: categoryId,
          key,
          sort_order: fields.reduce((max, f) => Math.max(max, f.sort_order), 0) + 10,
        });
    setSaving(false);
    if (error) {
      toast.error(t("errorSave"));
      return;
    }
    toast.success(t("saved"));
    setDraft(null);
    loadFields(categoryId);
    if (!editing) onChanged?.();
  };

  const remove = async (field: FieldRow) => {
    if (!window.confirm(t("confirmDelete", { name: specLabel(field, locale) }))) return;
    const { error } = await createClient().from("category_spec_fields").delete().eq("id", field.id);
    if (error) {
      toast.error(t("errorDelete"));
      return;
    }
    toast.success(t("deleted"));
    loadFields(categoryId);
    onChanged?.();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const other = index + direction;
    if (other < 0 || other >= fields.length) return;
    const reordered = [...fields];
    [reordered[index], reordered[other]] = [reordered[other], reordered[index]];
    // Renumber the whole list: two fields may share a sort_order after older edits.
    const next = reordered.map((f, i) => ({ ...f, sort_order: (i + 1) * 10 }));
    setFields(next);
    const supabase = createClient();
    const results = await Promise.all(
      next
        .filter((f) => fields.find((old) => old.id === f.id)?.sort_order !== f.sort_order)
        .map((f) => supabase.from("category_spec_fields").update({ sort_order: f.sort_order }).eq("id", f.id))
    );
    if (results.some((r) => r.error)) {
      toast.error(t("errorSave"));
      loadFields(categoryId);
    }
  };

  const edit = (field: FieldRow) =>
    setDraft({
      id: field.id,
      label_en: field.label_en,
      label_fr: field.label_fr,
      field_type: field.field_type,
      unit: field.unit ?? "",
      options: optionLines(field.options),
      required: field.required,
    });

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500" aria-live="polite">{loading ? "" : t("count", { count: fields.length })}</p>
        {!draft && !loading && (
          <button
            type="button"
            onClick={() => setDraft(EMPTY_DRAFT)}
            className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("add")}
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          {t("loading")}
        </p>
      ) : (
        <>
          {fields.length === 0 && !draft && (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-xs text-slate-500">{t("empty")}</p>
          )}
          {fields.length > 0 && (
            <ul className="mt-4 space-y-2">
              {fields.map((field, index) => (
                <li key={field.id} className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-slate-200/80">
                  <div className="min-w-0 flex-1 basis-[220px]">
                    <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-market-navy">
                      {specLabel(field, locale)}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
                        {t(`types.${field.field_type}`)}
                        {field.field_type === "number" && field.unit ? ` · ${field.unit}` : ""}
                      </span>
                      {field.required && (
                        <span className="rounded-full bg-market-cream px-2 py-0.5 text-[10.5px] font-semibold text-market-or-dark">
                          {t("required")}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <code className="text-[11px]">{field.key}</code>
                      {field.field_type === "select" && ` · ${field.options.map((o) => specLabel(o, locale)).join(", ")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t("moveUp")} title={t("moveUp")} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-navy disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === fields.length - 1} aria-label={t("moveDown")} title={t("moveDown")} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-navy disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => edit(field)} aria-label={t("edit")} title={t("edit")} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-navy">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => remove(field)} aria-label={t("delete")} title={t("delete")} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-red">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {draft && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-[13px] font-semibold text-market-navy">{t(draft.id ? "editTitle" : "newTitle")}</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">{t("labelEn")}</span>
                  <input className={FIELD} value={draft.label_en} maxLength={60} onChange={(e) => setDraft({ ...draft, label_en: e.target.value })} placeholder="Altitude" />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">{t("labelFr")}</span>
                  <input className={FIELD} value={draft.label_fr} maxLength={60} onChange={(e) => setDraft({ ...draft, label_fr: e.target.value })} placeholder="Altitude" />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">{t("type")}</span>
                  <select className={FIELD} value={draft.field_type} onChange={(e) => setDraft({ ...draft, field_type: e.target.value as SpecFieldType })}>
                    {SPEC_FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`types.${type}`)}
                      </option>
                    ))}
                  </select>
                </label>
                {draft.field_type === "number" && (
                  <label className="block min-w-0">
                    <span className="mb-1 block text-xs font-semibold text-slate-700">{t("unit")}</span>
                    <input className={FIELD} value={draft.unit} maxLength={20} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="kg, %, m…" />
                  </label>
                )}
                {draft.field_type === "select" && (
                  <label className="block min-w-0 sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-slate-700">{t("options")}</span>
                    <textarea
                      className={cn(FIELD, "h-auto resize-y py-2")}
                      rows={4}
                      value={draft.options}
                      onChange={(e) => setDraft({ ...draft, options: e.target.value })}
                      placeholder={"Washed | Lavé\nNatural | Nature"}
                    />
                    <span className="mt-1 block text-xs text-slate-500">{t("optionsHint")}</span>
                  </label>
                )}
                <label className="flex items-center gap-2 text-[13px] text-slate-700 sm:col-span-2">
                  <input type="checkbox" checked={draft.required} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} className="h-4 w-4 accent-[#0B1F3A]" />
                  {t("requiredToggle")}
                </label>
              </div>
              {!draft.id && draft.label_en.trim() && (
                <p className="mt-2 text-xs text-slate-500">
                  {t("keyPreview")} <code className="text-[11px]">{slugifySpecKey(draft.label_en) || "—"}</code>
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={() => setDraft(null)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-100">
                  <X className="h-4 w-4" aria-hidden />
                  {t("cancel")}
                </button>
                <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                  {t("save")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
