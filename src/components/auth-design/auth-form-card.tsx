import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthFormCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="bg-card border border-slate-200 rounded-2xl p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
      {footer && <div className="text-xs text-muted-foreground border-t pt-3">{footer}</div>}
    </div>
  );
}
