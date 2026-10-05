"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { SkeletonImage } from "@/components/design";

/** Main image + thumbnail strip, carried over from the previous product page. */
export function OfferGallery({ images, name }: { images: string[]; name: string }) {
  const t = useTranslations("OfferDetail");
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <SkeletonImage
        src={images[index]}
        alt={name}
        loading="eager"
        wrapperClassName="aspect-[4/3] rounded-lg bg-slate-50"
        className="object-contain"
      />
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("showImage", { n: i + 1 })}
              aria-pressed={i === index}
              className={`h-12 w-12 flex-none overflow-hidden rounded-md border-2 transition-colors duration-150 ease-out ${
                i === index ? "border-primary" : "border-transparent hover:border-slate-300"
              }`}
            >
              <SkeletonImage src={src} alt="" wrapperClassName="h-full w-full" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
