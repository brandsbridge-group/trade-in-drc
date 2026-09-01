import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import type { ContentItem, ContentType } from "@/lib/content/types";
import { PageHeader } from "@/components/design";

const ALLOWED: readonly ContentType[] = ["news", "event", "blog"] as const;

export default async function ContentListPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  if (!ALLOWED.includes(type as ContentType)) notFound();
  const contentType = type as ContentType;
  const t = await getTranslations({ locale, namespace: "Content.admin" });

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", contentType)
    .order("updated_at", { ascending: false });

  const items = (data ?? []) as unknown as ContentItem[];

  return (
    <div className="space-y-4">
      <PageHeader
        title={type.charAt(0).toUpperCase() + type.slice(1)}
        action={
          <Link
            href={`/admin/content/${type}/new`}
            className="h-9 inline-flex items-center text-sm bg-primary text-primary-foreground px-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            {t("addNew")}
          </Link>
        }
      />
      <table className="w-full text-sm border-collapse">
        <thead className="text-left text-xs text-muted-foreground border-b">
          <tr>
            <th className="py-2 font-medium">{t("colTitle")}</th>
            <th className="py-2 font-medium">{t("colStatus")}</th>
            <th className="py-2 font-medium">{t("colUpdated")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b hover:bg-muted/30">
              <td className="py-2">
                <Link
                  href={`/admin/content/${type}/${i.id}`}
                  className="underline underline-offset-2 hover:text-primary"
                >
                  {i.title_en}
                </Link>
              </td>
              <td className="py-2">
                <span
                  className={
                    i.status === "published"
                      ? "text-green-700"
                      : i.status === "archived"
                        ? "text-muted-foreground"
                        : "text-amber-700"
                  }
                >
                  {i.status}
                </span>
              </td>
              <td className="py-2 text-muted-foreground">
                {new Date(i.updated_at).toLocaleDateString(locale)}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-muted-foreground">
                {t("empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
