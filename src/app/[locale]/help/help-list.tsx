"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Search, LifeBuoy, ChevronRight } from "lucide-react";
import type { LocalizedHelpArticle } from "@/lib/content/pages";

interface HelpListProps {
  articles: LocalizedHelpArticle[];
}

const UNCATEGORIZED = "__uncategorized__";

export function HelpList({ articles }: HelpListProps) {
  const t = useTranslations("Help");
  const reduce = useReducedMotion();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filtered = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter((a) => a.title.toLowerCase().includes(term));
  }, [articles, searchTerm]);

  // Group by category, preserving the (already sorted) order of arrival.
  const groups = React.useMemo(() => {
    const map = new Map<string, LocalizedHelpArticle[]>();
    for (const article of filtered) {
      const key = article.category ?? UNCATEGORIZED;
      const bucket = map.get(key);
      if (bucket) bucket.push(article);
      else map.set(key, [article]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-10">
          <LifeBuoy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6">
          <LifeBuoy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([category, items], groupIndex) => (
            <section key={category}>
              {category !== UNCATEGORIZED && (
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </h2>
              )}
              <div className="space-y-2">
                {items.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduce ? 0 : 0.2,
                      delay: reduce ? 0 : (groupIndex * 4 + index) * 0.03,
                    }}
                  >
                    <Link
                      href={`/help/${article.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-card px-5 py-4 transition-colors hover:border-primary/40"
                    >
                      <span className="font-medium text-slate-900">{article.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
