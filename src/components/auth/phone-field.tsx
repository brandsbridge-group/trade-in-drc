"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import PhoneInput, { type Country, type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import en from "react-phone-number-input/locale/en.json";
import fr from "react-phone-number-input/locale/fr.json";
import es from "react-phone-number-input/locale/es.json";
import tr from "react-phone-number-input/locale/tr.json";
import zh from "react-phone-number-input/locale/zh.json";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const COUNTRY_LABELS = { en, fr, es, tr, zh } as const;

/** Bare text input: the wrapper below draws the field chrome. */
const BareInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function BareInput(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
      />
    );
  }
);

interface PhoneNumberInputProps {
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  /** ISO country preselected in the picker; omit to let the user pick. */
  defaultCountry?: Country;
  /** Field chrome (border, height, background) — merged over the default. */
  className?: string;
}

/**
 * The bare phone control: country picker (flag + dialling code, names in the
 * site's language) + number, emitting an E.164 string ("+243812345678").
 * Used by PhoneField below and by the company form, which draws its own label.
 */
export function PhoneNumberInput({
  value,
  onChange,
  id = "phone",
  disabled,
  placeholder,
  invalid,
  defaultCountry,
  className,
}: PhoneNumberInputProps) {
  const locale = useLocale() as keyof typeof COUNTRY_LABELS;
  return (
    <PhoneInput
      id={id}
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      labels={COUNTRY_LABELS[locale] ?? en}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="tel"
      aria-invalid={invalid || undefined}
      inputComponent={BareInput}
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 shadow-xs transition-colors duration-150 focus-within:border-ring focus-within:bg-background focus-within:ring-[3px] focus-within:ring-ring/50 aria-[invalid=true]:border-destructive has-[input[aria-invalid=true]]:border-destructive has-[input:disabled]:opacity-50",
        className
      )}
    />
  );
}

interface PhoneFieldProps {
  label: string;
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
}

/**
 * Labelled phone field for the auth pages, defaulting to the DRC (+243).
 */
export function PhoneField({ label, value, onChange, disabled, placeholder, invalid }: PhoneFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="phone">{label}</Label>
      <PhoneNumberInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        invalid={invalid}
        defaultCountry="CD"
      />
    </div>
  );
}
