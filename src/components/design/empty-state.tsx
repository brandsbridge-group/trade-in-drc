import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="text-center py-10 rounded-2xl border border-slate-200 bg-slate-50/50">
      {icon && <div className="inline-flex items-center justify-center mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
