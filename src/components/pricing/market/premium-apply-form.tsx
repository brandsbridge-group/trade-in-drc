"use client";

import * as React from "react";
import type { PromotionPlanId } from "@/config/promotion-plans";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  submitPremiumApplication,
  type PremiumApplyInput,
} from "./premium-apply-actions";

const TOAST_ID = "premium-apply";

const FIELD_CLS =
  "h-10 w-full rounded-[0.5rem] border-slate-300 text-sm transition-colors duration-150 focus-visible:border-market-navy";

interface PremiumApplyButtonProps {
  /** Visible button label (already localized by the caller). */
  label: string;
  /**
   * Promotion package this button applies for. Recorded on the lead so admins
   * can see which package was requested. Omitted → the default plan.
   */
  plan?: PromotionPlanId;
  /** Tailwind classes for the trigger button (colour / size variants). */
  className?: string;
  /** Optional leading icon rendered inside the trigger. */
  icon?: React.ReactNode;
}

/**
 * Self-contained apply island (design 12). Renders a trigger button that opens
 * the Premium application dialog. Two instances live on the page — the hero red
 * CTA and the assistance-band outline "Book a Call" — each managing its own
 * open/submit/success state so no state has to cross the RSC boundary.
 */
export function PremiumApplyButton({
  label,
  plan,
  className,
  icon,
}: PremiumApplyButtonProps) {
  const t = useTranslations("Premium");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);

  const resetOnClose = React.useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      // Defer the reset so the closing transition doesn't flash the form.
      window.setTimeout(() => {
        setReference(null);
        setSubmitting(false);
      }, 180);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const fd = new FormData(e.currentTarget);
    const input: PremiumApplyInput = {
      ...(plan ? { plan } : {}),
      fullName: String(fd.get("fullName") ?? ""),
      companyName: String(fd.get("companyName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      note: String(fd.get("note") ?? ""),
    };

    setSubmitting(true);
    toast.loading(t("form.submitting"), { id: TOAST_ID });
    const res = await submitPremiumApplication(input);
    setSubmitting(false);

    if (res.ok) {
      setReference(res.reference ?? "");
      toast.success(t("form.success.toast"), { id: TOAST_ID });
    } else {
      toast.error(
        res.error === "invalid" ? t("form.errors.invalid") : t("form.errors.server"),
        { id: TOAST_ID }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetOnClose}>
      <DialogTrigger asChild>
        <Button type="button" className={className}>
          {icon}
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-[0.5rem]">
        {reference !== null ? (
          <div className="py-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-market-navy">
              {t("form.success.title")}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              {t("form.success.body")}
            </p>
            {reference && (
              <div className="mt-4 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("form.success.reference")}
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold text-market-navy">
                  {reference}
                </p>
              </div>
            )}
            <Button
              type="button"
              onClick={() => resetOnClose(false)}
              className="mt-5 w-full bg-market-navy text-white transition-colors duration-150 hover:bg-market-navy-deep"
            >
              {t("form.success.done")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-market-navy">
                {t("form.title")}
              </DialogTitle>
              <DialogDescription>{t("form.subtitle")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <Field id="fullName" label={t("form.fields.fullName")} required>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  autoComplete="name"
                  placeholder={t("form.placeholders.fullName")}
                  className={FIELD_CLS}
                />
              </Field>
              <Field id="companyName" label={t("form.fields.companyName")} required>
                <Input
                  id="companyName"
                  name="companyName"
                  required
                  autoComplete="organization"
                  placeholder={t("form.placeholders.companyName")}
                  className={FIELD_CLS}
                />
              </Field>
              <Field id="email" label={t("form.fields.email")} required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("form.placeholders.email")}
                  className={FIELD_CLS}
                />
              </Field>
              <Field id="phone" label={t("form.fields.phone")} required>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder={t("form.placeholders.phone")}
                  className={FIELD_CLS}
                />
              </Field>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-market-red text-white transition-colors duration-150 hover:bg-market-red-dark"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? t("form.submitting") : t("form.submit")}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 text-xs font-semibold text-slate-800">
        {label} {required && <span className="text-market-red">*</span>}
      </Label>
      {children}
    </div>
  );
}
