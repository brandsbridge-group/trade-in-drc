"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { TaxonomyEditor } from "@/components/admin/taxonomy-editor";
import { toast } from "sonner";
import { PageHeader } from "@/components/design";

interface Sector {
    id: string;
    name_en: string;
    name_fr: string;
    slug: string;
}

export default function TaxonomyPage() {
    const t = useTranslations("Taxonomy");
    const [sectors, setSectors] = React.useState<Sector[]>([]);
    const [loadingSectors, setLoadingSectors] = React.useState(true);

    React.useEffect(() => {
        const fetchSectors = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("sectors")
                    .select("id, name_en, name_fr, slug")
                    .order("name_en");

                if (error) throw error;
                setSectors(data ?? []);
            } catch (error) {
                const message = error instanceof Error ? error.message : t("errorLoadSectors");
                toast.error(message);
            } finally {
                setLoadingSectors(false);
            }
        };

        fetchSectors();
    }, [t]);

    return (
        <div className="p-4 space-y-8 max-w-5xl">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <section className="space-y-3">
                <div className="border-b pb-2">
                    <h2 className="text-base font-semibold">{t("sectorsHeading")}</h2>
                    <p className="text-xs text-muted-foreground">{t("sectorsDescription")}</p>
                </div>
                <TaxonomyEditor type="sectors" />
            </section>

            <section className="space-y-3">
                <div className="border-b pb-2">
                    <h2 className="text-base font-semibold">{t("categoriesHeading")}</h2>
                    <p className="text-xs text-muted-foreground">{t("categoriesDescription")}</p>
                </div>
                {loadingSectors ? (
                    <p className="text-sm text-muted-foreground py-4">{t("loadingSectors")}</p>
                ) : (
                    <TaxonomyEditor type="categories" sectors={sectors} />
                )}
            </section>

            <section className="space-y-3">
                <div className="border-b pb-2">
                    <h2 className="text-base font-semibold">{t("hsCodesHeading")}</h2>
                    <p className="text-xs text-muted-foreground">{t("hsCodesDescription")}</p>
                </div>
                {loadingSectors ? (
                    <p className="text-sm text-muted-foreground py-4">{t("loadingSectors")}</p>
                ) : (
                    <TaxonomyEditor type="hs_codes" sectors={sectors} />
                )}
            </section>

            <section className="space-y-3">
                <div className="border-b pb-2">
                    <h2 className="text-base font-semibold">{t("tagsHeading")}</h2>
                    <p className="text-xs text-muted-foreground">{t("tagsDescription")}</p>
                </div>
                <TaxonomyEditor type="tags" />
            </section>
        </div>
    );
}
