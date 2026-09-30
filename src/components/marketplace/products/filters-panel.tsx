"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Body of the rounded filters card: a fixed heading row, then the facets in
 * their own scroll area (slim scrollbar, `scrollbar-slim` in globals.css) so
 * the heading never scrolls away. Below lg the facets fold behind the heading
 * (a disclosure) so offers aren't pushed a screen down; from lg up the panel
 * is always open and the toggle is inert.
 */
export function FiltersPanel({
  title,
  activeCount,
  clearSlot,
  children,
}: {
  title: string;
  activeCount: number;
  clearSlot?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <>
      <div
        className={cn(
          "flex flex-none items-center justify-between gap-3 px-4 py-3.5 lg:border-b lg:border-slate-100",
          open && "border-b border-slate-100",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex items-center gap-2 text-sm font-bold text-[var(--color-landing-navy)] lg:pointer-events-none"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {title}
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-market-or px-1.5 text-[10px] font-bold tabular-nums text-market-navy">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-150 ease-out lg:hidden",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {clearSlot}
      </div>
      <div
        id={bodyId}
        className={cn(
          "scrollbar-slim min-h-0 flex-1 px-4 py-4 lg:block lg:overflow-y-auto lg:overscroll-contain",
          open ? "block" : "hidden",
        )}
      >
        {children}
      </div>
    </>
  );
}
