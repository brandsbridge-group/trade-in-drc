import type { ReactNode } from "react";
import { ContentTabsNav } from "./content-tabs-nav";

export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <ContentTabsNav />
      {children}
    </div>
  );
}
