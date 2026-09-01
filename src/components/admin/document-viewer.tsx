"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SignedDocument } from "@/lib/verifications/actions";

interface DocumentViewerProps {
    documents: SignedDocument[];
}

const STATUS_COLORS: Record<string, string> = {
    approved: "bg-green-500",
    pending: "bg-amber-500",
    rejected: "bg-red-500",
};

export function DocumentViewer({ documents }: DocumentViewerProps) {
    const t = useTranslations("Admin.verifications");

    if (documents.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-3">
                {t("documents.empty")}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/30"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span
                            className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                STATUS_COLORS[doc.status] ?? "bg-gray-400"
                            )}
                            title={t(`documents.status.${doc.status}`)}
                        />
                        <Badge variant="outline" className="text-xs shrink-0">
                            {t(`documents.type.${doc.type}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground truncate">
                            {doc.fileName}
                        </span>
                    </div>
                    {doc.signedUrl ? (
                        <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {t("documents.view")}
                        </a>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <FileWarning className="w-3 h-3" />
                            {t("documents.unavailable")}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
