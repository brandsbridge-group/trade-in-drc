"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "market_report" as const, href: "/admin/data-hub/reports/market_report" },
  { key: "legal_guide" as const, href: "/admin/data-hub/reports/legal_guide" },
  { key: "regulation" as const, href: "/admin/data-hub/reports/regulation" },
  { key: "prices" as const, href: "/admin/data-hub/prices" },
] as const;

export function DataHubTabsNav() {
  const t = useTranslations("DataHub");
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b pb-0">
      {TABS.map((tab) => {
        const active = pathname.includes(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-t-md border border-b-0 transition-colors",
              active
                ? "bg-background border-border text-foreground"
                : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`pillars.${tab.key}.title`)}
          </Link>
        );
      })}
    </div>
  );
}
