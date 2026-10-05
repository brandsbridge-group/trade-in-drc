"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { ContentType } from "@/lib/content/types";

// href values use the singular content-type route param ("event"), matching the
// [type]/page.tsx ALLOWED set (news / event / blog). A plural "events" href 404s.
const TABS: { type: ContentType; labelKey: string; href: string }[] = [
  { type: "news", labelKey: "news", href: "/console/content/news" },
  { type: "event", labelKey: "events", href: "/console/content/event" },
  { type: "blog", labelKey: "blog", href: "/console/content/blog" },
];

export function ContentTabsNav() {
  const t = useTranslations("Content.admin.tabs");
  const pathname = usePathname();

  return (
    <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
      {TABS.map((tab) => {
        // Match the route segment exactly so "/console/content/event" does not
        // light up for unrelated paths that merely contain the substring.
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
