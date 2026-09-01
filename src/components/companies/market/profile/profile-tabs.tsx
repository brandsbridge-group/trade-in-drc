"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", target: "overview" },
  { key: "products", target: "products" },
  { key: "partnership", target: "partnership" },
  { key: "verification", target: "verification" },
  { key: "contact", target: "contact-intro" },
] as const;

/**
 * Anchor tab bar (design 5). Tabs smooth-scroll to the matching section rather
 * than hiding content — the whole dossier stays visible, matching the render.
 * "Overview" is active on load.
 */
export function ProfileTabs() {
  const t = useTranslations("CompanyProfile");
  const [active, setActive] = useState<string>("overview");

  const handleClick = (key: string, target: string) => {
    setActive(key);
    const el = document.getElementById(target);
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <div className="border-b border-market-navy/10 bg-white">
      <div className="flex gap-5 overflow-x-auto px-1 sm:gap-7">
        {TABS.map(({ key, target }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleClick(key, target)}
              className={cn(
                "relative whitespace-nowrap border-b-2 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "border-market-navy text-market-navy"
                  : "border-transparent text-market-navy/55 hover:text-market-navy",
              )}
            >
              {t(`tabs.${key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
