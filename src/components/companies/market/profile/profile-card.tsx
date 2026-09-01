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
 * Shared white bordered card used across every design-5 profile section. Keeps
 * the border/radius/shadow/padding tokens in one place so the dossier reads as
 * one uniform card grid on the light canvas.
 */
export function ProfileCard({ id, title, action, className, children }: ProfileCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-lg border border-market-navy/10 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 className="font-display text-base font-semibold text-market-navy">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
