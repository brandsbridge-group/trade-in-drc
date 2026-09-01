"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/design";
import { listCompaniesForAdmin, type AdminCompanyRow } from "./actions";

type CompanyStatus = "all" | "pending" | "verified" | "rejected";

const STATUS_FILTER_TABS: { value: CompanyStatus; labelKey: string }[] = [
    { value: "all", labelKey: "filterAll" },
    { value: "pending", labelKey: "statusValues.pending" },
    { value: "verified", labelKey: "statusValues.verified" },
    { value: "rejected", labelKey: "statusValues.rejected" },
];

const STATUS_BADGE_CLASSES: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    verified: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
};

const PAGE_SIZE = 20;

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j} className="py-2">
                            <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function AdminCompaniesPage() {
    const t = useTranslations("Admin.companies");
    const locale = useLocale();
    const [companies, setCompanies] = React.useState<AdminCompanyRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [activeStatus, setActiveStatus] = React.useState<CompanyStatus>("all");
    const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

    const dateFormatter = React.useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
        [locale]
    );

    React.useEffect(() => {
        let cancelled = false;
        const fetchCompanies = async () => {
            try {
                const rows = await listCompaniesForAdmin(locale);
                if (!cancelled) setCompanies(rows);
            } catch {
                if (!cancelled) toast.error(t("loadError"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchCompanies();
        return () => {
            cancelled = true;
        };
    }, [locale, t]);

    const filtered = React.useMemo(() => {
        return companies.filter((c) => {
            const matchesStatus = activeStatus === "all" || c.status === activeStatus;
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [companies, activeStatus, search]);

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    const statusCounts = React.useMemo(() => ({
        all: companies.length,
        pending: companies.filter((c) => c.status === "pending").length,
        verified: companies.filter((c) => c.status === "verified").length,
        rejected: companies.filter((c) => c.status === "rejected").length,
    }), [companies]);

    return (
        <div className="p-4">
            <PageHeader
                title={loading ? t("listTitle") : `${t("listTitle")} (${companies.length})`}
                subtitle={t("listSubtitle")}
            />

            {/* Controls */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setVisibleCount(PAGE_SIZE);
                        }}
                        placeholder={t("searchPlaceholder")}
                        className="h-9 text-sm pl-8"
                    />
                </div>

                {/* Status filter button group */}
                <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
                    {STATUS_FILTER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setActiveStatus(tab.value);
                                setVisibleCount(PAGE_SIZE);
                            }}
                            className={cn(
                                "px-3 py-1.5 text-sm border-r last:border-r-0 transition-colors",
                                activeStatus === tab.value
                                    ? "bg-foreground text-background"
                                    : "bg-card text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            {t(tab.labelKey)}
                            <span className={cn(
                                "ml-1.5 text-xs",
                                activeStatus === tab.value ? "opacity-60" : "text-muted-foreground"
                            )}>
                                {statusCounts[tab.value]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden">
                {loading ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">{t("colCompany")}</TableHead>
                                <TableHead className="text-xs">{t("info.sector")}</TableHead>
                                <TableHead className="text-xs">{t("colStatus")}</TableHead>
                                <TableHead className="text-xs">{t("colOwnerEmail")}</TableHead>
                                <TableHead className="text-xs">{t("colCreated")}</TableHead>
                                <TableHead className="text-xs text-right">{t("colAction")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SkeletonRows />
                        </TableBody>
                    </Table>
                ) : filtered.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">{t("colCompany")}</TableHead>
                                <TableHead className="text-xs">{t("info.sector")}</TableHead>
                                <TableHead className="text-xs">{t("colStatus")}</TableHead>
                                <TableHead className="text-xs">{t("colOwnerEmail")}</TableHead>
                                <TableHead className="text-xs">{t("colCreated")}</TableHead>
                                <TableHead className="text-xs text-right">{t("colAction")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="py-2">
                                        <div>
                                            <p className="text-sm font-medium">{company.name}</p>
                                            {company.city && (
                                                <p className="text-xs text-muted-foreground">{company.city}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {company.sectorName ?? "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs",
                                                STATUS_BADGE_CLASSES[company.status] ?? ""
                                            )}
                                        >
                                            {t(`statusValues.${company.status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {company.ownerEmail ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {dateFormatter.format(new Date(company.createdAt))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={`/admin/companies/${company.id}`}
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                        >
                                            {t("view")}
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="p-8 text-center">
                        <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                        <h3 className="text-sm font-semibold mb-1">{t("emptyTitle")}</h3>
                        <p className="text-sm text-muted-foreground">
                            {search ? t("emptySearch") : t("emptyFilter")}
                        </p>
                    </div>
                )}
            </div>

            {/* Load more */}
            {hasMore && (
                <div className="mt-4 text-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    >
                        {t("loadMore", { count: filtered.length - visibleCount })}
                    </Button>
                </div>
            )}
        </div>
    );
}
