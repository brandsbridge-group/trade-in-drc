"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { OWNER_PRODUCT_SELECT, type OwnerProduct } from "@/lib/dashboard/products";

export function useProducts(companyId: string | undefined) {
  return useQuery({
    queryKey: ["products", companyId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select(OWNER_PRODUCT_SELECT)
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OwnerProduct[];
    },
    enabled: !!companyId,
  });
}

/** One product with its category, for the owner's detail page. `null` = not found / not visible to this user. */
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("products")
        .select(OWNER_PRODUCT_SELECT)
        .eq("id", productId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as OwnerProduct | null) ?? null;
    },
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      company_id: string;
      name: string;
      description: string;
      category_id?: string;
      images?: string[];
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Lists, details and the dashboard's product counts all hang off this key.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["overview", "content"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const supabase = createClient();
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/** Show or hide a product in the marketplace without deleting it (00057). */
export function useSetProductPublished() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { data, error } = await createClient()
        .from("products")
        .update({ is_published: published })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      // RLS refused the write: do not report success.
      if (!data || data.length === 0) throw new Error("not_updated");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/**
 * Copies a product as a hidden draft — the quick way to list a variant
 * (another grade, another packaging). Photos are shared with the original:
 * the copy points at the same public files.
 */
export function useDuplicateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ product, suffix }: { product: OwnerProduct; suffix: string }) => {
      const withSuffix = (value: string | null) => (value ? `${value} ${suffix}` : value);
      const { data, error } = await createClient()
        .from("products")
        .insert({
          company_id: product.company_id,
          name: `${product.name} ${suffix}`,
          name_en: withSuffix(product.name_en),
          name_fr: withSuffix(product.name_fr),
          description: product.description,
          description_en: product.description_en,
          description_fr: product.description_fr,
          category_id: product.category_id,
          images: product.images ?? [],
          specs: (product.specs ?? null) as never,
          price: product.price,
          price_currency: product.price_currency,
          sale_unit: product.sale_unit,
          min_order_quantity: product.min_order_quantity,
          is_published: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["overview", "content"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["overview", "content"] });
    },
  });
}
