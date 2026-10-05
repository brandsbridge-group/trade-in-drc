"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Inbox, MoreHorizontal, Search, Send, X } from "lucide-react";
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
  forwardBusinessRequest,
} from "@/app/[locale]/console/requests/actions";
import type {
  BusinessRequestStatus,
  BusinessRequestIntent,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { REQUEST_VIEWS, inView, personInitials, viewCounts, type RequestView } from "@/lib/requests/views";
import { readPartnerRequestDetails } from "@/lib/requests/partner-request";
import { ALL, type AdminRequestRow } from "./shared";
import { FilterSelect } from "./filter-select";
import { StatusPicker } from "./status-picker";
import { OwnerEditor } from "./owner-editor";
import { RequestDetailSheet } from "./request-detail-sheet";
import { FulfilPromotionDialog } from "./fulfil-promotion-dialog";

export type { AdminRequestRow } from "./shared";

interface RequestsTableProps {
  rows: AdminRequestRow[];
  sectors: string[];
  countries: string[];
  owners: string[];
}

/**
 * The console's request list: quick views with their counts, search and
 * filters shown as removable chips, and a table whose rows open the request in
 * a side panel. Status and owner stay editable in place.
 */
export function RequestsTable({
  rows,
  sectors,
  countries,
  owners,
}: RequestsTableProps) {
  const t = useTranslations("AdminRequests");
  const tIntent = useTranslations("Request.intents");
  const tNeed = useTranslations("FindPartner.needs");
  const format = useFormatter();
  const router = useRouter();

  const [view, setView] = React.useState<RequestView>("all");
  const [search, setSearch] = React.useState("");
  const [sectorFilter, setSectorFilter] = React.useState(ALL);
  const [countryFilter, setCountryFilter] = React.useState(ALL);
  const [ownerFilter, setOwnerFilter] = React.useState(ALL);
  // An id, not a row: the open panel follows the list when it is refreshed.
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [fulfilRow, setFulfilRow] = React.useState<AdminRequestRow | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const detailRow = rows.find((r) => r.id === detailId) ?? null;
  const counts = React.useMemo(() => viewCounts(rows), [rows]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!inView(r, view)) return false;
      if (sectorFilter !== ALL && r.sector !== sectorFilter) return false;
      if (countryFilter !== ALL && r.country !== countryFilter) return false;
      if (ownerFilter !== ALL && r.follow_up_owner !== ownerFilter) return false;
      if (q) {
        const haystack = [
          r.full_name,
          r.company_name,
          r.country,
          r.sector,
          r.email,
          r.reference,
          r.follow_up_owner,
          r.target_company_name,
          r.product_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, view, search, sectorFilter, countryFilter, ownerFilter]);

  const chips = [
    search.trim() ? { key: "search", label: `« ${search.trim()} »`, clear: () => setSearch("") } : null,
    sectorFilter !== ALL ? { key: "sector", label: sectorFilter, clear: () => setSectorFilter(ALL) } : null,
    countryFilter !== ALL ? { key: "country", label: countryFilter, clear: () => setCountryFilter(ALL) } : null,
    ownerFilter !== ALL ? { key: "owner", label: ownerFilter, clear: () => setOwnerFilter(ALL) } : null,
  ].filter((c): c is { key: string; label: string; clear: () => void } => c !== null);

  function clearFilters() {
    setSearch("");
    setSectorFilter(ALL);
    setCountryFilter(ALL);
    setOwnerFilter(ALL);
  }

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

  /** Passes the request on to the company it is addressed to. */
  async function handleForward(r: AdminRequestRow) {
    const company = r.target_company_name ?? "";
    if (!window.confirm(t("forward.confirm", { company }))) return false;
    setPendingId(r.id);
    const toastId = toast.loading(t("forward.sending"));
    try {
      const result = await forwardBusinessRequest({ id: r.id });
      if (!result.ok) {
        toast.error(t("forward.error"), { id: toastId });
        return false;
      }
      toast.success(t("forward.sent", { company }), { id: toastId });
      router.refresh();
      return true;
    } catch {
      toast.error(t("forward.error"), { id: toastId });
      return false;
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return false;
    setPendingId(id);
    const toastId = toast.loading(t("deletingToast"));
    try {
      const result = await deleteBusinessRequest({ id });
      if (!result.ok) {
        toast.error(t("deleteErrorToast"), { id: toastId });
        return false;
      }
      toast.success(t("deletedToast"), { id: toastId });
      router.refresh();
      return true;
    } catch {
      toast.error(t("deleteErrorToast"), { id: toastId });
      return false;
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Quick views: each one answers a question staff asks of the list. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("views.label")} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
          {REQUEST_VIEWS.map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                  active ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200" : "text-slate-600 hover:text-market-navy"
                )}
              >
                {t(`views.${v}`)}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums leading-5",
                    v === "to_forward" && counts[v] > 0
                      ? "bg-amber-100 text-amber-800"
                      : active ? "bg-slate-100 text-market-navy" : "bg-slate-300/50 text-slate-600"
                  )}
                >
                  {counts[v]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs tabular-nums text-slate-500" aria-live="polite">{t("results", { count: filtered.length })}</p>
      </div>

      {/* Search and filters */}
      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_170px_170px_190px]">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              aria-label={t("filters.searchPlaceholder")}
              className="h-9 w-full rounded-full bg-slate-100 pl-10 pr-4 text-[13px] text-market-navy outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-market-navy/20"
            />
          </div>
          <FilterSelect label={t("filters.sector")} value={sectorFilter} onValueChange={setSectorFilter} allLabel={t("filters.allOf", { label: t("filters.sector") })} options={sectors} />
          <FilterSelect label={t("filters.country")} value={countryFilter} onValueChange={setCountryFilter} allLabel={t("filters.allOf", { label: t("filters.country") })} options={countries} />
          <FilterSelect label={t("filters.owner")} value={ownerFilter} onValueChange={setOwnerFilter} allLabel={t("filters.allOf", { label: t("filters.owner") })} options={owners} />
        </div>
        {chips.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                aria-label={t("filters.remove", { label: chip.label })}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-market-navy transition-colors hover:bg-slate-200"
              >
                {chip.label}
                <X className="size-3.5 text-slate-500" aria-hidden />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="px-1.5 text-xs font-medium text-slate-500 underline-offset-2 transition-colors hover:text-market-navy hover:underline">
              {t("filters.clear")}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="console-table-card">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2.5 font-medium">{t("table.requester")}</th>
              <th className="py-2.5 font-medium">{t("table.need")}</th>
              <th className="py-2.5 font-medium">{t("table.target")}</th>
              <th className="py-2.5 font-medium">{t("table.status")}</th>
              <th className="py-2.5 font-medium">{t("table.received")}</th>
              <th className="py-2.5 font-medium">{t("table.followUpOwner")}</th>
              <th className="py-2.5 text-right font-medium"><span className="sr-only">{t("table.actions")}</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const origin = [r.company_name, r.country].filter(Boolean).join(" · ");
              const details = readPartnerRequestDetails(r.details);
              return (
                <tr
                  key={r.id}
                  onClick={() => setDetailId(r.id)}
                  className={cn(
                    "cursor-pointer border-b transition-colors hover:bg-slate-50",
                    detailId === r.id && "bg-slate-50"
                  )}
                >
                  <td className="py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-market-navy" aria-hidden>
                        {personInitials(r.full_name)}
                      </span>
                      <div className="min-w-0">
                        {/* The row's keyboard entry point: the whole row is a mouse shortcut for it. */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailId(r.id);
                          }}
                          className="block max-w-[220px] truncate text-left text-[13.5px] font-semibold text-market-navy underline-offset-2 hover:underline"
                        >
                          {r.full_name}
                        </button>
                        <p className="max-w-[220px] truncate text-xs text-slate-500">{origin || r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="max-w-[200px] truncate text-[13px] font-medium text-slate-700">
                      {details ? tNeed(details.need) : tIntent(`${r.intent}.title` as `${BusinessRequestIntent}.title`)}
                    </p>
                    {(details?.product || r.sector) && (
                      <p className="max-w-[200px] truncate text-xs text-slate-500">{details?.product || r.sector}</p>
                    )}
                  </td>
                  <td className="max-w-[230px] py-3">
                    {r.target_company_id ? (
                      <>
                        <p className="truncate text-[13px] font-medium text-market-navy">{r.target_company_name ?? "—"}</p>
                        {r.product_name && <p className="truncate text-xs text-slate-500">{r.product_name}</p>}
                        <span
                          className={cn(
                            "mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            r.forwarded_at ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", r.forwarded_at ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
                          {r.forwarded_at ? t("forward.stateDone") : t("forward.stateTodo")}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">{t("table.teamTarget")}</span>
                    )}
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusPicker
                      status={r.status}
                      disabled={pendingId === r.id}
                      onChange={(next) => runUpdate(r.id, { status: next })}
                    />
                  </td>
                  <td className="whitespace-nowrap py-3 text-[13px] tabular-nums text-slate-500">
                    {format.dateTime(new Date(r.created_at), { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <OwnerEditor
                      value={r.follow_up_owner}
                      placeholder={t("ownerPlaceholder")}
                      disabled={pendingId === r.id}
                      onSave={(owner) => runUpdate(r.id, { followUpOwner: owner })}
                    />
                  </td>
                  <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={t("table.actions")}
                          className="grid size-8 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-market-navy"
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onSelect={() => setDetailId(r.id)}>
                          {t("detail.open")}
                        </DropdownMenuItem>
                        {r.target_company_id && !r.forwarded_at && (
                          <DropdownMenuItem disabled={pendingId === r.id} onSelect={() => handleForward(r)}>
                            <Send className="size-4" aria-hidden />
                            {t("forward.cta")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(r.id)}>
                          {t("deleteLabel")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-14 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>
                    <Inbox className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-market-navy">{t("empty")}</p>
                  {(chips.length > 0 || view !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        clearFilters();
                        setView("all");
                      }}
                      className="mt-2 text-xs font-medium text-slate-500 underline-offset-2 transition-colors hover:text-market-navy hover:underline"
                    >
                      {t("filters.clear")}
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RequestDetailSheet
        row={detailRow}
        open={detailRow !== null}
        onOpenChange={(open) => !open && setDetailId(null)}
        busy={detailRow !== null && pendingId === detailRow.id}
        onStatus={(status) => detailRow && runUpdate(detailRow.id, { status })}
        onOwner={(owner) => detailRow && runUpdate(detailRow.id, { followUpOwner: owner })}
        onSaveNote={(note) => detailRow && runUpdate(detailRow.id, { adminNote: note })}
        onFulfil={() => setFulfilRow(detailRow)}
        onForward={() => detailRow && handleForward(detailRow)}
        onDelete={async () => {
          if (!detailRow) return;
          const ok = await handleDelete(detailRow.id);
          if (ok) setDetailId(null);
        }}
      />

      {/* Granting the applied-for promotion package (see convert-promotion-actions). */}
      <FulfilPromotionDialog
        row={fulfilRow}
        open={fulfilRow !== null}
        onOpenChange={(open) => !open && setFulfilRow(null)}
        onGranted={() => {
          setFulfilRow(null);
          setDetailId(null);
          // Only refetch when a grant actually happened — cancelling should not
          // re-render the whole table.
          router.refresh();
        }}
      />
    </div>
  );
}
