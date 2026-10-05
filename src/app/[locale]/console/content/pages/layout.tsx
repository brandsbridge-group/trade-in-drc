import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PagesTabsNav } from "./pages-tabs-nav";

export default async function PagesCmsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <div className="space-y-4">
      <PagesTabsNav />
      {children}
    </div>
  );
}
