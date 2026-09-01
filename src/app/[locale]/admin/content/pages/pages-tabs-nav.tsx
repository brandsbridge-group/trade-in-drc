"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "pages", href: "/admin/content/pages" },
  { key: "faqs", href: "/admin/content/pages/faqs" },
  { key: "help", href: "/admin/content/pages/help" },
] as const;

export function PagesTabsNav() {
  const pathname = usePathname();
  const t = useTranslations("AdminCms");

  return (
    <div className="flex gap-1 border-b pb-0">
      {TABS.map((tab) => {
        // "pages" is the base — only active when no deeper segment matches a sibling tab.
        const isFaqs = pathname.includes("/admin/content/pages/faqs");
        const isHelp = pathname.includes("/admin/content/pages/help");
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
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-t-md border border-b-0 transition-colors",
              active
                ? "bg-background border-border text-foreground"
                : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`tabs.${tab.key}`)}
          </Link>
        );
      })}
    </div>
  );
}
