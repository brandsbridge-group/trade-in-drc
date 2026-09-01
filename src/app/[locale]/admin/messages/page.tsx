import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/design";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MessageReportStatus } from "@/lib/supabase/types";
import { ReportTriage } from "./report-triage";

/**
 * Admin moderation queue for reported messages (Requirements module 6 spam
 * reporting) + a read-only conversation thread viewer (cluster C2).
 *
 * Auth is enforced by the admin layout (requireAdmin); admin RLS policies on
 * message_reports / messages / profiles / conversations gate every read.
 *
 * Relationships in the generated types are empty arrays, so we resolve the
 * joins explicitly with id-batched follow-up queries rather than relying on
 * PostgREST auto-embeds.
 */

const REPORT_FETCH_LIMIT = 200;
const THREAD_FETCH_LIMIT = 500;

interface ReportRow {
  id: string;
  message_id: string;
  conversation_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: MessageReportStatus;
  created_at: string;
}

function statusVariant(
  status: MessageReportStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "open":
      return "destructive";
    case "actioned":
      return "default";
    case "reviewed":
      return "secondary";
    case "dismissed":
    default:
      return "outline";
  }
}

export default async function AdminMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { locale } = await params;
  const { conversation: viewerConversationId } = await searchParams;
  const t = await getTranslations({ locale, namespace: "AdminMessages" });
  const supabase = await createServerSupabaseClient();

  const { data: reportData } = await supabase
    .from("message_reports")
    .select(
      "id, message_id, conversation_id, reporter_id, reason, details, status, created_at"
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(REPORT_FETCH_LIMIT);

  const reports = (reportData ?? []) as ReportRow[];

  // Resolve reported message contents + reporter names in batched lookups.
  const messageIds = Array.from(new Set(reports.map((r) => r.message_id)));
  const reporterIds = Array.from(new Set(reports.map((r) => r.reporter_id)));

  const messageContentById = new Map<string, string>();
  if (messageIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, content")
      .in("id", messageIds);
    for (const m of msgs ?? []) {
      messageContentById.set(m.id, m.content);
    }
  }

  const reporterNameById = new Map<string, string | null>();
  if (reporterIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reporterIds);
    for (const p of people ?? []) {
      reporterNameById.set(p.id, p.full_name);
    }
  }

  // Optional read-only thread viewer.
  let threadMessages:
    | { id: string; sender_id: string; content: string; created_at: string }[]
    | null = null;
  let threadSubject: string | null = null;
  const senderNameById = new Map<string, string | null>();

  if (viewerConversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("subject")
      .eq("id", viewerConversationId)
      .maybeSingle();
    threadSubject = conv?.subject ?? null;

    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", viewerConversationId)
      .order("created_at", { ascending: true })
      .limit(THREAD_FETCH_LIMIT);
    threadMessages = msgs ?? [];

    const senderIds = Array.from(
      new Set(threadMessages.map((m) => m.sender_id))
    );
    if (senderIds.length > 0) {
      const { data: senders } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);
      for (const s of senders ?? []) {
        senderNameById.set(s.id, s.full_name);
      }
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        {/* Moderation queue */}
        <div>
          <table className="w-full text-sm border-collapse">
            <thead className="text-left text-xs text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-4">{t("columns.message")}</th>
                <th className="py-2 pr-4">{t("columns.reason")}</th>
                <th className="py-2 pr-4">{t("columns.reporter")}</th>
                <th className="py-2 pr-4">{t("columns.reported")}</th>
                <th className="py-2 pr-4">{t("columns.status")}</th>
                <th className="py-2">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const content =
                  messageContentById.get(r.message_id) ??
                  t("deletedMessage");
                return (
                  <tr key={r.id} className="border-b align-top hover:bg-muted/30">
                    <td className="py-2 pr-4 max-w-[320px]">
                      <p className="line-clamp-3 whitespace-pre-wrap break-words text-foreground">
                        {content}
                      </p>
                      {r.details && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {t("reporterNote")}: {r.details}
                        </p>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {t(`reasons.${r.reason}` as Parameters<typeof t>[0]) ||
                        r.reason}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {reporterNameById.get(r.reporter_id) ?? t("unknownUser")}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(locale)}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={statusVariant(r.status)}>
                        {t(`statuses.${r.status}`)}
                      </Badge>
                    </td>
                    <td className="py-2 space-y-1.5">
                      <ReportTriage reportId={r.id} status={r.status} />
                      <Link
                        href={`/admin/messages?conversation=${r.conversation_id}`}
                        className="block text-xs underline text-muted-foreground hover:text-foreground transition-colors duration-150"
                      >
                        {t("viewThread")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {t("emptyQueue")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Read-only thread viewer */}
        <aside className="rounded-lg border bg-card">
          <div className="border-b px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("viewer.heading")}
            </p>
            {viewerConversationId && (
              <p className="mt-0.5 text-sm font-medium text-foreground truncate">
                {threadSubject || t("viewer.noSubject")}
              </p>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
            {!viewerConversationId && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {t("viewer.selectPrompt")}
              </p>
            )}
            {viewerConversationId &&
              threadMessages &&
              threadMessages.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {t("viewer.empty")}
                </p>
              )}
            {threadMessages?.map((m) => (
              <div key={m.id} className="rounded-md bg-muted/40 p-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {senderNameById.get(m.sender_id) ?? t("unknownUser")}
                  {" · "}
                  {new Date(m.created_at).toLocaleString(locale)}
                </p>
                <p className="mt-0.5 text-sm whitespace-pre-wrap break-words text-foreground">
                  {m.content}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
