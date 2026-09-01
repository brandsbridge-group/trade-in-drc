"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/auth-provider";
import { useConversations } from "@/hooks/use-messages";
import { MessageThread } from "@/components/messaging/message-thread";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

export default function ConversationPage() {
  const t = useTranslations("Inbox");
  const params = useParams();
  const conversationId = params.id as string;
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations(user?.id);

  const currentConversation = conversations?.find(
    (c) => c.conversation_id === conversationId
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          {t("signInRequiredConversation")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted-foreground">
          {t("conversationNotFound")}
        </p>
        <Link
          href={ROUTES.DASHBOARD_INBOX}
          className="text-sm text-primary hover:underline"
        >
          {t("backToInbox")}
        </Link>
      </div>
    );
  }

  const convData = currentConversation.conversations;

  return (
    <div className="h-[calc(100vh-theme(spacing.12))] flex flex-col">
      <div className="flex items-center gap-3 pb-3 border-b mb-0">
        <Link
          href={ROUTES.DASHBOARD_INBOX}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <h1 className="text-sm font-semibold truncate">
              {convData?.companies?.name ?? t("unknownCompany")}
            </h1>
          </div>
          {convData?.subject && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {convData.subject}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 border border-slate-200 rounded-2xl bg-card mt-3 overflow-hidden">
        <MessageThread conversationId={conversationId} />
      </div>
    </div>
  );
}
