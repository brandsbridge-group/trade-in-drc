"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

function VerifyEmailContent() {
  const t = useTranslations("Auth.verifyEmail");
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const [sending, setSending] = useState(false);

  async function resend() {
    if (!email) {
      toast.error("Missing email");
      return;
    }
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success(t("resent"));
  }

  return (
    <div className="flex gap-2">
      <Button onClick={resend} disabled={sending}>{t("resend")}</Button>
      <Button variant="outline" asChild>
        <Link href="/login">{t("openInbox")}</Link>
      </Button>
    </div>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
