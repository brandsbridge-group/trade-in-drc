import { redirect } from "@/i18n/routing";

export default async function ContentIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/console/content/news", locale });
}
