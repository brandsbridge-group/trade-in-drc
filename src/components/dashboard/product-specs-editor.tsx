"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAX_SPECS,
  SPEC_LABEL_MAX,
  SPEC_VALUE_MAX,
  slugifySpecKey,
  specLabel,
  type CustomSpec,
  type SpecField,
  type TemplateValues,
} from "@/lib/products/specs";

const FIELD =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";

/** Characteristics most products share — offered as one-click free lines. */
const SUGGESTIONS = ["origin", "packaging", "minOrder", "certifications"] as const;

export interface SpecErrors {
  /** Template field keys: required but empty, or not a number. */
  fields: Set<string>;
  /** Free-line ids: half-filled, or named like another characteristic. */
  rows: Set<string>;
}

interface Props {
  /** The selected category's template; empty when it has none (or no category). */
  fields: SpecField[];
  values: TemplateValues;
  custom: CustomSpec[];
  onValuesChange: (values: TemplateValues) => void;
  onCustomChange: (custom: CustomSpec[]) => void;
  errors: SpecErrors;
  locale: string;
  hasCategory: boolean;
}

/**
 * Characteristics of a product: the category's template fields (typed inputs,
 * defined by staff in the console), then the seller's own "name / value"
 * lines for anything the template does not cover.
 */
export function ProductSpecsEditor({ fields, values, custom, onValuesChange, onCustomChange, errors, locale, hasCategory }: Props) {
  const t = useTranslations("Dashboard.productForm.specs");
  const setValue = (key: string, value: string) => onValuesChange({ ...values, [key]: value });

  const total = fields.filter((f) => (values[f.key] ?? "").trim()).length + custom.length;
  const canAdd = total < MAX_SPECS;
  const addRow = (label = "") =>
    onCustomChange([...custom, { id: `row-${Date.now()}-${custom.length}`, label, value: "" }]);
  const updateRow = (id: string, patch: Partial<CustomSpec>) =>
    onCustomChange(custom.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  // A suggestion is offered until a template field or a free line already carries that name.
  const taken = new Set([
    ...fields.flatMap((f) => [f.key, slugifySpecKey(f.label_en), slugifySpecKey(f.label_fr)]),
    ...custom.map((row) => slugifySpecKey(row.label)),
  ]);
  const suggestions = SUGGESTIONS.map((key) => t(`suggestions.${key}`)).filter((label) => !taken.has(slugifySpecKey(label)));

  return (
    <div className="space-y-5">
      {fields.length > 0 ? (
        <div>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{t("templateTitle")}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const id = `spec-${field.key}`;
              const invalid = errors.fields.has(field.key);
              const value = values[field.key] ?? "";
              return (
                <div key={field.key} className="min-w-0">
                  <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-700">
                    {specLabel(field, locale)}
                    {field.required && <span className="ml-0.5 text-market-red">*</span>}
                  </label>
                  {field.field_type === "select" ? (
                    <select
                      id={id}
                      value={value}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      aria-invalid={invalid}
                      className={cn(FIELD, invalid && "border-market-red")}
                    >
                      <option value="">{t("choose")}</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {specLabel(option, locale)}
                        </option>
                      ))}
                    </select>
                  ) : field.field_type === "boolean" ? (
                    <div id={id} role="radiogroup" aria-label={specLabel(field, locale)} className="inline-flex rounded-full bg-slate-100 p-1">
                      {(["true", "false"] as const).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          role="radio"
                          aria-checked={value === choice}
                          // Clicking the active choice clears it: an optional yes/no can stay unanswered.
                          onClick={() => setValue(field.key, value === choice ? "" : choice)}
                          className={cn(
                            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                            value === choice ? "bg-market-navy text-white" : "text-slate-600 hover:text-market-navy"
                          )}
                        >
                          {t(choice === "true" ? "yes" : "no")}
                        </button>
                      ))}
                    </div>
                  ) : field.field_type === "number" ? (
                    <div className={cn("flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors focus-within:border-market-navy", invalid && "border-market-red")}>
                      <input
                        id={id}
                        inputMode="decimal"
                        value={value}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        aria-invalid={invalid}
                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none"
                      />
                      {field.unit && <span className="shrink-0 border-l border-slate-200 bg-slate-50 px-3 text-xs font-medium leading-10 text-slate-500">{field.unit}</span>}
                    </div>
                  ) : (
                    <input
                      id={id}
                      value={value}
                      maxLength={SPEC_VALUE_MAX}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      aria-invalid={invalid}
                      className={cn(FIELD, invalid && "border-market-red")}
                    />
                  )}
                  {invalid && (
                    <p className="mt-1 text-xs text-market-red">
                      {t(field.field_type === "number" && value.trim() ? "errors.number" : "errors.required")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{t(hasCategory ? "noTemplate" : "noCategory")}</p>
      )}

      <div>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {t(fields.length > 0 ? "customTitleMore" : "customTitle")}
        </p>

        {custom.length > 0 && (
          <ul className="mb-3 space-y-2">
            {custom.map((row) => {
              const invalid = errors.rows.has(row.id);
              return (
                <li key={row.id}>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <input
                      value={row.label}
                      maxLength={SPEC_LABEL_MAX}
                      onChange={(e) => updateRow(row.id, { label: e.target.value })}
                      placeholder={t("namePlaceholder")}
                      aria-label={t("nameLabel")}
                      aria-invalid={invalid}
                      className={cn(FIELD, "min-w-0 flex-1 basis-[40%] sm:basis-0", invalid && "border-market-red")}
                    />
                    <input
                      value={row.value}
                      maxLength={SPEC_VALUE_MAX}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                      placeholder={t("valuePlaceholder")}
                      aria-label={t("valueLabel")}
                      aria-invalid={invalid}
                      className={cn(FIELD, "min-w-0 flex-1 basis-[40%] sm:basis-0", invalid && "border-market-red")}
                    />
                    <button
                      type="button"
                      onClick={() => onCustomChange(custom.filter((r) => r.id !== row.id))}
                      aria-label={t("removeRow")}
                      title={t("removeRow")}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-red"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  {invalid && <p className="mt-1 text-xs text-market-red">{t("errors.row")}</p>}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addRow()}
            disabled={!canAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-market-navy transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t("addRow")}
          </button>
          {canAdd &&
            suggestions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => addRow(label)}
                className="inline-flex items-center gap-1 rounded-full bg-market-cream px-3 py-1.5 text-xs font-semibold text-market-or-dark transition-colors hover:bg-market-or-light/40"
              >
                <Plus className="h-3 w-3" aria-hidden />
                {label}
              </button>
            ))}
        </div>
        {!canAdd && <p className="mt-2 text-xs text-slate-500">{t("max", { max: MAX_SPECS })}</p>}
      </div>
    </div>
  );
}
