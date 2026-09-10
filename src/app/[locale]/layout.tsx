import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import { Suspense } from "react";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { locales } from "@/config/locales";
import { SITE_URL } from "@/app/sitemap";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { SearchProvider } from "@/lib/search/search-context";
import { LayoutShell } from "@/components/layout/layout-shell";
import { SiteFooter } from "@/components/home/site-footer";
import { AuthFlash } from "@/components/auth/auth-flash";
import { CommandPalette } from "@/components/search/command-palette";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const languageAlternates = Object.fromEntries(
    locales.map((l) => [l, `${SITE_URL}/${l}`]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("siteTitle"),
      template: `%s · ${t("siteTitle")}`,
    },
    description: t("siteDescription"),
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ...languageAlternates,
        "x-default": `${SITE_URL}/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      title: t("siteTitle"),
      description: t("siteDescription"),
      url: `${SITE_URL}/${locale}`,
      siteName: t("siteTitle"),
      locale,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        // Browser extensions (password managers, shortcut tools) inject attributes
        // like `cz-shortcut-listen` onto <body> before React hydrates; ignore the
        // resulting attribute mismatch rather than logging a false hydration error.
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <QueryProvider>
              <SearchProvider>
                <LayoutShell footer={<SiteFooter />}>
                  {children}
                  <Analytics />
                </LayoutShell>
                <Toaster />
                <Suspense fallback={null}>
                  <AuthFlash />
                </Suspense>
                <Suspense fallback={null}>
                  <CommandPalette />
                </Suspense>
              </SearchProvider>
            </QueryProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
