"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/auth-provider";
import { reportClientError } from "@/lib/errors/report-client-error";

/**
 * Catches a crash of any dashboard page. Without it Next.js replaces the whole
 * site with a blank "Application error" screen; here the sidebar stays, the
 * user can try again, and the error is sent to the server logs under the
 * reference shown on screen.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Dashboard.error");
  const router = useRouter();
  const { user } = useAuth();
  // Quoted by the user, searched by the team: one code per crash.
  const [reference] = React.useState(() => crypto.randomUUID().slice(0, 8).toUpperCase());
  const reported = React.useRef<Error | null>(null);

  React.useEffect(() => {
    if (reported.current === error) return;
    reported.current = error;
    console.error(error);
    reportClientError(error, { area: "dashboard", reference, userId: user?.id });
  }, [error, reference, user?.id]);

  const retry = () => {
    // refresh() re-fetches the server part of the page, reset() re-renders what crashed.
    React.startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <section role="alert" className="mx-auto mt-6 max-w-xl rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200/70 sm:p-8">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-red-50 text-market-red" aria-hidden>
        <TriangleAlert className="h-5 w-5" />
      </span>
      <h1 className="mt-4 font-display text-xl font-semibold text-market-navy">{t("title")}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t("body")}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-market-navy px-6 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
        >
          <RotateCw className="h-4 w-4" aria-hidden />
          {t("retry")}
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center rounded-full bg-slate-200/70 px-5 text-[13px] font-semibold text-market-navy transition-colors hover:bg-slate-200"
        >
          {t("home")}
        </Link>
      </div>
      <p className="mt-5 text-xs tabular-nums text-slate-400">{t("reference", { code: reference })}</p>
    </section>
  );
}
