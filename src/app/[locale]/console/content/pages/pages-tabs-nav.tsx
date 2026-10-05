"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "pages", href: "/console/content/pages" },
  { key: "faqs", href: "/console/content/pages/faqs" },
  { key: "help", href: "/console/content/pages/help" },
] as const;

export function PagesTabsNav() {
  const pathname = usePathname();
  const t = useTranslations("AdminCms");

  return (
    <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
      {TABS.map((tab) => {
        // "pages" is the base — only active when no deeper segment matches a sibling tab.
        const isFaqs = pathname.includes("/console/content/pages/faqs");
        const isHelp = pathname.includes("/console/content/pages/help");
        const active =
          tab.key === "faqs"
            ? isFaqs
            : tab.key === "help"
              ? isHelp
              : !isFaqs && !isHelp;
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
            {t(`tabs.${tab.key}`)}
          </Link>
        );
      })}
    </div>
  );
}
