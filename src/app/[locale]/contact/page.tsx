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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-sm opacity-90 max-w-xl mx-auto">{t("subtitle")}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div>
            <h2 className="text-lg font-bold mb-4">{tc("getInTouch")}</h2>
            <p className="text-muted-foreground mb-6 text-sm">{tc("getInTouchBody")}</p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0 rounded-md">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{t("email")}</h3>
                  {/* Values come from config/contact.ts, not the locale files —
                      they are proper nouns and must not drift per language. */}
                  <a
                    href={CONTACT_EMAIL_HREF}
                    className="text-muted-foreground underline-offset-2 transition-colors duration-150 hover:text-primary hover:underline"
                  >
                    {CONTACT.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0 rounded-md">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{tc("phone")}</h3>
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="text-muted-foreground underline-offset-2 transition-colors duration-150 hover:text-primary hover:underline"
                  >
                    {CONTACT.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0 rounded-md">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{tc("address")}</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{CONTACT_ADDRESS}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card border border-slate-200 rounded-2xl p-4">
            <h2 className="text-lg font-bold mb-4">{t("sendMessage")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={tc("namePlaceholder")}
                    aria-invalid={Boolean(fieldErrors.name)}
                    required
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">{tc("nameError")}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={tc("emailPlaceholder")}
                    aria-invalid={Boolean(fieldErrors.email)}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{tc("emailError")}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t("subject")}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={tc("subjectPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={tc("messagePlaceholder")}
                  rows={5}
                  aria-invalid={Boolean(fieldErrors.message)}
                  required
                />
                {fieldErrors.message && (
                  <p className="text-xs text-destructive">{tc("messageError")}</p>
                )}
              </div>

              {/*
                Honeypot field — visually hidden and off the tab order. Genuine
                users never see or fill it; bots that auto-fill every input trip
                it and the submission is silently discarded server-side.
              */}
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
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
