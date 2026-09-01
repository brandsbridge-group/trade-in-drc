"use client";
import { useTranslations } from "next-intl";
import { CheckCircle2, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierTone, tierLabel, type TrustTone } from "@/lib/trust/labels";
import type { VerificationTier } from "@/lib/trust/types";

const toneClasses: Record<TrustTone, string> = {
  muted: "bg-muted text-muted-foreground border-transparent",
  slate: "bg-slate-100 text-slate-800 border-slate-200",
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
};

const iconByTier: Record<VerificationTier, React.ElementType> = {
  none: ShieldAlert,
  basic: ShieldCheck,
  verified: CheckCircle2,
  premium: Sparkles,
};

export function VerificationBadge({ tier, className }: { tier: VerificationTier; className?: string }) {
  const t = useTranslations("Trust");
  const Icon = iconByTier[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full",
        toneClasses[tierTone(tier)],
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {t(tierLabel(tier))}
    </span>
  );
}
