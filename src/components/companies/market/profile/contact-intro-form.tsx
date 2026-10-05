"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Value } from "react-phone-number-input";
import { Label } from "@/components/ui/label";
import { PhoneNumberInput } from "@/components/auth/phone-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileCard } from "./profile-card";
import { submitIntroRequest, type IntroRequestInput } from "./contact-intro-actions";

const INTEREST_OPTIONS = [
  "distribution",
  "investment",
  "partnership",
  "sourcing",
  "other",
] as const;

type Interest = (typeof INTEREST_OPTIONS)[number];

interface ContactIntroFormProps {
  companyId: string;
  companyName: string;
}

const EMPTY_STATE = {
  fullName: "",
  submitterCompany: "",
  email: "",
  phone: "",
  interest: "" as Interest | "",
  message: "",
};

/**
 * "Request Contact / Introduction" form (design 5, bottom-right). Anonymous
 * friendly — submits a one-way lead to `business_requests` via a server action;
 * the visitor never receives the company's contact PII. Uses the toast
 * loading→success/error pattern per NON_BLOCKING_UX.
 */
export function ContactIntroForm({ companyId, companyName }: ContactIntroFormProps) {
  const t = useTranslations("CompanyProfile");
  const [form, setForm] = useState(EMPTY_STATE);
  const [pending, startTransition] = useTransition();

  const update = (field: keyof typeof EMPTY_STATE, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.submitterCompany || !form.email || !form.interest) {
      toast.error(t("contact.errorRequired"));
      return;
    }

    const payload: IntroRequestInput = {
      companyId,
      companyName,
      fullName: form.fullName,
      submitterCompany: form.submitterCompany,
      email: form.email,
      phone: form.phone,
      interest: form.interest,
      message: form.message,
    };

    startTransition(async () => {
      const toastId = toast.loading(t("contact.submitting"));
      const res = await submitIntroRequest(payload);
      if (res.ok) {
        toast.success(t("contact.success"), { id: toastId });
        setForm(EMPTY_STATE);
      } else {
        toast.error(t("contact.error"), { id: toastId });
      }
    });
  };

  return (
    <ProfileCard id="contact-intro" title={t("contact.title")}>
      <p className="mb-4 text-[13px] text-slate-600">{t("contact.intro", { name: companyName })}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("contact.fullName")} required>
            <Input
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder={t("contact.fullNamePlaceholder")}
            />
          </Field>
          <Field label={t("contact.companyName")} required>
            <Input
              value={form.submitterCompany}
              onChange={(e) => update("submitterCompany", e.target.value)}
              placeholder={t("contact.companyNamePlaceholder")}
            />
          </Field>
          <Field label={t("contact.email")} required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder={t("contact.emailPlaceholder")}
            />
          </Field>
          <Field label={t("contact.phone")}>
            {/* Buyers come from anywhere: the visitor picks their own country code. */}
            <PhoneNumberInput
              id="intro-phone"
              value={(form.phone || undefined) as Value | undefined}
              onChange={(value) => update("phone", value ?? "")}
              placeholder={t("contact.phonePlaceholder")}
              className="h-9 rounded-md bg-transparent"
            />
          </Field>
          <Field label={t("contact.interest")} required>
            <Select value={form.interest} onValueChange={(v) => update("interest", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("contact.interestPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {t(`contact.interestOptions.${opt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label={t("contact.message")}>
          <Textarea
            rows={3}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder={t("contact.messagePlaceholder")}
          />
        </Field>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 shrink-0 rounded-full bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-navy-deep disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {t("contact.submit")}
          </button>
          <p className="text-[11px] text-slate-500 sm:max-w-xs sm:text-right">{t("contact.privacy")}</p>
        </div>
      </form>
    </ProfileCard>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-market-navy/70">
        {label}
        {required && <span className="text-market-red"> *</span>}
      </Label>
      {children}
    </div>
  );
}
