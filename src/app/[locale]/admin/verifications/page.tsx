"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/design";
import { EXPECTED_DOC_TYPES, VERIFICATION_DECISION } from "@/constants/status";
import {
    getVerificationQueue,
    type QueueCompany,
} from "@/lib/verifications/actions";

type FilterTab = "all" | "new" | "resubmitted";

function hasResubmission(decisions: string[]): boolean {
    return decisions.includes(VERIFICATION_DECISION.RESUBMITTED);
}

export default function VerificationsPage() {
    const t = useTranslations("Admin.verifications");
    const locale = useLocale();

    const [companies, setCompanies] = React.useState<QueueCompany[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<FilterTab>("all");

    React.useEffect(() => {
        let cancelled = false;
        const fetchPending = async () => {
            setLoading(true);
            setLoadError(false);
            try {
                const data = await getVerificationQueue(locale);
                if (!cancelled) setCompanies(data);
            } catch {
                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchPending();
        return () => {
            cancelled = true;
        };
    }, [locale]);

    const formatDate = React.useCallback(
        (dateStr: string) =>
            new Date(dateStr).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
        [locale]
    );

    const filtered = React.useMemo(() => {
        switch (activeTab) {
            case "new":
                return companies.filter((c) => !hasResubmission(c.decisions));
            case "resubmitted":
                return companies.filter((c) => hasResubmission(c.decisions));
            default:
                return companies;
        }
    }, [companies, activeTab]);

    const counts = React.useMemo(() => {
        const resubmittedCount = companies.filter((c) =>
            hasResubmission(c.decisions)
        ).length;
        return {
            all: companies.length,
            new: companies.length - resubmittedCount,
            resubmitted: resubmittedCount,
        };
    }, [companies]);

    return (
        <div className="p-4">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as FilterTab)}
                className="mb-4"
            >
                <TabsList>
                    <TabsTrigger value="all">
                        {t("tabs.all", { count: counts.all })}
                    </TabsTrigger>
                    <TabsTrigger value="new">
                        {t("tabs.new", { count: counts.new })}
                    </TabsTrigger>
                    <TabsTrigger value="resubmitted">
                        {t("tabs.resubmitted", { count: counts.resubmitted })}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : loadError ? (
                    <div className="p-8 text-center">
                        <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-3" />
                        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">{t("columns.company")}</TableHead>
                                <TableHead className="text-xs">{t("columns.sector")}</TableHead>
                                <TableHead className="text-xs">{t("columns.submitted")}</TableHead>
                                <TableHead className="text-xs">{t("columns.documents")}</TableHead>
                                <TableHead className="text-xs">{t("columns.status")}</TableHead>
                                <TableHead className="text-xs text-right">
                                    {t("columns.action")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((company) => {
                                const isResubmitted = hasResubmission(company.decisions);
                                return (
                                    <TableRow key={company.id}>
                                        <TableCell className="py-3">
                                            <div>
                                                <p className="text-sm font-medium">{company.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {company.ownerEmail ?? "—"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {company.sectorName ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(company.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {EXPECTED_DOC_TYPES.map((docType) => {
                                                    const isUploaded = company.documents.some(
                                                        (d) => d.type === docType
                                                    );
                                                    return (
                                                        <span
                                                            key={docType}
                                                            title={`${t(`documents.type.${docType}`)}: ${
                                                                isUploaded
                                                                    ? t("documents.uploaded")
                                                                    : t("documents.missing")
                                                            }`}
                                                            className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                isUploaded
                                                                    ? "bg-green-500"
                                                                    : "bg-amber-500"
                                                            )}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isResubmitted && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                                                >
                                                    {t("badges.resubmitted")}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/verifications/${company.id}`}
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                            >
                                                {t("review")}
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="p-8 text-center">
                        <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-3" />
                        <h3 className="text-sm font-semibold mb-1">{t("empty.title")}</h3>
                        <p className="text-sm text-muted-foreground">{t("empty.subtitle")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
