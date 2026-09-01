import { Sidebar } from "@/components/dashboard/sidebar";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAuth(locale, "/dashboard");

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
