"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { X, FileText } from "lucide-react";
import { useRfqListings, useCloseRfq } from "@/hooks/use-rfq";
import { Button } from "@/components/ui/button";

interface RfqListProps {
  companyId: string;
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  expired: "bg-slate-400",
  closed: "bg-red-500",
};

const TYPE_BADGE: Record<string, string> = {
  supply: "bg-blue-100 text-blue-800",
  demand: "bg-amber-100 text-amber-800",
};

export function RfqList({ companyId }: RfqListProps) {
  const t = useTranslations("RfqBoard");
  const locale = useLocale();
  const { data: listings, isLoading } = useRfqListings(companyId);
  const closeRfq = useCloseRfq();

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  const handleClose = async (id: string) => {
    const toastId = toast.loading(t("closing"));
    try {
      await closeRfq.mutateAsync(id);
      toast.success(t("closeSuccess"), { id: toastId });
    } catch {
      toast.error(t("closeError"), { id: toastId });
    }
  };

  if (isLoading) {
    return <div className="h-20 bg-slate-100 animate-pulse rounded-sm" />;
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <FileText className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">{t("emptyListings")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase tracking-wide">
            <th className="py-2 px-3 font-medium">{t("colTitle")}</th>
            <th className="py-2 px-3 font-medium">{t("colType")}</th>
            <th className="py-2 px-3 font-medium">{t("colStatus")}</th>
            <th className="py-2 px-3 font-medium">{t("colExpires")}</th>
            <th className="py-2 px-3 font-medium text-right">{t("colActions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {listings.map((rfq) => (
            <tr key={rfq.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-2 px-3 font-medium text-slate-800">{rfq.title}</td>
              <td className="py-2 px-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[rfq.type] ?? "bg-slate-100 text-slate-700"}`}
                >
                  {t(`type.${rfq.type}` as Parameters<typeof t>[0])}
                </span>
              </td>
              <td className="py-2 px-3">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[rfq.status] ?? "bg-slate-400"}`}
                  />
                  <span className="text-slate-600">
                    {t(`status.${rfq.status}` as Parameters<typeof t>[0])}
                  </span>
                </span>
              </td>
              <td className="py-2 px-3 text-slate-500">
                {rfq.expires_at ? dateFormatter.format(new Date(rfq.expires_at)) : "—"}
              </td>
              <td className="py-2 px-3 text-right">
                {rfq.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => handleClose(rfq.id)}
                    disabled={closeRfq.isPending}
                  >
                    <X className="w-3 h-3 mr-1" />
                    {t("close")}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
