"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Images, Star } from "lucide-react";
import { PageHeader } from "@/components/design";
import { GeneralSettingsForm } from "./general-settings-form";
import { CarouselManager } from "./carousel-manager";
import { FeaturedCompaniesPicker } from "./featured-companies-picker";

export default function AdminSettingsPage() {
    const t = useTranslations("Admin.settings");
    const locale = useLocale();

    return (
        <div className="p-4">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <Tabs defaultValue="general" className="max-w-3xl">
                <TabsList>
                    <TabsTrigger value="general" className="gap-1.5 text-xs">
                        <Settings className="h-3.5 w-3.5" />
                        {t("tabGeneral")}
                    </TabsTrigger>
                    <TabsTrigger value="carousel" className="gap-1.5 text-xs">
                        <Images className="h-3.5 w-3.5" />
                        {t("tabCarousel")}
                    </TabsTrigger>
                    <TabsTrigger value="featured" className="gap-1.5 text-xs">
                        <Star className="h-3.5 w-3.5" />
                        {t("tabFeatured")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4">
                    <GeneralSettingsForm locale={locale} />
                </TabsContent>
                <TabsContent value="carousel" className="mt-4">
                    <CarouselManager locale={locale} />
                </TabsContent>
                <TabsContent value="featured" className="mt-4">
                    <FeaturedCompaniesPicker locale={locale} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
