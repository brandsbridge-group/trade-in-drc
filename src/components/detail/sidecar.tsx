import { ReactNode } from "react";

export function Sidecar({ children }: { children: ReactNode }) {
  return (
    <aside className="md:sticky md:top-4 border border-slate-200 rounded-2xl p-4 bg-card text-sm space-y-3 h-fit">
      {children}
    </aside>
  );
}
