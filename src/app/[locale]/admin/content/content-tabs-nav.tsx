"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { ContentType } from "@/lib/content/types";

// href values use the singular content-type route param ("event"), matching the
// [type]/page.tsx ALLOWED set (news / event / blog). A plural "events" href 404s.
const TABS: { type: ContentType; labelKey: string; href: string }[] = [
  { type: "news", labelKey: "news", href: "/admin/content/news" },
  { type: "event", labelKey: "events", href: "/admin/content/event" },
  { type: "blog", labelKey: "blog", href: "/admin/content/blog" },
];

export function ContentTabsNav() {
  const t = useTranslations("Content.admin.tabs");
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b pb-0">
      {TABS.map((tab) => {
        // Match the route segment exactly so "/admin/content/event" does not
        // light up for unrelated paths that merely contain the substring.
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
