import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
