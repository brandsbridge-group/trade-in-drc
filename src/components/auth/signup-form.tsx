"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { isValidPhoneNumber, type Value } from "react-phone-number-input";
import { createClient } from "@/lib/supabase/client";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect-guard";
import {
  EmailField,
  NameField,
  PasswordField,
  SubmitButton,
  authErrorMessage,
  currentLocale,
} from "./auth-fields";
import { PhoneField } from "./phone-field";

export function SignupForm() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState<Value | undefined>();
  const [phoneInvalid, setPhoneInvalid] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Phone is optional — only validate it when something was typed.
    if (phone && !isValidPhoneNumber(phone)) {
      setPhoneInvalid(true);
      toast.error(t("errorPhoneInvalid"));
      return;
    }

    setLoading(true);
    const locale = currentLocale();
    const origin = window.location.origin;

    // Most people registering a company don't have an account yet, so this
    // is where `?redirect=` is carried for the vast majority of the flow.
    const safeRedirect = resolvePostAuthRedirect(searchParams.get("redirect"), locale, origin);

    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        // The confirmation link opens /callback, which forwards `redirect` on
        // to resolvePostAuthRedirect itself — both ends share the same helper.
        emailRedirectTo: `${origin}/${locale}/callback?redirect=${encodeURIComponent(safeRedirect)}`,
        // Copied into public.profiles by the handle_new_user() trigger (00046).
        // `locale` picks the language of the confirmation e-mail template.
        data: { full_name: fullName.trim(), phone: phone ?? null, locale },
      },
    });
    if (error) {
      toast.error(authErrorMessage(error, t));
      setLoading(false);
      return;
    }
    toast.success(t("successRegister"));
    // Keep `loading` on while the verify-email page loads.
    window.location.href = `/${locale}/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(safeRedirect)}`;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <NameField
        label={t("fullName")}
        placeholder={t("fullNamePlaceholder")}
        disabled={loading}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <EmailField
        label={t("email")}
        placeholder="name@example.com"
        disabled={loading}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordField
        label={t("password")}
        autoComplete="new-password"
        disabled={loading}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PhoneField
        label={`${t("phone")} (${t("optional")})`}
        placeholder={t("phonePlaceholder")}
        disabled={loading}
        value={phone}
        invalid={phoneInvalid}
        onChange={(v) => {
          setPhone(v);
          setPhoneInvalid(false);
        }}
      />
      <SubmitButton loading={loading}>{t("signUp")}</SubmitButton>
    </form>
  );
}
