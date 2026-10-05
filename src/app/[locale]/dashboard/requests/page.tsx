"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Inbox, Package, Send, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useReceivedRequests } from "@/hooks/use-received-requests";
import { RequestInbox } from "@/components/dashboard/requests/request-inbox";
import {
  markReceivedRequestsSeen,
  receivedRequestsKey,
  unseenRequests,
} from "@/lib/dashboard/received-requests";

const CARD = "rounded-2xl bg-white p-5 ring-1 ring-slate-200/70";
const NO_IDS: ReadonlySet<string> = new Set();

/**
 * "Demandes reçues": the quote and contact requests buyers sent to the
 * company, once the TradeInDRC team has checked and forwarded them. Opening the
 * page marks them as seen (sidebar badge and home task go away); the ones that
 * were new on arrival keep their "New" tag for the visit.
 */
export default function ReceivedRequestsPage() {
  const t = useTranslations("ReceivedRequests");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: companies } = useCompanies(user?.id);
  const { data: requests, isLoading, isError } = useReceivedRequests(user?.id);

  const [newIds, setNewIds] = React.useState<ReadonlySet<string>>(NO_IDS);
  const marked = React.useRef(false);

  React.useEffect(() => {
    if (!requests || marked.current) return;
    marked.current = true;
    const fresh = unseenRequests(requests);
    if (fresh.length === 0) return;
    setNewIds(new Set(fresh.map((r) => r.id)));
    markReceivedRequestsSeen()
      .then(() => queryClient.invalidateQueries({ queryKey: receivedRequestsKey(user?.id) }))
      // The list is still readable; the badge simply stays until the next visit.
      .catch(() => {});
  }, [requests, queryClient, user?.id]);

  const steps = [
    { key: "buyer", icon: Send },
    { key: "team", icon: ShieldCheck },
    { key: "you", icon: Inbox },
  ] as const;

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pt-2">
      <header>
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
          {t("title")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{t("subtitle")}</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[380px_minmax(0,1fr)]" aria-busy>
          <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/70" />
          <div className="hidden h-96 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/70 lg:block" />
        </div>
      ) : isError ? (
        <p className={`${CARD} text-sm text-market-red`} role="alert">{t("loadError")}</p>
      ) : !requests || requests.length === 0 ? (
        <section className={`${CARD} px-6 py-10`}>
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-market-navy" aria-hidden>
              <Inbox className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-market-navy">{t("empty.title")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("empty.body")}</p>
          </div>

          {/* The path a request follows, so an empty inbox still explains itself. */}
          <ol className="mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {steps.map(({ key, icon: Icon }, index) => (
              <li key={key} className="relative rounded-xl bg-slate-50 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-market-navy ring-1 ring-slate-200/70" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[13px] font-semibold text-market-navy">
                  <span className="text-market-or-dark">{index + 1}.</span> {t(`empty.steps.${key}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">{t(`empty.steps.${key}.body`)}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-300 sm:block" aria-hidden />
                )}
              </li>
            ))}
          </ol>

          <div className="mt-7 text-center">
            <Link
              href={ROUTES.DASHBOARD_PRODUCTS}
              className="inline-flex items-center gap-2 rounded-full bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              <Package className="h-4 w-4" aria-hidden />
              {t("empty.cta")}
            </Link>
          </div>
        </section>
      ) : (
        <RequestInbox requests={requests} newIds={newIds} showCompany={(companies?.length ?? 0) > 1} />
      )}
    </div>
  );
}
