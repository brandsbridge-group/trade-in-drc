"use client";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface BrandLogo {
  id: string;
  name: string;
  logo_url?: string | null;
}

export function BrandLogoCarousel({ logos }: { logos: BrandLogo[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const t = useTranslations("Design");
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  if (!logos.length) return null;
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("previous")}
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full border border-slate-200 bg-card"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-8 no-scrollbar"
      >
        {logos.map((l) => (
          <motion.div
            key={l.id}
            whileHover={reduce ? undefined : { scale: 1.04 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0.2 }}
            className="snap-start shrink-0 w-32 h-16 flex items-center justify-center grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition"
          >
            {l.logo_url ? (
              <img src={l.logo_url} alt={l.name} className="max-h-12 max-w-full object-contain" />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">{l.name}</span>
            )}
          </motion.div>
        ))}
      </div>
      <button
        type="button"
        aria-label={t("next")}
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full border border-slate-200 bg-card"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
