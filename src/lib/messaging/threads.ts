import type { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Thread create/reuse primitive shared by every server action that needs to open
 * (or append to) a conversation: the public Contact action (`startConversation`)
 * and the Opportunities Board response action (`insertOpportunityResponse`).
 *
 * This is deliberately a plain module (NOT "use server") so it can be imported
 * by multiple server actions without itself being exposed as a callable action.
 * It performs no auth / captcha / rate-limit checks — callers own those guards;
 * this only finds-or-creates the thread, ensures participants, and posts the
 * first message. RLS still governs every write because the caller passes its
 * cookie-aware server client.
 */

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface EnsureThreadParams {
  supabase: ServerSupabaseClient;
  initiatorId: string;
  companyId: string;
  companyOwnerId: string;
  subject: string;
  message: string;
  /** NULL = company-level thread; a UUID scopes the thread to one opportunity. */
  opportunityId: string | null;
}

export interface EnsureThreadResult {
  conversationId: string;
  isNewConversation: boolean;
}

/**
 * Finds or creates the conversation for this (initiator, company, opportunity)
 * tuple, inserting both participants on create, then appends `message`. Reuse is
 * scoped by opportunity_id (NULL vs value) to honour migration 00025's
 * per-opportunity threading. Returns `null` on any DB failure so callers can map
 * it to a clean error code.
 */
export async function ensureThreadAndPostMessage(
  params: EnsureThreadParams
): Promise<EnsureThreadResult | null> {
  const {
    supabase,
    initiatorId,
    companyId,
    companyOwnerId,
    subject,
    message,
    opportunityId,
  } = params;

  // Reuse an existing thread for this exact (user, company, opportunity) scope.
  // opportunity_id is matched as NULL vs value so a company-level thread and an
  // opportunity-scoped thread never collide.
  let lookup = supabase
    .from("conversations")
    .select("id")
    .eq("initiator_id", initiatorId)
    .eq("company_id", companyId);
  lookup = opportunityId
    ? lookup.eq("opportunity_id", opportunityId)
    : lookup.is("opportunity_id", null);

  const { data: existing, error: lookupError } = await lookup.maybeSingle();
  if (lookupError) {
    return null;
  }

  let conversationId: string;
  let isNewConversation = false;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        initiator_id: initiatorId,
        company_id: companyId,
        subject,
        opportunity_id: opportunityId,
      })
      .select("id")
      .single();
    if (convError || !newConv) {
      return null;
    }
    conversationId = newConv.id;
    isNewConversation = true;

    const { error: participantError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conversationId, user_id: initiatorId },
        { conversation_id: conversationId, user_id: companyOwnerId },
      ]);
    if (participantError) {
      return null;
    }
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: initiatorId,
    content: message,
  });
  if (messageError) {
    return null;
  }

  return { conversationId, isNewConversation };
}
