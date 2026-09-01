import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBySlug } from "@/lib/content/queries";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { MarkdownView } from "@/components/content/markdown-view";
import { Breadcrumb } from "@/components/detail/breadcrumb";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  const supabase = await createServerSupabaseClient();
  const item = await getBySlug(supabase, "event", slug);
  if (!item) notFound();

  const title = pickLocalized(item, "title", locale as Locale);
  const body = pickLocalized(item, "body", locale as Locale);
  const start = item.event_start_at
    ? new Date(item.event_start_at).toLocaleString(locale)
    : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: t("events"), href: "/events" },
          { label: title },
        ]}
      />
      <h1 className="text-3xl font-semibold mb-2">{title}</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {start ?? null}
        {start && item.event_location ? " · " : ""}
        {item.event_location ?? null}
      </p>
      <MarkdownView source={body} />
    </main>
  );
}
