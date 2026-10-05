import { Crown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationTier } from "@/constants/status";
import type { ReviewStage } from "@/lib/verifications/workflow";

/** Same colours as the verification queue: one stage, one tone, everywhere in the console. */
export const STAGE_PILL: Record<ReviewStage, string> = {
  not_submitted: "bg-slate-100 text-slate-600",
  to_review: "bg-blue-50 text-blue-700",
  awaiting_owner: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const TIER_PILL: Record<VerificationTier, string> = {
  none: "bg-slate-100 text-slate-500",
  basic: "bg-slate-100 text-slate-700",
  verified: "bg-emerald-50 text-emerald-700",
  premium: "bg-market-cream text-market-or-dark",
};

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";

/** Where the verification file stands. The label is passed in: these pills serve server and client screens alike. */
export function StagePill({ stage, label, className }: { stage: ReviewStage; label: string; className?: string }) {
  return (
    <span className={cn(PILL, STAGE_PILL[stage], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

/** The trust tier shown on the public profile. */
export function TierPill({ tier, label, className }: { tier: VerificationTier; label: string; className?: string }) {
  return (
    <span className={cn(PILL, TIER_PILL[tier], className)}>
      {(tier === "verified" || tier === "premium") && <ShieldCheck className="size-3" aria-hidden />}
      {label}
    </span>
  );
}

/** A running premium subscription. */
export function PremiumPill({ label, title, className }: { label: string; title?: string; className?: string }) {
  return (
    <span title={title} className={cn(PILL, "bg-market-navy text-market-or-light", className)}>
      <Crown className="size-3" aria-hidden />
      {label}
    </span>
  );
}
