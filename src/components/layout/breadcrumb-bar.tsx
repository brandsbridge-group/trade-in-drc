import { Link } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Navy breadcrumb bar (customer designs 7/9) — a second row flush under the
 * global navbar. The last crumb is the current page (no link). Rendered at the
 * top of a page's content so it visually continues the navy navbar chrome.
 */
export function BreadcrumbBar({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-t border-white/10 bg-market-navy text-white">
      <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 px-4 py-2.5 text-xs md:px-6">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-market-gold" aria-hidden />}
              {c.href && !last ? (
                <Link href={c.href} className="text-white/70 transition-colors duration-150 hover:text-white">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "font-semibold text-white" : "text-white/70"}>{c.label}</span>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
