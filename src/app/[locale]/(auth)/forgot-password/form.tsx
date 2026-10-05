"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import { authEmailRedirect } from "@/lib/auth/email-redirect";
import { EmailField, SubmitButton } from "@/components/auth/auth-fields";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth.forgotPassword");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: authEmailRedirect(window.location.origin, locale, "recovery"),
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success(t("sent"));
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <EmailField
        label={tAuth("email")}
        placeholder={t("emailPlaceholder")}
        disabled={sending}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <SubmitButton loading={sending}>{t("submit")}</SubmitButton>
    </form>
  );
}
