import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CATEGORY_ORDER, CATEGORY_ICONS } from "./categories";

interface CategorySidebarProps {
  locale: string;
  activeCategory: string;
  query: string;
}

function buildHref(category: string, query: string): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (query.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `/contact-points?${qs}` : "/contact-points";
}

/**
 * Left "CATEGORIES" filter card for the Institutional Contacts directory.
 * Active row gets a navy left-accent bar + tinted background (design 4).
 */
export async function CategorySidebar({ locale, activeCategory, query }: CategorySidebarProps) {
  const t = await getTranslations({ locale, namespace: "Institutions" });

  const rows: { value: string; label: string; icon: typeof CATEGORY_ICONS.all }[] = [
    { value: "", label: t("allInstitutions"), icon: CATEGORY_ICONS.all },
    ...CATEGORY_ORDER.map((c) => ({
      value: c,
      label: t(`category.${c}`),
      icon: CATEGORY_ICONS[c],
    })),
  ];

  return (
    <aside className="rounded-lg border border-border bg-white">
      <h2 className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-market-navy">
        {t("sidebarTitle")}
      </h2>
      <nav className="py-1">
        {rows.map((row) => {
          const active = row.value === activeCategory;
          const Icon = row.icon;
          return (
            <Link
              key={row.value || "all"}
              href={buildHref(row.value, query)}
              className={`flex items-center gap-2.5 border-l-[3px] px-4 py-2.5 text-sm transition-colors duration-150 ${
                active
                  ? "border-market-navy bg-market-navy/5 font-semibold text-market-navy"
                  : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-market-navy"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{row.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
