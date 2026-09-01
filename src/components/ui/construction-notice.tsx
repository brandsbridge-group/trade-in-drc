"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";

interface ConstructionNoticeProps {
    title: string;
    description?: string;
}

export function ConstructionNotice({ title, description }: ConstructionNoticeProps) {
    const t = useTranslations("Construction");

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center bg-slate-50/50">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-md w-full">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <Construction className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
                <p className="text-slate-500 mb-8">
                    {description || t("defaultDescription")}
                </p>
                <Button asChild variant="outline" className="gap-2">
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4" />
                        {t("returnHome")}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
