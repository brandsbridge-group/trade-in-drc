"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  FileWarning,
  MailWarning,
  MessageSquareReply,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { companiesQueryKey } from "@/hooks/use-companies";
import { resubmitCompanyVerification } from "@/lib/verifications/actions";
import { MAX_TASKS, type DashboardTask, type TaskKind, type TaskTone } from "@/lib/dashboard/overview/tasks";

const TONE: Record<TaskTone, { icon: string; action: string }> = {
  blocking: { icon: "bg-amber-100 text-amber-700", action: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
  opportunity: { icon: "bg-blue-50 text-blue-700", action: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  improve: { icon: "", action: "bg-slate-100 text-market-navy hover:bg-slate-200" },
  subscription: { icon: "bg-market-cream text-market-or-dark", action: "bg-market-cream text-market-or-dark hover:bg-market-or-light/40" },
  done: { icon: "bg-emerald-50 text-emerald-700", action: "text-slate-400" },
};

const ICON: Record<TaskKind, LucideIcon> = {
  verification_documents: FileWarning,
  verification_more_info: ShieldAlert,
  verification_rejected: ShieldAlert,
  verification_pending: Clock,
  messages_awaiting: MailWarning,
  responses_new: MessageSquareReply,
  profile_incomplete: CheckCircle2,
  premium_expiring: Crown,
  premium_expired: Crown,
};

function taskHref(task: DashboardTask): string | null {
  switch (task.kind) {
    case "verification_documents":
    case "verification_more_info":
    case "profile_incomplete":
      return task.companyId ? `/dashboard/companies/${task.companyId}/edit` : "/dashboard/companies";
    case "messages_awaiting":
      return "/dashboard/inbox";
    case "responses_new":
      return "/dashboard/opportunities";
    case "premium_expiring":
    case "premium_expired":
      return "/pricing";
    default:
      return null;
  }
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-9 w-9 shrink-0 place-items-center" aria-hidden>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" className="stroke-slate-200" />
        <circle
          cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" strokeLinecap="round"
          className="stroke-market-or-dark" strokeDasharray={`${(percent / 100) * c} ${c}`}
        />
      </svg>
      <span className="text-[9.5px] font-bold text-market-navy">{percent}%</span>
    </div>
  );
}

interface ActionCenterProps {
  tasks: DashboardTask[];
  userId: string;
}

/** "À faire maintenant": what blocks the company or loses it business, one action per row. */
export function ActionCenter({ tasks, userId }: ActionCenterProps) {
  const t = useTranslations("DashboardOverview");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [resubmitting, setResubmitting] = React.useState<string | null>(null);

  const actionable = tasks.filter((task) => task.tone !== "done");
  const visible = tasks.slice(0, MAX_TASKS);
  const hidden = tasks.length - visible.length;

  const resubmit = async (companyId: string) => {
    setResubmitting(companyId);
    const toastId = toast.loading(t("tasks.verification_rejected.resubmitting"));
    try {
      // Service-role server action: owners cannot write companies.status themselves.
      const result = await resubmitCompanyVerification({ companyId, locale });
      if (!result.ok) throw new Error(result.error ?? "resubmit_failed");
      toast.success(t("tasks.verification_rejected.resubmitted"), { id: toastId });
      await queryClient.invalidateQueries({ queryKey: companiesQueryKey(userId) });
    } catch {
      toast.error(t("tasks.verification_rejected.resubmitError"), { id: toastId });
    } finally {
      setResubmitting(null);
    }
  };

  return (
    <section aria-labelledby="overview-todo" className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="overview-todo" className="flex items-center gap-2 font-display text-base font-semibold text-market-navy">
          {t("todoTitle")}
          {actionable.length > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-market-red px-1.5 text-[11px] font-bold text-white">
              {actionable.length}
            </span>
          )}
        </h2>
        {hidden > 0 && <span className="text-xs text-slate-500">{t("todoMore", { count: hidden })}</span>}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-emerald-50/60 px-4 py-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm font-medium text-emerald-800">{t("todoAllDone")}</p>
        </div>
      ) : (
        <ul className="-mx-2 flex-1 space-y-1">
          {visible.map((task) => {
            const Icon = ICON[task.kind];
            const tone = TONE[task.tone];
            const href = taskHref(task);
            const values = {
              company: task.companyName ?? "",
              ...task.values,
              ...(task.kind === "profile_incomplete"
                ? {
                    first: task.values?.first ? t(`missing.${task.values.first}`) : "",
                    second: task.values?.second ? t(`missing.${task.values.second}`) : "",
                  }
                : {}),
            };
            const body =
              task.kind === "profile_incomplete" && !task.values?.second
                ? t("tasks.profile_incomplete.bodySingle", values)
                : t(`tasks.${task.kind}.body`, values);
            const pill = cn(
              "ml-12 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors sm:ml-0",
              tone.action
            );

            return (
              <li
                key={`${task.kind}-${task.companyId ?? ""}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 sm:flex-nowrap"
              >
                {task.kind === "profile_incomplete" ? (
                  <ProgressRing percent={Number(task.values?.percent ?? 0)} />
                ) : (
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", tone.icon)}>
                    <Icon className="h-[17px] w-[17px]" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-auto">
                  <p className="text-[13px] font-semibold text-market-navy sm:truncate">{t(`tasks.${task.kind}.title`, values)}</p>
                  <p className="line-clamp-1 text-xs text-slate-500" title={body}>{body}</p>
                </div>
                {task.kind === "verification_rejected" && task.companyId ? (
                  <button
                    type="button"
                    onClick={() => resubmit(task.companyId!)}
                    disabled={resubmitting === task.companyId}
                    className={cn(pill, "disabled:opacity-60")}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", resubmitting === task.companyId && "animate-spin")} aria-hidden />
                    {t("tasks.verification_rejected.cta")}
                  </button>
                ) : href ? (
                  <Link href={href} className={pill}>
                    {t(`tasks.${task.kind}.cta`)}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ) : (
                  <span className="shrink-0 text-[11.5px] text-slate-400">{t("noActionNeeded")}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
