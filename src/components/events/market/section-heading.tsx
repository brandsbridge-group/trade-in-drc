/** Section heading with a gold accent bar (design 13). */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-8 w-1 rounded-full bg-market-red" aria-hidden />
      <h2 className="font-display text-xl font-bold leading-tight text-market-navy md:text-2xl">{children}</h2>
    </div>
  );
}
