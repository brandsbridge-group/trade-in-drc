"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies, companiesQueryKey } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/design";
import { StatsRow } from "@/components/dashboard/stats-row";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { PremiumStatusCard } from "@/components/pricing/premium-status-card";
import {
    Building2,
    Plus,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Edit,
    RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resubmitCompanyVerification } from "@/lib/verifications/actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    canViewPublicProfile,
    registerFirstOrAnother,
    resolveSectorLabel,
} from "@/lib/dashboard/company-display";
import type { Locale } from "@/config/locales";

interface VerificationReview {
    decision: string;
    notes: string | null;
    created_at: string;
}

interface SectorRef {
    name_en: string | null;
    name_fr: string | null;
}

interface Company {
    id: string;
    name: string;
    sectors: SectorRef | SectorRef[] | null;
    status: "pending" | "verified" | "rejected" | "more_info_requested";
    verification_reviews: VerificationReview[];
}

export default function DashboardPage() {
    const t = useTranslations("Dashboard");
    const locale = useLocale();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: companies, isLoading } = useCompanies(user?.id);
    const [resubmittingIds, setResubmittingIds] = React.useState<Set<string>>(new Set());
    const [productCount, setProductCount] = React.useState<number | null>(null);
    const [opportunityCount, setOpportunityCount] = React.useState<number | null>(null);

    const companyIds = React.useMemo(
        () => (companies ?? []).map((c) => c.id),
        [companies]
    );

    // Fetch product and opportunity counts once company IDs are known
    React.useEffect(() => {
        if (!user || companyIds.length === 0) {
            setProductCount(0);
            setOpportunityCount(0);
            return;
        }
        const supabase = createClient();
        Promise.all([
            supabase
                .from("products")
                .select("id", { count: "exact", head: true })
                .in("company_id", companyIds),
            supabase
                .from("opportunities")
                .select("id", { count: "exact", head: true })
                .in("company_id", companyIds),
        ]).then(([{ count: pCount }, { count: oCount }]) => {
            setProductCount(pCount ?? 0);
            setOpportunityCount(oCount ?? 0);
        });
    }, [user, companyIds]);

    const getLatestReview = (reviews: VerificationReview[]): VerificationReview | null => {
        if (!reviews || reviews.length === 0) return null;
        return [...reviews].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    };

    const handleResubmit = async (companyId: string) => {
        if (!user) return;

        setResubmittingIds((prev) => new Set(prev).add(companyId));
        const toastId = toast.loading(t("resubmitting"));

        try {
            // Routed through a service-role server action: an owner cannot write
            // companies.status (column-REVOKE'd) or insert a verification_reviews
            // row (admin-only RLS) directly — the action verifies ownership first.
            const result = await resubmitCompanyVerification({ companyId, locale });
            if (!result.ok) throw new Error(result.error ?? "resubmit_failed");

            toast.success(t("resubmitSuccess"), { id: toastId });
            queryClient.invalidateQueries({ queryKey: companiesQueryKey(user.id) });
        } catch (err) {
            console.error("Error resubmitting company:", err);
            toast.error(t("resubmitError"), { id: toastId });
        } finally {
            setResubmittingIds((prev) => {
                const next = new Set(prev);
                next.delete(companyId);
                return next;
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "verified":
                return (
                    <Badge className="badge-verified">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("verified")}
                    </Badge>
                );
            case "pending":
                return (
                    <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {t("pendingVerification")}
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t("rejected")}
                    </Badge>
                );
            case "more_info_requested":
                return (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        <Clock className="w-3 h-3 mr-1" />
                        {t("moreInfoRequested")}
                    </Badge>
                );
            default:
                return null;
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>{t("signInRequired")}</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl">
            <PageHeader
                title={t("title")}
                subtitle={`${t("welcome")}, ${user.email}`}
                action={
                    // P1-1: an owner who already has companies must see "Register
                    // Another Company", not the first-time CTA. This used to hide
                    // the whole button while isLoading, which popped the CTA in
                    // and shifted the header layout on every single visit — now
                    // the button always renders and only its LABEL swaps once the
                    // companies query resolves (defaulting to the "first company"
                    // copy while loading, since 0 is the safe starting guess).
                    <Button asChild size="sm">
                        <Link href="/register-company">
                            <Plus className="w-4 h-4 mr-2" />
                            {t(registerFirstOrAnother(companies?.length ?? 0))}
                        </Link>
                    </Button>
                }
            />

            <div className="mt-4 mb-4">
                <StatsRow companyIds={companyIds} />
            </div>

            <div className="mb-4">
                <PremiumStatusCard />
            </div>

            {!isLoading && productCount !== null && opportunityCount !== null && (
                <OnboardingCard
                    steps={[
                        {
                            key: "company",
                            href: "/dashboard/companies",
                            done: (companies?.length ?? 0) > 0,
                        },
                        {
                            key: "product",
                            href: "/dashboard/products",
                            done: productCount > 0,
                        },
                        {
                            key: "opportunity",
                            href: "/dashboard/opportunities/new",
                            done: opportunityCount > 0,
                        },
                    ]}
                />
            )}

            <div className="bg-card border border-slate-200 rounded-2xl">
                <div className="p-3 border-b">
                    <h2 className="font-semibold text-sm">{t("myCompanies")}</h2>
                </div>

                    {isLoading ? (
                        <div className="p-3 space-y-2">
                            <div className="h-14 bg-muted animate-pulse rounded-sm" />
                            <div className="h-14 bg-muted animate-pulse rounded-sm" />
                        </div>
                    ) : (companies as unknown as Company[] | undefined)?.length ? (
                        <div className="divide-y">
                            {(companies as unknown as Company[]).map((company, index) => {
                                const latestReview = getLatestReview(company.verification_reviews);
                                const isRejected = company.status === "rejected";
                                const isMoreInfo = company.status === "more_info_requested";
                                const isResubmitting = resubmittingIds.has(company.id);
                                const canViewProfile = canViewPublicProfile(company.status);
                                const sectorLabel = resolveSectorLabel(company.sectors, locale as Locale);

                                return (
                                    <motion.div
                                        key={company.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-muted flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{company.name}</h3>
                                                        {getStatusBadge(company.status)}
                                                    </div>
                                                    {sectorLabel && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {sectorLabel}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isRejected && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleResubmit(company.id)}
                                                        disabled={isResubmitting}
                                                    >
                                                        <RefreshCw className={`w-4 h-4 mr-1 ${isResubmitting ? "animate-spin" : ""}`} />
                                                        {t("resubmit")}
                                                    </Button>
                                                )}
                                                {canViewProfile ? (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/companies/${company.id}`}>
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            {t("viewProfile")}
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    // P1-3: companies_public only exposes verified rows
                                                    // (00036_companies_public_country.sql:31). Linking there
                                                    // for a pending/rejected company 404s, so show a disabled
                                                    // state instead of a dead link.
                                                    // disabled:pointer-events-none on the Button
                                                    // primitive (src/components/ui/button.tsx) also
                                                    // blocks the browser's native title tooltip on the
                                                    // button itself, so the explanation is carried by
                                                    // this wrapping span instead — it isn't disabled
                                                    // and still receives pointer/hover events.
                                                    <span title={t("viewProfilePendingHint")}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            {t("viewProfile")}
                                                        </Button>
                                                    </span>
                                                )}
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/companies/${company.id}/edit`}>
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        {t("editProfile")}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>

                                        {(isRejected || isMoreInfo) && latestReview?.notes && (
                                            <div className={`mt-3 ml-16 px-3 py-2 text-sm rounded-sm border ${
                                                isRejected
                                                    ? "bg-red-50 border-red-100 text-red-700"
                                                    : "bg-amber-50 border-amber-100 text-amber-700"
                                            }`}>
                                                <span className="font-medium">
                                                    {isRejected ? t("rejectionReason") : t("moreInfoRequested")}:
                                                </span>{" "}
                                                {latestReview.notes}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                            <h3 className="text-sm font-medium mb-2">{t("noCompanies")}</h3>
                            <Button asChild className="mt-4">
                                <Link href="/register-company">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t("registerFirst")}
                                </Link>
                            </Button>
                        </div>
                    )}
            </div>
        </div>
    );
}

