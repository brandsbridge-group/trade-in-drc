"use client";

import * as React from "react";

type SkeletonImageProps = {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  loading?: "eager" | "lazy";
  sizes?: string;
};

/**
 * <img> wrapped in a pulsing slate-100 placeholder. The placeholder shows while
 * the bitmap is loading, then the image fades in over 250 ms once `onLoad` fires.
 *
 * The wrapper must size itself (e.g. `aspect-square` or fixed `h-*`) — this
 * component does NOT impose a size of its own.
 *
 * Cache-served images may fire `onLoad` synchronously before our React listener
 * attaches, so we also check `img.complete` on mount.
 */
export function SkeletonImage({
  src,
  alt,
  className,
  wrapperClassName,
  loading = "lazy",
  sizes,
}: SkeletonImageProps) {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [src]);

  return (
    <div
      className={[
        // Visible neutral placeholder (reads clearly as "loading" on a white
        // page, unlike near-white slate-100). Gentle pulse only while loading;
        // prefers-reduced-motion users get a static placeholder (globals.css).
        "relative overflow-hidden bg-slate-200",
        loaded ? "" : "animate-pulse",
        wrapperClassName ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={[
          // Calm fade-in once the bitmap is ready — graceful, not flashy.
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
