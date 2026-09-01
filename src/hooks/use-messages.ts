"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { sendMessage as sendMessageAction } from "@/lib/messaging/actions";
import type { MessagingErrorCode } from "@/lib/messaging/actions";

/** Thrown when the messaging server action rejects a write (rate-limit, captcha, etc.). */
export class MessagingActionError extends Error {
  code: MessagingErrorCode;
  constructor(code: MessagingErrorCode) {
    super(code);
    this.name = "MessagingActionError";
    this.code = code;
  }
}

const QUERY_KEYS = {
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
} as const;

/**
 * Upper bound on messages fetched per thread open. Without a cap, a long thread
 * returns its entire history in one unbounded payload. We fetch the newest
 * MESSAGE_PAGE_SIZE rows (created_at DESC) then reverse to ascending for display,
 * so the thread always shows the most recent activity. The realtime channel in
 * message-thread.tsx keeps newer messages flowing in after the initial load.
 */
const MESSAGE_PAGE_SIZE = 100;

interface ConversationWithDetails {
  conversation_id: string;
  last_read_at: string | null;
  conversations: {
    id: string;
    company_id: string;
    subject: string | null;
    updated_at: string;
    last_message_at: string | null;
    /** Set when the thread was opened from an Opportunities Board listing (00025). */
    opportunity_id: string | null;
    companies: {
      name: string;
    };
    /** Bilingual opportunity title when the thread is opportunity-scoped. */
    opportunities: {
      title_en: string;
      title_fr: string;
    } | null;
    messages: {
      content: string;
      sender_id: string;
      created_at: string;
    }[];
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
  };
}

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(
          `conversation_id,
           last_read_at,
           conversations(
             id,
             company_id,
             subject,
             updated_at,
             last_message_at,
             opportunity_id,
             companies(name),
             opportunities(title_en, title_fr),
             messages(content, sender_id, created_at)
           )`
        )
        .eq("user_id", userId!)
        .order("created_at", {
          ascending: false,
          referencedTable: "conversations.messages",
        })
        .limit(1, { referencedTable: "conversations.messages" });

      if (error) throw error;
      const conversations = (data as unknown as ConversationWithDetails[]) ?? [];
      // Sort by latest activity. last_message_at (denormalized by the
      // messages_bump_conversation_activity trigger, migration 00024) is the
      // source of truth; fall back to the previewed message or updated_at for
      // rows predating the backfill.
      return conversations.sort((a, b) => {
        const aTime =
          a.conversations?.last_message_at ??
          a.conversations?.messages?.[0]?.created_at ??
          a.conversations?.updated_at ??
          "";
        const bTime =
          b.conversations?.last_message_at ??
          b.conversations?.messages?.[0]?.created_at ??
          b.conversations?.updated_at ??
          "";
        return bTime.localeCompare(aTime);
      });
    },
    enabled: !!userId,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, conversationId],
    queryFn: async () => {
      const supabase = createClient();
      // Fetch the newest page (created_at DESC + limit), then reverse to
      // ascending so the thread renders oldest-to-newest. Bounds the payload
      // and pairs with messages_conversation_id_created_at_idx (migration 00024).
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at, profiles(full_name)")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE);

      if (error) throw error;
      const newestFirst = (data as unknown as Message[]) ?? [];
      return newestFirst.reverse();
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    // Route every send through the server action so rate-limiting, CAPTCHA, and
    // participant checks are enforced server-side (never trust the browser).
    mutationFn: async ({
      conversationId,
      content,
      captchaToken,
    }: {
      conversationId: string;
      content: string;
      captchaToken?: string | null;
    }) => {
      const result = await sendMessageAction({
        conversationId,
        content,
        captchaToken,
      });
      if (!result.success) {
        throw new MessagingActionError(result.errorCode ?? "send_failed");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MESSAGES, variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS],
      });
    },
  });
}

export function useMarkAsRead(
  conversationId: string | undefined,
  userId: string | undefined
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!conversationId || !userId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS],
      });
    },
  });
}
