import { MobileDashboardBar, Sidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
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

  // Soft grey canvas + white cards: depth comes from contrast, not shadows.
  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <MobileDashboardBar />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar />
        <main className="min-w-0 flex-1 px-4 pb-10 pt-4 md:px-6 md:pt-2">{children}</main>
      </div>
    </div>
  );
}
