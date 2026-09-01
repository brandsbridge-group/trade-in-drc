"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BusinessRequestIntent } from "@/lib/supabase/types";
import { Crown } from "lucide-react";
import { findPlan, formatPlanPrice } from "@/config/promotion-plans";
import type { AdminRequestRow } from "./shared";

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="break-words text-foreground">{value || "—"}</p>
    </div>
  );
}

export function RequestDetailDialog({
  row,
  open,
  onOpenChange,
  onSaveNote,
  onFulfil,
}: {
  row: AdminRequestRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveNote: (note: string) => void;
  /** Opens the "grant this promotion package" flow. */
  onFulfil: () => void;
}) {
  const t = useTranslations("AdminRequests");
  const tIntent = useTranslations("Request.intents");
  const tFulfil = useTranslations("AdminRequests.fulfil");
  const locale = useLocale();
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setNote(row?.admin_notes ?? "");
  }, [row]);

  if (!row) return null;

  const plan = row.promotion_plan ? findPlan(row.promotion_plan) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{row.full_name}</DialogTitle>
          <DialogDescription>
            {tIntent(`${row.intent}.title` as `${BusinessRequestIntent}.title`)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <DetailField label={t("detail.contact")} value={row.email} />
            <DetailField label={t("table.country")} value={row.country} />
            <DetailField label={t("table.company")} value={row.company_name} />
            <DetailField label={t("table.sector")} value={row.sector} />
            <DetailField
              label={t("detail.submittedBy")}
              value={row.submitter_name}
            />
            <DetailField
              label={t("detail.submittedAt")}
              value={new Date(row.created_at).toLocaleString(locale)}
            />
          </div>

          {plan && (
            <div className="rounded-md border border-market-gold/40 bg-amber-50/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t("detail.promotionRequested")}
              </p>
              <p className="mt-0.5 flex items-center gap-2 font-semibold text-market-navy">
                <Crown className="size-4 text-market-gold" aria-hidden />
                {tFulfil(`plans.${plan.id}`)} — {formatPlanPrice(plan.amountUsd)}
              </p>
              {row.status === "converted" ? (
                <p className="mt-2 text-xs font-medium text-green-700">
                  {t("detail.promotionGranted")}
                </p>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 bg-market-gold text-market-navy hover:bg-yellow-500"
                  onClick={onFulfil}
                >
                  {t("detail.grantPromotion")}
                </Button>
              )}
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {t("detail.message")}
            </p>
            <p className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2.5 text-foreground">
              {row.message}
            </p>
          </div>

          <div>
            <Label
              htmlFor="admin-note"
              className="mb-1 text-xs font-medium text-muted-foreground"
            >
              {t("addNote")}
            </Label>
            <Textarea
              id="admin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onSaveNote(note.trim())}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
