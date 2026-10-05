"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "market_report" as const, href: "/console/data-hub/reports/market_report" },
  { key: "legal_guide" as const, href: "/console/data-hub/reports/legal_guide" },
  { key: "regulation" as const, href: "/console/data-hub/reports/regulation" },
  { key: "prices" as const, href: "/console/data-hub/prices" },
] as const;

export function DataHubTabsNav() {
  const t = useTranslations("DataHub");
  const pathname = usePathname();

  return (
    <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
      {TABS.map((tab) => {
        const active = pathname.includes(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
              active
                ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200"
                : "text-slate-600 hover:text-market-navy"
            )}
          >
            {t(`pillars.${tab.key}.title`)}
          </Link>
        );
      })}
    </div>
  );
}
