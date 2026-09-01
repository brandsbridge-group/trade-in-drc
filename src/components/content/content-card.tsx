import Link from "next/link";
import type { ContentItem } from "@/lib/content/types";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { SkeletonImage } from "@/components/design";

export function ContentCard({
  item,
  locale,
}: {
  item: ContentItem;
  locale: string;
}) {
  const title = pickLocalized(item, "title", locale as Locale);
  const excerpt = pickLocalized(item, "excerpt", locale as Locale);
  const section =
    item.type === "blog" ? "blog"
    : item.type === "event" ? "events"
    : "news";
  const href = `/${locale}/${section}/${item.slug}`;
  const date = item.published_at
    ? new Date(item.published_at).toLocaleDateString(locale)
    : null;

  const coverUrl = (item as { cover_url?: string | null }).cover_url ?? null;

  return (
    <Link
      href={href}
      className="group block border border-slate-200 rounded-2xl bg-white p-2 hover:border-slate-300 transition"
    >
      {coverUrl && (
        <SkeletonImage
          src={coverUrl}
          alt={title ?? ""}
          wrapperClassName="rounded-2xl aspect-[16/10] mb-2"
          className="group-hover:scale-[1.02] transition-transform duration-300 ease-out"
        />
      )}
      <div className="px-1 pt-1 pb-1">
        <h3 className="text-sm font-medium line-clamp-2 mb-1">{title}</h3>
        {excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{excerpt}</p>
        )}
        {date && <p className="text-[11px] text-muted-foreground">{date}</p>}
      </div>
    </Link>
  );
}
