import { ReactNode } from "react";

interface MetaItem {
  label?: string;
  value: ReactNode;
}

export function PageMeta({ items }: { items: MetaItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={i}>
          {it.label && <span className="mr-1">{it.label}:</span>}
          <span className="text-foreground">{it.value}</span>
        </span>
      ))}
    </div>
  );
}
