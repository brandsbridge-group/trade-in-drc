import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { normalizeReference } from "@/lib/requests/tracking";
import { TrackRequestForm } from "@/components/requests/market/track-request-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RequestTracking" });
  // A page about one visitor's request: nothing for a search engine to list.
  return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * /request/track — "Follow my request". Works for every request that got a
 * reference (partner request, quote request…): the visitor gives the reference
 * and the e-mail address used, no account needed.
 */
export default async function TrackRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const { locale } = await params;
  const { ref } = await searchParams;
  const t = await getTranslations({ locale, namespace: "RequestTracking" });
  const tPartner = await getTranslations({ locale, namespace: "FindPartner" });
  const initialReference = normalizeReference(Array.isArray(ref) ? ref[0] ?? "" : ref ?? "") ?? "";

  return (
    <main className="bg-slate-100">
      <section className="bg-market-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
            <Link href="/" className="text-white/60 transition-colors hover:text-white">{tPartner("breadcrumb.home")}</Link>
            <ChevronRight className="h-3 w-3 text-white/40" aria-hidden />
            <Link href="/request" className="text-white/60 transition-colors hover:text-white">{tPartner("breadcrumb.current")}</Link>
            <ChevronRight className="h-3 w-3 text-white/40" aria-hidden />
            <span className="text-white/85">{t("title")}</span>
          </nav>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-[36px]">{t("title")}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/75">{t("subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-8 md:py-10">
        <TrackRequestForm initialReference={initialReference} />
      </section>
    </main>
  );
}
