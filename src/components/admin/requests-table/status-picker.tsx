"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessRequestStatus } from "@/lib/supabase/types";
import { STATUSES, STATUS_BADGE_CLASS } from "./shared";

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
        className={cn(
          "h-7 w-auto gap-1.5 rounded-full border px-2.5 text-xs font-medium",
          STATUS_BADGE_CLASS[status]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {t(`statusLabels.${s}` as `statusLabels.${BusinessRequestStatus}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
