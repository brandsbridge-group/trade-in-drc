"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { NewsletterCampaign } from "@/lib/newsletter/campaign-email";

export type CampaignStatus = NewsletterCampaign["status"];

const STATUS_DOT: Record<CampaignStatus, string> = {
  draft: "bg-slate-400",
  sending: "bg-amber-500",
  sent: "bg-emerald-600",
  failed: "bg-red-600",
};

/** `onCanvas`: placed on the grey page background (white pill) instead of inside a white card. */
export function CampaignStatusPill({ status, onCanvas }: { status: CampaignStatus; onCanvas?: boolean }) {
  const t = useTranslations("Admin.newsletter.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium text-slate-700",
        onCanvas ? "bg-white px-2.5 py-1 ring-1 ring-slate-200" : "bg-slate-100"
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {t(status)}
    </span>
  );
}

/** Delivered (navy) and failed (red) shares of a campaign's recipients. */
export function DeliveryBar({
  sent,
  failed,
  total,
  label,
  className,
}: {
  sent: number;
  failed: number;
  total: number;
  label: string;
  className?: string;
}) {
  const share = (value: number) => (total > 0 ? `${Math.min(100, (value / total) * 100)}%` : "0%");
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={sent}
      className={cn("flex h-1.5 overflow-hidden rounded-full bg-slate-100", className)}
    >
      <span className="bg-market-navy transition-[width] duration-300 ease-out" style={{ width: share(sent) }} />
      <span className="bg-red-500 transition-[width] duration-300 ease-out" style={{ width: share(failed) }} />
    </div>
  );
}
