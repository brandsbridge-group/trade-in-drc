"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface CarouselSlideView {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
}

const AUTO_ADVANCE_MS = 6000;

/**
 * Client-side rotator for the admin-curated homepage carousel. Crossfade between
 * slides (marketing surface; ≤500 ms per MOTION.md), auto-advance that fully
 * stops under prefers-reduced-motion, and manual prev/next + dot controls.
 */
export function HomeCarouselClient({
  slides,
  previousLabel,
  nextLabel,
  goToLabel,
}: {
  slides: CarouselSlideView[];
  previousLabel: string;
  nextLabel: string;
  goToLabel: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);

  const count = slides.length;
  const go = React.useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Auto-advance only when motion is allowed and there is more than one slide.
  React.useEffect(() => {
    if (reduce || count <= 1) return;
    const timer = window.setInterval(
      () => setIndex((prev) => (prev + 1) % count),
      AUTO_ADVANCE_MS
    );
    return () => window.clearInterval(timer);
  }, [reduce, count]);

  const slide = slides[index];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900">
        <div className="relative aspect-[21/9] w-full sm:aspect-[3/1]">
          <AnimatePresence mode="sync">
            <motion.div
              key={slide.id}
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/45 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-xl px-6 sm:px-10">
                  <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.ctaLabel && slide.ctaHref && (
                    <Link
                      href={slide.ctaHref}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition-transform duration-150 ease-out hover:-translate-y-0.5"
                    >
                      {slide.ctaLabel}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label={previousLabel}
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition-colors duration-150 ease-out hover:bg-white/25"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={nextLabel}
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition-colors duration-150 ease-out hover:bg-white/25"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`${goToLabel} ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => go(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-150 ease-out",
                    i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
