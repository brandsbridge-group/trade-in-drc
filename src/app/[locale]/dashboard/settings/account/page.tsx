"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { PageHeader } from "@/components/design";

export default function AccountSettingsPage() {
  const t = useTranslations("Auth.accountSettings");
  const tReset = useTranslations("Auth.resetPassword");
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState<"email" | "pw" | null>(null);

  const verified = !!user?.email_confirmed_at;

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setBusy(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("emailChangeSent"));
      setNewEmail("");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < MIN_PASSWORD_LENGTH) {
      toast.error(tReset("weak"));
      return;
    }
    setBusy("pw");
    const supabase = createClient();
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPw,
    });
    if (reauthErr) {
      setBusy(null);
      toast.error(reauthErr.message);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setBusy(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("saved"));
      setCurrentPw("");
      setNewPw("");
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t("title")}
        subtitle={!verified ? t("unverifiedBanner") : undefined}
      />

      <div className="max-w-md space-y-8 mt-6">
        <form onSubmit={changeEmail} className="space-y-4">
          <h2 className="text-sm font-medium">{t("changeEmail")}</h2>
          <div>
            <Label className="text-sm">{t("email")}</Label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="mt-1 h-9 text-sm bg-muted"
            />
          </div>
          <div>
            <Label htmlFor="newEmail" className="text-sm">{t("newEmail")}</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder={t("newEmail")}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="mt-1 h-9 text-sm"
            />
          </div>
          <Button type="submit" disabled={busy === "email"} size="sm" className="text-sm">
            {busy === "email" && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
            {t("changeEmail")}
          </Button>
        </form>

        <form onSubmit={changePassword} className="space-y-4">
          <h2 className="text-sm font-medium">{t("changePassword")}</h2>
          <div>
            <Label htmlFor="currentPw" className="text-sm">{t("currentPassword")}</Label>
            <Input
              id="currentPw"
              type="password"
              placeholder={t("currentPassword")}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="newPw" className="text-sm">{t("password")}</Label>
            <Input
              id="newPw"
              type="password"
              placeholder={t("password")}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              className="mt-1 h-9 text-sm"
            />
          </div>
          <Button type="submit" disabled={busy === "pw"} size="sm" className="text-sm">
            {busy === "pw" && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
            {t("changePassword")}
          </Button>
        </form>
      </div>
    </div>
  );
}
