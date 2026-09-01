"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

/** Sort options for the verified directory. `recent` (default) → created_at
 * desc; `az` → name asc. Drives the `?sort=` URL param. */
export const DIRECTORY_SORT = {
  RECENT: "recent",
  AZ: "az",
} as const;

export type DirectorySortValue = (typeof DIRECTORY_SORT)[keyof typeof DIRECTORY_SORT];

export function DirectorySort({ value }: { value: DirectorySortValue }) {
  const t = useTranslations("VerifiedDirectory");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (next === DIRECTORY_SORT.RECENT) params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span>{t("sortBy")}</span>
      <select
        value={value}
        onChange={onChange}
        aria-label={t("sortBy")}
        className="rounded-md border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs text-market-navy outline-none transition-colors duration-150 focus:border-market-navy"
      >
        <option value={DIRECTORY_SORT.RECENT}>{t("sortRecent")}</option>
        <option value={DIRECTORY_SORT.AZ}>{t("sortNameAZ")}</option>
      </select>
    </label>
  );
}
