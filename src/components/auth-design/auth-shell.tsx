import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/logo";
import { CongoAuthCarousel } from "./congo-auth-carousel";

export async function AuthShell({
  children,
  locale,
  boxed = false,
}: {
  children: ReactNode;
  locale: string;
  /** Clean layout: logo on top, frameless 400px form centred on a white column. */
  boxed?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "AuthDesign.panel" });
  const checks = t.raw("checks") as string[];
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-muted/30">
      <CongoAuthCarousel
        title={t("title")}
        tagline={t("tagline")}
        checks={checks}
        copyrightLabel="TradeInDRC"
      />
      {boxed ? (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 py-6">
          <div className="w-full max-w-[340px]">
            <Link href="/" className="mb-5 flex justify-center">
              <Logo size="md" />
            </Link>
            {children}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      )}
    </div>
  );
}
