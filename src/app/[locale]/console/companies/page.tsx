"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { PageHeader } from "@/components/console/page-header";
import { listCompaniesForAdmin, type AdminCompanyRow } from "./actions";

type CompanyStatus = "all" | "pending_documents" | "pending" | "verified" | "rejected";

const STATUS_FILTER_TABS: { value: CompanyStatus; labelKey: string }[] = [
    { value: "all", labelKey: "filterAll" },
    { value: "pending_documents", labelKey: "statusValues.pending_documents" },
    { value: "pending", labelKey: "statusValues.pending" },
    { value: "verified", labelKey: "statusValues.verified" },
    { value: "rejected", labelKey: "statusValues.rejected" },
];

const STATUS_PILL_CLASSES: Record<string, string> = {
    pending_documents: "bg-slate-100 text-slate-600",
    pending: "bg-amber-100 text-amber-800",
    verified: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
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
        pending_documents: companies.filter((c) => c.status === "pending_documents").length,
        pending: companies.filter((c) => c.status === "pending").length,
        verified: companies.filter((c) => c.status === "verified").length,
        rejected: companies.filter((c) => c.status === "rejected").length,
    }), [companies]);

    return (
        <div className="space-y-4">
            <PageHeader
                title={loading ? t("listTitle") : `${t("listTitle")} (${companies.length})`}
                subtitle={t("listSubtitle")}
            />

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setVisibleCount(PAGE_SIZE);
                        }}
                        placeholder={t("searchPlaceholder")}
                        className="h-9 rounded-full border-0 bg-white pl-10 text-sm shadow-none ring-1 ring-slate-200"
                    />
                </div>

                {/* Status filter button group */}
                <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
                    {STATUS_FILTER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            aria-pressed={activeStatus === tab.value}
                            onClick={() => {
                                setActiveStatus(tab.value);
                                setVisibleCount(PAGE_SIZE);
                            }}
                            className={cn(
                                "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                                activeStatus === tab.value
                                    ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200"
                                    : "text-slate-600 hover:text-market-navy"
                            )}
                        >
                            {t(tab.labelKey)}
                            <span className={cn(
                                "ml-1.5 text-xs tabular-nums",
                                activeStatus === tab.value ? "text-slate-500" : "text-slate-400"
                            )}>
                                {statusCounts[tab.value]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="console-table-card">
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
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
                                                STATUS_PILL_CLASSES[company.status] ?? "bg-slate-100 text-slate-600"
                                            )}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                                            {t(`statusValues.${company.status}`)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {company.ownerEmail ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {dateFormatter.format(new Date(company.createdAt))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={`/console/companies/${company.id}`}
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
