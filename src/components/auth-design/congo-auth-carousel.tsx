"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

const SLIDES = [
  { src: "/images/hero-official.jpg", altKey: "slideAlt.portal" },
  { src: "/images/kinshasa-skyline.jpg", altKey: "slideAlt.skyline" },
  { src: "/images/banners/sectors-banner.png", altKey: "slideAlt.sectors" },
  { src: "/images/banners/opportunities-banner.png", altKey: "slideAlt.opportunities" },
  { src: "/images/banners/events-banner.png", altKey: "slideAlt.events" },
  { src: "/images/banners/news-banner.png", altKey: "slideAlt.news" },
  { src: "/images/banners/contact-banner.png", altKey: "slideAlt.contact" },
] as const;

const ROTATE_MS = 6000;

type CongoAuthCarouselProps = {
  title: string;
  tagline: string;
  checks: string[];
  copyrightLabel: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function CongoAuthCarousel({ title, tagline, checks, copyrightLabel }: CongoAuthCarouselProps) {
  const t = useTranslations("AuthDesign.carousel");
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const reduceMotion = useReducedMotion();

  // Restart the timer whenever the slide changes (manual pick included) so the
  // progress bar and the actual rotation always stay in sync.
  React.useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, reduceMotion]);

  const current = SLIDES[index];

  return (
    <div
      className="relative hidden overflow-hidden bg-[#0B1B33] text-white md:block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides — crossfade + a slight settle-in scale. 900 ms exceeds the
          500 ms marketing cap on purpose: a full-bleed photo swap reads as a
          jump cut when faster (MOTION.md §1 "longer needs a comment"). */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={current.src}
          className="absolute inset-0"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={current.src}
            alt={t(current.altKey)}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 0vw, 50vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Layered scrims: navy wash for legibility, deep bottom vignette for the
          checklist, faint gold glow for warmth. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1B33]/75 via-[#0B1B33]/35 to-[#0B1B33]/95" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(217,164,65,0.18),transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" aria-hidden />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, translateY: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", duration: 0.45, bounce: 0 }}
          className="max-w-lg"
        >
          <span className="mb-6 block h-px w-12 bg-gradient-to-r from-[#E7C173] to-[#C8941F]" aria-hidden />
          <p className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-balance lg:text-[2.5rem]">
            {title}
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">{tagline}</p>
        </motion.div>

        <div className="space-y-8">
          <motion.ul
            initial={reduceMotion ? false : { opacity: 0, translateY: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", duration: 0.45, bounce: 0, delay: reduceMotion ? 0 : 0.08 }}
            className="max-w-md space-y-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md"
          >
            {checks.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-snug text-white/90">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D9A441]/15 ring-1 ring-[#D9A441]/40">
                  <Check className="h-3 w-3 text-[#E7C173]" strokeWidth={3} />
                </span>
                <span>{c}</span>
              </li>
            ))}
          </motion.ul>

          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="font-display text-xs tabular-nums tracking-[0.2em] text-white/50">
                <span className="text-white">{pad(index + 1)}</span> / {pad(SLIDES.length)}
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={current.altKey}
                  initial={reduceMotion ? false : { opacity: 0, translateY: 4 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, translateY: -4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1.5 truncate text-xs text-white/60"
                >
                  {t(current.altKey)}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center gap-1.5" role="tablist" aria-label={t("indicatorsLabel")}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t("showSlide", { number: i + 1 })}
                  aria-selected={i === index}
                  role="tab"
                  onClick={() => setIndex(i)}
                  className="group relative flex h-6 items-center"
                >
                  <span
                    className={`relative block h-[3px] overflow-hidden rounded-full bg-white/20 transition-[width,background-color] duration-200 ease-out group-hover:bg-white/40 ${
                      i === index ? "w-10" : "w-4"
                    }`}
                  >
                    {i === index && (
                      // Progress fill mirrors ROTATE_MS (6 s, linear) — it's a
                      // timer readout, not a UI transition, so the cap doesn't apply.
                      <motion.span
                        key={`${index}-${paused}`}
                        className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#E7C173] to-[#D9A441]"
                        initial={{ scaleX: reduceMotion || paused ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: reduceMotion || paused ? 0 : ROTATE_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] tracking-wide text-white/40">
            © {new Date().getFullYear()} {copyrightLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
