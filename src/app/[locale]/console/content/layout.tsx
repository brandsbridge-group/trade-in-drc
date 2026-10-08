import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth/require-admin";
import { ContentTabsNav } from "./content-tabs-nav";

export default async function ContentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // The newsletter tab leads to a super-admin section: moderators do not get it.
  const { isSuperAdmin } = await requireStaff(locale);

  return (
    <div className="space-y-4">
      <ContentTabsNav showNewsletter={isSuperAdmin} />
      {children}
    </div>
  );
}
