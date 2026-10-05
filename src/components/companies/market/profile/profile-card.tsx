import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  id?: string;
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Shared white card used by every section of the public company page. Keeps
 * the radius, ring and padding in one place so the page reads as one uniform
 * set of cards on the light canvas.
 */
export function ProfileCard({ id, title, action, className, children }: ProfileCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="font-display text-lg font-semibold text-market-navy">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
