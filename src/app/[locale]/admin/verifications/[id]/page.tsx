import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Building2,
    FileText,
    Mail,
    MapPin,
    Package,
    Phone,
    Globe,
    Calendar,
    History,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { DecisionPanel } from "@/components/admin/decision-panel";
import { getCompanyForReview } from "@/lib/verifications/actions";

interface PageProps {
    params: Promise<{ id: string; locale: string }>;
}

const DECISION_BADGE_STYLES: Record<string, string> = {
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    more_info_requested: "bg-amber-100 text-amber-800 border-amber-200",
    resubmitted: "bg-amber-100 text-amber-800 border-amber-200",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    verified: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
};

function formatDateTime(dateStr: string, locale: string): string {
    return new Date(dateStr).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default async function VerificationDetailPage({ params }: PageProps) {
    const { id, locale } = await params;
    const t = await getTranslations("Admin.verifications");
    const tBadge = await getTranslations("Trust.badge");

    const company = await getCompanyForReview(id, locale);
    if (!company) {
        redirect("/admin/verifications");
    }

    const location = [company.address, company.city, company.province]
        .filter(Boolean)
        .join(", ");

    const sortedReviews = [...company.reviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="p-4">
            <Link
                href="/admin/verifications"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                {t("backToQueue")}
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {/* Company information */}
                    <Card className="py-4">
                        <CardHeader className="pb-2 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {t("detail.companyInfo")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="font-semibold text-lg">{company.name}</h2>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-xs shrink-0",
                                        STATUS_BADGE_STYLES[company.status] ?? ""
                                    )}
                                >
                                    {t(`statusValues.${company.status}`)}
                                </Badge>
                            </div>

                            {company.description && (
                                <p className="text-sm text-muted-foreground">
                                    {company.description}
                                </p>
                            )}

                            <div className="space-y-2 text-sm">
                                {company.sectorName && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>{company.sectorName}</span>
                                    </div>
                                )}
                                {company.ownerEmail && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span>{company.ownerEmail}</span>
                                    </div>
                                )}
                                {company.contactPhone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>{company.contactPhone}</span>
                                    </div>
                                )}
                                {company.website && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Globe className="w-3.5 h-3.5" />
                                        <span className="break-all">{company.website}</span>
                                    </div>
                                )}
                                {location && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {t("detail.submittedOn", {
                                            date: formatDateTime(company.createdAt, locale),
                                        })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Products */}
                    <Card className="py-4">
                        <CardHeader className="pb-2 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                {t("detail.products", { count: company.products.length })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4">
                            {company.products.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t("detail.noProducts")}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {company.products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="p-2 border rounded-md bg-muted/30"
                                        >
                                            <p className="text-sm font-medium">{product.name}</p>
                                            {product.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                    {product.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="py-4">
                        <CardHeader className="pb-2 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {t("detail.documents")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4">
                            <DocumentViewer documents={company.documents} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    <Card className="py-4">
                        <CardContent className="px-4">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {t("detail.currentTier")}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                    {tBadge(company.verificationTier)}
                                </Badge>
                            </div>
                            <DecisionPanel companyId={company.id} />
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="px-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <History className="w-4 h-4" />
                                {t("detail.reviewHistory")}
                            </h3>
                            {sortedReviews.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t("detail.noReviews")}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {sortedReviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="relative pl-4 border-l-2 border-muted"
                                        >
                                            <div className="space-y-1">
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
                                                        {formatDateTime(review.createdAt, locale)}
                                                    </span>
                                                </div>
                                                {review.notes && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {review.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
