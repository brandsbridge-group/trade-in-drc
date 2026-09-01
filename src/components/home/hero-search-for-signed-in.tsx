"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/auth-provider";
import { HomeSearchPanel } from "./home-search-panel";
import { SignedInQuickActions } from "./signed-in-quick-actions";

/**
 * For signed-in users, surfaces the functional search panel + quick actions
 * directly inside the hero (customer note 1: for signed-in users the home page is
 * the application's main page, not a landing page). Renders a filled white
 * "app-home" card sitting on the navy hero. Returns null while the session is
 * loading or when signed out — anonymous visitors keep the marketing hero and get
 * the search in the band below (see HomeSearchBand).
 */
export function HeroSearchForSignedIn() {
  const { user, loading } = useAuth();
  const t = useTranslations("HomeSearch");

  if (loading || !user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-2 sm:pb-16">
      <div className="rounded-2xl border border-white/15 bg-white p-5 shadow-2xl sm:p-7">
        <SignedInQuickActions />
        <div className="mt-6 border-t border-border pt-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("title")}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-4">
            <HomeSearchPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
