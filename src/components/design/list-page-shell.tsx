import { ReactNode } from "react";

interface ListPageShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function ListPageShell({ sidebar, children }: ListPageShellProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="grid md:grid-cols-[260px_1fr] gap-4">
        <aside className="hidden md:block">
          <div className="rounded-2xl border border-slate-200 bg-card p-3">
            {sidebar}
          </div>
        </aside>
        <main className="min-w-0">
          <div className="rounded-2xl border border-slate-200 bg-card p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
