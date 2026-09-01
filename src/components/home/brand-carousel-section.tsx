import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BrandLogoCarousel } from "@/components/design";
import { MotionEnter } from "@/components/home/motion-enter";

export async function BrandCarouselSection() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("companies")
    .select("id, name, logo_url")
    .eq("verified", true)
    .eq("is_premium", true)
    .not("logo_url", "is", null)
    .order("name")
    .limit(20);

  const logos = (data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    logo_url: c.logo_url as string | null,
  }));

  if (!logos.length) return null;

  return (
    <MotionEnter>
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-card p-5">
          <BrandLogoCarousel logos={logos} />
        </div>
      </section>
    </MotionEnter>
  );
}
