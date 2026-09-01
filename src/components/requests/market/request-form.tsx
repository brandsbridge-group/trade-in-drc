"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, UploadCloud, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryCombobox } from "@/components/forms/country-combobox";
import { COUNTRIES } from "@/config/geo";
import { DRC_PROVINCES } from "@/config/provinces";
import { cn } from "@/lib/utils";

import {
  submitFindPartnerRequest,
  type FindPartnerInput,
} from "./find-partner-actions";
import {
  CONTACT_TYPES,
  VOLUMES,
  TIMELINES,
  PREFERENCES,
  DIAL_CODES,
  MAX_UPLOAD_BYTES,
  ACCEPTED_UPLOAD,
  type BusinessNeed,
  type Preference,
} from "./find-partner-config";

interface SectorOption {
  id: string;
  label: string;
}

interface RequestFormProps {
  sectors: SectorOption[];
  selectedNeed: BusinessNeed | null;
  onSubmitted: (reference: string | null) => void;
}

interface FormState {
  companyName: string;
  country: string;
  website: string;
  contactPerson: string;
  email: string;
  dialCode: string;
  phoneNumber: string;
  sector: string;
  contactType: string;
  targetProvince: string;
  productService: string;
  volume: string;
  timeline: string;
  requirement: string;
}

const EMPTY_FORM: FormState = {
  companyName: "",
  country: "",
  website: "",
  contactPerson: "",
  email: "",
  dialCode: DIAL_CODES[0],
  phoneNumber: "",
  sector: "",
  contactType: "",
  targetProvince: "",
  productService: "",
  volume: "",
  timeline: "",
  requirement: "",
};

const INPUT = "h-9 text-sm";
const TRIGGER = "h-9 text-sm";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
        {label} {required && <span className="text-market-red">*</span>}
      </Label>
      {children}
    </div>
  );
}

const STEP_BADGE =
  "flex size-7 items-center justify-center rounded-md bg-market-navy text-sm font-bold text-white";

/** Column 2 — the full business-need form. Owns field state + submission. */
export function RequestForm({ sectors, selectedNeed, onSubmitted }: RequestFormProps) {
  const t = useTranslations("FindPartner");
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [prefs, setPrefs] = React.useState<Preference[]>([
    "verified_only",
    "b2b_meetings",
    "market_entry_support",
  ]);
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const set = <K extends keyof FormState>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const togglePref = (pref: Preference) =>
    setPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );

  const onFile = (file: File | null) => {
    if (!file) return setAttachment(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(t("validation.fileTooLarge"));
      return;
    }
    setAttachment(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNeed) {
      toast.error(t("validation.selectNeed"));
      return;
    }
    if (
      !form.companyName.trim() ||
      !form.country.trim() ||
      !form.contactPerson.trim() ||
      !form.email.trim() ||
      !form.contactType ||
      !form.targetProvince ||
      !form.timeline ||
      !form.requirement.trim()
    ) {
      toast.error(t("validation.required"));
      return;
    }

    const phone = form.phoneNumber.trim()
      ? `${form.dialCode} ${form.phoneNumber.trim()}`
      : null;

    const payload: FindPartnerInput = {
      need: selectedNeed,
      companyName: form.companyName,
      country: form.country,
      website: form.website || null,
      contactPerson: form.contactPerson,
      email: form.email,
      phone,
      sector: form.sector || null,
      contactType: t(`contactTypes.${form.contactType}`),
      targetProvince: form.targetProvince,
      productService: form.productService || null,
      volume: form.volume ? t(`volumes.${form.volume}`) : null,
      timeline: form.timeline,
      requirement: form.requirement,
      attachmentName: attachment?.name ?? null,
      preferences: prefs.map((p) => t(`checkboxes.${p}`)),
    };

    setIsSubmitting(true);
    const toastId = toast.loading(t("toast.loading"));
    try {
      const result = await submitFindPartnerRequest(payload);
      if (!result.ok) {
        toast.error(t("toast.error"), { id: toastId });
        return;
      }
      toast.success(t("toast.success"), { id: toastId });
      setForm(EMPTY_FORM);
      setAttachment(null);
      onSubmitted(result.reference ?? null);
    } catch {
      toast.error(t("toast.error"), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="request-form" className="scroll-mt-24">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className={STEP_BADGE} aria-hidden>
          2
        </span>
        <h2 className="font-display text-lg font-bold text-market-navy">
          {t("step2.title")}
        </h2>
      </div>
      <p className="mb-4 text-sm text-slate-500">{t("step2.subtitle")}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column */}
        <Field label={t("form.companyName")} htmlFor="fp-company" required>
          <Input id="fp-company" className={INPUT} placeholder={t("form.companyNamePlaceholder")} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        </Field>
        <Field label={t("form.contactType")} htmlFor="fp-contactType" required>
          <Select value={form.contactType} onValueChange={(v) => set("contactType", v)}>
            <SelectTrigger id="fp-contactType" className={TRIGGER}>
              <SelectValue placeholder={t("form.contactTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TYPES.map((c) => (
                <SelectItem key={c} value={c} className="text-sm">{t(`contactTypes.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("form.country")} htmlFor="fp-country" required>
          <CountryCombobox id="fp-country" value={form.country} onChange={(v) => set("country", v)} options={COUNTRIES} placeholder={t("form.countryPlaceholder")} searchPlaceholder={t("form.countrySearch")} emptyText={t("form.countryNoResults")} />
        </Field>
        <Field label={t("form.targetProvince")} htmlFor="fp-province" required>
          <Select value={form.targetProvince} onValueChange={(v) => set("targetProvince", v)}>
            <SelectTrigger id="fp-province" className={TRIGGER}>
              <SelectValue placeholder={t("form.targetProvincePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {DRC_PROVINCES.map((p) => (
                <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("form.website")} htmlFor="fp-website">
          <Input id="fp-website" className={INPUT} placeholder={t("form.websitePlaceholder")} value={form.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
        <Field label={t("form.productService")} htmlFor="fp-product" required>
          <Input id="fp-product" className={INPUT} placeholder={t("form.productServicePlaceholder")} value={form.productService} onChange={(e) => set("productService", e.target.value)} />
        </Field>

        <Field label={t("form.contactPerson")} htmlFor="fp-person" required>
          <Input id="fp-person" className={INPUT} placeholder={t("form.contactPersonPlaceholder")} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
        </Field>
        <Field label={t("form.volume")} htmlFor="fp-volume">
          <Select value={form.volume} onValueChange={(v) => set("volume", v)}>
            <SelectTrigger id="fp-volume" className={TRIGGER}>
              <SelectValue placeholder={t("form.volumePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {VOLUMES.map((v) => (
                <SelectItem key={v} value={v} className="text-sm">{t(`volumes.${v}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("form.email")} htmlFor="fp-email" required>
          <Input id="fp-email" type="email" className={INPUT} placeholder={t("form.emailPlaceholder")} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label={t("form.timeline")} htmlFor="fp-timeline" required>
          <Select value={form.timeline} onValueChange={(v) => set("timeline", v)}>
            <SelectTrigger id="fp-timeline" className={TRIGGER}>
              <SelectValue placeholder={t("form.timelinePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {TIMELINES.map((tl) => (
                <SelectItem key={tl} value={tl} className="text-sm">{t(`timelines.${tl}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("form.phone")} htmlFor="fp-phone">
          <div className="flex gap-2">
            <Select value={form.dialCode} onValueChange={(v) => set("dialCode", v)}>
              <SelectTrigger className="h-9 w-20 shrink-0 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIAL_CODES.map((d) => (
                  <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input id="fp-phone" type="tel" className={INPUT} placeholder={t("form.phonePlaceholder")} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
          </div>
        </Field>
        <Field label={t("form.requirement")} htmlFor="fp-requirement" required>
          <Textarea id="fp-requirement" rows={3} className="text-sm" placeholder={t("form.requirementPlaceholder")} value={form.requirement} onChange={(e) => set("requirement", e.target.value)} />
        </Field>

        <Field label={t("form.sector")} htmlFor="fp-sector">
          <Select value={form.sector} onValueChange={(v) => set("sector", v)}>
            <SelectTrigger id="fp-sector" className={TRIGGER}>
              <SelectValue placeholder={t("form.sectorPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((s) => (
                <SelectItem key={s.id} value={s.label} className="text-sm">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("form.uploadLabel")} htmlFor="fp-file">
          <label
            htmlFor="fp-file"
            className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50/60 px-3 text-xs text-slate-500 transition-colors duration-150 hover:border-market-navy/50"
          >
            <UploadCloud className="size-4 shrink-0 text-market-navy/60" aria-hidden />
            <span className="truncate">
              {attachment ? attachment.name : `${t("form.uploadTitle")} — ${t("form.uploadHint")}`}
            </span>
            <input id="fp-file" type="file" accept={ACCEPTED_UPLOAD} className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
      </div>

      {/* Preference checkboxes */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
        {PREFERENCES.map((pref) => {
          const checked = prefs.includes(pref);
          return (
            <label key={pref} className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePref(pref)}
                className="size-4 shrink-0 rounded border-slate-300 text-market-navy accent-market-navy"
              />
              {t(`checkboxes.${pref}`)}
            </label>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        {t("form.privacy")}
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-market-red px-5 py-2.5 text-sm font-semibold text-white",
          "transition-colors duration-150 hover:bg-market-red-dark disabled:opacity-60"
        )}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {isSubmitting ? t("form.submitting") : t("form.submit")}
      </button>
    </form>
  );
}
