"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const HERO_IMAGE = "/images/register/hero-businessman.jpg";

interface ValueProp {
  title: string;
  body: string;
}

/**
 * Design 6 hero: navy photographic band (businessman + DRC flag on the right,
 * navy overlay fading left) with H1, subtitle and 3 circle-bullet value props.
 */
export function RegisterHero() {
  const t = useTranslations("RegisterCompany");
  const valueProps = t.raw("hero.valueProps") as ValueProp[];

  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      {/* Photo right ~46%, masked so the left text zone stays dark navy. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[46%] [mask-image:linear-gradient(to_left,black_60%,transparent)]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="46vw"
        />
        <div className="absolute inset-0 bg-market-navy/30" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-14 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-[2.35rem]">
            {t("hero.title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
            {t("hero.subtitle")}
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-3">
            {valueProps.map((vp) => (
              <li key={vp.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 inline-block size-5 shrink-0 rounded-full border-2 border-market-gold"
                />
                <span>
                  <span className="block text-sm font-semibold">{vp.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/75">
                    {vp.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
