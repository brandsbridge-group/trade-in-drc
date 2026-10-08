import type { ReactNode } from "react";
import { ContentTabsNav } from "../content/content-tabs-nav";

/**
 * The newsletter is reached from "Content" (tab between News and Events), so
 * its pages carry the same tab bar. Every page under here is super-admin only
 * (proxy + `requireSuperAdmin` in each action), hence the tab is always shown.
 */
export default function NewsletterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <ContentTabsNav showNewsletter />
      {children}
    </div>
  );
}
