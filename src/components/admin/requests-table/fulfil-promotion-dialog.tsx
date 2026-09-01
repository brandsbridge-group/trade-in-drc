"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Crown, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatPlanPrice, findPlan } from "@/config/promotion-plans";
import {
  convertPromotionLead,
  searchCompaniesForPromotion,
} from "@/app/[locale]/admin/requests/convert-promotion-actions";
import type { AdminRequestRow } from "./shared";

interface CompanyOption {
  id: string;
  name: string;
  isPremium: boolean;
}

/**
 * Grants the promotion package a lead applied for.
 *
 * Applications from /pricing are anonymous, so they arrive without a company_id
 * — the admin picks which company the package belongs to, and the server action
 * writes the approved premium_requests row plus the company entitlement.
 */
export function FulfilPromotionDialog({
  row,
  open,
  onOpenChange,
  onGranted,
}: {
  row: AdminRequestRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired only when premium was actually granted — cancelling must not refetch. */
  onGranted: () => void;
}) {
  const t = useTranslations("AdminRequests.fulfil");
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<CompanyOption[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  /** Last term actually sent to the server — avoids re-querying on backspace. */
  const lastTerm = React.useRef<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Pre-fill the search with the company name the applicant typed.
  React.useEffect(() => {
    if (!open) return;
    setSelected(null);
    lastTerm.current = null;
    setQuery(row?.company_name ?? "");
  }, [open, row]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const term = query.trim();
    if (lastTerm.current === term) {
      setLoading(false);
      return;
    }
    const handle = window.setTimeout(async () => {
      const res = await searchCompaniesForPromotion(term);
      if (!cancelled) {
        lastTerm.current = term;
        setOptions(res);
        setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, open]);

  if (!row) return null;

  const plan = row.promotion_plan ? findPlan(row.promotion_plan) : undefined;

  const submit = async () => {
    if (!selected || saving) return;
    setSaving(true);
    const id = toast.loading(t("granting"));
    const res = await convertPromotionLead({
      requestId: row.id,
      companyId: selected,
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t("granted"), { id });
      onGranted();
      return;
    }
    toast.error(t(`errors.${res.error ?? "update_failed"}`), { id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="size-5 text-market-gold" aria-hidden />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {plan
              ? t("description", {
                  plan: t(`plans.${plan.id}`),
                  price: formatPlanPrice(plan.amountUsd),
                })
              : t("noPlan")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border">
            {loading ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("searching")}
              </p>
            ) : options.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("noResults")}
              </p>
            ) : (
              <ul>
                {options.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm transition-colors last:border-0 hover:bg-muted/50",
                        selected === c.id && "bg-primary/5"
                      )}
                    >
                      <span className="min-w-0 truncate">{c.name}</span>
                      <span className="flex flex-none items-center gap-2">
                        {c.isPremium && (
                          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            {t("alreadyPremium")}
                          </span>
                        )}
                        {selected === c.id && (
                          <Check className="size-4 text-primary" aria-hidden />
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={!selected || saving || !plan}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
