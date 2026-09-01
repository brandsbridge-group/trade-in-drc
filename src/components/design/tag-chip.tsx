import { cn } from "@/lib/utils";

export function TagChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-[11px] rounded-full border border-slate-200 bg-white text-slate-700", className)}>
      {children}
    </span>
  );
}
