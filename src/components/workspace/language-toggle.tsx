"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** The two working languages of the signed-in areas; the public site keeps all five. */
const WORKSPACE_LOCALES = ["fr", "en"] as const;

/**
 * FR | EN segmented switch for the dashboard and the staff console top bars.
 * It keeps the visitor on the same page and only changes the language.
 */
export function WorkspaceLanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Nav");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("changeLanguage")}
      className={cn("inline-flex shrink-0 rounded-full bg-white p-0.5 ring-1 ring-slate-200", pending && "opacity-60", className)}
    >
      {WORKSPACE_LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            disabled={pending}
            onClick={() => !active && startTransition(() => router.replace(pathname, { locale: code }))}
            className={cn(
              "h-8 min-w-9 rounded-full px-2.5 text-[11.5px] font-bold uppercase tracking-wide transition-colors",
              active ? "bg-market-navy text-white" : "text-slate-500 hover:text-market-navy"
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
