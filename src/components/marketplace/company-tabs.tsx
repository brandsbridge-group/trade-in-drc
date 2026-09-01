"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SegmentBadge } from "@/components/marketplace/segment-badge";
import { CompanyReferences } from "@/components/marketplace/company-references";
import { CompanyContacts } from "@/components/marketplace/company-contacts";
import { SkeletonImage } from "@/components/design";
import { Package, CheckCircle, Factory, Clock } from "lucide-react";
import { isSegmentKey } from "@/lib/marketplace/segments";
import type { SegmentKey } from "@/lib/marketplace/segments";

interface ProductRow {
    id: string;
    name: string;
    description: string | null;
    images: string[] | null;
    price: string | null;
    unit: string | null;
}

interface ServiceRow {
    id: string;
    name_en: string;
    name_fr: string;
    description_en: string | null;
    description_fr: string | null;
}

interface CompanyTabsProps {
    companyId: string;
    products: ProductRow[];
    certifications: string[] | null;
    capacity: string | null;
    moq: string | null;
    lead_time: string | null;
}

function useServices(companyId: string) {
    return useQuery({
        queryKey: ["company-services", companyId],
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("services")
                .select("id, name_en, name_fr, description_en, description_fr")
                .eq("company_id", companyId)
                .eq("status", "active");
            if (error) {
                // Table may not exist until migration 00006 is applied
                if (error.code === "42P01") return [] as ServiceRow[];
                throw error;
            }
            return (data ?? []) as ServiceRow[];
        },
        enabled: !!companyId,
    });
}

function useCompanySegments(companyId: string) {
    return useQuery({
        queryKey: ["company-segments", companyId],
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("company_segments")
                .select("segment_key")
                .eq("company_id", companyId);
            if (error) {
                if (error.code === "42P01") return [] as SegmentKey[];
                throw error;
            }
            return ((data ?? []) as { segment_key: string }[])
                .map((r) => r.segment_key)
                .filter(isSegmentKey);
        },
        enabled: !!companyId,
    });
}

function formatCapacityItem(label: string, value: string | null, icon: React.ReactNode) {
    if (!value) return null;
    return (
        <div className="bg-card border rounded-md p-3 text-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                {icon}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-sm font-bold mt-0.5">{value}</p>
        </div>
    );
}

export function CompanyTabs({ companyId, products, certifications, capacity, moq, lead_time }: CompanyTabsProps) {
    const t = useTranslations("Market.companyProfile");
    const locale = useLocale();
    const { data: services = [] } = useServices(companyId);
    const { data: segments = [] } = useCompanySegments(companyId);

    return (
        <Tabs defaultValue="overview">
            <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="overview">{t("tabsOverview")}</TabsTrigger>
                <TabsTrigger value="segments">{t("tabsSegments")}</TabsTrigger>
                <TabsTrigger value="products">{t("tabsProducts")}</TabsTrigger>
                <TabsTrigger value="services">{t("tabsServices")}</TabsTrigger>
                <TabsTrigger value="references">{t("tabsReferences")}</TabsTrigger>
                <TabsTrigger value="contacts">{t("tabsContacts")}</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-5">
                {(capacity || moq || lead_time) && (
                    <div>
                        <h2 className="text-sm font-semibold mb-2">{t("productionCapacity")}</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {formatCapacityItem(t("capacity"), capacity, <Factory className="w-4 h-4 text-primary" />)}
                            {formatCapacityItem(t("minOrder"), moq, <Package className="w-4 h-4 text-primary" />)}
                            {formatCapacityItem(t("leadTime"), lead_time, <Clock className="w-4 h-4 text-primary" />)}
                        </div>
                    </div>
                )}

                {certifications && certifications.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold mb-2">{t("certifications")}</h2>
                        <div className="flex flex-wrap gap-2">
                            {certifications.map((cert) => (
                                <div
                                    key={cert}
                                    className="flex items-center gap-1.5 bg-secondary/30 border border-secondary px-2.5 py-1 rounded text-xs"
                                >
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <span className="font-medium">{cert}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!capacity && !moq && !lead_time && (!certifications || certifications.length === 0) && (
                    <p className="text-sm text-muted-foreground">{t("noDetails")}</p>
                )}
            </TabsContent>

            {/* Products tab */}
            <TabsContent value="products">
                {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {products.map((product) => (
                            <div key={product.id} className="bg-card border rounded-md p-3">
                                <div className="flex items-start gap-3">
                                    {product.images?.[0] ? (
                                        <SkeletonImage
                                            src={product.images[0]}
                                            alt={product.name}
                                            wrapperClassName="w-12 h-12 rounded shrink-0"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                                            <Package className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-medium truncate">{product.name}</h3>
                                        {product.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {product.description}
                                            </p>
                                        )}
                                        {product.price && (
                                            <p className="text-xs font-medium text-primary mt-1">
                                                {product.price}{product.unit ? ` / ${product.unit}` : ""}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </TabsContent>

            {/* Services tab */}
            <TabsContent value="services">
                {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noServices")}</p>
                ) : (
                    <div className="space-y-3">
                        {services.map((service) => {
                            const name = locale === "fr" ? service.name_fr : service.name_en;
                            const description = locale === "fr" ? service.description_fr : service.description_en;
                            return (
                                <div key={service.id} className="bg-card border rounded-md p-3">
                                    <p className="text-sm font-medium">{name}</p>
                                    {description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{description}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </TabsContent>

            {/* Segments tab */}
            <TabsContent value="segments">
                {segments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noSegments")}</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {segments.map((seg) => (
                            <SegmentBadge key={seg} segment={seg} />
                        ))}
                    </div>
                )}
            </TabsContent>

            {/* Verified References tab (network of trust) */}
            <TabsContent value="references">
                <CompanyReferences companyId={companyId} />
            </TabsContent>

            {/* Contact persons tab */}
            <TabsContent value="contacts">
                <CompanyContacts companyId={companyId} />
            </TabsContent>
        </Tabs>
    );
}
