import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({ icon, label, value, className }: { icon?: ReactNode; label?: string; value: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      {icon && <span aria-hidden>{icon}</span>}
      <span>{value}{label ? <span className="ml-1">{label}</span> : null}</span>
    </span>
  );
}
