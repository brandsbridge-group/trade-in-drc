"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { PasswordField, SubmitButton, currentLocale } from "@/components/auth/auth-fields";

const STRENGTH_COLORS = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-emerald-500"];

export function ResetPasswordForm() {
  const t = useTranslations("Auth.resetPassword");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);

  // Only the length is enforced (MIN_PASSWORD_LENGTH); the other two are
  // guidance that feeds the strength meter.
  const rules = [
    { ok: newPassword.length >= MIN_PASSWORD_LENGTH, label: t("ruleLength", { min: MIN_PASSWORD_LENGTH }) },
    { ok: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword), label: t("ruleCase") },
    { ok: /\d/.test(newPassword), label: t("ruleNumber") },
  ];
  const strength = newPassword ? rules.filter((r) => r.ok).length : 0;
  const showMatch = confirmPassword.length > 0;
  const matches = newPassword === confirmPassword;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(t("weak"));
      return;
    }
    if (!matches) {
      toast.error(t("mismatch"));
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    if (error) {
      // No recovery session = the link expired or was already used.
      if (/session/i.test(error.message)) {
        setExpired(true);
        toast.error(t("expired"));
      } else {
        toast.error(error.message);
      }
      setBusy(false);
      return;
    }
    toast.success(t("success"));
    // Full navigation; keep the button spinning until /login is up.
    window.location.href = `/${currentLocale()}/login`;
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <PasswordField
        id="new-password"
        label={t("newPassword")}
        autoComplete="new-password"
        disabled={busy}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      {/* Strength meter + checklist */}
      <div className="space-y-2" aria-live="polite">
        <div className="grid grid-cols-3 gap-1.5" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                "h-1 rounded-full transition-colors duration-200",
                strength >= n ? STRENGTH_COLORS[strength] : "bg-slate-200"
              )}
            />
          ))}
        </div>
        <ul className="grid gap-1">
          {rules.map((r) => (
            <li
              key={r.label}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors duration-150",
                r.ok ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {r.ok ? <Check className="h-3.5 w-3.5" /> : <span className="mx-[5px] h-1 w-1 rounded-full bg-current" />}
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      <PasswordField
        id="confirm-password"
        label={t("confirm")}
        autoComplete="new-password"
        disabled={busy}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        aria-invalid={showMatch && !matches ? true : undefined}
      />
      {showMatch && (
        <p
          className={cn(
            "-mt-1 flex items-center gap-1.5 text-xs",
            matches ? "text-emerald-600" : "text-destructive"
          )}
        >
          {matches ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {matches ? t("match") : t("mismatch")}
        </p>
      )}

      <SubmitButton loading={busy}>{t("submit")}</SubmitButton>

      {expired && (
        <Link
          href="/forgot-password"
          className="text-center text-sm font-medium text-primary underline underline-offset-4"
        >
          {t("requestNew")}
        </Link>
      )}
    </form>
  );
}
