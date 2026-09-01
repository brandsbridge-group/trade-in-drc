"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIELD_CLS } from "./constants";

export function SectionHeader({
  icon: Icon,
  title,
  tight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  /** Reduces the bottom margin — for headers immediately followed by a
   *  subheading paragraph, where the full mb-4 gap plus the paragraph's own
   *  margin would look doubled. Achieves the tighter spacing without a
   *  negative margin on the paragraph below (house rule: no negative
   *  margins in this area — that's what caused the original overlap bug). */
  tight?: boolean;
}) {
  return (
    <h2
      className={cn(
        "flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-market-navy",
        tight ? "mb-1" : "mb-4"
      )}
    >
      <Icon className="size-4" aria-hidden />
      {title}
    </h2>
  );
}

export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1 block text-xs font-semibold text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-market-red">*</span>}
    </label>
  );
}

interface TextFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  invalid?: boolean;
}

export function TextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  invalid,
}: TextFieldProps) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(FIELD_CLS, invalid && "border-market-red")}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  invalid?: boolean;
}

export function SelectField({
  label,
  required,
  value,
  onChange,
  placeholder,
  options,
  invalid,
}: SelectFieldProps) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD_CLS, invalid && "border-market-red")}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Phone input with a dialing-prefix segment (design: "+243 ▾"). Pass
 * `dialOptions` + `onPrefixChange` to let the applicant pick their country's
 * code — international companies need this. Without them the prefix is static.
 */
export function PhoneField({
  label,
  required,
  prefix,
  dialOptions,
  onPrefixChange,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  label: string;
  required?: boolean;
  prefix: string;
  dialOptions?: { value: string; label: string }[];
  onPrefixChange?: (v: string) => void;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const selectable = dialOptions && onPrefixChange;
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div
        className={cn(
          "flex h-10 items-center overflow-hidden rounded-[0.5rem] border border-slate-300 bg-white transition-colors duration-150 focus-within:border-market-navy",
          invalid && "border-market-red"
        )}
      >
        {selectable ? (
          <select
            aria-label={label}
            value={prefix}
            onChange={(e) => onPrefixChange(e.target.value)}
            className="h-full border-r border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-600 outline-none"
          >
            <option value="" disabled>
              —
            </option>
            {dialOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex h-full items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
            {prefix}
          </span>
        )}
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

/**
 * Add/remove a value in a multi-select array, immutably. Written four separate
 * times across the wizard steps before this existed.
 */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Multi-line free text (design: "tell us what you are looking for"). */
export function TextAreaField({
  label,
  required,
  value,
  onChange,
  placeholder,
  invalid,
  rows = 4,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors duration-150 focus:border-market-navy placeholder:text-slate-400",
          invalid && "border-market-red"
        )}
      />
    </div>
  );
}

/**
 * Toggleable chips for a multi-select (languages, DRC interests, provinces).
 * Extracted from step-positioning so every multi-select looks and behaves the
 * same instead of each step hand-rolling the toggle markup.
 */
export function ChipGroup({
  label,
  required,
  options,
  selected,
  onToggle,
  invalid,
  removable,
}: {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  invalid?: boolean;
  /** Show an × on selected chips (the languages picker's look). */
  removable?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-[0.5rem] border border-slate-300 p-2",
          invalid && "border-market-red"
        )}
      >
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onToggle(o.value)}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
                on
                  ? "bg-sky-100 text-market-navy"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {o.label}
              {removable && on && <X className="size-3" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
