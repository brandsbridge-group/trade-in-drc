"use client";

import * as React from "react";
import { useConversations } from "@/hooks/use-messages";

export interface AwaitingReplies {
  count: number;
  /** Time of the oldest message still waiting, or null. */
  oldestAt: string | null;
}

/**
 * Conversations whose latest message came from the other side — they are
 * waiting on this user. Shares the conversations query cache with the inbox,
 * so the sidebar badge, top bar and overview never disagree.
 */
export function useAwaitingReplies(userId: string | undefined): AwaitingReplies {
  const { data: conversations } = useConversations(userId);
  return React.useMemo(() => {
    const waiting = (conversations ?? [])
      .map((c) => c.conversations?.messages?.[0])
      .filter((m): m is { content: string; sender_id: string; created_at: string } => !!m && m.sender_id !== userId);
    const oldestAt = waiting.reduce<string | null>((min, m) => (!min || m.created_at < min ? m.created_at : min), null);
    return { count: waiting.length, oldestAt };
  }, [conversations, userId]);
}
