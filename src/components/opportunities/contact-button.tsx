"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface ContactButtonProps {
  companyId: string;
  subject: string;
  /**
   * When the contact originates from an Opportunities Board listing, scope the
   * thread to that opportunity (conversations.opportunity_id, migration 00025)
   * so it threads separately from any company-level chat.
   */
  opportunityId?: string;
}

export function ContactButton({ companyId, subject, opportunityId }: ContactButtonProps) {
  const t = useTranslations("Opportunities");
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(false);

  // Not logged in → render a link styled as a button to preserve locale-aware routing
  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 hover:bg-primary/90 transition-colors"
      >
        {t("contact")}
      </Link>
    );
  }

  const handleContact = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Reuse the thread scoped to this exact (user, company, opportunity) tuple.
      // opportunity_id is matched as NULL vs value (migration 00025) so an
      // opportunity-scoped thread never collides with a company-level one.
      let lookup = supabase
        .from("conversations")
        .select("id")
        .eq("company_id", companyId)
        .eq("initiator_id", user.id);
      lookup = opportunityId
        ? lookup.eq("opportunity_id", opportunityId)
        : lookup.is("opportunity_id", null);
      const { data: existing } = await lookup.maybeSingle();

      if (existing?.id) {
        router.push(`/dashboard/inbox/${existing.id}`);
        return;
      }

      // Create the conversation, scoped to the opportunity when present.
      const { data: created, error: convError } = await supabase
        .from("conversations")
        .insert({
          company_id: companyId,
          initiator_id: user.id,
          subject,
          opportunity_id: opportunityId ?? null,
        } as never)
        .select("id")
        .single();

      if (convError || !created) {
        console.error("Failed to create conversation:", convError);
        return;
      }

      // Add initiator as participant (required by messages_participants_insert policy)
      await supabase
        .from("conversation_participants")
        .insert({ conversation_id: created.id, user_id: user.id } as never);

      router.push(`/dashboard/inbox/${created.id}`);
    } catch (err) {
      console.error("ContactButton error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleContact} disabled={loading}>
      {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
      {t("contact")}
    </Button>
  );
}
