"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, Briefcase, CheckCircle2, Crown, Inbox, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { QUEUE_KEYS, type QueueEntry, type QueueKey } from "@/lib/console/dashboard-metrics";
import { REVIEW_TARGET_DAYS, daysBetween } from "@/lib/verifications/workflow";

const ITEM: Record<QueueKey, { icon: LucideIcon; href: string }> = {
  verifications: { icon: ShieldCheck, href: ROUTES.CONSOLE_VERIFICATIONS },
  opportunities: { icon: Briefcase, href: `${ROUTES.CONSOLE_OPPORTUNITIES}?status=pending_review` },
  requests: { icon: Inbox, href: ROUTES.CONSOLE_REQUESTS },
  premium: { icon: Crown, href: ROUTES.CONSOLE_PREMIUM },
  reports: { icon: MessageSquareWarning, href: ROUTES.CONSOLE_MESSAGES },
};

interface ModerationQueueProps {
  queue: Record<QueueKey, QueueEntry>;
  now: Date;
}

/** "À traiter": every queue waiting on staff, with how long its oldest item has waited. */
export function ModerationQueue({ queue, now }: ModerationQueueProps) {
  const t = useTranslations("Admin.dashboard.queue");
  const format = useFormatter();
  const total = QUEUE_KEYS.reduce((sum, key) => sum + queue[key].count, 0);
  // Busiest-first would reshuffle on every visit; the order stays fixed, empty queues just recede.
  return (
    <section aria-labelledby="console-queue" className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
      <h2 id="console-queue" className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-market-navy">
        {t("title")}
        {total > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-market-red px-1.5 text-[11px] font-bold tabular-nums text-white">
            {format.number(total)}
          </span>
        )}
      </h2>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-emerald-50/60 px-4 py-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm font-medium text-emerald-800">{t("allClear")}</p>
        </div>
      ) : (
        <ul className="-mx-2 flex-1 space-y-0.5">
          {QUEUE_KEYS.map((key) => {
            const { icon: Icon, href } = ITEM[key];
            const { count, oldest } = queue[key];
            const late = oldest !== null && daysBetween(oldest, now) > REVIEW_TARGET_DAYS;
            return (
              <li key={key}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      count === 0 ? "bg-slate-100 text-slate-400" : late ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"
                    )}
                  >
                    <Icon className="h-[17px] w-[17px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px] font-semibold", count === 0 ? "text-slate-500" : "text-market-navy")}>
                      {t(`items.${key}`)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {count === 0 || oldest === null
                        ? t("upToDate")
                        : t(late ? "oldestLate" : "oldest", { age: format.relativeTime(new Date(oldest), now) })}
                    </span>
                  </span>
                  <span className={cn("shrink-0 font-display text-lg font-semibold tabular-nums", count === 0 ? "text-slate-300" : "text-market-navy")}>
                    {format.number(count)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
