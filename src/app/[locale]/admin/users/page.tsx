"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Ban, RotateCcw, History } from "lucide-react";
import { PageHeader } from "@/components/design";
import {
    listUsers,
    listUserAudit,
    setUserRole,
    suspendUser,
    reactivateUser,
    type AdminUserRow,
    type AdminAuditRow,
} from "@/lib/admin/users-actions";

const ASSIGNABLE_ROLE_OPTIONS = [
    { value: "super_admin", labelKey: "superAdmin" },
    { value: "moderator", labelKey: "moderator" },
    { value: "congolese_company", labelKey: "congoleseCompany" },
    { value: "international_business", labelKey: "internationalBusiness" },
    { value: "user", labelKey: "user" },
] as const;

type AssignableRole = (typeof ASSIGNABLE_ROLE_OPTIONS)[number]["value"];

/** Map a resolved AppRole onto the assignable select value. */
function appRoleToSelect(row: AdminUserRow): AssignableRole {
    if (row.staffRole === "super_admin") return "super_admin";
    if (row.staffRole === "moderator") return "moderator";
    if (row.accountType === "congolese_company") return "congolese_company";
    if (row.accountType === "international_business") return "international_business";
    return "user";
}

export default function AdminUsersPage() {
    const t = useTranslations("Admin.users");
    const locale = useLocale();
    const [users, setUsers] = React.useState<AdminUserRow[]>([]);
    const [audit, setAudit] = React.useState<AdminAuditRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [auditLoading, setAuditLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [busyId, setBusyId] = React.useState<string | null>(null);

    const loadUsers = React.useCallback(async () => {
        try {
            const rows = await listUsers(locale);
            setUsers(rows);
        } catch {
            toast.error(t("loadError"));
        } finally {
            setLoading(false);
        }
    }, [locale, t]);

    const loadAudit = React.useCallback(async () => {
        try {
            const rows = await listUserAudit(locale);
            setAudit(rows);
        } catch {
            // Audit trail is supplementary — surface quietly, don't block the page.
            toast.error(t("auditLoadError"));
        } finally {
            setAuditLoading(false);
        }
    }, [locale, t]);

    React.useEffect(() => {
        loadUsers();
        loadAudit();
    }, [loadUsers, loadAudit]);

    const handleRoleChange = async (userId: string, role: AssignableRole) => {
        setBusyId(userId);
        const toastId = `role-${userId}`;
        toast.loading(t("roleUpdating"), { id: toastId });
        const result = await setUserRole(locale, { userId, role });
        if (!result.ok) {
            toast.error(result.error ?? t("roleError"), { id: toastId });
            setBusyId(null);
            return;
        }
        toast.success(t("roleUpdated"), { id: toastId });
        await Promise.all([loadUsers(), loadAudit()]);
        setBusyId(null);
    };

    const handleSuspendToggle = async (row: AdminUserRow) => {
        setBusyId(row.id);
        const toastId = `suspend-${row.id}`;
        const action = row.suspended ? reactivateUser : suspendUser;
        toast.loading(row.suspended ? t("reactivating") : t("suspending"), {
            id: toastId,
        });
        const result = await action(locale, { userId: row.id });
        if (!result.ok) {
            toast.error(result.error ?? t("moderationError"), { id: toastId });
            setBusyId(null);
            return;
        }
        toast.success(row.suspended ? t("reactivated") : t("suspended"), {
            id: toastId,
        });
        await Promise.all([loadUsers(), loadAudit()]);
        setBusyId(null);
    };

    const filteredUsers = users.filter((u) => {
        const query = search.toLowerCase();
        return (
            (u.email?.toLowerCase().includes(query) ?? false) ||
            (u.fullName?.toLowerCase().includes(query) ?? false)
        );
    });

    return (
        <div className="p-4">
            <PageHeader
                title={loading ? t("title") : `${t("title")} (${users.length})`}
                subtitle={t("subtitle")}
                action={
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            className="h-9 text-sm pl-8"
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                }
            />

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs">{t("colEmail")}</TableHead>
                            <TableHead className="text-xs">{t("colName")}</TableHead>
                            <TableHead className="text-xs">{t("colRole")}</TableHead>
                            <TableHead className="text-xs">{t("colCompanies")}</TableHead>
                            <TableHead className="text-xs">{t("colStatus")}</TableHead>
                            <TableHead className="text-xs">{t("colJoined")}</TableHead>
                            <TableHead className="text-xs text-right">{t("colActions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <TableCell key={j} className="py-2">
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-10 text-center text-sm text-muted-foreground"
                                >
                                    <Users className="mx-auto mb-2 h-5 w-5 opacity-50" />
                                    {t("empty")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} data-busy={busyId === user.id}>
                                    <TableCell className="py-2 text-sm font-medium">
                                        {user.email ?? "—"}
                                    </TableCell>
                                    <TableCell className="py-2 text-sm text-muted-foreground">
                                        {user.fullName ?? "—"}
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <Select
                                            value={appRoleToSelect(user)}
                                            disabled={busyId === user.id}
                                            onValueChange={(value) =>
                                                handleRoleChange(user.id, value as AssignableRole)
                                            }
                                        >
                                            <SelectTrigger className="h-8 w-44 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ASSIGNABLE_ROLE_OPTIONS.map((opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        className="text-xs"
                                                    >
                                                        {t(`role.${opt.labelKey}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="py-2 text-sm text-muted-foreground">
                                        {user.companyCount}
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <Badge
                                            variant={user.suspended ? "destructive" : "secondary"}
                                            className="text-xs"
                                        >
                                            {user.suspended ? t("statusSuspended") : t("statusActive")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2 text-sm text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString(locale)}
                                    </TableCell>
                                    <TableCell className="py-2 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={busyId === user.id}
                                            onClick={() => handleSuspendToggle(user)}
                                            className="h-8 text-xs"
                                        >
                                            {user.suspended ? (
                                                <>
                                                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                                    {t("reactivate")}
                                                </>
                                            ) : (
                                                <>
                                                    <Ban className="mr-1.5 h-3.5 w-3.5" />
                                                    {t("suspend")}
                                                </>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-6">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <History className="h-4 w-4 text-slate-500" />
                    {t("auditTitle")}
                </h2>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">{t("auditWhen")}</TableHead>
                                <TableHead className="text-xs">{t("auditActor")}</TableHead>
                                <TableHead className="text-xs">{t("auditAction")}</TableHead>
                                <TableHead className="text-xs">{t("auditSummary")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <TableCell key={j} className="py-2">
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : audit.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        {t("auditEmpty")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                audit.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(entry.createdAt).toLocaleString(locale)}
                                        </TableCell>
                                        <TableCell className="py-2 text-xs">
                                            {entry.actorEmail ?? "—"}
                                        </TableCell>
                                        <TableCell className="py-2 text-xs font-mono text-slate-600">
                                            {entry.action}
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-muted-foreground">
                                            {entry.summary ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
