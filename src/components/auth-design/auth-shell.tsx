import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { CongoAuthCarousel } from "./congo-auth-carousel";

export async function AuthShell({ children, locale }: { children: ReactNode; locale: string }) {
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
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
