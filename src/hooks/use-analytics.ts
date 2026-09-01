"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useAnalytics(companyIds: string[]) {
  return useQuery({
    queryKey: ["analytics", companyIds],
    queryFn: async () => {
      const supabase = createClient();
      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("event_type, entity_type")
        .in("entity_id", companyIds);
      if (error) throw error;

      const profileViews =
        events?.filter((e) => e.entity_type === "company" && e.event_type === "view").length ?? 0;
      const productViews =
        events?.filter((e) => e.entity_type === "product" && e.event_type === "view").length ?? 0;
      const contactRequests =
        events?.filter((e) => e.event_type === "contact_request").length ?? 0;

      return { profileViews, productViews, contactRequests };
    },
    enabled: companyIds.length > 0,
  });
}
