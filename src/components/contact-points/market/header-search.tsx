"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import { CATEGORY_ORDER, type InstitutionCategory } from "./categories";

interface HeaderSearchProps {
  initialQuery: string;
  activeCategory: string;
  placeholder: string;
  allCategoriesLabel: string;
  categoryLabels: Record<string, string>;
}

/**
 * Header controls for the Institutional Contacts directory: a keyword search
 * input and an "All Categories" dropdown. Both drive URL search params
 * (`?q=` / `?category=`) so the server component re-queries Supabase.
 */
export function HeaderSearch({
  initialQuery,
  activeCategory,
  placeholder,
  allCategoriesLabel,
  categoryLabels,
}: HeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);

  function pushParams(next: { q?: string; category?: string }) {
    const params = new URLSearchParams();
    const q = next.q ?? query;
    const category = next.category ?? activeCategory;
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pushParams({ q: query });
        }}
        className="relative w-full sm:w-[320px]"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-market-navy outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:border-market-navy"
        />
      </form>

      <div className="relative w-full sm:w-[200px]">
        <select
          value={activeCategory}
          onChange={(e) => pushParams({ category: e.target.value })}
          aria-label={allCategoriesLabel}
          className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-border bg-white pl-3 pr-9 text-sm text-market-navy outline-none transition-colors duration-150 focus:border-market-navy"
        >
          <option value="">{allCategoriesLabel}</option>
          {CATEGORY_ORDER.map((c: InstitutionCategory) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-market-navy" aria-hidden />
      </div>
    </div>
  );
}
