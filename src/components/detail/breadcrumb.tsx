import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export async function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = await getTranslations("Nav");
  return (
    <nav
      className="flex items-center gap-1 text-xs text-muted-foreground mb-3"
      aria-label={t("breadcrumb")}
    >
      {items.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {c.href ? (
            <Link href={c.href} className="hover:text-foreground hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground">{c.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="w-3 h-3" />}
        </span>
      ))}
    </nav>
  );
}
