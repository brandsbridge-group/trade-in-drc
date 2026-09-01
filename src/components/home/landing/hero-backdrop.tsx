import Image from "next/image";
import { BLUR } from "./blur-data";

/**
 * Full-bleed animated composite backdrop for the hero zone (hero copy + panel +
 * feature cards). Absolutely fills its positioned parent. Two overlays:
 * left-dark for copy legibility, bottom-dark so the white feature cards sit on a
 * near-solid navy band (Congo reference vibe). Reduced-motion → static poster.
 */
export function HeroBackdrop() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/landing/hero-bg.webp"
        className="hidden h-full w-full object-cover motion-safe:block"
      >
        <source src="/videos/landing/hero-bg-loop.webm" type="video/webm" />
        <source src="/videos/landing/hero-bg-loop.mp4" type="video/mp4" />
      </video>
      <Image
        src="/images/landing/hero-bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={BLUR.heroBg}
        className="object-cover motion-safe:hidden"
      />
      {/* left-dark scrim for headline legibility */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,28,68,0.94)_0%,rgba(14,28,68,0.78)_42%,rgba(14,28,68,0.46)_72%,rgba(14,28,68,0.30)_100%)]" />
      {/* bottom-dark band so the white feature cards pop on near-solid navy */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,28,68,0.05)_0%,rgba(14,28,68,0.30)_52%,rgba(14,28,68,0.94)_100%)]" />
    </div>
  );
}
