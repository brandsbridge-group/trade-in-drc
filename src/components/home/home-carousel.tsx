import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HomeCarouselClient, type CarouselSlideView } from "./home-carousel-client";

/**
 * Admin-curated homepage hero carousel (cluster C4). Server component: reads
 * active `carousel_slides` (00016), resolves the localized title/subtitle/CTA,
 * and hands a plain view-model to the client rotator. Renders nothing when there
 * are no active slides, so it is safe to mount additively below the main hero.
 *
 * RLS exposes only active slides to the public, so an empty result simply means
 * "no carousel configured" and the section disappears.
 */
export async function HomeCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.carousel" });
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("carousel_slides")
    .select(
      "id, title_en, title_fr, subtitle_en, subtitle_fr, image_url, cta_label_en, cta_label_fr, cta_href, sort_order"
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const isFr = locale === "fr";
  const slides: CarouselSlideView[] = (data ?? []).map((s) => ({
    id: s.id,
    title: isFr ? s.title_fr : s.title_en,
    subtitle: (isFr ? s.subtitle_fr : s.subtitle_en) ?? null,
    imageUrl: s.image_url,
    ctaLabel: (isFr ? s.cta_label_fr : s.cta_label_en) ?? null,
    ctaHref: s.cta_href ?? null,
  }));

  if (slides.length === 0) return null;

  return (
    <HomeCarouselClient
      slides={slides}
      previousLabel={t("previous")}
      nextLabel={t("next")}
      goToLabel={t("goToSlide")}
    />
  );
}
