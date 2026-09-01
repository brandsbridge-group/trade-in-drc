"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { DRC_PROVINCES } from "@/config/provinces";
import { VERIFICATION_TIER } from "@/constants/status";
import { LayoutGrid, Search, Users } from "lucide-react";

interface SectorOption {
  id: string;
  label: string;
}

/** Supplier-type facet maps to companies.verification_tier. */
const SUPPLIER_TIERS = [VERIFICATION_TIER.VERIFIED, VERIFICATION_TIER.PREMIUM] as const;

/**
 * Marketplace hero (customer design 1): short navy band with photo collage
 * edges (coffee sack left, port + mining right), headline and a 4-facet
 * white search pill. Kept deliberately compact so content starts immediately.
 */
export function MarketHero({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("MarketHome.hero");
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    const sector = String(fd.get("sector") ?? "");
    const province = String(fd.get("province") ?? "");
    const tier = String(fd.get("tier") ?? "");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sector) params.set("sector", sector);
    // Province + supplier-type facets only exist on the companies directory;
    // a plain product search goes to /products.
    if (province || tier) {
      if (province) params.set("region", province);
      if (tier) params.set("tier", tier);
      router.push(`/companies?${params.toString()}`);
    } else {
      router.push(`/products?${params.toString()}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      {/* Photo collage edges from the customer's artwork — mask-faded into the
          navy band so there are no visible seams (matches the reference blend). */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[16%] lg:block [mask-image:linear-gradient(to_right,black_55%,transparent)]">
        <Image src="/images/home/hero-left.jpg" alt="" fill priority className="object-cover" sizes="16vw" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] md:block [mask-image:linear-gradient(to_left,black_62%,transparent)]">
        <Image src="/images/home/hero-right.jpg" alt="" fill priority className="object-cover" sizes="52vw" />
        <div className="absolute inset-0 bg-market-navy/20" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6">
        <div className="max-w-3xl">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
            {t("title")}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/85">{t("subtitle")}</p>

          {/* 4-facet search pill */}
          <form
            onSubmit={onSubmit}
            className="mt-4 flex w-full max-w-2xl items-stretch overflow-hidden rounded-lg border-2 border-white bg-white text-slate-800 shadow-md"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 pl-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <input
                name="q"
                placeholder={t("searchPlaceholder")}
                className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <select
              name="sector"
              aria-label={t("category")}
              className="hidden h-10 w-32 border-l border-slate-200 bg-transparent px-2 text-sm text-slate-600 outline-none md:block"
            >
              <option value="">{t("category")}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select
              name="province"
              aria-label={t("province")}
              className="hidden h-10 w-30 border-l border-slate-200 bg-transparent px-2 text-sm text-slate-600 outline-none md:block"
            >
              <option value="">{t("province")}</option>
              {DRC_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              name="tier"
              aria-label={t("supplierType")}
              className="hidden h-10 w-32 border-l border-slate-200 bg-transparent px-2 text-sm text-slate-600 outline-none lg:block"
            >
              <option value="">{t("supplierType")}</option>
              {SUPPLIER_TIERS.map((tier) => (
                <option key={tier} value={tier}>{t(`tiers.${tier}`)}</option>
              ))}
            </select>
            <button
              type="submit"
              className="m-1 inline-flex items-center gap-2 rounded-md bg-market-red px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark"
            >
              <Search className="h-4 w-4" aria-hidden />
              {t("searchBtn")}
            </button>
          </form>

          {/* Hero quick CTAs */}
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-md bg-market-red px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              {t("browseProducts")}
            </Link>
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 rounded-md border border-market-gold bg-market-navy/60 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-navy-deep"
            >
              <Users className="h-4 w-4 text-market-gold" aria-hidden />
              {t("findSuppliers")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
