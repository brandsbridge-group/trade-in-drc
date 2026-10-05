export function AuthPageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1 text-center">
      <h1 className="text-xl font-bold tracking-tight md:text-xl">{title}</h1>
      {subtitle && <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
