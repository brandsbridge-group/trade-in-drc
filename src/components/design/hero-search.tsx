"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/routing";

type HeroTab = "importers" | "exporters" | "products" | "opportunities";

const HREF_BY_TAB: Record<HeroTab, (q: string) => string> = {
  importers:     (q) => `/opportunities?q=${encodeURIComponent(q)}`,
  exporters:     (q) => `/companies?q=${encodeURIComponent(q)}`,
  products:      (q) => `/products?q=${encodeURIComponent(q)}`,
  opportunities: (q) => `/opportunities?q=${encodeURIComponent(q)}`,
};

const TABS: HeroTab[] = ["importers", "exporters", "products", "opportunities"];

export function HeroSearch() {
  const t = useTranslations("Design.hero");
  const td = useTranslations("Design");
  const router = useRouter();
  const [tab, setTab] = useState<HeroTab>("exporters");
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(HREF_BY_TAB[tab](q.trim()));
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Tab strip — attached to the search bar below like folder tabs */}
      <div className="flex">
        {TABS.map((k) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-pressed={active}
              className={[
                "px-4 py-2 text-xs font-medium transition rounded-t-xl -mr-px relative",
                active
                  ? "bg-white text-foreground z-10"
                  : "bg-white/10 text-white/80 hover:bg-white/15",
              ].join(" ")}
            >
              {t(`tabs.${k}`)}
            </button>
          );
        })}
      </div>
      {/* Search bar — flush with the tabs */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 bg-white rounded-2xl rounded-tl-none p-1.5 shadow-sm"
      >
        <div className="flex-1 flex items-center gap-2 pl-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 h-10 text-sm text-foreground placeholder:text-slate-400 bg-transparent border-0 outline-none focus:ring-0"
          />
        </div>
        <button
          type="submit"
          className="bg-foreground text-background hover:bg-foreground/90 px-5 h-10 rounded-xl text-sm font-medium"
        >
          {td("search")}
        </button>
      </form>
    </div>
  );
}
