"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateBusinessRequest,
  deleteBusinessRequest,
} from "@/app/[locale]/admin/requests/actions";
import type {
  BusinessRequestStatus,
  BusinessRequestIntent,
} from "@/lib/supabase/types";
import { ALL, STATUSES, type AdminRequestRow } from "./shared";
import { FilterSelect } from "./filter-select";
import { StatusPicker } from "./status-picker";
import { OwnerEditor } from "./owner-editor";
import { RequestDetailDialog } from "./request-detail-dialog";
import { FulfilPromotionDialog } from "./fulfil-promotion-dialog";

export type { AdminRequestRow } from "./shared";

interface RequestsTableProps {
  rows: AdminRequestRow[];
  sectors: string[];
  countries: string[];
  owners: string[];
}

export function RequestsTable({
  rows,
  sectors,
  countries,
  owners,
}: RequestsTableProps) {
  const t = useTranslations("AdminRequests");
  const tIntent = useTranslations("Request.intents");
  const locale = useLocale();
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [sectorFilter, setSectorFilter] = React.useState(ALL);
  const [countryFilter, setCountryFilter] = React.useState(ALL);
  const [statusFilter, setStatusFilter] = React.useState(ALL);
  const [ownerFilter, setOwnerFilter] = React.useState(ALL);
  const [detailRow, setDetailRow] = React.useState<AdminRequestRow | null>(null);
  const [fulfilRow, setFulfilRow] = React.useState<AdminRequestRow | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (sectorFilter !== ALL && r.sector !== sectorFilter) return false;
      if (countryFilter !== ALL && r.country !== countryFilter) return false;
      if (statusFilter !== ALL && r.status !== statusFilter) return false;
      if (ownerFilter !== ALL && r.follow_up_owner !== ownerFilter) return false;
      if (q) {
        const haystack = [
          r.full_name,
          r.company_name,
          r.country,
          r.sector,
          r.email,
          r.follow_up_owner,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, sectorFilter, countryFilter, statusFilter, ownerFilter]);

  async function runUpdate(
    id: string,
    patch: { status?: BusinessRequestStatus; followUpOwner?: string; adminNote?: string }
  ) {
    setPendingId(id);
    const toastId = toast.loading(t("savingToast"));
    try {
      const result = await updateBusinessRequest({ id, ...patch });
      if (!result.ok) {
        toast.error(t("saveErrorToast"), { id: toastId });
        return false;
      }
      toast.success(t("savedToast"), { id: toastId });
      router.refresh();
      return true;
    } catch {
      toast.error(t("saveErrorToast"), { id: toastId });
      return false;
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setPendingId(id);
    const toastId = toast.loading(t("deletingToast"));
    try {
      const result = await deleteBusinessRequest({ id });
      if (!result.ok) {
        toast.error(t("deleteErrorToast"), { id: toastId });
        return;
      }
      toast.success(t("deletedToast"), { id: toastId });
      router.refresh();
    } catch {
      toast.error(t("deleteErrorToast"), { id: toastId });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border bg-card p-3 md:grid-cols-3 lg:grid-cols-5">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("filters.search")}
            className="h-9 pl-8 text-xs"
          />
        </div>
        <FilterSelect
          label={t("filters.sector")}
          value={sectorFilter}
          onValueChange={setSectorFilter}
          allLabel={t("filters.all")}
          options={sectors}
        />
        <FilterSelect
          label={t("filters.country")}
          value={countryFilter}
          onValueChange={setCountryFilter}
          allLabel={t("filters.all")}
          options={countries}
        />
        <FilterSelect
          label={t("filters.status")}
          value={statusFilter}
          onValueChange={setStatusFilter}
          allLabel={t("filters.all")}
          options={STATUSES}
          renderOption={(s) => t(`statusLabels.${s}` as `statusLabels.${BusinessRequestStatus}`)}
        />
        <FilterSelect
          label={t("filters.owner")}
          value={ownerFilter}
          onValueChange={setOwnerFilter}
          allLabel={t("filters.all")}
          options={owners}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">{t("table.name")}</th>
              <th className="px-3 py-2.5 font-medium">{t("table.company")}</th>
              <th className="px-3 py-2.5 font-medium">{t("table.country")}</th>
              <th className="px-3 py-2.5 font-medium">{t("table.sector")}</th>
              <th className="px-3 py-2.5 font-medium">{t("table.need")}</th>
              <th className="px-3 py-2.5 font-medium">{t("table.status")}</th>
              <th className="px-3 py-2.5 font-medium">{t("table.date")}</th>
              <th className="px-3 py-2.5 font-medium">
                {t("table.followUpOwner")}
              </th>
              <th className="px-3 py-2.5 text-right font-medium">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b transition-colors duration-150 last:border-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2.5 font-medium text-foreground">
                  {r.full_name}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {r.company_name ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {r.country ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {r.sector ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {tIntent(`${r.intent}.title` as `${BusinessRequestIntent}.title`)}
                </td>
                <td className="px-3 py-2.5">
                  <StatusPicker
                    status={r.status}
                    disabled={pendingId === r.id}
                    onChange={(next) => runUpdate(r.id, { status: next })}
                  />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString(locale)}
                </td>
                <td className="px-3 py-2.5">
                  <OwnerEditor
                    value={r.follow_up_owner}
                    placeholder={t("ownerPlaceholder")}
                    disabled={pendingId === r.id}
                    onSave={(owner) => runUpdate(r.id, { followUpOwner: owner })}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={t("table.actions")}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => setDetailRow(r)}>
                        {t("detail.message")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => handleDelete(r.id)}
                      >
                        {t("deleteLabel")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-12 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RequestDetailDialog
        row={detailRow}
        open={detailRow !== null}
        onOpenChange={(open) => !open && setDetailRow(null)}
        onSaveNote={async (note) => {
          if (!detailRow) return;
          const ok = await runUpdate(detailRow.id, { adminNote: note });
          if (ok) setDetailRow(null);
        }}
        onFulfil={() => setFulfilRow(detailRow)}
      />

      {/* Granting the applied-for promotion package (see convert-promotion-actions). */}
      <FulfilPromotionDialog
        row={fulfilRow}
        open={fulfilRow !== null}
        onOpenChange={(open) => !open && setFulfilRow(null)}
        onGranted={() => {
          setFulfilRow(null);
          setDetailRow(null);
          // Only refetch when a grant actually happened — cancelling should not
          // re-render the whole table.
          router.refresh();
        }}
      />
    </div>
  );
}
