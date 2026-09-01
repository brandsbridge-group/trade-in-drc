import Image from "next/image";

/**
 * Explore-by-Sector hero (customer design 9): full-bleed Kinshasa skyline photo
 * under a left-weighted navy overlay, with a white heading + intro copy on the
 * left. Static presentation — text is passed in already localized.
 */
export function SectorHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      <Image
        src="/images/directory/skyline.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />
      {/* Left-weighted navy overlay so the heading stays legible over the photo. */}
      <div className="absolute inset-0 bg-gradient-to-r from-market-navy via-market-navy/85 to-market-navy/20" />

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col justify-center px-4 py-12 md:px-6 md:py-14">
        <h1 className="max-w-2xl font-display text-2xl font-bold tracking-tight md:text-[2rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">{subtitle}</p>
      </div>
    </section>
  );
}
