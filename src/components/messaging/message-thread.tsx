"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  MessagingActionError,
} from "@/hooks/use-messages";
import { reportMessage } from "@/lib/messaging/actions";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2, Flag } from "lucide-react";

const QUERY_KEY_MESSAGES = "messages";
/** Mirrors the DB CHECK (messages_content_length_check) in migration 00012. */
const MESSAGE_MAX_LENGTH = 5000;
const REPORT_DETAILS_MAX = 1000;
const REPORT_REASONS = ["spam", "harassment", "scam", "inappropriate", "other"] as const;
type ReportReason = (typeof REPORT_REASONS)[number];

interface MessageThreadProps {
  conversationId: string;
}

interface ReportTarget {
  messageId: string;
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const t = useTranslations("Messaging");
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead(conversationId, user?.id);
  const [newMessage, setNewMessage] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [reportTarget, setReportTarget] = React.useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = React.useState<ReportReason>("spam");
  const [reportDetails, setReportDetails] = React.useState("");
  const [isReporting, setIsReporting] = React.useState(false);

  React.useEffect(() => {
    if (conversationId && user?.id) {
      markAsRead.mutate();
    }
    // Only run on mount and when conversationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY_MESSAGES, conversationId],
          });
          markAsRead.mutate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, queryClient]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function messagingErrorText(error: unknown): string {
    if (error instanceof MessagingActionError) {
      switch (error.code) {
        case "rate_limited":
          return t("errors.rateLimited");
        case "captcha_failed":
          return t("errors.captchaFailed");
        case "not_participant":
          return t("errors.notParticipant");
        case "not_authenticated":
          return t("errors.notAuthenticated");
        case "validation_failed":
          return t("errors.validationFailed");
        default:
          return t("errors.sendFailed");
      }
    }
    return t("errors.sendFailed");
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !user) return;
    if (trimmed.length > MESSAGE_MAX_LENGTH) {
      toast.error(t("errors.tooLong", { max: MESSAGE_MAX_LENGTH }));
      return;
    }

    setNewMessage("");
    sendMessage.mutate(
      { conversationId, content: trimmed },
      {
        onError: (error) => {
          toast.error(messagingErrorText(error));
          setNewMessage(trimmed);
        },
      }
    );
  };

  const openReport = (messageId: string) => {
    setReportTarget({ messageId });
    setReportReason("spam");
    setReportDetails("");
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    setIsReporting(true);
    const toastId = toast.loading(t("report.submitting"));
    try {
      const result = await reportMessage({
        messageId: reportTarget.messageId,
        conversationId,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      if (!result.success) {
        toast.error(t("report.error"), { id: toastId });
        return;
      }
      toast.success(t("report.success"), { id: toastId });
      setReportTarget(null);
    } catch {
      toast.error(t("report.error"), { id: toastId });
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("empty")}
          </p>
        )}
        {messages?.map((msg) => {
          const isSent = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`group flex ${isSent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[75%] rounded-lg p-2 ${
                  isSent
                    ? "bg-primary/10 text-foreground"
                    : "bg-slate-100 text-foreground"
                }`}
              >
                {!isSent && msg.profiles?.full_name && (
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {msg.profiles.full_name}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 text-right">
                  {formatMessageTime(msg.created_at, locale)}
                </p>
                {!isSent && (
                  <button
                    type="button"
                    onClick={() => openReport(msg.id)}
                    aria-label={t("report.action")}
                    title={t("report.action")}
                    className="absolute -right-7 top-1 text-muted-foreground/60 hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t("inputPlaceholder")}
          maxLength={MESSAGE_MAX_LENGTH}
          className="h-9 text-sm"
          disabled={sendMessage.isPending}
        />
        <Button
          type="submit"
          size="sm"
          className="h-9 px-3"
          disabled={!newMessage.trim() || sendMessage.isPending}
        >
          {sendMessage.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      <Dialog
        open={reportTarget !== null}
        onOpenChange={(open) => !open && setReportTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base">{t("report.title")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("report.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("report.reasonLabel")}</Label>
              <Select
                value={reportReason}
                onValueChange={(v) => setReportReason(v as ReportReason)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {t(`report.reasons.${reason}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-details" className="text-sm">
                {t("report.detailsLabel")}
              </Label>
              <Textarea
                id="report-details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t("report.detailsPlaceholder")}
                rows={3}
                maxLength={REPORT_DETAILS_MAX}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReportTarget(null)}
              disabled={isReporting}
            >
              {t("report.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={submitReport}
              disabled={isReporting}
            >
              {isReporting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Flag className="w-4 h-4 mr-1.5" />
              )}
              {t("report.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatMessageTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return timeFormatter.format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return timeFormatter.format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
