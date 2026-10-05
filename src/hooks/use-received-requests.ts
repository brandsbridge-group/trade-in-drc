"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReceivedRequests, receivedRequestsKey, unseenRequests } from "@/lib/dashboard/received-requests";

/**
 * Buyer requests forwarded to the user's companies. One query cache shared by
 * the page, the sidebar badge and the home's action centre, so they agree.
 */
export function useReceivedRequests(userId: string | undefined) {
  const query = useQuery({
    queryKey: receivedRequestsKey(userId),
    queryFn: fetchReceivedRequests,
    enabled: !!userId,
  });
  return { ...query, unseenCount: unseenRequests(query.data ?? []).length };
}
