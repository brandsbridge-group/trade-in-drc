import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { MESSAGING_ENABLED } from "@/config/features";

/**
 * The inbox and its threads exist only while direct messaging is switched on
 * (`src/config/features.ts`). Off, an old link or a typed address lands on the
 * dashboard home instead of a screen the menu no longer shows.
 */
export default async function InboxLayout({ children }: { children: ReactNode }) {
  if (!MESSAGING_ENABLED) {
    redirect({ href: "/dashboard", locale: await getLocale() });
  }
  return children;
}
