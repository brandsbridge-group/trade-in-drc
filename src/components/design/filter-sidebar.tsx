"use client";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterSidebar({ children }: { children: ReactNode }) {
  return <aside className="space-y-4 text-sm">{children}</aside>;
}

interface FilterGroupProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FilterGroup({ label, defaultOpen = true, children }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  return (
    <section className="border-b pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn("w-3 h-3 transition", open ? "rotate-180" : "")}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface FilterItemProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

export function FilterItem({ label, count, active, onClick, href }: FilterItemProps) {
  const className = cn(
    "flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-muted",
    active && "bg-muted font-medium"
  );
  const inner = (
    <>
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground">{count}</span>}
    </>
  );
  if (href) return <a href={href} className={className}>{inner}</a>;
  return (
    <button type="button" onClick={onClick} className={className + " w-full text-left"}>
      {inner}
    </button>
  );
}
