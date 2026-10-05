"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { BusinessRequestStatus } from "@/lib/supabase/types";
import { STATUSES, STATUS_BADGE_CLASS, STATUS_DOT_CLASS } from "./shared";

/** Status as a coloured dot + label pill that opens the list of statuses. */
export function StatusPicker({
  status,
  disabled,
  onChange,
}: {
  status: BusinessRequestStatus;
  disabled: boolean;
  onChange: (next: BusinessRequestStatus) => void;
}) {
  const t = useTranslations("AdminRequests");
  return (
    <Select
      value={status}
      onValueChange={(v) => {
        if (v !== status) onChange(v as BusinessRequestStatus);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={t("table.status")}
        className={cn(
          "h-7 w-auto gap-1.5 rounded-full border-0 px-2.5 text-xs font-semibold shadow-none",
          STATUS_BADGE_CLASS[status]
        )}
      >
        <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden />
        {t(`statusLabels.${status}` as `statusLabels.${BusinessRequestStatus}`)}
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[s])} aria-hidden />
            {t(`statusLabels.${s}` as `statusLabels.${BusinessRequestStatus}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
