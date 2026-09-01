"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  approvePremiumRequest,
  rejectPremiumRequest,
} from "@/app/[locale]/admin/requests/premium/actions";
import type {
  PremiumPlan,
  PremiumRequestStatus,
} from "@/lib/supabase/types";

export interface PremiumRequestRow {
  id: string;
  companyName: string;
  requestedByEmail: string | null;
  requestedByName: string | null;
  plan: PremiumPlan;
  amountUsd: number;
  status: PremiumRequestStatus;
  createdAt: string;
}

interface PremiumRequestsTableProps {
  rows: PremiumRequestRow[];
  locale: string;
}

function statusVariant(
  status: PremiumRequestStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
      return "secondary";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "cancelled":
    default:
      return "outline";
  }
}

function formatAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Dense admin table of Premium profile requests. Pending rows expose an inline
 * note field plus Approve / Reject actions (with a confirm step) that call the
 * service-role-backed server actions and refresh on success.
 */
export function PremiumRequestsTable({
  rows,
  locale,
}: PremiumRequestsTableProps) {
  const t = useTranslations("AdminPremium");
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<Record<string, string>>({});

  const setNote = (id: string, value: string) =>
    setNotes((prev) => ({ ...prev, [id]: value }));

  const planLabel = (plan: PremiumPlan) =>
    plan === "congolese" ? t("planCongolese") : t("planInternational");

  const handleApprove = async (id: string) => {
    if (!window.confirm(t("approveConfirm"))) return;
    setPendingId(id);
    const toastId = toast.loading(t("approve"));
    try {
      const result = await approvePremiumRequest({ id, note: notes[id] });
      if (!result.ok) {
        toast.error(t("rejectedToast"), { id: toastId });
        return;
      }
      toast.success(t("approvedToast"), { id: toastId });
      router.refresh();
    } catch {
      toast.error(t("rejectedToast"), { id: toastId });
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm(t("rejectConfirm"))) return;
    setPendingId(id);
    const toastId = toast.loading(t("reject"));
    try {
      const result = await rejectPremiumRequest({ id, note: notes[id] });
      if (!result.ok) {
        toast.error(t("rejectedToast"), { id: toastId });
        return;
      }
      toast.success(t("rejectedToast"), { id: toastId });
      router.refresh();
    } catch {
      toast.error(t("rejectedToast"), { id: toastId });
    } finally {
      setPendingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm border-collapse">
        <thead className="text-left text-xs text-muted-foreground border-b">
          <tr>
            <th className="px-3 py-2.5 font-medium">{t("table.company")}</th>
            <th className="px-3 py-2.5 font-medium">{t("table.requestedBy")}</th>
            <th className="px-3 py-2.5 font-medium">{t("table.plan")}</th>
            <th className="px-3 py-2.5 font-medium">{t("table.amount")}</th>
            <th className="px-3 py-2.5 font-medium">{t("table.status")}</th>
            <th className="px-3 py-2.5 font-medium">{t("table.date")}</th>
            <th className="px-3 py-2.5 font-medium">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isPending = row.status === "pending";
            const isBusy = pendingId === row.id;
            return (
              <tr
                key={row.id}
                className="border-b align-top last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2.5 font-medium text-foreground">
                  {row.companyName}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  <span className="block text-foreground">
                    {row.requestedByName ?? "—"}
                  </span>
                  {row.requestedByEmail && (
                    <span className="block text-xs">{row.requestedByEmail}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {planLabel(row.plan)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-foreground">
                  {formatAmount(row.amountUsd, locale)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={statusVariant(row.status)}>
                    {t(`statusLabels.${row.status}`)}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleDateString(locale)}
                </td>
                <td className="px-3 py-2.5">
                  {isPending ? (
                    <div className="min-w-[220px] space-y-2">
                      <Textarea
                        value={notes[row.id] ?? ""}
                        onChange={(e) => setNote(row.id, e.target.value)}
                        placeholder={t("notes")}
                        rows={2}
                        className="text-xs"
                        disabled={isBusy}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8"
                          disabled={isBusy}
                          onClick={() => handleApprove(row.id)}
                        >
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={isBusy}
                          onClick={() => handleReject(row.id)}
                        >
                          {t("reject")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
