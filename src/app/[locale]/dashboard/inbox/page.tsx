"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth/auth-provider";
import { useConversations } from "@/hooks/use-messages";
import { MessageThread } from "@/components/messaging/message-thread";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Search,
  Inbox,
  Loader2,
  Briefcase,
} from "lucide-react";

export default function InboxPage() {
  const t = useTranslations("Inbox");
  const locale = useLocale();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations(user?.id);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          {t("signInRequired")}
        </p>
      </div>
    );
  }

  const filtered = conversations?.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const companyName = c.conversations?.companies?.name?.toLowerCase() ?? "";
    const subject = c.conversations?.subject?.toLowerCase() ?? "";
    const latestContent =
      c.conversations?.messages?.[0]?.content?.toLowerCase() ?? "";
    return (
      companyName.includes(query) ||
      subject.includes(query) ||
      latestContent.includes(query)
    );
  });

  return (
    <div className="h-[calc(100vh-theme(spacing.12))]">
      <div className="flex items-center gap-2 mb-4">
        <Inbox className="w-5 h-5" />
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        {conversations && conversations.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({conversations.length})
          </span>
        )}
      </div>

      <div className="flex border border-slate-200 rounded-2xl bg-card h-[calc(100%-theme(spacing.14))]">
        {/* Left panel: conversation list */}
        <div className="w-80 border-r flex flex-col shrink-0">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder={t("searchConversations")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((conv) => {
                const convData = conv.conversations;
                const latestMessage = convData?.messages?.[0];
                const isSelected = selectedId === conv.conversation_id;
                const hasUnread =
                  latestMessage &&
                  (!conv.last_read_at ||
                    new Date(latestMessage.created_at) >
                      new Date(conv.last_read_at));
                const opportunityTitle = convData?.opportunity_id
                  ? locale === "fr"
                    ? convData.opportunities?.title_fr
                    : convData.opportunities?.title_en
                  : null;

                return (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setSelectedId(conv.conversation_id)}
                    className={`w-full text-left p-3 border-b transition-colors hover:bg-muted/50 ${
                      isSelected ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {hasUnread && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {convData?.companies?.name ?? t("unknownCompany")}
                          </p>
                          {latestMessage && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatRelativeTime(latestMessage.created_at, t, locale)}
                            </span>
                          )}
                        </div>
                        {opportunityTitle && (
                          <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {t("opportunityContext", { title: opportunityTitle })}
                            </span>
                          </span>
                        )}
                        {convData?.subject && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {convData.subject}
                          </p>
                        )}
                        {latestMessage && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {latestMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  {searchQuery ? t("noSearchResults") : t("noConversations")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: message thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedId ? (
            <MessageThread conversationId={selectedId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t("selectConversation")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(
  dateString: string,
  t: ReturnType<typeof useTranslations<"Inbox">>,
  locale: string
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("relativeNow");
  if (diffMins < 60) return t("relativeMinutes", { count: diffMins });
  if (diffHours < 24) return t("relativeHours", { count: diffHours });
  if (diffDays < 7) return t("relativeDays", { count: diffDays });

  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}
