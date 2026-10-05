import { getTranslations } from "next-intl/server";
import { ArrowRight, Megaphone } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CATEGORY_DISPLAY, NOTICE_CATEGORIES } from "@/lib/opportunities/board-config";
import { listOpenNotices } from "@/lib/opportunities/queries";
import { MotionEnter } from "@/components/home/motion-enter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section";
import { isSignedIn, loadOpenDemands } from "@/components/marketplace/landing/market-demands";
import { HomeDemandsBoard, type NoticeItem } from "./home-demands-board";

const ROWS = 4;
const DAY_MS = 86_400_000;

async function loadNotices(locale: string): Promise<{ items: NoticeItem[]; total: number }> {
  const supabase = await createServerSupabaseClient();
  const tBadge = await getTranslations({ locale, namespace: "Opportunities.badges" });
  const { data, countsByCategory } = await listOpenNotices(supabase, {
    categories: NOTICE_CATEGORIES,
    countCategories: NOTICE_CATEGORIES,
    limit: ROWS,
  });
  const now = Date.now();
  // Formatted here (fixed zone) so server and client render the same string.
  const money = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

  const items = data.map((o) => {
    const amount = o.budget_max ?? o.budget_min;
    return {
      id: o.id,
      href: `/opportunities/${o.category}/${o.slug}`,
      title: pickLocalized(o, "title", locale as Locale),
      category: tBadge(CATEGORY_DISPLAY[o.category].labelKey),
      issuer: o.company?.name ?? null,
      location: o.region,
      budget: amount ? `${money.format(amount)} ${o.budget_currency ?? "USD"}` : null,
      closesInDays: o.deadline_at
        ? Math.max(0, Math.ceil((new Date(o.deadline_at).getTime() - now) / DAY_MS))
        : null,
    };
  });
  const total = NOTICE_CATEGORIES.reduce((sum, c) => sum + (countsByCategory[c] ?? 0), 0);
  return { items, total };
}

/**
 * Homepage section 4 — "Buyers are looking, right now": open purchase
 * requests and open tenders / projects in one compact table with two tabs,
 * then a navy "publish a need" band.
 */
export async function HomeDemands({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "HomeDemands" });
  const [demands, notices, signedIn] = await Promise.all([
    loadOpenDemands(locale),
    loadNotices(locale),
    isSignedIn(),
  ]);

  return (
    <HomeSection id="demands">
      <MotionEnter>
        <HomeSectionHeader eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      </MotionEnter>

      <HomeDemandsBoard
        demands={demands.slice(0, ROWS)}
        demandsTotal={demands.length}
        notices={notices.items}
        noticesTotal={notices.total}
        signedIn={signedIn}
      />

      <MotionEnter>
        <div className="mt-6 flex flex-col gap-4 rounded-[1.25rem] bg-market-navy px-5 py-5 text-white sm:px-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-market-or/15 text-market-or">
              <Megaphone className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-base font-bold">{t("cta.title")}</p>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-white/60">{t("cta.body")}</p>
            </div>
          </div>
          <div className="flex flex-none flex-wrap gap-2">
            <Link
              href="/services"
              className="inline-flex items-center rounded-full px-4 py-2 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors duration-150 ease-out hover:bg-white/10"
            >
              {t("cta.secondary")}
            </Link>
            <Link
              href="/request"
              className="group inline-flex items-center gap-1.5 rounded-full bg-market-or px-4 py-2 text-[13px] font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-light"
            >
              {t("cta.primary")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </MotionEnter>
    </HomeSection>
  );
}
