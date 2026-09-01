"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterSignup() {
  const t = useTranslations("Design.newsletter");
  const td = useTranslations("Design");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setBusy(true);
    // Endpoint TBD in a future slice; for now just simulate.
    setTimeout(() => {
      setBusy(false);
      setEmail("");
      setConsent(false);
      toast.success(td("subscribe"));
    }, 400);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-medium">{t("headline")}</p>
      <p className="text-xs text-muted-foreground">{t("body")}</p>
      <div className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={td("emailPlaceholder")}
          className="h-9 text-sm"
        />
        <Button type="submit" disabled={!consent || busy} size="sm" className="h-9">{td("subscribe")}</Button>
      </div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        <span>
          {t("consent", { privacyLink: t("privacy") })}
        </span>
      </label>
    </form>
  );
}
