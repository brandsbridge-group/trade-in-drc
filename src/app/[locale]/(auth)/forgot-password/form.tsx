"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth.forgotPassword");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/callback?type=recovery`,
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success(t("sent"));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
      />
      <Button type="submit" disabled={sending} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
