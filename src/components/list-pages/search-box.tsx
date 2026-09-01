"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

/**
 * Full-text search input for the directory / marketplace list pages (Req 5).
 * Writes the `q` param into the URL while preserving every other filter param,
 * so search composes with the sidebar facets and the resulting URL is
 * shareable. The page reads `q` server-side and runs the `global_search` RPC.
 *
 * Debounced to avoid a navigation per keystroke; Enter submits immediately.
 * Resetting to the first page is implicit because the page param is dropped.
 */
export function SearchBox({ placeholder }: { placeholder: string }) {
  const t = useTranslations("Search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get("q") ?? "");

  // Keep the input in sync when navigation changes `q` externally (e.g. reset).
  React.useEffect(() => {
    setValue(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("q")]);

  const commit = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  React.useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;
    const handle = setTimeout(() => commit(value), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [value, commit, searchParams]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    commit(value);
  }

  return (
    <form onSubmit={onSubmit} className="relative" role="search">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm outline-none transition focus:border-primary"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            commit("");
          }}
          aria-label={t("clear")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:bg-muted transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}
