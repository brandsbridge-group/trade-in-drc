"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

// href values use the singular content-type route param ("event"), matching the
// [type]/page.tsx ALLOWED set (news / event / blog). A plural "events" href 404s.
// The newsletter is not a content type: it has its own section
// (/console/newsletter), reserved to super-admins, and only shares this bar.
const TABS: { labelKey: string; href: string; superAdminOnly?: boolean }[] = [
  { labelKey: "news", href: "/console/content/news" },
  { labelKey: "newsletter", href: ROUTES.CONSOLE_NEWSLETTER, superAdminOnly: true },
  { labelKey: "events", href: "/console/content/event" },
  { labelKey: "blog", href: "/console/content/blog" },
];

/**
 * Sub-navigation of "Content". `showNewsletter` must be true for super-admins
 * only: a moderator who followed the tab would be sent back by the proxy.
 */
export function ContentTabsNav({ showNewsletter = false }: { showNewsletter?: boolean }) {
  const t = useTranslations("Content.admin.tabs");
  const pathname = usePathname();

  return (
    <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
      {TABS.filter((tab) => showNewsletter || !tab.superAdminOnly).map((tab) => {
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
