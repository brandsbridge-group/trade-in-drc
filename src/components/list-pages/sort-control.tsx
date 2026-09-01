"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowDownUp } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "./sort-options";

/**
 * Sort control for the directory / marketplace list pages (Req 5 — sorting:
 * relevance, A–Z, newest). Writes the `sort` param into the URL preserving all
 * other params, so the chosen sort is shareable. "Relevance" only applies when
 * a search query is present; the page falls back to A–Z otherwise.
 */
export function SortControl({ value }: { value: SortOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Companies");

  const labels: Record<SortOption, string> = {
    relevance: t("relevance"),
    az: t("nameAZ"),
    newest: t("newest"),
  };

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as SortOption;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "az") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <ArrowDownUp className="w-3.5 h-3.5" aria-hidden />
      <span className="sr-only sm:not-sr-only">{t("sortBy")}</span>
      <select
        value={value}
        onChange={onChange}
        aria-label={t("sortBy")}
        className="rounded-md border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs text-foreground outline-none transition focus:border-primary"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {labels[opt]}
          </option>
        ))}
      </select>
    </label>
  );
}
