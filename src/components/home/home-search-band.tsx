"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/auth-provider";
import { HomeSearchPanel } from "./home-search-panel";

/**
 * Search-forward band for ANONYMOUS visitors (customer note 1: the search surface
 * is available to everyone). Signed-in users get the search inside the hero
 * (HeroSearchForSignedIn) instead, so this hides once a signed-in session
 * resolves. We intentionally do NOT gate on `loading`: anonymous visitors are the
 * common case, so the band stays visible during the brief auth check rather than
 * flashing empty space, and only collapses if a user turns out to be signed in.
 */
export function HomeSearchBand() {
  const { user } = useAuth();
  const t = useTranslations("HomeSearch");

  if (user) return null;

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
        <div className="mt-5">
          <HomeSearchPanel />
        </div>
      </div>
    </section>
  );
}
