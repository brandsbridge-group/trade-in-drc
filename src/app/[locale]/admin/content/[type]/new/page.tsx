import { notFound } from "next/navigation";
import { ContentForm } from "../../content-form";
import type { ContentType } from "@/lib/content/types";

const ALLOWED: readonly ContentType[] = ["news", "event", "blog"] as const;

export default async function ContentNewPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!ALLOWED.includes(type as ContentType)) notFound();

  return <ContentForm type={type as ContentType} mode="create" />;
}
