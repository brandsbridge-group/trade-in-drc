import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ContentForm } from "../../content-form";
import type { ContentItem, ContentType } from "@/lib/content/types";

const ALLOWED: readonly ContentType[] = ["news", "event", "blog"] as const;

export default async function ContentEditPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!ALLOWED.includes(type as ContentType)) notFound();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <ContentForm
      type={type as ContentType}
      mode="edit"
      initial={data as unknown as ContentItem}
    />
  );
}
