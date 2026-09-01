"use client";
import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FilterChip } from "@/components/design";
import { createClient } from "@/lib/supabase/client";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";

const ALLOWED_KEYS = ["sector", "segment", "tier", "category", "region", "tag", "country", "cert"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LookupMap = Map<string, string>;

function useFilterValueResolver(locale: string) {
  const [sectors, setSectors] = React.useState<LookupMap>(new Map());
  const [categories, setCategories] = React.useState<LookupMap>(new Map());

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const cols = "id, name_en, name_fr, name_tr, name_zh, name_es";

    (async () => {
      const [s, c] = await Promise.all([
        supabase.from("sectors").select(cols),
        supabase.from("categories").select(cols),
      ]);
      if (cancelled) return;
      const toMap = (rows: Array<{ id: string }>): LookupMap => {
        const m: LookupMap = new Map();
        for (const row of rows) {
          m.set(row.id, pickLocalized(row, "name", locale as Locale) || row.id);
        }
        return m;
      };
      if (s.data) setSectors(toMap(s.data as unknown as Array<{ id: string }>));
      if (c.data) setCategories(toMap(c.data as unknown as Array<{ id: string }>));
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return React.useCallback(
    (key: string, value: string): string => {
      if (!UUID_RE.test(value)) return value;
      if (key === "sector") return sectors.get(value) ?? value;
      if (key === "category") return categories.get(value) ?? value;
      return value;
    },
    [sectors, categories],
  );
}

export function ActiveFiltersBar({ labels }: { labels: Record<string, string> }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const t = useTranslations("ListPages.filters");
  const locale = useLocale();
  const resolve = useFilterValueResolver(locale);
  const entries = Array.from(sp.entries()).filter(([k]) => ALLOWED_KEYS.includes(k));
  if (entries.length === 0) return null;

  function remove(key: string) {
    const next = new URLSearchParams(sp.toString());
    next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${path}?${qs}` : path);
  }

  function resetAll() {
    router.push(path);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {entries.map(([k, v]) => (
        <FilterChip key={k} label={labels[k] ?? k} value={resolve(k, v)} onRemove={() => remove(k)} />
      ))}
      <button
        type="button"
        onClick={resetAll}
        className="text-xs underline text-muted-foreground"
      >
        {t("reset")}
      </button>
    </div>
  );
}
