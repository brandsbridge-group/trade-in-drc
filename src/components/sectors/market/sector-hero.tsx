import Image from "next/image";

/**
 * Explore-by-Sector hero (customer design 9): full-bleed Kinshasa skyline photo
 * under a left-weighted navy overlay, with a white heading + intro copy on the
 * left. Static presentation — text is passed in already localized.
 */
export function SectorHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="bg-white px-4 pb-5 pt-3 md:px-6">
      <div className="mx-auto grid w-full max-w-[1500px] overflow-hidden border border-slate-200 bg-market-navy text-white md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center px-5 py-8 sm:px-8 md:px-10 md:py-10">
          <span aria-hidden className="mb-5 h-1 w-12 bg-market-gold" />
          <h1 className="max-w-2xl font-display text-2xl font-bold leading-tight md:text-[2rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">{subtitle}</p>
        </div>

        <div className="relative min-h-[190px] md:min-h-[300px]">
          <Image
            src="/images/directory/skyline.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover object-right"
          />
          <div aria-hidden className="absolute inset-0 bg-market-navy/10" />
        </div>
      </div>
    </section>
  );
}
