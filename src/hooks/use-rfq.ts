"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RfqType } from "@/lib/supabase/types";

export function useRfqListings(companyId: string | undefined) {
  return useQuery({
    queryKey: ["rfq", companyId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("rfq_listings")
        .select("*")
        .eq("company_id", companyId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rfq: {
      company_id: string;
      title: string;
      description: string;
      type: RfqType;
      expires_at: string;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase.from("rfq_listings").insert(rfq).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rfq", variables.company_id] });
    },
  });
}

export function useUpdateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const supabase = createClient();
      const { error } = await supabase.from("rfq_listings").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq"] });
    },
  });
}

export function useCloseRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("rfq_listings")
        .update({ status: "closed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq"] });
    },
  });
}
