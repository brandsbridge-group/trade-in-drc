"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateReportStatus } from "./actions";
import type { MessageReportStatus } from "@/lib/supabase/types";

const STATUSES: MessageReportStatus[] = [
  "open",
  "reviewed",
  "dismissed",
  "actioned",
];

interface ReportTriageProps {
  reportId: string;
  status: MessageReportStatus;
}

/** Inline status picker for a single report row in the admin moderation queue. */
export function ReportTriage({ reportId, status }: ReportTriageProps) {
  const t = useTranslations("AdminMessages");
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const handleChange = async (next: string) => {
    if (next === status) return;
    setPending(true);
    const toastId = toast.loading(t("triage.saving"));
    try {
      const result = await updateReportStatus({
        reportId,
        status: next as MessageReportStatus,
      });
      if (!result.success) {
        const msg =
          result.errorCode === "not_authorized"
            ? t("triage.notAuthorized")
            : t("triage.error");
        toast.error(msg, { id: toastId });
        return;
      }
      toast.success(t("triage.saved"), { id: toastId });
      router.refresh();
    } catch {
      toast.error(t("triage.error"), { id: toastId });
    } finally {
      setPending(false);
    }
  };

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {t(`statuses.${s}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
