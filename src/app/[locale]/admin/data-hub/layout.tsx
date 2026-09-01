import type { ReactNode } from "react";
import { DataHubTabsNav } from "./data-hub-tabs-nav";

export default function DataHubAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <DataHubTabsNav />
      {children}
    </div>
  );
}
