import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Console page title, in the dashboard's visual language (display font, navy, no rule underneath). */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
      <div className="min-w-0">
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
