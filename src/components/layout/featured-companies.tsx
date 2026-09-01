"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, MapPin, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";

interface Company {
    id: string;
    name: string;
    sectorName: string | null;
    province: string | null;
    verified: boolean;
    description: string | null;
}

export function FeaturedCompanies() {
    const locale = useLocale();
    const t = useTranslations("FeaturedCompanies");
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("companies")
                    .select(
                        "id, name, province, status, verification_tier, description, sectors(name_en, name_fr, name_tr, name_zh, name_es)",
                    )
                    .eq("status", "verified")
                    .order("created_at", { ascending: false })
                    .limit(4);

                if (error) throw error;
                const mapped: Company[] = (data ?? []).map((row) => {
                    const sector = Array.isArray(row.sectors)
                        ? row.sectors[0]
                        : row.sectors;
                    return {
                        id: row.id,
                        name: row.name,
                        sectorName: sector
                            ? pickLocalized(sector, "name", locale as Locale)
                            : null,
                        province: row.province,
                        verified:
                            row.status === "verified" ||
                            row.verification_tier === "verified" ||
                            row.verification_tier === "premium",
                        description: row.description,
                    };
                });
                setCompanies(mapped);
            } catch (error) {
                console.error("Error fetching featured companies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, [locale]);

    return (
        <section className="py-8 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-xl font-bold">{t("title")}</h2>
                        <p className="text-muted-foreground mt-2">
                            {t("subtitle")}
                        </p>
                    </motion.div>
                    <Button variant="outline" asChild>
                        <Link href="/companies">
                            {t("viewAll")}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-48 bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : companies.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {companies.map((company, index) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link href={`/companies/${company.id}`}>
                                    <div className="bg-card border p-6 h-full hover:border-primary/50 transition-colors group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            {company.verified && (
                                                <Badge className="badge-verified">
                                                    <CheckCircle className="w-3 h-3" />
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                            {company.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                            <MapPin className="w-3 h-3" />
                                            {company.province}
                                        </p>
                                        {company.sectorName && (
                                            <Badge variant="secondary" className="text-xs">
                                                {company.sectorName}
                                            </Badge>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-card border">
                        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">{t("empty")}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
