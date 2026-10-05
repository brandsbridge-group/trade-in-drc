import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth/require-admin";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { isSuperAdmin } = await requireStaff(locale);
  return <AdminLayoutClient isSuperAdmin={isSuperAdmin}>{children}</AdminLayoutClient>;
}
