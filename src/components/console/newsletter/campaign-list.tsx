"use client";

import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Loader2, MailPlus, MoreHorizontal, Pencil, Play, RotateCcw, Search, Trash2, BarChart3 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  deleteNewsletterCampaign,
  duplicateNewsletterCampaign,
  type NewsletterOverview,
} from "@/lib/newsletter/campaign-actions";
import type { NewsletterCampaign } from "@/lib/newsletter/campaign-email";
import type { CampaignProgress } from "@/lib/newsletter/send-queue";
import { SendReviewDialog } from "./send-review-dialog";
import {
  CampaignStatusPill,
  DeliveryBar,
  GHOST_PILL,
  NAVY_PILL,
  NEW_CAMPAIGN_PATH,
  campaignPath,
  campaignSubject,
  type CampaignStatus,
} from "./shared";
import { useCampaignDelivery } from "./use-campaign-delivery";

type View = "all" | CampaignStatus;
const VIEWS: View[] = ["all", "draft", "sending", "sent", "failed"];

/**
 * Every campaign: quick views by status with counts, search on the subject, and
 * one row per campaign with its delivery. A campaign being sent advances from
 * here (see `useCampaignDelivery`).
 */
export function CampaignList({
  locale,
  campaigns,
  overview,
}: {
  locale: string;
  campaigns: NewsletterCampaign[];
  overview: NewsletterOverview;
}) {
  const t = useTranslations("Admin.newsletter");
  const router = useRouter();
  const [view, setView] = useState<View>("all");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<NewsletterCampaign | null>(null);
  const [toRetry, setToRetry] = useState<NewsletterCampaign | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const byStatus: Record<View, number> = { all: campaigns.length, draft: 0, sending: 0, sent: 0, failed: 0 };
    for (const campaign of campaigns) byStatus[campaign.status] += 1;
    return byStatus;
  }, [campaigns]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return campaigns.filter(
      (campaign) =>
        (view === "all" || campaign.status === view) &&
        (!needle || `${campaign.subject_en}\n${campaign.subject_fr}`.toLowerCase().includes(needle))
    );
  }, [campaigns, view, query]);

  async function duplicate(campaign: NewsletterCampaign) {
    setBusy(true);
    try {
      const result = await duplicateNewsletterCampaign(locale, campaign.id);
      if (!result.ok) {
        toast.error(t("list.duplicateError"));
        return;
      }
      toast.success(t("list.duplicated"));
      router.push(campaignPath(result.id));
    } catch {
      toast.error(t("list.duplicateError"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      const result = await deleteNewsletterCampaign(locale, toDelete.id);
      if (!result.ok) {
        toast.error(t("list.deleteError"));
        return;
      }
      toast.success(t("list.deleted"));
      setToDelete(null);
      router.refresh();
    } catch {
      toast.error(t("list.deleteError"));
    } finally {
      setBusy(false);
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200/70">
        <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-market-navy">
          <MailPlus className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold text-market-navy">{t("list.empty")}</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{t("list.emptyBody")}</p>
        <Link href={NEW_CAMPAIGN_PATH} className={cn(NAVY_PILL, "mt-5")}>
          {t("newCampaign")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
          {VIEWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                view === option ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200" : "text-slate-600 hover:text-market-navy"
              )}
            >
              {t(`views.${option}`)} <span className="tabular-nums text-slate-400">{counts[option]}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">{t("searchPlaceholder")}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-full rounded-full bg-white pl-9 pr-3 text-[13px] text-slate-800 outline-none ring-1 ring-slate-200 transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-market-navy/30"
          />
        </label>
      </div>

      <div className="console-table-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("list.campaign")}</TableHead>
              <TableHead>{t("list.status")}</TableHead>
              <TableHead className="min-w-[220px]">{t("list.delivery")}</TableHead>
              <TableHead>{t("list.date")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t("list.actionsColumn")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                  {t("list.noMatch")}
                </TableCell>
              </TableRow>
            ) : (
              shown.map((campaign) => (
                <CampaignRow
                  // A status change starts the row afresh (live counts, sending state).
                  key={`${campaign.id}:${campaign.status}`}
                  locale={locale}
                  campaign={campaign}
                  audience={overview.subscribers.active}
                  busy={busy}
                  onDuplicate={() => void duplicate(campaign)}
                  onDelete={() => setToDelete(campaign)}
                  onRetry={() => setToRetry(campaign)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {toRetry && (
        <SendReviewDialog
          locale={locale}
          campaign={toRetry}
          overview={overview}
          onClose={() => setToRetry(null)}
          onStarted={() => {
            setToRetry(null);
            router.refresh();
          }}
        />
      )}

      {toDelete && (
        <Dialog open onOpenChange={(open) => !open && !busy && setToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg text-market-navy">{t("deleteDialog.title")}</DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-slate-600">
                {t("deleteDialog.body", { subject: campaignSubject(toDelete, locale) || t("list.untitled") })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <button type="button" onClick={() => setToDelete(null)} disabled={busy} className={GHOST_PILL}>
                {t("deleteDialog.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
                {t("deleteDialog.confirm")}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CampaignRow({
  locale,
  campaign,
  audience,
  busy,
  onDuplicate,
  onDelete,
  onRetry,
}: {
  locale: string;
  campaign: NewsletterCampaign;
  audience: number;
  busy: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations("Admin.newsletter");
  const format = useFormatter();
  const router = useRouter();

  const { counts, state, resume } = useCampaignDelivery(locale, campaign, (progress: CampaignProgress) => {
    if (progress.failed > 0) toast.warning(t("delivery.doneWithFailures", { sent: progress.sent, failed: progress.failed }));
    else toast.success(t("delivery.done", { count: progress.sent }));
    router.refresh();
  });

  const draft = campaign.status === "draft";
  const subject = campaignSubject(campaign, locale) || t("list.untitled");
  const date = new Date(campaign.sent_at ?? campaign.updated_at);
  const href = campaignPath(campaign.id);

  return (
    <TableRow>
      <TableCell className="max-w-[340px]">
        <Link href={href} className="block truncate font-semibold text-slate-900 hover:text-market-navy hover:underline">
          {subject}
        </Link>
      </TableCell>
      <TableCell>
        <CampaignStatusPill status={campaign.status} />
      </TableCell>
      <TableCell>
        {draft ? (
          <span className="text-[13px] text-slate-500">{t("list.audience", { count: audience })}</span>
        ) : (
          <div className="space-y-1.5">
            <DeliveryBar {...counts} label={t("list.delivery")} className="max-w-[220px]" />
            <p className="text-xs text-slate-500">
              {state === "waiting"
                ? t("delivery.waiting")
                : state === "stalled"
                  ? t("delivery.stalled")
                  : t("list.delivered", { sent: format.number(counts.sent), total: format.number(counts.total) })}
              {counts.failed > 0 && state !== "stalled" && state !== "waiting" && (
                <span className="font-medium text-red-700"> · {t("list.failedCount", { count: counts.failed })}</span>
              )}
            </p>
          </div>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-[13px] text-slate-500">
        {format.dateTime(date, { day: "numeric", month: "short", year: "numeric" })}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1.5">
          {state === "stalled" && (
            <button type="button" onClick={resume} className={cn(GHOST_PILL, "px-3 py-1.5")}>
              <Play className="size-3.5" aria-hidden />
              {t("delivery.resume")}
            </button>
          )}
          {campaign.status === "failed" && (
            <button type="button" onClick={onRetry} disabled={busy} className={cn(GHOST_PILL, "px-3 py-1.5")}>
              <RotateCcw className="size-3.5" aria-hidden />
              {t("delivery.retry")}
            </button>
          )}
          {draft && (
            <Link href={href} className={cn(GHOST_PILL, "px-3 py-1.5")}>
              <Pencil className="size-3.5" aria-hidden />
              {t("list.edit")}
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("list.actions", { subject })}
              className="grid size-8 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-market-navy"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={href}>
                  {draft ? <Pencil className="size-4" aria-hidden /> : <BarChart3 className="size-4" aria-hidden />}
                  {t(draft ? "list.edit" : "list.report")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onSelect={onDuplicate}>
                <Copy className="size-4" aria-hidden />
                {t("list.duplicate")}
              </DropdownMenuItem>
              {draft && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" disabled={busy} onSelect={onDelete}>
                    <Trash2 className="size-4" aria-hidden />
                    {t("list.delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
