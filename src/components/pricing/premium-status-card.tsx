"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";
import { Crown, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { PremiumPlan } from "@/lib/supabase/types";
import { cancelPremiumRequest } from "@/app/[locale]/(public)/pricing/actions";

/**
 * Dashboard "My Premium" surface. Resolves the owner's effective Premium state
 * across their companies:
 *   - any company with is_premium=true  → Premium Active
 *   - else any pending premium_request  → Premium Pending Review
 *   - else                              → Free Plan
 * Premium columns (is_premium / premium_plan / premium_expires_at) are readable
 * by the owner; only service-role writes them, so this is a pure read.
 */

type PremiumState = "free" | "pending" | "premium";

interface PremiumSnapshot {
  state: PremiumState;
  plan: PremiumPlan | null;
  expiresAt: string | null;
}

const EMPTY_SNAPSHOT: PremiumSnapshot = {
  state: "free",
  plan: null,
  expiresAt: null,
};

const STATUS_DISPLAY: Record<
  PremiumState,
  { labelKey: string; Icon: typeof Crown; badgeClass: string }
> = {
  premium: {
    labelKey: "statusPremium",
    Icon: CheckCircle2,
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  pending: {
    labelKey: "statusPending",
    Icon: Clock,
    badgeClass: "bg-amber-100 text-amber-700",
  },
  free: {
    labelKey: "statusFree",
    Icon: Crown,
    badgeClass: "bg-primary/10 text-primary",
  },
};

export function PremiumStatusCard() {
  const t = useTranslations("DashboardPremium");
  const tPricing = useTranslations("Pricing");
  const router = useRouter();
  const { user } = useAuth();
  const [snapshot, setSnapshot] = React.useState<PremiumSnapshot>(EMPTY_SNAPSHOT);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const supabase = createClient();

    const { data: companies } = await supabase
      .from("companies")
      .select("id, is_premium, premium_plan, premium_expires_at")
      .eq("owner_id", user.id);

    const premiumCompany = (companies ?? []).find((c) => c.is_premium);
    if (premiumCompany) {
      setSnapshot({
        state: "premium",
        plan: (premiumCompany.premium_plan as PremiumPlan | null) ?? null,
        expiresAt: premiumCompany.premium_expires_at ?? null,
      });
      setIsLoading(false);
      return;
    }

    const { data: pending } = await supabase
      .from("premium_requests")
      .select("plan, status")
      .eq("requested_by", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pending) {
      setSnapshot({
        state: "pending",
        plan: (pending.plan as PremiumPlan | null) ?? null,
        expiresAt: null,
      });
    } else {
      setSnapshot(EMPTY_SNAPSHOT);
    }
    setIsLoading(false);
  }, [user]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = React.useCallback(async () => {
    if (isCancelling) return;
    if (!window.confirm(tPricing("cancelConfirm"))) return;

    setIsCancelling(true);
    const toastId = toast.loading(t("cancelling"));
    try {
      const result = await cancelPremiumRequest();
      if (result.ok) {
        toast.success(tPricing("cancelledToast"), { id: toastId });
        router.refresh();
        void load();
      } else {
        toast.error(tPricing("cancelErrorToast"), { id: toastId });
      }
    } catch {
      toast.error(tPricing("cancelErrorToast"), { id: toastId });
    } finally {
      setIsCancelling(false);
    }
  }, [isCancelling, tPricing, t, router, load]);

  if (!user || isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-card p-4">
        <div className="h-5 w-32 animate-pulse rounded-sm bg-muted" />
        <div className="mt-3 h-4 w-48 animate-pulse rounded-sm bg-muted" />
      </div>
    );
  }

  const { state, plan, expiresAt } = snapshot;
  const display = STATUS_DISPLAY[state];
  const StatusIcon = display.Icon;
  const statusLabel = t(display.labelKey);

  const planLabel =
    plan === "congolese"
      ? t("planCongolese")
      : plan === "international"
        ? t("planInternational")
        : null;

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString()
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-md ${display.badgeClass}`}
          >
            <StatusIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {t("cardTitle")}
            </h2>
            <p className="text-xs text-slate-500">{statusLabel}</p>
          </div>
        </div>

        {state === "free" && (
          <Button asChild size="sm">
            <Link href="/pricing">{t("upgradeCta")}</Link>
          </Button>
        )}
        {state === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {t("cancelPendingCta")}
          </Button>
        )}
      </div>

      {(planLabel || formattedExpiry) && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm">
          {planLabel && (
            <div>
              <span className="text-slate-500">{t("planLabel")}: </span>
              <span className="font-medium text-slate-900">{planLabel}</span>
            </div>
          )}
          {formattedExpiry && (
            <div>
              <span className="text-slate-500">{t("expiresLabel")}: </span>
              <span className="font-medium text-slate-900">
                {formattedExpiry}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
