import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Building2,
    FileText,
    History,
    Layers,
    Package,
    ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { cn } from "@/lib/utils";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { TierOverridePanel } from "@/components/admin/tier-override-panel";
import { TrustProfileForm } from "./trust-profile-form";
import { SegmentsForm } from "./segments-form";
import { isSegmentKey } from "@/lib/marketplace/segments";
import type { SegmentKey } from "@/lib/marketplace/segments";
import { getCompanyForReview } from "@/lib/verifications/actions";

interface PageProps {
    params: Promise<{ id: string; locale: string }>;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    verified: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
};

const DECISION_BADGE_STYLES: Record<string, string> = {
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    more_info_requested: "bg-amber-100 text-amber-800 border-amber-200",
    resubmitted: "bg-amber-100 text-amber-800 border-amber-200",
};

function formatDate(dateStr: string, locale: string): string {
    return new Date(dateStr).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function SectionCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-card border border-slate-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                {icon}
                {title}
            </h2>
            {children}
        </div>
    );
}

export default async function AdminCompanyDetailPage({ params }: PageProps) {
    const { id, locale } = await params;
    const t = await getTranslations("Admin.companies");
    const tBadge = await getTranslations("Trust.badge");

    const company = await getCompanyForReview(id, locale);

    if (!company) {
        return (
            <div className="p-4">
                <Link
                    href="/admin/companies"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("backToCompanies")}
                </Link>
                <div className="p-8 text-center">
                    <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">{t("notFound")}</p>
                </div>
            </div>
        );
    }

    const sortedReviews = [...company.reviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const infoRows = [
        { label: t("info.sector"), value: company.sectorName },
        { label: t("info.owner"), value: company.ownerEmail },
        { label: t("info.city"), value: company.city },
        { label: t("info.province"), value: company.province },
        { label: t("info.address"), value: company.address },
        { label: t("info.email"), value: company.contactEmail },
        { label: t("info.phone"), value: company.contactPhone },
        { label: t("info.website"), value: company.website },
    ];

    return (
        <div className="p-4 space-y-4">
            <div>
                <Link
                    href="/admin/companies"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("backToCompanies")}
                </Link>
                <PageHeader
                    title={company.name}
                    subtitle={t("registeredOn", {
                        date: formatDate(company.createdAt, locale),
                    })}
                    action={
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs",
                                STATUS_BADGE_CLASSES[company.status] ?? ""
                            )}
                        >
                            {t(`statusValues.${company.status}`)}
                        </Badge>
                    }
                />
            </div>

            {/* Trust tier override (service-role, REVOKE-protected columns) */}
            <SectionCard
                icon={<ShieldCheck className="w-4 h-4 text-muted-foreground" />}
                title={t("tier.title")}
            >
                <div className="mb-2 flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t("tier.current")}</span>
                    <Badge variant="outline" className="text-xs">
                        {tBadge(company.verificationTier)}
                    </Badge>
                    {company.verifiedAt && (
                        <span className="text-xs text-muted-foreground">
                            {t("tier.verifiedOn", {
                                date: formatDate(company.verifiedAt, locale),
                            })}
                        </span>
                    )}
                </div>
                <TierOverridePanel
                    companyId={company.id}
                    initialTier={company.verificationTier}
                />
            </SectionCard>

            {/* Company info */}
            <SectionCard
                icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                title={t("info.title")}
            >
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                    {infoRows.map(({ label, value }) => (
                        <div key={label} className="flex gap-2">
                            <dt className="text-muted-foreground w-24 shrink-0">{label}</dt>
                            <dd className="font-medium break-all">{value ?? "—"}</dd>
                        </div>
                    ))}
                    {company.description && (
                        <div className="sm:col-span-2 flex gap-2">
                            <dt className="text-muted-foreground w-24 shrink-0">
                                {t("info.description")}
                            </dt>
                            <dd className="font-medium">{company.description}</dd>
                        </div>
                    )}
                </dl>
            </SectionCard>

            {/* Products */}
            <SectionCard
                icon={<Package className="w-4 h-4 text-muted-foreground" />}
                title={t("products.title", { count: company.products.length })}
            >
                {company.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("products.empty")}</p>
                ) : (
                    <ul className="space-y-2">
                        {company.products.map((product) => (
                            <li
                                key={product.id}
                                className="py-1.5 border-b last:border-b-0"
                            >
                                <p className="text-sm font-medium">{product.name}</p>
                                {product.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {product.description}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            {/* Documents (signed URLs) */}
            <SectionCard
                icon={<FileText className="w-4 h-4 text-muted-foreground" />}
                title={t("documents.title", { count: company.documents.length })}
            >
                <DocumentViewer documents={company.documents} />
            </SectionCard>

            {/* Verification history */}
            <SectionCard
                icon={<History className="w-4 h-4 text-muted-foreground" />}
                title={t("history.title", { count: company.reviews.length })}
            >
                {sortedReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
                ) : (
                    <ul className="space-y-2">
                        {sortedReviews.map((review) => (
                            <li
                                key={review.id}
                                className="py-1.5 border-b last:border-b-0"
                            >
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs",
                                            DECISION_BADGE_STYLES[review.decision] ?? ""
                                        )}
                                    >
                                        {t(`decisionValues.${review.decision}`)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(review.createdAt, locale)}
                                    </span>
                                </div>
                                {review.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {review.notes}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            {/* Structured trust profile (C8 editor) */}
            <SectionCard
                icon={<ShieldCheck className="w-4 h-4 text-muted-foreground" />}
                title={t("trustProfile.title")}
            >
                <TrustProfileForm
                    companyId={company.id}
                    initialTier={company.verificationTier}
                    initialSummary={company.verificationSummary}
                />
            </SectionCard>

            {/* Marketplace segments */}
            <SectionCard
                icon={<Layers className="w-4 h-4 text-muted-foreground" />}
                title={t("segments.title")}
            >
                <SegmentsForm
                    companyId={company.id}
                    initial={
                        company.segmentKeys.filter(isSegmentKey) as SegmentKey[]
                    }
                />
            </SectionCard>
        </div>
    );
}
