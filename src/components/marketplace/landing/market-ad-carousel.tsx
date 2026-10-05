"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Pause, Play } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface AdSlide {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  /** Paid/admin slide vs. Trade in DRC's own house slide — labelled differently. */
  sponsored: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Marketplace hero ad carousel — a landscape "deck": the active slide in
 * front, the next two peeking behind it. Everything lives inside the frame so
 * the photo stays the hero: story-style progress segments + counter + pause
 * along the top, the caption straight on a bottom-third gradient (no panel).
 *
 * Motion (MOTION.md §2.8): photo crossfade + 1.04 → 1 settle over 900 ms;
 * the caption follows with a short §2.2 enter (≤ 350 ms). The active
 * segment's linear fill IS the rotation timer (CSS `ad-progress`, advancing
 * on animationend), so hover / focus / the pause button simply freeze it.
 * Reduced motion: no autoplay, no scale, no fill, instant caption.
 */
export function MarketAdCarousel({ slides }: { slides: AdSlide[] }) {
  const t = useTranslations("MarketLanding.carousel");
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const count = slides.length;
  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);
  const autoplay = !reduce && count > 1;
  const paused = userPaused || hovered || focused;
  const slide = slides[index];
  // The (up to) two slides waiting behind the active one, furthest first.
  const behind = [2, 1]
    .filter((offset) => offset < count)
    .map((offset) => ({ offset, s: slides[(index + offset) % count] }));

  return (
    <section
      aria-roledescription={t("roledescription")}
      aria-label={t("label")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className="relative pt-7"
    >
      {/* Deck: cards waiting behind. origin-top so the scaled-down ones stick out above. */}
      {behind.map(({ offset, s }) => (
        <div
          key={`${s.id}-behind`}
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-7 aspect-[16/11] origin-top overflow-hidden rounded-3xl ring-1 ring-white/10 transition-transform duration-300 ease-out",
            offset === 2
              ? "-translate-y-7 scale-[0.88] opacity-40"
              : "-translate-y-3.5 scale-[0.94] opacity-70",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-market-navy/60" />
        </div>
      ))}

      <div className="relative aspect-[16/11] overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-black/50 ring-1 ring-white/15">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={slide.id}
            role="group"
            aria-roledescription={t("slide")}
            aria-label={t("position", { n: index + 1, total: count })}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.9, ease: EASE }}
          >
            {/* Admin slides point at arbitrary hosts, so a plain img (as HomeCarousel). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
            {/* Shade only the top strip (controls) and the bottom third (caption). */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Top: story-style segments (timer + navigation), then label, counter, pause. */}
        <div className="absolute inset-x-0 top-0 px-4 pt-3">
          {count > 1 && (
            <div className="flex gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t("goTo", { n: i + 1 })}
                  aria-current={i === index}
                  // py-2 widens the hit area around the 3 px bar.
                  className="group/seg flex-1 py-2"
                >
                  <span className="relative block h-[3px] overflow-hidden rounded-full bg-white/30 transition-colors duration-150 ease-out group-hover/seg:bg-white/50">
                    {i < index && <span className="absolute inset-0 rounded-full bg-white/90" />}
                    {i === index && (
                      <span
                        key={`${s.id}-${index}`}
                        onAnimationEnd={() => go(index + 1)}
                        className={cn(
                          "absolute inset-0 origin-left rounded-full bg-market-or",
                          // 6.5 s per slide: this fill is the rotation timer.
                          autoplay ? "animate-[ad-progress_6500ms_linear_forwards]" : "scale-x-100",
                          autoplay && paused && "[animation-play-state:paused]",
                        )}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 backdrop-blur-md",
                slide.sponsored
                  ? "bg-market-or/20 text-market-or-light ring-market-or/40"
                  : "bg-black/25 text-white/90 ring-white/20",
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", slide.sponsored ? "bg-market-or" : "bg-white/80")}
                aria-hidden
              />
              {slide.sponsored ? t("sponsored") : t("house")}
            </span>

            {count > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] font-semibold tabular-nums text-white">
                  {pad(index + 1)}
                  <span className="text-white/50"> / {pad(count)}</span>
                </span>
                {autoplay && (
                  <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    aria-label={userPaused ? t("play") : t("pause")}
                    className="grid h-7 w-7 place-items-center rounded-full bg-black/25 text-white ring-1 ring-white/20 backdrop-blur-md transition-colors duration-150 ease-out hover:bg-black/40"
                  >
                    {userPaused ? <Play className="h-3 w-3" aria-hidden /> : <Pause className="h-3 w-3" aria-hidden />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: caption straight on the gradient — no panel over the photo. */}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={slide.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 4, transition: { duration: 0.15 } }}
              transition={{ duration: reduce ? 0 : 0.35, ease: EASE, delay: reduce ? 0 : 0.15 }}
              className="flex items-end justify-between gap-4"
            >
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold leading-tight text-white drop-shadow-sm sm:text-xl">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="mt-1 line-clamp-2 max-w-sm text-[13px] leading-relaxed text-white/75">
                    {slide.subtitle}
                  </p>
                )}
              </div>
              {slide.ctaLabel && slide.ctaHref && (
                <Link
                  href={slide.ctaHref}
                  aria-label={slide.ctaLabel}
                  className="group/cta inline-flex flex-none items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[12px] font-bold text-slate-900 shadow-sm transition-colors duration-150 ease-out hover:bg-market-or"
                >
                  <span className="hidden sm:inline">{slide.ctaLabel}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover/cta:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
