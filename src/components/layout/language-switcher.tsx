"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, routing } from "@/i18n/routing";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { locales } from "@/config/locales";

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale as (typeof routing.locales)[number] });
    };

    const getLocaleName = (l: string) => {
        switch (l) {
            case "en":
                return "English";
            case "fr":
                return "Français";
            case "tr":
                return "Türkçe";
            case "es":
                return "Español";
            case "zh":
                return "中文";

            default:
                return l;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="uppercase">{locale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((l) => (
                    <DropdownMenuItem
                        key={l}
                        onClick={() => handleLocaleChange(l)}
                        className={locale === l ? "font-bold" : ""}
                    >
                        {getLocaleName(l)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
