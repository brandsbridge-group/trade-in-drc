import { redirect } from "next/navigation";

export default async function ContentIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/content/news`);
}
