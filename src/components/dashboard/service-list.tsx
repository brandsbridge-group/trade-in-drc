"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServices, useDeleteService } from "@/hooks/use-services";

interface ServiceListProps {
  companyId: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
};

export function ServiceList({ companyId }: ServiceListProps) {
  const t = useTranslations("Dashboard.services");
  const locale = useLocale();
  const { data: services, isLoading } = useServices(companyId);
  const deleteService = useDeleteService();

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t("deleteConfirm", { name }))) return;

    const toastId = toast.loading(t("deleting"));
    try {
      await deleteService.mutateAsync(id);
      toast.success(t("deleted"), { id: toastId });
    } catch {
      toast.error(t("deleteError"), { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colName")}</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colType")}</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colDelivery")}</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colStatus")}</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colCreated")}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-slate-100">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <td key={j} className="px-4 py-2">
                    <div className="h-4 bg-slate-100 animate-pulse rounded-sm" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="border border-slate-200 rounded-sm p-12 text-center">
        <Wrench className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-600 mb-1">{t("emptyTitle")}</p>
        <p className="text-xs text-slate-400 mb-4">{t("emptyBody")}</p>
        <Button size="sm" asChild>
          <Link href="/dashboard/services/new">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t("addService")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colName")}</th>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colType")}</th>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colDelivery")}</th>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colStatus")}</th>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colCreated")}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const name = locale === "fr" ? service.name_fr : service.name_en;
            return (
              <tr
                key={service.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-2 font-medium text-slate-800">{name}</td>
                <td className="px-4 py-2 text-slate-500">
                  {t(`serviceTypes.${service.service_type}` as Parameters<typeof t>[0])}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {t(`deliveryModes.${service.delivery_mode}` as Parameters<typeof t>[0])}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[service.status] ?? STATUS_STYLES.archived
                    }`}
                  >
                    {t(`statuses.${service.status}` as Parameters<typeof t>[0])}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-400 text-xs">
                  {dateFormatter.format(new Date(service.created_at))}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                      <Link href={`/dashboard/services/${service.id}/edit`}>
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(service.id, name)}
                      disabled={deleteService.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
