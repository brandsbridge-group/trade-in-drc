"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Send, Loader2 } from "lucide-react";
import { submitContactMessage } from "@/lib/contact/actions";
import {
  CONTACT,
  CONTACT_ADDRESS,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_HREF,
} from "@/config/contact";

const TOAST_ID = "contact-submit";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string; // honeypot — must stay empty
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  company: "",
};

export default function ContactPage() {
  const t = useTranslations("Contact");
  const tc = useTranslations("ContactPage");
  const locale = useLocale();
  const reduce = useReducedMotion();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsSubmitting(true);
    toast.loading(tc("sending"), { id: TOAST_ID });

    try {
      const result = await submitContactMessage({ ...formData, locale });

      if (result.success) {
        toast.success(t("success"), { id: TOAST_ID });
        setFormData(EMPTY_FORM);
      } else if (result.error === "rate_limited") {
        toast.error(tc("rateLimited"), { id: TOAST_ID });
      } else if (result.error === "validation_failed") {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(tc("validationError"), { id: TOAST_ID });
      } else {
        toast.error(tc("sendError"), { id: TOAST_ID });
      }
    } catch {
      toast.error(tc("sendError"), { id: TOAST_ID });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(19,38,75,0.1),transparent_42%)] text-slate-900">
      <section className="relative isolate overflow-hidden bg-market-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-28 -top-24 h-[360px] w-[360px] rounded-full bg-primary/35 blur-[110px]" />
          <div className="absolute -bottom-24 right-[-8%] h-[340px] w-[340px] rounded-full bg-market-or/10 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-market-or">{t("title")}</p>
            <h1 className="text-3xl font-display font-extrabold leading-[1.08] tracking-tight md:text-5xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
              {t("subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_-36px_rgba(15,23,42,0.35)] md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-market-or-dark">{tc("getInTouch")}</p>
            <h2 className="mt-3 text-2xl font-display font-bold tracking-tight text-market-navy">{tc("getInTouch")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{tc("getInTouchBody")}</p>

            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-market-or/12 text-market-or-dark ring-1 ring-market-or/20">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-market-navy">{t("email")}</h3>
                  <a
                    href={CONTACT_EMAIL_HREF}
                    className="mt-1 block text-sm text-slate-600 underline-offset-2 transition-colors duration-150 hover:text-market-navy hover:underline"
                  >
                    {CONTACT.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-market-or/12 text-market-or-dark ring-1 ring-market-or/20">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-market-navy">{tc("phone")}</h3>
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="mt-1 block text-sm text-slate-600 underline-offset-2 transition-colors duration-150 hover:text-market-navy hover:underline"
                  >
                    {CONTACT.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-market-or/12 text-market-or-dark ring-1 ring-market-or/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-market-navy">{tc("address")}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">{CONTACT_ADDRESS}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_-36px_rgba(15,23,42,0.35)] md:p-8">
            <h2 className="text-2xl font-display font-bold tracking-tight text-market-navy">{t("sendMessage")}</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">{t("name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={tc("namePlaceholder")}
                    aria-invalid={Boolean(fieldErrors.name)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/35"
                  />
                  {fieldErrors.name && <p className="text-xs text-destructive">{tc("nameError")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={tc("emailPlaceholder")}
                    aria-invalid={Boolean(fieldErrors.email)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/35"
                  />
                  {fieldErrors.email && <p className="text-xs text-destructive">{tc("emailError")}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-semibold text-slate-700">{t("subject")}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={tc("subjectPlaceholder")}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/35"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold text-slate-700">{t("message")}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={tc("messagePlaceholder")}
                  rows={5}
                  aria-invalid={Boolean(fieldErrors.message)}
                  required
                  className="rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/35"
                />
                {fieldErrors.message && <p className="text-xs text-destructive">{tc("messageError")}</p>}
              </div>

              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="company">{tc("honeypotLabel")}</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-market-navy text-sm font-semibold text-white shadow-lg shadow-market-navy/20 transition-colors duration-150 hover:bg-market-navy/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t("send")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
