"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { approveOpportunity, rejectOpportunity } from "./actions";

export function ReviewActions({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: string;
}) {
  const t = useTranslations("Opportunities");
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    // Server action: publishes the opportunity AND writes an `approved` row to
    // opportunity_moderation_events so the decision is auditable (Req 8).
    const result = await approveOpportunity(locale, id);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? t("admin.approved"));
    } else {
      toast.success(t("admin.approved"));
      setStatus("published");
      router.refresh();
    }
  }

  async function reject() {
    setBusy(true);
    // Server action: marks rejected with reason AND writes a `rejected` audit row.
    const result = await rejectOpportunity(locale, id, reason);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? t("admin.rejected"));
    } else {
      toast.success(t("admin.rejected"));
      setStatus("rejected");
      router.refresh();
    }
  }

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        {t(`status.${status}` as Parameters<typeof t>[0])}
      </p>
      <div className="flex gap-2 items-center">
        <Button size="sm" onClick={approve} disabled={busy}>
          {t("admin.approve")}
        </Button>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("admin.rejectReason")}
          className="h-8 text-sm max-w-sm"
        />
        <Button size="sm" variant="destructive" onClick={reject} disabled={busy}>
          {t("admin.reject")}
        </Button>
      </div>
    </div>
  );
}
