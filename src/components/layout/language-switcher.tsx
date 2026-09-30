"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";

import { useRouter, usePathname, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales } from "@/config/locales";

/** Each language in its own words — never a flag (a language isn't a country). */
const NATIVE: Record<string, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    tr: "Türkçe",
    zh: "中文",
};

/**
 * Language picker: globe + code trigger; the menu lists every language by its
 * native name, with its name in the current UI language underneath (so both a
 * native reader and a current-language reader recognise it), a code badge and
 * a check on the active one. Radio semantics for screen readers.
 */
export function LanguageSwitcher() {
    const locale = useLocale();
    const t = useTranslations("Nav");
    const router = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();

    // "Anglais", "Espagnol"… in the language currently on screen.
    const inCurrent = new Intl.DisplayNames([locale], { type: "language" });
    const localized = (l: string) => {
        const name = inCurrent.of(l) ?? l;
        return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
    };

    const change = (next: string) => {
        if (next === locale) return;
        startTransition(() => {
            router.replace(pathname, { locale: next as (typeof routing.locales)[number] });
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={t("changeLanguage")}
                className={cn(
                    "group inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold text-white/75 outline-none transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 data-[state=open]:bg-white/10 data-[state=open]:text-white",
                    pending && "opacity-60",
                )}
            >
                <Globe className="h-3.5 w-3.5" aria-hidden />
                <span className="uppercase tracking-wide">{locale}</span>
                <ChevronDown
                    className="h-3 w-3 opacity-60 transition-transform duration-150 ease-out group-data-[state=open]:rotate-180"
                    aria-hidden
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-60 rounded-2xl border-slate-200/80 p-1.5 shadow-2xl shadow-slate-900/15"
            >
                <DropdownMenuLabel className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {t("language")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={locale} onValueChange={change}>
                    {locales.map((l) => {
                        const on = l === locale;
                        return (
                            <DropdownMenuRadioItem
                                key={l}
                                value={l}
                                lang={l}
                                // Our own check on the right replaces the radio dot.
                                className="cursor-pointer gap-3 rounded-xl py-2 pl-2.5 pr-2.5 focus:bg-slate-50 [&>span:first-child]:hidden"
                            >
                                <span
                                    className={cn(
                                        "grid h-8 w-8 flex-none place-items-center rounded-lg text-[10px] font-bold uppercase tracking-wide ring-1",
                                        on
                                            ? "bg-market-navy text-white ring-market-navy"
                                            : "bg-white text-slate-500 ring-slate-200",
                                    )}
                                >
                                    {l}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className={cn("block text-[13px] leading-tight", on ? "font-semibold text-market-navy" : "font-medium text-slate-700")}>
                                        {NATIVE[l] ?? l}
                                    </span>
                                    {l !== locale && (
                                        <span lang={locale} className="block text-[11px] leading-tight text-slate-400">
                                            {localized(l)}
                                        </span>
                                    )}
                                </span>
                                {on && <Check className="h-4 w-4 flex-none text-market-or" aria-hidden />}
                            </DropdownMenuRadioItem>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
