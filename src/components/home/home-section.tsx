import { cn } from "@/lib/utils";

/**
 * Boxed layout for every homepage section below the hero: one centred
 * container (max-w-6xl) so the sections share a single, restrained rhythm.
 * `panel` wraps the content in a white rounded surface for sections that need
 * to stand apart, instead of a full-width colour band.
 */
export function HomeSection({
  id,
  panel = false,
  className,
  children,
}: {
  id?: string;
  panel?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-8 sm:py-10", className)}>
      <div className="mx-auto max-w-6xl px-4">
        {panel ? (
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-8">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/** Compact section heading: gold eyebrow, title, optional lead and action. */
export function HomeSectionHeader({
  eyebrow,
  title,
  lead,
  action,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-market-or-dark">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-landing-navy)] sm:text-[1.75rem]">
          {title}
        </h2>
        {lead && <p className="mt-2 max-w-2xl text-sm text-slate-500">{lead}</p>}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}
