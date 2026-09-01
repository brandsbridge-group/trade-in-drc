"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";

export function ResetPasswordForm() {
  const t = useTranslations("Auth.resetPassword");
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(t("weak"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("mismatch"));
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("success"));
      router.push("/login");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        type="password"
        placeholder={t("newPassword")}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder={t("confirm")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={busy} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
