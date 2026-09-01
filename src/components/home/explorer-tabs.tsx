"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Package, Building2, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ProductCardDesign,
  CompanyRow,
  OpportunityCardDesign,
  EmptyState,
} from "@/components/design";
import type { VerificationTier } from "@/lib/trust/types";
import type { Opportunity } from "@/lib/opportunities/types";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";

type Tab = "products" | "companies" | "opportunities";

interface Sector {
  id: string;
  name_en: string;
  name_fr: string;
  name_tr?: string | null;
  name_zh?: string | null;
  name_es?: string | null;
  slug: string;
}

interface ProductLite {
  id: string;
  name: string;
  images: string[] | null;
  company_id: string;
  companies: { name: string; verification_tier?: string | null } | null;
}

interface CompanyLite {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  verification_tier: string | null;
}

const ICON: Record<Tab, React.ElementType> = {
  products: Package,
  companies: Building2,
  opportunities: TrendingUp,
};

const HREF: Record<Tab, string> = {
  products: "/products",
  companies: "/companies",
  opportunities: "/opportunities",
};

export function ExplorerTabs({
  locale,
  sectors,
  products,
  companies,
  opportunities,
}: {
  locale: string;
  sectors: Sector[];
  products: ProductLite[];
  companies: CompanyLite[];
  opportunities: Opportunity[];
}) {
  const t = useTranslations("Home.explorer");
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-0">
      {/* Left rail — sectors (no outer border; connected inside the outer rounded-2xl container) */}
      <aside className="border-r border-slate-200 bg-card text-sm pr-4 mr-4">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-slate-200">
          {t("sectorsHeading")}
        </div>
        <ul className="py-1">
          {sectors.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">—</li>
          )}
          {sectors.map((s) => (
            <li key={s.id}>
              <Link
                href={`/companies?sector=${s.id}`}
                className="block px-3 py-1.5 hover:bg-muted/40 text-sm"
              >
                {pickLocalized(s, "name", locale as Locale)}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right column */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex gap-1">
            {(["products", "companies", "opportunities"] as Tab[]).map((k) => {
              const Icon = ICON[k];
              const active = tab === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  aria-pressed={active}
                  className={[
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/40",
                  ].join(" ")}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(`tabs.${k}`)}
                </button>
              );
            })}
          </div>
          <Link
            href={HREF[tab]}
            className="text-xs text-primary hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, translateY: 4 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -4 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "products" &&
              (products.length === 0 ? (
                <EmptyState title={t("tabs.products")} body={t("viewAll")} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {products.slice(0, 10).map((p) => (
                    <ProductCardDesign
                      key={p.id}
                      item={{
                        id: p.id,
                        name: p.name,
                        image_url: p.images?.[0] ?? null,
                        company_id: p.company_id,
                        company_name: p.companies?.name ?? null,
                        verificationTier:
                          (p.companies?.verification_tier ?? null) as VerificationTier | null,
                      }}
                    />
                  ))}
                </div>
              ))}

            {tab === "companies" &&
              (companies.length === 0 ? (
                <EmptyState title={t("tabs.companies")} body={t("viewAll")} />
              ) : (
                <div className="space-y-2">
                  {companies.map((c) => (
                    <CompanyRow
                      key={c.id}
                      company={{
                        id: c.id,
                        name: c.name,
                        logo_url: c.logo_url,
                        description: c.description,
                        verification_tier: (c.verification_tier ??
                          "none") as VerificationTier,
                        tags: [],
                      }}
                    />
                  ))}
                </div>
              ))}

            {tab === "opportunities" &&
              (opportunities.length === 0 ? (
                <EmptyState title={t("tabs.opportunities")} body={t("viewAll")} />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {opportunities.map((o) => (
                    <OpportunityCardDesign key={o.id} item={o} locale={locale} />
                  ))}
                </div>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
