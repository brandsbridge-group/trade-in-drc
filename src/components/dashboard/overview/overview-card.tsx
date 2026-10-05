import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  id: string;
  title: string;
  subtitle?: string;
  /** Right-aligned header content (summary pills, a link…). */
  aside?: ReactNode;
  footerLink?: { href: string; label: string };
  className?: string;
  children: ReactNode;
}

/** Shared shell for the dashboard-home result cards. */
export function OverviewCard({ id, title, subtitle, aside, footerLink, className, children }: OverviewCardProps) {
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200/70", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id={id} className="font-display text-base font-semibold text-market-navy">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      <div className="flex-1">{children}</div>
      {footerLink && (
        <Link href={footerLink.href} className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline">
          {footerLink.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </section>
  );
}

export function EmptyHint({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl bg-slate-50 px-4 py-5 text-xs text-slate-500">
      <p>{text}</p>
      {cta && (
        <Link href={cta.href} className="font-semibold text-primary hover:underline">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
      <div className="h-4 w-40 rounded bg-slate-100" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
