"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/** Shared query key for a user's companies list — keep every invalidation in sync with this. */
export const companiesQueryKey = (userId: string | undefined) => ["companies", userId] as const;

export function useCompanies(userId: string | undefined) {
  return useQuery({
    queryKey: companiesQueryKey(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .select(
          "*, sectors(name_en, name_fr), verification_reviews(decision, notes, created_at)"
        )
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    // P1-2: this used to be `refetchOnMount: "always"`, so a company just
    // written by register-company would appear on the very next dashboard
    // mount instead of waiting out the 60s staleTime. But ~10 dashboard
    // surfaces mount this hook, so "always" re-issued the full
    // select *, sectors(...), verification_reviews(...) on EVERY navigation
    // between any two of them, defeating the staleTime everywhere just to
    // cover the one post-registration case. The registration wizard now
    // invalidates this exact ["companies", userId] key directly on success
    // (register-wizard.tsx submit()), so the gap is closed at the source
    // instead of by refetching on every mount.
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const supabase = createClient();
      const { error } = await supabase.from("companies").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
