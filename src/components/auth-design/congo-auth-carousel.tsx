"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const SLIDES = [
  { src: "/images/hero-official.jpg", altKey: "slideAlt.portal" },
  { src: "/images/kinshasa-skyline.jpg", altKey: "slideAlt.skyline" },
  { src: "/images/banners/sectors-banner.png", altKey: "slideAlt.sectors" },
  { src: "/images/banners/opportunities-banner.png", altKey: "slideAlt.opportunities" },
  { src: "/images/banners/events-banner.png", altKey: "slideAlt.events" },
  { src: "/images/banners/news-banner.png", altKey: "slideAlt.news" },
  { src: "/images/banners/contact-banner.png", altKey: "slideAlt.contact" },
] as const;

const ROTATE_MS = 5000;

type CongoAuthCarouselProps = {
  title: string;
  tagline: string;
  checks: string[];
  copyrightLabel: string;
};

export function CongoAuthCarousel({ title, tagline, checks, copyrightLabel }: CongoAuthCarouselProps) {
  const t = useTranslations("AuthDesign.carousel");
  const [index, setIndex] = React.useState(0);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const current = SLIDES[index];

  return (
    <div className="hidden md:block relative overflow-hidden bg-slate-900 text-white">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={current.src}
          className="absolute inset-0"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeInOut" }}
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

      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/30 to-slate-900/80" aria-hidden />

      <div className="relative z-10 flex h-full flex-col justify-between p-10">
        <div>
          <p className="text-2xl font-semibold leading-tight max-w-md">{title}</p>
          <p className="text-sm opacity-90 mt-3 max-w-sm">{tagline}</p>
        </div>

        <ul className="space-y-3">
          {checks.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-white/90" />
              <span className="opacity-95">{c}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between text-xs">
          <p className="opacity-70">© {new Date().getFullYear()} {copyrightLabel}</p>
          <div className="flex items-center gap-1.5" role="tablist" aria-label={t("indicatorsLabel")}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("showSlide", { number: i + 1 })}
                aria-selected={i === index}
                role="tab"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
