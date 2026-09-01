"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export type CreateServiceInput = Omit<
  ServiceInsert,
  "id" | "created_at" | "updated_at" | "search_en" | "search_fr"
>;

export type UpdateServiceInput = Omit<
  ServiceUpdate,
  "id" | "company_id" | "created_at" | "updated_at" | "search_en" | "search_fr"
>;

const SERVICES_KEY = "services";

export function useServices(companyId: string | undefined) {
  return useQuery({
    queryKey: [SERVICES_KEY, companyId],
    queryFn: async (): Promise<ServiceRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: CreateServiceInput): Promise<ServiceRow> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY, variables.company_id] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceInput }) => {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from("services")
        .update(data)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      // RLS or ownership prevented the write — surface it instead of a false success.
      if (!updated || updated.length === 0) {
        throw new Error("RLS_NO_ROWS");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
    },
  });
}
