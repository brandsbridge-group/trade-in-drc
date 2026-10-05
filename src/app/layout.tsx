import type { ReactNode } from "react";

/**
 * Pass-through root layout. The real document (<html>, fonts, providers) is
 * built by `[locale]/layout.tsx`; this file only exists because Next.js needs a
 * root layout for `not-found.tsx` next to it, which catches addresses that have
 * no valid language prefix (e.g. `/dashboard/products`).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
