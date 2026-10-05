"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toExternalHref } from "@/lib/url/external-href";
import { ProfileCard } from "./profile-card";
import type { ProfileMedia } from "./types";

interface ProfileGalleryProps {
  companyName: string;
  media: ProfileMedia[];
  locale: string;
}

/**
 * The photos, brochures and videos the company added in its dashboard
 * (`company_media`). Photos open in a viewer with previous / next; brochures
 * and videos are plain outbound links. Renders nothing when there is no media.
 */
export function ProfileGallery({ companyName, media, locale }: ProfileGalleryProps) {
  const t = useTranslations("CompanyProfile.page.gallery");
  const [open, setOpen] = useState<number | null>(null);

  const photos = media.filter((m) => m.kind === "gallery");
  const links = media
    .filter((m) => m.kind !== "gallery")
    .map((m, index, all) => ({
      id: m.id,
      kind: m.kind,
      href: toExternalHref(m.url),
      // The owner's own title when there is one, otherwise "Brochure 2".
      label:
        (locale === "fr" ? m.title_fr : m.title_en) ??
        m.title_en ??
        m.title_fr ??
        t(m.kind === "brochure" ? "brochure" : "video", { index: all.slice(0, index + 1).filter((x) => x.kind === m.kind).length }),
    }))
    .filter((link): link is typeof link & { href: string } => Boolean(link.href));

  const count = photos.length;
  const step = (delta: number) => setOpen((current) => (current === null ? current : (current + delta + count) % count));

  useEffect(() => {
    if (open === null || count < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setOpen((current) => (current === null ? current : (current - 1 + count) % count));
      if (event.key === "ArrowRight") setOpen((current) => (current === null ? current : (current + 1) % count));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  if (count === 0 && links.length === 0) return null;
  const current = open === null ? null : photos[open];

  return (
    <ProfileCard id="gallery" title={t("title")}>
      {count > 0 && (
        <ul className={cn("grid gap-2", count === 1 ? "grid-cols-1" : count === 2 || count === 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
          {photos.map((photo, index) => (
            <li key={photo.id} className={cn(count >= 3 && index === 0 && "col-span-2 row-span-2")}>
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={t("open", { index: index + 1 })}
                className={cn(
                  "group block h-full w-full overflow-hidden rounded-xl bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-market-navy focus-visible:ring-offset-2",
                  count === 1 ? "aspect-[16/9]" : "aspect-[4/3]"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- owner-uploaded photo on Supabase storage */}
                <img
                  src={photo.url}
                  alt={t("photoAlt", { name: companyName, index: index + 1 })}
                  loading="lazy"
                  className="h-full w-full object-cover transition-opacity duration-150 group-hover:opacity-90"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {links.length > 0 && (
        <div className={cn(count > 0 && "mt-4 border-t border-slate-100 pt-4")}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t("documents")}</p>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-[13px] font-medium text-market-navy transition-colors hover:bg-slate-100"
                >
                  {link.kind === "brochure" ? (
                    <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                  ) : (
                    <PlayCircle className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-w-4xl gap-3 border-0 bg-market-navy-deep p-3 text-white sm:max-w-4xl">
          <DialogTitle className="sr-only">{t("viewer")}</DialogTitle>
          <DialogDescription className="sr-only">{companyName}</DialogDescription>
          {current && open !== null && (
            <>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- owner-uploaded photo on Supabase storage */}
                <img
                  src={current.url}
                  alt={t("photoAlt", { name: companyName, index: open + 1 })}
                  className="max-h-[75vh] w-full rounded-lg object-contain"
                />
                {count > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label={t("previous")}
                      className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-market-navy transition-colors hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label={t("next")}
                      className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-market-navy transition-colors hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </button>
                  </>
                )}
              </div>
              <p className="text-center text-xs text-white/70" aria-live="polite">
                {t("counter", { index: open + 1, total: count })}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ProfileCard>
  );
}
