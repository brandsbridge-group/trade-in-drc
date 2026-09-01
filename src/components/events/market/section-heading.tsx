/** Section heading with a gold accent bar (design 13). */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="h-6 w-1.5 rounded-full bg-market-gold" aria-hidden />
      <h2 className="font-display text-xl font-bold text-market-navy md:text-2xl">{children}</h2>
    </div>
  );
}
